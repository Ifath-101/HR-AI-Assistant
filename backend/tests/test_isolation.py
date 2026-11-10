import pytest
from app.services.rag import get_hr_collection

def test_employee_retrieves_only_own_record(client, employee_token):
    """Verify that /api/employees/me extracts identity from token and returns only caller's record."""
    response = client.get("/api/employees/me", headers={
        "Authorization": f"Bearer {employee_token}"
    })
    assert response.status_code == 200
    user = response.json()
    assert user["employee_id"] == "EMP001"
    assert user["email"] == "employee@gmail.com"
    assert user["name"] == "Jane Doe"
    assert user["annual_leave_balance"] == 14
    assert user["medical_leave_used"] == 3
    # Password hash must NEVER be exposed in response
    assert "password_hash" not in user

def test_employee_cannot_access_specific_employee_record(client, employee_token):
    """Verify employee cannot query specific records via /api/employees/{id}."""
    response = client.get("/api/employees/ADM001", headers={
        "Authorization": f"Bearer {employee_token}"
    })
    assert response.status_code == 403

def test_employee_cannot_update_records(client, employee_token):
    """Verify employee cannot update annual leave balances."""
    response = client.put("/api/employees/EMP001", json={
        "annual_leave_balance": 50
    }, headers={
        "Authorization": f"Bearer {employee_token}"
    })
    assert response.status_code == 403

def test_vector_db_contains_no_employee_data():
    """Verify that ChromaDB collection holds strictly policy chunks, never employee personal records."""
    collection = get_hr_collection()
    data = collection.get()
    
    # Check all metadatas in ChromaDB
    for meta in data.get("metadatas", []):
        assert "annual_leave_balance" not in meta
        assert "medical_leave_used" not in meta
        assert "employee_id" not in meta
        assert "password_hash" not in meta

def test_chat_history_persistence_and_isolation(client, employee_token, admin_token):
    """Verify chat messages persist in SQLite and are strictly isolated per employee."""
    from app.database.db import save_chat_message, clear_employee_chat_history
    
    # Clear any previous test history
    clear_employee_chat_history("EMP001")
    clear_employee_chat_history("ADM001")
    
    # Save a message for employee EMP001
    save_chat_message("EMP001", "user", "How many leave days do I have?")
    save_chat_message("EMP001", "assistant", "You have 14 annual leave days remaining.")
    
    # Employee fetches history
    res = client.get("/api/chat/history", headers={"Authorization": f"Bearer {employee_token}"})
    assert res.status_code == 200
    history = res.json()
    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "How many leave days do I have?"
    assert history[1]["role"] == "assistant"
    
    # Admin fetches history - should be empty for admin (isolation)
    admin_res = client.get("/api/chat/history", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    assert len(admin_res.json()) == 0
    
    # Clear history endpoint
    del_res = client.delete("/api/chat/history", headers={"Authorization": f"Bearer {employee_token}"})
    assert del_res.status_code == 200
    res_after = client.get("/api/chat/history", headers={"Authorization": f"Bearer {employee_token}"})
    assert len(res_after.json()) == 0

def test_document_versioning_and_employee_access(client, employee_token, admin_token):
    """Verify document versioning, supersede logic, and that employees see only latest active policies."""
    import io
    import fitz

    # Create dummy PDF bytes
    doc1 = fitz.open()
    page1 = doc1.new_page()
    page1.insert_text((50, 72), "Leave Policy 2025: Employees get 10 days.")
    pdf1_bytes = doc1.tobytes()

    # Admin uploads v1 of "Annual Leave Policy"
    res1 = client.post(
        "/api/documents/upload",
        files={"file": ("Leave_Policy_v1.pdf", io.BytesIO(pdf1_bytes), "application/pdf")},
        data={"policy_name": "Annual Leave Policy", "description": "Initial policy"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res1.status_code == 200
    doc1_data = res1.json()
    assert doc1_data["policy_name"] == "Annual Leave Policy"
    assert doc1_data["version"] == 1
    assert doc1_data["is_latest"] is True

    # Admin uploads v2 of "Annual Leave Policy"
    doc2 = fitz.open()
    page2 = doc2.new_page()
    page2.insert_text((50, 72), "Leave Policy 2026: Employees get 14 days.")
    pdf2_bytes = doc2.tobytes()

    res2 = client.post(
        "/api/documents/upload",
        files={"file": ("Leave_Policy_v2.pdf", io.BytesIO(pdf2_bytes), "application/pdf")},
        data={"policy_name": "Annual Leave Policy", "description": "Updated for 2026"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res2.status_code == 200
    doc2_data = res2.json()
    assert doc2_data["policy_name"] == "Annual Leave Policy"
    assert doc2_data["version"] == 2
    assert doc2_data["is_latest"] is True

    # Employee views documents - must ONLY receive active (is_latest=1) documents!
    emp_res = client.get("/api/documents", headers={"Authorization": f"Bearer {employee_token}"})
    assert emp_res.status_code == 200
    emp_docs = emp_res.json()
    emp_doc_ids = [d["id"] for d in emp_docs]
    assert doc1_data["id"] not in emp_doc_ids
    assert doc2_data["id"] in emp_doc_ids

    # Admin views all documents - can see both versions
    admin_res = client.get("/api/documents?latest_only=false", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_res.status_code == 200
    admin_docs = admin_res.json()
    admin_doc_ids = [d["id"] for d in admin_docs]
    assert doc1_data["id"] in admin_doc_ids
    assert doc2_data["id"] in admin_doc_ids

    # Clean up test documents
    client.delete(f"/api/documents/{doc1_data['id']}", headers={"Authorization": f"Bearer {admin_token}"})
    client.delete(f"/api/documents/{doc2_data['id']}", headers={"Authorization": f"Bearer {admin_token}"})

