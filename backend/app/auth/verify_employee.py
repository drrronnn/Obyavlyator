from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.users.models import User
from app.users.schemas import VerifyEmail
from app.services.redis_service import redis_client
from app.auth.utils import create_access_token
from app.core.responses import success_response, error_response, ErrorCode
import hashlib
import logging

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)


@router.post("/verify-employee")
async def verify_employee(verify_data: VerifyEmail, db: Session = Depends(get_db)):
    """Подтверждение email сотрудника через OTP"""
    stored_otp = redis_client.get(f"email_otp:{verify_data.email}")
    if not stored_otp:
        logger.warning(f"OTP не найден или истек для email: {verify_data.email}")
        return error_response(400, ErrorCode.OTP_EXPIRED)
    
    hashed_input_otp = hashlib.sha256(verify_data.otp_code.encode()).hexdigest()
    if hashed_input_otp != stored_otp:
        logger.warning(f"Неверный OTP для email: {verify_data.email}")
        return error_response(400, ErrorCode.INVALID_OTP)
    
    # Находим сотрудника
    user = db.query(User).filter(User.email == verify_data.email).first()
    if not user:
        logger.error(f"Пользователь не найден для email: {verify_data.email}")
        return error_response(404, ErrorCode.USER_NOT_FOUND)
    
    # Верифицируем
    user.is_verified = True
    db.commit()
    db.refresh(user)
    
    redis_client.delete(f"email_otp:{verify_data.email}")
    
    access_token = create_access_token(data={"sub": user.email})
    logger.info(f"Email подтвержден для сотрудника: {verify_data.email}")
    
    return success_response({
        "message": "Email успешно подтвержден",
        "access_token": access_token,
        "token_type": "bearer"
    })
