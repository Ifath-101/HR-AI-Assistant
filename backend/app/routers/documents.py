import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Header, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import settings
from app.database.db import (
    create_document_record,
    get_all_documents,
    get_document_by_id,
    delete_document_record,
    get_documents_by_policy_name,
    get_unique_policy_names,
    set_document_is_latest,
    reactivate_document_version,
)
from app.routers.auth import get_current_user, require_admin, validate_token_and_get_user
from app.services.pdf_service import extract_text_and_chunks_from_pdf
from app.services.gemini import generate_embeddings
from app.services.rag import (
    add_document_chunks_to_chroma,
    delete_document_chunks_from_chroma,
)

router = APIRouter(prefix="/api/documents", tags=["HR Documents"])

class DocumentResponse(BaseModel):
    id: str
    filename: str
    policy_name: str
    version: int
    is_latest: bool
    description: Optional[str] = ""
    file_size: int
    chunk_count: int
    uploaded_by: str
    uploaded_at: str

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    latest_only: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    List HR policy documents.
    Regular employees always receive current active policies only (is_latest=1).
    Admins can specify latest_only=true or view all historical versions.
    """
    if current_user["role"] == "employee":
        return get_all_documents(latest_only=True)
    return get_all_documents(latest_only=bool(latest_only))

@router.get("/policies", response_model=List[str])
def list_policy_names(current_user: dict = Depends(get_current_user)):
    """List unique policy group names for selection during upload."""
    return get_unique_policy_names()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    policy_name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    admin_user: dict = Depends(require_admin)
):
    """
    Admin only: Upload an HR policy PDF document with versioning support.
    If the policy name matches an existing policy, it automatically increments
    the version, archives previous versions, and ensures vector search exclusively
    indexes the latest version chunks for accurate AI responses.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are permitted for policy uploads."
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    max_size_bytes = 15 * 1024 * 1024  # 15 MB
    if len(file_bytes) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 15 MB limit."
        )

    doc_id = str(uuid.uuid4())
    sanitized_filename = Path(file.filename).name
    save_path = Path(settings.UPLOAD_DIRECTORY) / f"{doc_id}_{sanitized_filename}"

    # Determine clean policy display title
    if policy_name and policy_name.strip():
        clean_policy_name = policy_name.strip()
    else:
        clean_policy_name = Path(file.filename).stem.replace('_', ' ').replace('-', ' ').title().strip()

    # Check for existing versions of this policy
    existing_docs = get_documents_by_policy_name(clean_policy_name)
    if existing_docs:
        next_version = max(d["version"] for d in existing_docs) + 1
        # Supersede older versions in SQLite and remove older chunks from ChromaDB
        for prev_doc in existing_docs:
            set_document_is_latest(prev_doc["id"], is_latest=False)
            try:
                delete_document_chunks_from_chroma(prev_doc["id"])
            except Exception:
                pass
    else:
        next_version = 1

    # 1. Save file locally for record keeping
    with open(save_path, "wb") as f:
        f.write(file_bytes)

    # 2. Extract text and create manageable chunks via PyMuPDF
    chunks = extract_text_and_chunks_from_pdf(file_bytes, sanitized_filename)

    # 3. Generate embeddings using Gemini Embedding Model
    chunk_texts = [c["text"] for c in chunks]
    embeddings = await generate_embeddings(chunk_texts)

    # 4. Store embeddings and chunks in ChromaDB with policy_name and version
    add_document_chunks_to_chroma(
        doc_id=doc_id,
        filename=sanitized_filename,
        chunks=chunks,
        embeddings=embeddings,
        policy_name=clean_policy_name,
        version=next_version
    )

    # 5. Record metadata in SQLite
    create_document_record(
        doc_id=doc_id,
        filename=sanitized_filename,
        file_path=str(save_path),
        file_size=len(file_bytes),
        chunk_count=len(chunks),
        uploaded_by=admin_user["email"],
        policy_name=clean_policy_name,
        version=next_version,
        is_latest=True,
        description=description.strip() if description else ""
    )

    doc_record = get_document_by_id(doc_id)
    return doc_record

