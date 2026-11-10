import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Resolve workspace directory
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")

    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "peoplesphere-dev-secret-key-change-in-production-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Default Demo Credentials
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@123")
    EMPLOYEE_PASSWORD: str = os.getenv("EMPLOYEE_PASSWORD", "Employee@123")

    # Storage
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", str(BASE_DIR / "data" / "hr.db"))
    CHROMA_PERSIST_DIRECTORY: str = os.getenv("CHROMA_PERSIST_DIRECTORY", str(BASE_DIR / "chroma_data"))
    UPLOAD_DIRECTORY: str = os.getenv("UPLOAD_DIRECTORY", str(BASE_DIR / "uploads"))

    # CORS
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
Path(settings.DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
Path(settings.CHROMA_PERSIST_DIRECTORY).mkdir(parents=True, exist_ok=True)
Path(settings.UPLOAD_DIRECTORY).mkdir(parents=True, exist_ok=True)

