from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class EmployeeCreate(BaseModel):
    """Схема для добавления сотрудника"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str
    last_name: str
    position: Optional[str] = None
    role: str = Field(default="employee", pattern="^(admin|employee)$")


class EmployeeUpdate(BaseModel):
    """Схема для обновления сотрудника"""
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    role: Optional[str] = Field(None, pattern="^(admin|employee)$")


class EmployeeResponse(BaseModel):
    """Схема для возврата данных сотрудника"""
    id: UUID
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    position: Optional[str]
    role: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    """Схема для списка сотрудников"""
    employees: list[EmployeeResponse]
    total: int
