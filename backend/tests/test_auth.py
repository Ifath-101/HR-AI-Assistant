import pytest

def test_admin_login_success(client):
    response = client.post("/api/auth/login", json={
        "email": "admin@gmail.com",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" == "access_token"
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "admin"
    assert data["user"]["email"] == "admin@gmail.com"

def test_employee_login_success(client):
    response = client.post("/api/auth/login", json={
        "email": "employee@gmail.com",
        "password": "Employee@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "employee"
    assert data["user"]["email"] == "employee@gmail.com"
    assert data["user"]["employee_id"] == "EMP001"

def test_login_invalid_password(client):
    response = client.post("/api/auth/login", json={
        "email": "admin@gmail.com",
        "password": "WrongPassword123"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_role_separation_employee_forbidden_from_admin_endpoints(client, employee_token):
    # Employee attempts to list all employees (Admin-only endpoint)
    response = client.get("/api/employees", headers={
        "Authorization": f"Bearer {employee_token}"
    })
    assert response.status_code == 403
    assert "HR Administrator role required" in response.json()["detail"]

def test_admin_access_allowed_on_admin_endpoints(client, admin_token):
    # Admin accesses employee list
    response = client.get("/api/employees", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert response.status_code == 200
    employees = response.json()
    assert len(employees) >= 2
    emails = [e["email"] for e in employees]
    assert "admin@gmail.com" in emails
    assert "employee@gmail.com" in emails

