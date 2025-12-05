from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel
from fastapi.responses import JSONResponse


class ErrorCode(str, Enum):
    """Коды ошибок для фронтенда"""
    # Аутентификация
    NOT_AUTHORIZED = "NOT_AUTHORIZED"
    ACCESS_DENIED = "ACCESS_DENIED"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    INVALID_TOKEN = "INVALID_TOKEN"
    INVALID_GOOGLE_TOKEN = "INVALID_GOOGLE_TOKEN"
    
    # Регистрация
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
    INVALID_OTP = "INVALID_OTP"
    OTP_EXPIRED = "OTP_EXPIRED"
    REGISTRATION_DATA_NOT_FOUND = "REGISTRATION_DATA_NOT_FOUND"
    
    # Rate limiting
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS"
    
    # Пользователь
    USER_NOT_FOUND = "USER_NOT_FOUND"
    
    # Валидация
    VALIDATION_ERROR = "VALIDATION_ERROR"
    
    # Общие
    INTERNAL_ERROR = "INTERNAL_ERROR"
    NOT_FOUND = "NOT_FOUND"


class ErrorResponse(BaseModel):
    """Структура ошибки"""
    code: int
    message: ErrorCode


class ApiResponse(BaseModel):
    """Стандартный формат ответа API"""
    data: Any = {}
    error: Optional[ErrorResponse] = None


def success_response(data: Any = None) -> dict:
    """Успешный ответ"""
    return {
        "data": data or {},
        "error": None
    }


def error_response(code: int, message: ErrorCode) -> JSONResponse:
    """Ответ с ошибкой"""
    return JSONResponse(
        status_code=code,
        content={
            "data": {},
            "error": {
                "code": code,
                "message": message.value
            }
        }
    )