@router.post("/{doc_id}/reactivate", response_model=DocumentResponse)
async def reactivate_document(
    doc_id: str,
    admin_user: dict = Depends(require_admin)
):
    """
    Admin only: Rollback / restore an archived version to become active.
    Sets target document to is_latest=1, archives other versions of this policy,
    and re-indexes target document's chunks into ChromaDB.
    """
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    policy_name = doc["policy_name"]

    # 1. Find all documents of this policy and clear their chunks from ChromaDB
    existing_docs = get_documents_by_policy_name(policy_name)
    for d in existing_docs:
        try:
            delete_document_chunks_from_chroma(d["id"])
        except Exception:
            pass

    # 2. Update SQLite status
    updated_doc = reactivate_document_version(doc_id)
    if not updated_doc:
        raise HTTPException(status_code=500, detail="Failed to reactivate document")

    # 3. Read file and re-index into ChromaDB
    file_path = Path(doc["file_path"])
    if file_path.exists():
        file_bytes = file_path.read_bytes()
        chunks = extract_text_and_chunks_from_pdf(file_bytes, doc["filename"])
        chunk_texts = [c["text"] for c in chunks]
        embeddings = await generate_embeddings(chunk_texts)
        add_document_chunks_to_chroma(
            doc_id=doc["id"],
            filename=doc["filename"],
            chunks=chunks,
            embeddings=embeddings,
            policy_name=doc["policy_name"],
            version=doc["version"]
        )

    return updated_doc

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    admin_user: dict = Depends(require_admin)
):
    """
    Admin only: Delete an HR policy document.
    Removes its chunks from ChromaDB, deletes physical file, and removes record from SQLite.
    If the active version was deleted and an older version exists, promotes the newest
    remaining version to active and re-indexes it.
    """
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    was_latest = bool(doc.get("is_latest"))
    policy_name = doc.get("policy_name")

    # 1. Delete chunks from ChromaDB
    try:
        delete_document_chunks_from_chroma(doc_id)
    except Exception:
        pass

    # 2. Delete physical file if present
    file_path = Path(doc["file_path"])
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass

    # 3. Delete metadata from SQLite
    delete_document_record(doc_id)

    # 4. If the active version was deleted, check if an older version exists to promote
    if was_latest and policy_name:
        remaining = get_documents_by_policy_name(policy_name)
        if remaining:
            new_active = remaining[0]  # sorted by version DESC
            reactivate_document_version(new_active["id"])
            # Re-index new active version into ChromaDB
            new_path = Path(new_active["file_path"])
            if new_path.exists():
                file_bytes = new_path.read_bytes()
                chunks = extract_text_and_chunks_from_pdf(file_bytes, new_active["filename"])
                chunk_texts = [c["text"] for c in chunks]
                embeddings = await generate_embeddings(chunk_texts)
                add_document_chunks_to_chroma(
                    doc_id=new_active["id"],
                    filename=new_active["filename"],
                    chunks=chunks,
                    embeddings=embeddings,
                    policy_name=new_active["policy_name"],
                    version=new_active["version"]
                )

    return {"message": f"Document '{doc['filename']}' deleted successfully", "id": doc_id}

@router.get("/{doc_id}/download")
def download_document(
    doc_id: str,
    token: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
):
    """
    Download or view an uploaded HR policy document in browser.
    Accepts JWT token via either Query parameter (?token=...) or Authorization header (Bearer ...).
    """
    jwt_token = None
    if token and token.strip():
        jwt_token = token.strip()
    elif authorization and authorization.startswith("Bearer "):
        jwt_token = authorization.split(" ", 1)[1].strip()

    if not jwt_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in to view documents."
        )

    # Validate token and verify user exists
    validate_token_and_get_user(jwt_token)

    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(doc["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical document file missing on server")

    return FileResponse(
        path=str(file_path),
        filename=doc["filename"],
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{doc["filename"]}"'
        }
    )

