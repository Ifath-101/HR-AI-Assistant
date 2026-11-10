from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from pydantic import BaseModel

from app.config import settings
from app.database.db import get_employee_by_email, verify_password
from app.services.rate_limiter import auth_limiter

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT token containing user identity and role."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def validate_token_and_get_user(token: str) -> dict:
    """Validate a JWT token string and return the employee record."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = get_employee_by_email(email)
    if user is None:
        raise credentials_exception

    # Remove password hash before returning
    user_data = dict(user)
    user_data.pop("password_hash", None)
    return user_data

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency: Extract and validate user from JWT Bearer token."""
    return validate_token_and_get_user(token)

def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: Restrict endpoint to HR Administrators only."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: HR Administrator role required"
        )
    return current_user

@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, raw_request: Request):
    """Authenticate user with email and password, returning JWT access token."""
    client_ip = raw_request.client.host if raw_request.client else "unknown"
    allowed, retry_after = auth_limiter.is_allowed(client_ip)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Please wait {retry_after} seconds before trying again.",
            headers={"Retry-After": str(retry_after)}
        )

    user = get_employee_by_email(credentials.email)
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_info = {
        "id": user["id"],
        "employee_id": user["employee_id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "department": user["department"],
        "designation": user["designation"],
        "annual_leave_balance": user["annual_leave_balance"],
        "medical_leave_used": user["medical_leave_used"],
        "reporting_manager": user["reporting_manager"]
    }

    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"], "emp_id": user["employee_id"]}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    }

@router.get("/me")
def get_authenticated_profile(current_user: dict = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return current_user

@router.get("/demo-accounts")
def get_demo_accounts():
    """Provides the two demo accounts for fast demonstration in UI."""
    return [
        {
            "role": "Admin",
            "email": "admin@gmail.com",
            "password": settings.ADMIN_PASSWORD,
            "label": "HR Administrator (Full Admin Access)"
        },
        {
            "role": "Employee",
            "email": "employee@gmail.com",
            "password": settings.EMPLOYEE_PASSWORD,
            "label": "Jane Doe (Software Engineer)"
        }
    ]
