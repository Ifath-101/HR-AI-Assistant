from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.database.db import get_all_employees, get_employee_by_id, update_employee_record
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

class EmployeeUpdateRequest(BaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None
    annual_leave_balance: Optional[int] = Field(None, ge=0)
    medical_leave_used: Optional[int] = Field(None, ge=0)
    reporting_manager: Optional[str] = None

@router.get("/me", response_model=EmployeeResponse)
def get_my_record(current_user: dict = Depends(get_current_user)):
    """Fetch the authenticated employee's personal record."""
    # Always fetch fresh record from DB using token's employee_id
    employee = get_employee_by_id(current_user["employee_id"])
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    return employee

@router.get("", response_model=List[EmployeeResponse])
def list_employees(admin_user: dict = Depends(require_admin)):
    """Admin only: List all employee records."""
    return get_all_employees()

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
    """Admin only: Update an employee's records (e.g. leave balance, manager, designation)."""
    existing = get_employee_by_id(employee_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")

    updated = update_employee_record(
        employee_id=employee_id,
        department=update_data.department,
        designation=update_data.designation,
        annual_leave_balance=update_data.annual_leave_balance,
        medical_leave_used=update_data.medical_leave_used,
        reporting_manager=update_data.reporting_manager
    )
    return updated

