from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.database.db import (
    get_all_employees,
    get_employee_by_id,
    get_employee_by_email,
    update_employee_record,
    create_employee_record,
    get_next_suggested_employee_id,
    verify_password,
    hash_password
)
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/employees", tags=["Employees"])

class EmployeeResponse(BaseModel):
    id: int
    employee_id: str
    name: str
    email: str
    role: str
    department: str
    designation: str
    annual_leave_balance: int
    medical_leave_used: int
    reporting_manager: str
    created_at: Optional[str] = None

class EmployeeCreateRequest(BaseModel):
    employee_id: Optional[str] = Field(None, description="Optional custom ID (e.g. EMP010). Auto-generated if omitted.")
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    initial_password: Optional[str] = Field("Employee@123", min_length=6, max_length=128)
    role: str = Field("employee", pattern="^(employee|admin)$")
    department: str = Field(..., min_length=1, max_length=100)
    designation: str = Field(..., min_length=1, max_length=100)
    annual_leave_balance: int = Field(20, ge=0, le=365)
    medical_leave_used: int = Field(0, ge=0, le=365)
    reporting_manager: Optional[str] = Field("", max_length=100)
    admin_verification_password: Optional[str] = Field(None, description="Current HR Administrator password required when granting admin access.")

class EmployeeUpdateRequest(BaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None
    annual_leave_balance: Optional[int] = Field(None, ge=0)
    medical_leave_used: Optional[int] = Field(None, ge=0)
    reporting_manager: Optional[str] = None
    role: Optional[str] = Field(None, pattern="^(employee|admin)$")
    admin_verification_password: Optional[str] = Field(None, description="Current HR Administrator password required when modifying admin role permissions.")

@router.get("/next-id", response_model=dict)
def get_next_id(role: str = "employee", admin_user: dict = Depends(require_admin)):
    """Admin only: Generate next suggested sequential employee ID."""
    next_id = get_next_suggested_employee_id(role)
    return {"suggested_id": next_id}

@router.get("/me", response_model=EmployeeResponse)
def get_my_record(current_user: dict = Depends(get_current_user)):
    """Fetch the authenticated employee's personal record."""
    employee = get_employee_by_id(current_user["employee_id"])
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    return employee

@router.get("", response_model=List[EmployeeResponse])
def list_employees(admin_user: dict = Depends(require_admin)):
    """Admin only: List all employee records."""
    return get_all_employees()

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreateRequest,
    admin_user: dict = Depends(require_admin)
):
    """
    Admin only: Add a new employee or administrator to the directory.
    Industry Security Practice (Step-Up Authentication):
    - Granting 'admin' access (privilege escalation) mandates verification of the acting HR Manager's password.
    - Protects the organization from unauthorized privilege elevation.
    """
    clean_email = payload.email.strip().lower()

    # 1. Check for email uniqueness
    existing_by_email = get_employee_by_email(clean_email)
    if existing_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An employee with email '{clean_email}' already exists in the directory."
        )

    # 2. Check for employee_id uniqueness or generate next ID
    clean_emp_id = (
        payload.employee_id.strip().upper()
        if payload.employee_id and payload.employee_id.strip()
        else get_next_suggested_employee_id(payload.role)
    )
    existing_by_id = get_employee_by_id(clean_emp_id)
    if existing_by_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An employee with ID '{clean_emp_id}' already exists in the directory."
        )

    # 3. Security Verification: If granting 'admin' role, verify acting admin's password
    if payload.role == "admin":
        if not payload.admin_verification_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security Verification Required: You must enter your current HR Administrator password to grant administrative access."
            )
        acting_admin = get_employee_by_email(admin_user["email"])
        if not acting_admin or not verify_password(payload.admin_verification_password, acting_admin["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Security Verification Failed: The administrator password entered is incorrect. Privilege escalation rejected."
            )

    # 4. Hash initial temporary password
    initial_pwd = payload.initial_password or "Employee@123"
    hashed_pwd = hash_password(initial_pwd)

    # 5. Insert new employee into SQLite
    created = create_employee_record(
        employee_id=clean_emp_id,
        name=payload.name.strip(),
        email=clean_email,
        password_hash=hashed_pwd,
        role=payload.role,
        department=payload.department.strip(),
        designation=payload.designation.strip(),
        annual_leave_balance=payload.annual_leave_balance,
        medical_leave_used=payload.medical_leave_used,
        reporting_manager=payload.reporting_manager.strip() if payload.reporting_manager else ""
    )
    return created

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, admin_user: dict = Depends(require_admin)):
    """Admin only: View a specific employee's record."""
    employee = get_employee_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")
    return employee

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str,
    update_data: EmployeeUpdateRequest,
    admin_user: dict = Depends(require_admin)
):
    """
    Admin only: Update an employee's records (e.g. leave balance, manager, designation, role).
    Step-Up Verification is enforced if role is being modified or elevated to 'admin'.
    """
    existing = get_employee_by_id(employee_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    # Step-Up Verification if role is being modified
    if update_data.role and update_data.role != existing["role"]:
        # Prevent self-demotion if currently logged-in admin
        if existing["email"].lower() == admin_user["email"].lower() and update_data.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation prohibited: You cannot revoke your own administrator privileges."
            )

        if not update_data.admin_verification_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security Verification Required: You must enter your current HR Administrator password to modify administrative role permissions."
            )

        acting_admin = get_employee_by_email(admin_user["email"])
        if not acting_admin or not verify_password(update_data.admin_verification_password, acting_admin["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Security Verification Failed: The administrator password entered is incorrect. Role modification rejected."
            )

    updated = update_employee_record(
        employee_id=employee_id,
        department=update_data.department,
        designation=update_data.designation,
        annual_leave_balance=update_data.annual_leave_balance,
        medical_leave_used=update_data.medical_leave_used,
        reporting_manager=update_data.reporting_manager,
        role=update_data.role
    )
    return updated

