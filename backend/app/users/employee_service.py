from sqlalchemy.orm import Session
from app.users.models import User
from app.auth.utils import get_password_hash
from app.core.responses import ErrorCode
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


def get_employees(db: Session, admin_id: UUID) -> list[User]:
    """Получить всех сотрудников созданных админом"""
    return db.query(User).filter(User.created_by == admin_id).all()


def get_all_group_members(db: Session, user: User) -> list[User]:
    """Получить всех членов группы (админа и его сотрудников)"""
    if user.created_by is None:
        # Если пользователь админ - возвращаем его и его сотрудников
        admin = user
        employees = db.query(User).filter(User.created_by == admin.id).all()
        return [admin] + employees
    else:
        # Если сотрудник - возвращаем админа и всех сотрудников
        admin = db.query(User).filter(User.id == user.created_by).first()
        employees = db.query(User).filter(User.created_by == user.created_by).all()
        return [admin] + employees if admin else employees


def get_employee_by_id(db: Session, employee_id: UUID, admin_id: UUID) -> User | None:
    """Получить сотрудника по ID"""
    return db.query(User).filter(
        User.id == employee_id,
        User.created_by == admin_id
    ).first()


def create_employee(db: Session, admin_id: UUID, email: str, password: str, 
                   first_name: str, last_name: str, position: str | None, role: str) -> tuple[bool, User | str]:
    """Создать нового сотрудника"""
    # Проверка лимита сотрудников
    employees_count = db.query(User).filter(User.created_by == admin_id).count()
    if employees_count >= 20:
        return False, "MAX_EMPLOYEES_LIMIT"
    
    # Проверка существования email
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        return False, "EMAIL_ALREADY_EXISTS"
    
    # Создание сотрудника
    employee = User(
        email=email,
        hashed_password=get_password_hash(password),
        first_name=first_name,
        last_name=last_name,
        position=position,
        role=role,
        created_by=admin_id,
        is_verified=False
    )
    
    db.add(employee)
    db.commit()
    db.refresh(employee)
    
    logger.info(f"Создан сотрудник {email} админом {admin_id}")
    return True, employee


def update_employee(db: Session, employee_id: UUID, admin_id: UUID, 
                   email: str | None, password: str | None, first_name: str | None,
                   last_name: str | None, position: str | None, role: str | None) -> tuple[bool, User | str]:
    """Обновить данные сотрудника"""
    employee = get_employee_by_id(db, employee_id, admin_id)
    if not employee:
        return False, "EMPLOYEE_NOT_FOUND"
    
    # Проверка email на уникальность
    if email and email != employee.email:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return False, "EMAIL_ALREADY_EXISTS"
        employee.email = email
    
    if password:
        employee.hashed_password = get_password_hash(password)
    if first_name is not None:
        employee.first_name = first_name
    if last_name is not None:
        employee.last_name = last_name
    if position is not None:
        employee.position = position
    if role is not None:
        employee.role = role
    
    db.commit()
    db.refresh(employee)
    
    logger.info(f"Обновлен сотрудник {employee_id}")
    return True, employee


def delete_employee(db: Session, employee_id: UUID, admin_id: UUID) -> tuple[bool, str]:
    """Удалить сотрудника"""
    employee = get_employee_by_id(db, employee_id, admin_id)
    if not employee:
        return False, "EMPLOYEE_NOT_FOUND"
    
    db.delete(employee)
    db.commit()
    
    logger.info(f"Удален сотрудник {employee_id}")
    return True, "EMPLOYEE_DELETED"


def check_is_admin(user: User) -> bool:
    """Проверить, является ли пользователь админом"""
    return user.role == "admin"
