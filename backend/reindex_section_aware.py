import asyncio
import os
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.db import get_db_connection
from app.services.pdf_service import extract_text_and_chunks_from_pdf
from app.services.rag import (
    add_document_chunks_to_chroma,
    delete_document_chunks_from_chroma,
    get_hr_collection
)
from app.services.gemini import generate_embeddings

async def reindex_all_active_documents():
    print("=" * 70)
    print("  PEOPLESPHERE - SECTION-AWARE REINDEXING PIPELINE")
    print("=" * 70)

    conn = get_db_connection()
    rows = conn.execute("""
        SELECT id, filename, policy_name, version, file_path 
        FROM documents 
        WHERE is_latest = 1
    """).fetchall()

    if not rows:
        print("[!] No active documents found in database.")
        return

    print(f"[*] Found {len(rows)} active document(s) to process.\n")
    total_reindexed_chunks = 0

    for r in rows:
        doc_id = r["id"]
        filename = r["filename"]
        policy_name = r["policy_name"]
        version = r["version"]
        file_path = r["file_path"]

        print(f"--> Processing: {filename} (v{version}) [ID: {doc_id[:8]}...]")
        
        path_obj = Path(file_path)
        if not path_obj.exists():
            print(f"    [X] File path does not exist on disk: {file_path}. Skipping.")
            continue

        file_bytes = path_obj.read_bytes()

        # 1. Extract section-aware chunks
        chunks = extract_text_and_chunks_from_pdf(file_bytes, filename)
        print(f"    [+] Extracted {len(chunks)} section-aware chunks.")
        for c in chunks:
            print(f"        - Section: '{c['section']}' (p.{c['page']}, {len(c['text'])} chars)")

        # 2. Delete previous chunks from ChromaDB for this document
        delete_document_chunks_from_chroma(doc_id)

        # 3. Generate embeddings
        chunk_texts = [c["text"] for c in chunks]
        embeddings = await generate_embeddings(chunk_texts)

        # 4. Store in ChromaDB with section metadata
        add_document_chunks_to_chroma(
            doc_id=doc_id,
            filename=filename,
            chunks=chunks,
            embeddings=embeddings,
            policy_name=policy_name,
            version=version
        )

        # 5. Update chunk_count in SQLite
        conn.execute("UPDATE documents SET chunk_count = ? WHERE id = ?", (len(chunks), doc_id))
        conn.commit()

        total_reindexed_chunks += len(chunks)
        print(f"    [OK] Successfully indexed {len(chunks)} chunks into ChromaDB.\n")

    conn.close()

    coll = get_hr_collection()
    print("=" * 70)
    print(f"[SUCCESS] Reindexing complete! Total chunks now in ChromaDB: {coll.count()}")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(reindex_all_active_documents())

