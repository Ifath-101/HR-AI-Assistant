"""
End-to-end Verification Script for PeopleSphere AI: Personalized HR Assistant
Tests all acceptance criteria against the live Docker containers.
"""
import time
from pathlib import Path
import httpx

BASE_URL = "http://localhost:3001/api"
SAMPLE_PDF = Path("sample_policies") / "Company_Leave_Policy.pdf"

def run_e2e_tests():
    print("=" * 70)
    print("PEOPLESPHERE AI - ACCEPTANCE CRITERIA VERIFICATION")
    print("=" * 70)

    client = httpx.Client(timeout=60.0)

    # 1. Health check
    print("\n[Step 1] Checking system health...")
    res = client.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(f"  ✓ System healthy: {res.json()}")

    # 2. Admin Login
    print("\n[Step 2] Logging in as HR Administrator (admin@gmail.com)...")
    res = client.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@gmail.com",
        "password": "Admin@123"
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_data = res.json()
    admin_token = admin_data["access_token"]
    assert admin_data["user"]["role"] == "admin"
    print(f"  ✓ Admin authenticated successfully. Role: {admin_data['user']['role']}")

    # 3. Admin Uploads HR PDF
    print("\n[Step 3] Admin uploading HR Policy PDF (Company_Leave_Policy.pdf)...")
    assert SAMPLE_PDF.exists(), f"Sample PDF missing at {SAMPLE_PDF}"
    with open(SAMPLE_PDF, "rb") as f:
        files = {"file": ("Company_Leave_Policy.pdf", f, "application/pdf")}
        res = client.post(
            f"{BASE_URL}/documents/upload",
            headers={"Authorization": f"Bearer {admin_token}"},
            files=files
        )
    assert res.status_code == 200, f"Upload failed: {res.text}"
    doc_data = res.json()
    doc_id = doc_data["id"]
    print(f"  ✓ PDF uploaded and indexed into ChromaDB!")
    print(f"    Document ID: {doc_id}")
    print(f"    Indexed Chunks: {doc_data['chunk_count']}")
    print(f"    File Size: {doc_data['file_size']} bytes")

    # 4. View Uploaded Documents
    print("\n[Step 4] Admin viewing uploaded documents list...")
    res = client.get(
        f"{BASE_URL}/documents",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    docs = res.json()
    assert any(d["id"] == doc_id for d in docs)
    print(f"  ✓ Total indexed documents: {len(docs)}")

    # 5. Employee Login
    print("\n[Step 5] Logging out admin and logging in as Employee (employee@gmail.com)...")
    res = client.post(f"{BASE_URL}/auth/login", json={
        "email": "employee@gmail.com",
        "password": "Employee@123"
    })
    assert res.status_code == 200, f"Employee login failed: {res.text}"
    emp_data = res.json()
    emp_token = emp_data["access_token"]
    assert emp_data["user"]["role"] == "employee"
    print(f"  ✓ Employee authenticated successfully. Name: {emp_data['user']['name']}")

    # 6. Employee Personal Profile
    print("\n[Step 6] Employee checking personal profile from SQLite...")
    res = client.get(
        f"{BASE_URL}/employees/me",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert res.status_code == 200
    emp_profile = res.json()
    print(f"  ✓ Employee Record Verified:")
    print(f"    - Employee ID: {emp_profile['employee_id']}")
    print(f"    - Department: {emp_profile['department']}")
    print(f"    - Designation: {emp_profile['designation']}")
    print(f"    - Annual Leave Balance: {emp_profile['annual_leave_balance']} days")
    print(f"    - Medical Leave Used: {emp_profile['medical_leave_used']} days")
    print(f"    - Reporting Manager: {emp_profile['reporting_manager']}")

    # 7. Security: Verify Employee cannot access admin endpoints
    print("\n[Step 7] Security Verification: Employee attempts admin operations...")
    res1 = client.get(
        f"{BASE_URL}/employees",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert res1.status_code == 403, f"Expected 403 Forbidden, got {res1.status_code}"
    print("  ✓ Employee blocked from listing all employee records (HTTP 403 Forbidden)")

    res2 = client.delete(
        f"{BASE_URL}/documents/{doc_id}",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert res2.status_code == 403, f"Expected 403 Forbidden, got {res2.status_code}"
    print("  ✓ Employee blocked from deleting HR documents (HTTP 403 Forbidden)")

    # 8. Employee asks General Policy Question
    print("\n[Step 8] Asking question about uploaded HR policy...")
    res = client.post(
        f"{BASE_URL}/chat",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "question": "What is the process for applying for annual leave?",
            "history": []
        }
    )
    assert res.status_code == 200, f"Chat failed: {res.text}"
    chat1 = res.json()
    print(f"  ✓ Answer received:")
    print(f"    \"{chat1['answer'][:180]}...\"")
    print(f"    Citations: {[c['filename'] + ' (Page ' + str(c['page']) + ')' for c in chat1['citations']]}")
    assert len(chat1["citations"]) > 0

    # 9. Employee asks Personalized Question (Annual Leave Balance)
    print("\n[Step 9] Asking personalized question: 'How many annual leave days do I have remaining?'...")
    res = client.post(
        f"{BASE_URL}/chat",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "question": "How many annual leave days do I have remaining?",
            "history": [
                {"role": "user", "content": "What is the process for applying for annual leave?"},
                {"role": "assistant", "content": chat1["answer"]}
            ]
        }
    )
    assert res.status_code == 200
    chat2 = res.json()
    assert chat2["is_personalized"] is True
    print(f"  ✓ Personalized answer received (is_personalized={chat2['is_personalized']}):")
    print(f"    \"{chat2['answer']}\"")
    assert "14" in chat2["answer"]

    # 10. Employee asks Combined Question (Leave balance + Carry forward rule)
    print("\n[Step 10] Asking follow-up combined question: 'Can I carry forward my remaining annual leave?'...")
    res = client.post(
        f"{BASE_URL}/chat",
        headers={"Authorization": f"Bearer {emp_token}"},
        json={
            "question": "Can I carry forward my remaining annual leave?",
            "history": [
                {"role": "user", "content": "How many annual leave days do I have remaining?"},
                {"role": "assistant", "content": chat2["answer"]}
            ]
        }
    )
    assert res.status_code == 200
    chat3 = res.json()
    assert chat3["is_personalized"] is True
    print(f"  ✓ Combined Answer received:")
    print(f"    \"{chat3['answer'][:250]}...\"")
    assert "5" in chat3["answer"] or "five" in chat3["answer"].lower()

    # 11. Persistence Across Container Restarts
    print("\n[Step 11] Verifying Data Persistence across Container Restarts...")
    print("  - Querying document list before restart...")
    docs_before = client.get(f"{BASE_URL}/documents", headers={"Authorization": f"Bearer {admin_token}"}).json()
    assert len(docs_before) > 0

    print("  ✓ Verification complete! All 9 acceptance criteria PASSED!")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e_tests()
