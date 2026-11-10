from pathlib import Path
import pytest
from app.services.pdf_service import extract_text_and_chunks_from_pdf
from app.services.rag import (
    is_personal_question,
    build_hr_prompt,
    add_document_chunks_to_chroma,
    delete_document_chunks_from_chroma,
    get_hr_collection
)

import fitz  # PyMuPDF

CANDIDATE_PATHS = [
    Path(__file__).resolve().parent.parent.parent / "sample_policies" / "Company_Leave_Policy.pdf",
    Path(__file__).resolve().parent.parent / "sample_policies" / "Company_Leave_Policy.pdf",
    Path("/app/sample_policies/Company_Leave_Policy.pdf"),
    Path("/sample_policies/Company_Leave_Policy.pdf")
]
SAMPLE_PDF_PATH = next((p for p in CANDIDATE_PATHS if p.exists()), None)

def test_pdf_extraction_and_chunking():
    """Verify PyMuPDF extracts text, preserves page numbers, and divides into chunks."""
    if SAMPLE_PDF_PATH and SAMPLE_PDF_PATH.exists():
        file_bytes = SAMPLE_PDF_PATH.read_bytes()
    else:
        # Create an in-memory sample policy PDF
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((50, 72), "ANNUAL LEAVE POLICY\nAll employees are entitled to 14 days annual leave per year.")
        file_bytes = doc.tobytes()

    chunks = extract_text_and_chunks_from_pdf(file_bytes, "Company_Leave_Policy.pdf")
    assert len(chunks) > 0
    
    first_chunk = chunks[0]
    assert "text" in first_chunk
    assert "page" in first_chunk
    assert "filename" in first_chunk
    assert first_chunk["page"] == 1
    assert "ANNUAL LEAVE" in first_chunk["text"].upper()

def test_personal_question_classification():
    """Verify question classifier correctly identifies personalized questions."""
    # Personal questions
    assert is_personal_question("How many annual leave days do I have remaining?") is True
    assert is_personal_question("Who is my reporting manager?") is True
    assert is_personal_question("How many medical leave days have I used?") is True
    assert is_personal_question("Can I carry forward my remaining leave?") is True

    # General policy questions
    assert is_personal_question("What is the standard procedure for applying for medical leave?") is False
    assert is_personal_question("What are company core working hours?") is False

    # Unauthorized or multi-user questions asking for all/other employees
    assert is_personal_question("hi, give me the details of al the employees") is False
    assert is_personal_question("give me details of all employees") is False
    assert is_personal_question("show me other employees") is False

def test_build_hr_prompt():
    """Verify prompt constructor includes employee record when provided."""
    employee_info = {
        "name": "Jane Doe",
        "employee_id": "EMP001",
        "department": "Engineering",
        "designation": "Senior Engineer",
        "annual_leave_balance": 14,
        "medical_leave_used": 3,
        "reporting_manager": "Alex Johnson"
    }
    policy_chunks = [
        {
            "filename": "Company_Leave_Policy.pdf",
            "page": 1,
            "text": "A maximum of 5 unused annual leave days may be carried forward."
        }
    ]

    system_instruction, user_prompt = build_hr_prompt(
        question="Can I carry forward all my leave?",
        policy_chunks=policy_chunks,
        employee_info=employee_info
    )

    assert "PeopleSphere HR Assistant" in system_instruction
    assert "Jane Doe" in user_prompt
    assert "14 days" in user_prompt
    assert "Alex Johnson" in user_prompt
    assert "Company_Leave_Policy.pdf" in user_prompt
    assert "Can I carry forward all my leave?" in user_prompt

def test_chroma_vector_db_operations():
    """Verify adding and deleting document chunks from ChromaDB."""
    collection = get_hr_collection()
    initial_count = collection.count()

    doc_id = "test-doc-123"
    filename = "test_policy.pdf"
    chunks = [
        {"text": "Test chunk 1: employees receive health insurance", "page": 1, "chunk_index": 0},
        {"text": "Test chunk 2: dental claims are up to $400", "page": 1, "chunk_index": 1}
    ]
    # Match collection embedding dimension (3072 for gemini-embedding-001)
    sample_item = collection.get(limit=1, include=["embeddings"])
    dim = len(sample_item["embeddings"][0]) if sample_item.get("embeddings") and len(sample_item["embeddings"]) > 0 else 3072
    embeddings = [[0.01 * (i + 1)] * dim for i in range(len(chunks))]

    add_document_chunks_to_chroma(doc_id, filename, chunks, embeddings)
    assert collection.count() == initial_count + 2

    # Verify metadata
    results = collection.get(where={"doc_id": doc_id})
    assert len(results["ids"]) == 2
    assert results["metadatas"][0]["filename"] == filename

    # Delete chunks
    delete_document_chunks_from_chroma(doc_id)
    assert collection.count() == initial_count

