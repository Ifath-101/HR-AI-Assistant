"""
Independent RAG Vector Retrieval Tester
---------------------------------------
Queries the ChromaDB vector database directly to inspect retrieved policy chunks.
- Zero LLM generation calls ($0 cost, 0 generation quota used).
- Runs directly against ChromaDB vector storage.
- Uses Gemini Embedding Free Tier (or offline vector fallback) to vectorize your query.
"""

import sys
import os
import asyncio
import logging
from pathlib import Path

# Suppress ChromaDB and Posthog telemetry warnings
os.environ["ANONYMIZED_TELEMETRY"] = "False"
logging.getLogger("chromadb.telemetry.posthog").setLevel(logging.ERROR)
logging.getLogger("chromadb").setLevel(logging.ERROR)

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

from app.services.rag import get_hr_collection, retrieve_relevant_policy_chunks
from app.config import settings

def print_banner():
    print("\n" + "=" * 72)
    print("  PEOPLESPHERE - INDEPENDENT RAG HYBRID RETRIEVAL INSPECTOR")
    print("=" * 72)
    print("  * Storage: ChromaDB Local Persistent Vector Store")
    print("  * Search Mode: Hybrid (60% Dense Vector + 40% Sparse Keyword Rerank)")
    print("  * LLM Text Generation: DISABLED (0 text generation calls, $0.00 cost)")
    print("  * Cosine Distance Threshold: <= 0.50 (allows >= 50% semantic match)")
    print("=" * 72 + "\n")

async def search_query(query: str, top_k: int = 4):
    query = query.strip()
    if not query:
        print("[!] Query cannot be empty.")
        return

    collection = get_hr_collection()
    total_chunks = collection.count()

    print(f"\n[?] Query: \"{query}\"")
    print(f"[*] Total policy chunks indexed in ChromaDB: {total_chunks}")
    print(f"[*] Searching for top {top_k} matching chunks...\n")

    chunks = await retrieve_relevant_policy_chunks(query=query, top_k=top_k)

    if not chunks:
        print("[X] No relevant policy chunks matched this query (either cosine distance > 0.50 without strong keyword matches, or collection is empty).")
        return

    print(f"[+] Found {len(chunks)} relevant chunk(s) (ranked by hybrid relevance):\n")
    for idx, c in enumerate(chunks, 1):
        dist = c.get("distance")
        score_str = f"Cosine Distance: {dist:.4f}" if dist is not None else "N/A"
        similarity_pct = f"({(1.0 - dist) * 100:.1f}% similarity)" if dist is not None else ""
        hybrid_score = c.get("hybrid_score", 0.0)
        kw_score = c.get("keyword_score", 0.0)
        policy = c.get("policy_name") or c.get("filename")
        version = f"v{c['version']}" if c.get("version") else "v1"
        page = c.get("page", 1)

        section = c.get("section") or "General Overview"

        print(f"--- [Result #{idx}] ----------------------------------------------------")
        print(f"  Source Document : {policy} ({c.get('filename')})")
        print(f"  Section / Topic : {section}")
        print(f"  Version / Page  : {version} | Page {page}")
        print(f"  Hybrid Score    : {hybrid_score:.4f} [Vector: {score_str} {similarity_pct} | Keyword: {kw_score:.2f}]")
        print(f"  Retrieved Excerpt:")
        for line in c["text"].strip().split("\n"):
            print(f"    {line}")
        print()
    print("-" * 72)

async def main():
    print_banner()

    # If query was passed as a command-line argument
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        await search_query(query)
        return

    # Interactive prompt loop
    print("Type any question to inspect retrieved policy chunks.")
    print("Type 'exit' or 'q' to quit.\n")

    while True:
        try:
            user_input = input("Enter inquiry > ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("exit", "quit", "q"):
                print("\nExiting RAG inspector. Goodbye!")
                break
            await search_query(user_input)
            print()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting RAG inspector. Goodbye!")
            break

if __name__ == "__main__":
    asyncio.run(main())

