import os
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Create a temporary directory for isolated test database and chroma storage
temp_dir = tempfile.mkdtemp()
os.environ["DATABASE_PATH"] = str(Path(temp_dir) / "test_hr.db")
os.environ["CHROMA_PERSIST_DIRECTORY"] = str(Path(temp_dir) / "test_chroma")
os.environ["UPLOAD_DIRECTORY"] = str(Path(temp_dir) / "test_uploads")
os.environ["JWT_SECRET"] = "test-secret-key-12345"
os.environ["ADMIN_PASSWORD"] = "Admin@123"
os.environ["EMPLOYEE_PASSWORD"] = "Employee@123"
os.environ["MOCK_GEMINI"] = "true"
os.environ["TESTING"] = "true"

from app.main import app
from app.database.db import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def admin_token(client):
    res = client.post("/api/auth/login", json={
        "email": "admin@gmail.com",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    return res.json()["access_token"]

@pytest.fixture
def employee_token(client):
    res = client.post("/api/auth/login", json={
        "email": "employee@gmail.com",
        "password": "Employee@123"
    })
    assert res.status_code == 200
    return res.json()["access_token"]

