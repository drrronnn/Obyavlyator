from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.users.models import User
from app.users.employee_schemas import EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeListResponse
from app.users.employee_service import (
    get_employees, get_employee_by_id, create_employee, 
    update_employee, delete_employee, check_is_admin, get_all_group_members
)
from app.auth.utils import get_current_user
from app.core.responses import success_response, error_response, ErrorCode
from uuid import UUID
import logging

router = APIRouter(prefix="/employees", tags=["Employees"])
logger = logging.getLogger(__name__)


@router.get("", response_model=EmployeeListResponse)
async def list_employees(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список всех членов группы"""
    employees = get_all_group_members(db, current_user)
    return EmployeeListResponse(employees=employees, total=len(employees))


@router.post("", response_model=EmployeeResponse)
async def add_employee(
    employee_data: EmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавить нового сотрудника (только для админа)"""
    # Проверка прав: только админ
    if not check_is_admin(current_user):
        return error_response(403, ErrorCode.ACCESS_DENIED)
    
    success, result = create_employee(
        db, current_user.id, employee_data.email, employee_data.password,
        employee_data.first_name, employee_data.last_name, 
        employee_data.position, employee_data.role
    )
    
    if not success:
        if result == "MAX_EMPLOYEES_LIMIT":
            return error_response(400, ErrorCode.VALIDATION_ERROR)
        elif result == "EMAIL_ALREADY_EXISTS":
            return error_response(400, ErrorCode.EMAIL_ALREADY_EXISTS)
    
    logger.info(f"Сотрудник {result.email} добавлен пользователем {current_user.email}")
    return result


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить данные сотрудника по ID"""
    admin_id = current_user.id if check_is_admin(current_user) else current_user.created_by
    employee = get_employee_by_id(db, UUID(employee_id), admin_id)
    
    if not employee:
        return error_response(404, ErrorCode.USER_NOT_FOUND)
    
    return employee


@router.patch("/{employee_id}", response_model=EmployeeResponse)
async def update_employee_data(
    employee_id: str,
    employee_data: EmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить данные сотрудника (только для админа)"""
    # Проверка прав
    if not check_is_admin(current_user):
        return error_response(403, ErrorCode.ACCESS_DENIED)
    
    # Нельзя изменить себя
    if str(current_user.id) == employee_id:
        return error_response(403, ErrorCode.ACCESS_DENIED)
    
    admin_id = current_user.id
    
    success, result = update_employee(
        db, UUID(employee_id), admin_id,
        employee_data.email, employee_data.password, employee_data.first_name,
        employee_data.last_name, employee_data.position, employee_data.role
    )
    
    if not success:
        if result == "EMPLOYEE_NOT_FOUND":
            return error_response(404, ErrorCode.USER_NOT_FOUND)
        elif result == "EMAIL_ALREADY_EXISTS":
            return error_response(400, ErrorCode.EMAIL_ALREADY_EXISTS)
    
    logger.info(f"Сотрудник {employee_id} обновлен пользователем {current_user.email}")
    return result


@router.delete("/{employee_id}")
async def remove_employee(
    employee_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить сотрудника (только для админа)"""
    # Проверка прав
    if not check_is_admin(current_user):
        return error_response(403, ErrorCode.ACCESS_DENIED)
    
    # Нельзя удалить себя
    if str(current_user.id) == employee_id:
        return error_response(403, ErrorCode.ACCESS_DENIED)
    
    success, result = delete_employee(db, UUID(employee_id), current_user.id)
    
    if not success:
        return error_response(404, ErrorCode.USER_NOT_FOUND)
    
    logger.info(f"Сотрудник {employee_id} удален пользователем {current_user.email}")
    return success_response({"message": "Employee deleted successfully"})
