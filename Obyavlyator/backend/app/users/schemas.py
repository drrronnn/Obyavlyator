from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    """Схема для регистрации пользователя"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str | None = None
    last_name: str | None = None


class UserResponse(BaseModel):
    """Схема для возврата данных пользователя"""
    id: UUID
    email: str
    first_name: str | None
    last_name: str | None
    role: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Схема для входа пользователя"""
    email: EmailStr
    password: str


class UserUpdatePassword(BaseModel):
    """Схема для обновления пароля через OTP"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6)


class VerifyEmail(BaseModel):
    """Схема для подтверждения email"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)


class ForgotPassword(BaseModel):
    """Схема для запроса восстановления пароля"""
    email: EmailStr


class ResetPassword(BaseModel):
    """Схема для сброса пароля"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=6)


class GoogleAuth(BaseModel):
    """Схема для Google авторизации"""
    credential: Optional[str] = None
    access_token: Optional[str] = None


class UpdateUserName(BaseModel):
    """Схема для изменения имени и фамилии"""
    first_name: str | None = None
    last_name: str | None = None


class RequestEmailChange(BaseModel):
    """Схема для запроса смены email"""
    new_email: EmailStr
    current_password: str


class ConfirmEmailChange(BaseModel):
    """Схема для подтверждения смены email"""
    otp_code: str = Field(..., min_length=6, max_length=6)


class RequestPasswordChange(BaseModel):
    """Схема для запроса смены пароля"""
    new_password: str = Field(..., min_length=6)


class ConfirmPasswordChange(BaseModel):
    """Схема для подтверждения смены пароля"""
    otp_code: str = Field(..., min_length=6, max_length=6)