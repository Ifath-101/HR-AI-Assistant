import pytest

def test_admin_create_regular_employee_success(client, admin_token):
    """Verify admin can create a regular employee without verification password."""
    payload = {
        "name": "Alex Mercer",
        "email": "amercer@peoplesphere.com",
        "initial_password": "Employee@123",
        "role": "employee",
        "department": "Software Engineering",
        "designation": "Backend Engineer",
        "annual_leave_balance": 20,
        "medical_leave_used": 0,
        "reporting_manager": "David Vance"
    }
    response = client.post("/api/employees", json=payload, headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alex Mercer"
    assert data["email"] == "amercer@peoplesphere.com"
    assert data["role"] == "employee"
    assert data["employee_id"].startswith("EMP")
    assert "password_hash" not in data

def test_employee_cannot_create_employee(client, employee_token):
    """Verify regular employee cannot access POST /api/employees (403 Forbidden)."""
    payload = {
        "name": "Intruder User",
        "email": "intruder@peoplesphere.com",
        "role": "employee",
        "department": "Marketing",
        "designation": "Associate"
    }
    response = client.post("/api/employees", json=payload, headers={
        "Authorization": f"Bearer {employee_token}"
    })
    assert response.status_code == 403

def test_create_admin_without_verification_fails(client, admin_token):
    """Verify creating an admin without admin_verification_password is rejected (400 Bad Request)."""
    payload = {
        "name": "New Admin Without Verification",
        "email": "unverified_admin@peoplesphere.com",
        "role": "admin",
        "department": "Human Resources",
        "designation": "HR Director"
    }
    response = client.post("/api/employees", json=payload, headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert response.status_code == 400
    assert "Security Verification Required" in response.json()["detail"]

def test_create_admin_with_invalid_verification_fails(client, admin_token):
    """Verify creating an admin with wrong admin password is rejected (401 Unauthorized)."""
    payload = {
        "name": "New Admin Wrong Pwd",
        "email": "wrongpwd_admin@peoplesphere.com",
        "role": "admin",
        "department": "Human Resources",
        "designation": "HR Director",
        "admin_verification_password": "WrongPassword!999"
    }
    response = client.post("/api/employees", json=payload, headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert response.status_code == 401
    assert "Security Verification Failed" in response.json()["detail"]

def test_create_admin_with_valid_verification_success(client, admin_token):
    """Verify creating an admin with correct admin password succeeds (201 Created)."""
    payload = {
        "name": "Verified HR Lead",
        "email": "verified_admin@peoplesphere.com",
        "role": "admin",
        "department": "Human Resources",
        "designation": "VP People Operations",
        "admin_verification_password": "Admin@123"
    }
    response = client.post("/api/employees", json=payload, headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "admin"
    assert data["email"] == "verified_admin@peoplesphere.com"
    assert data["employee_id"].startswith("ADM")

def test_update_employee_promote_to_admin_with_verification(client, admin_token):
    """Verify promoting an employee to admin requires and accepts step-up password."""
    # First promote without verification -> fails 400
    res_fail = client.put("/api/employees/EMP002", json={
        "role": "admin"
    }, headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert res_fail.status_code == 400
    assert "Security Verification Required" in res_fail.json()["detail"]

    # Promote with valid verification -> succeeds 200
    res_succ = client.put("/api/employees/EMP002", json={
        "role": "admin",
        "admin_verification_password": "Admin@123"
    }, headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert res_succ.status_code == 200
    assert res_succ.json()["role"] == "admin"
