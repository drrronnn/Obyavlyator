from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db import get_db
from app.users.models import User
from app.users.schemas import UserCreate, UserResponse, VerifyEmail, ForgotPassword, ResetPassword, GoogleAuth, UpdateUserName, RequestEmailChange, ConfirmEmailChange, RequestPasswordChange, ConfirmPasswordChange
from app.auth.utils import get_password_hash, verify_password, create_access_token, get_current_user
from app.services.redis_service import redis_client, store_email_change_otp, get_email_change_otp, delete_email_change_otp, store_password_change_otp, get_password_change_otp, delete_password_change_otp
from app.tasks.email_tasks import send_otp_task, send_email_change_otp_task
from app.users.service import update_user_name, request_email_change, confirm_email_change, store_pending_password, confirm_password_change
from app.core.responses import success_response, error_response, ErrorCode
import random
import hashlib
import logging
import requests



router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)


@router.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        logger.warning(f"Попытка регистрации с существующим email: {user_data.email}")
        return error_response(400, ErrorCode.EMAIL_ALREADY_EXISTS)
    
    rate_limit_key = f"otp_rate_limit:{user_data.email}"
    last_request = redis_client.get(rate_limit_key)
    if last_request:
        logger.warning(f"Rate limit: повторный запрос OTP для {user_data.email}")
        return error_response(429, ErrorCode.TOO_MANY_REQUESTS)
    
    otp = str(random.randint(100000, 999999))
    hashed_otp = hashlib.sha256(otp.encode()).hexdigest()
    hashed_password = get_password_hash(user_data.password)
    
    redis_client.setex(f"email_otp:{user_data.email}", 600, hashed_otp)
    redis_client.setex(f"pending_user:{user_data.email}", 600, f"{user_data.first_name}|{user_data.last_name}|{hashed_password}")
    redis_client.setex(rate_limit_key, 60, "1")
    
    send_otp_task.delay(user_data.email, otp)
    logger.info(f"OTP отправлен на email: {user_data.email}")
    
    return success_response({"message": "OTP sent to your email"})


@router.post("/verify-email")
async def verify_email(verify_data: VerifyEmail, db: Session = Depends(get_db)):
    """Подтверждение email через OTP"""
    stored_otp = redis_client.get(f"email_otp:{verify_data.email}")
    if not stored_otp:
        logger.warning(f"OTP не найден или истек для email: {verify_data.email}")
        return error_response(400, ErrorCode.OTP_EXPIRED)
    
    hashed_input_otp = hashlib.sha256(verify_data.otp_code.encode()).hexdigest()
    if hashed_input_otp != stored_otp:
        logger.warning(f"Неверный OTP для email: {verify_data.email}")
        return error_response(400, ErrorCode.INVALID_OTP)
    
    pending_user_data = redis_client.get(f"pending_user:{verify_data.email}")
    if not pending_user_data:
        logger.error(f"Данные пользователя не найдены для email: {verify_data.email}")
        return error_response(400, ErrorCode.REGISTRATION_DATA_NOT_FOUND)
    
    first_name, last_name, hashed_password = pending_user_data.split("|")
    
    user = User(
        email=verify_data.email,
        first_name=first_name,
        last_name=last_name,
        hashed_password=hashed_password,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    redis_client.delete(f"email_otp:{verify_data.email}")
    redis_client.delete(f"pending_user:{verify_data.email}")
    
    access_token = create_access_token(data={"sub": user.email})
    logger.info(f"Email подтвержден для пользователя: {verify_data.email}")
    
    return success_response({
        "message": "Email успешно подтвержден",
        "access_token": access_token,
        "token_type": "bearer"
    })


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Вход пользователя"""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        logger.warning(f"Попытка входа с несуществующим email: {form_data.username}")
        return error_response(401, ErrorCode.INVALID_CREDENTIALS)
    
    if not user.is_verified:
        rate_limit_key = f"otp_rate_limit:{user.email}"
        last_request = redis_client.get(rate_limit_key)
        if last_request:
            logger.warning(f"Rate limit: повторный запрос OTP для {user.email}")
            return error_response(429, ErrorCode.TOO_MANY_REQUESTS)
        
        otp = str(random.randint(100000, 999999))
        hashed_otp = hashlib.sha256(otp.encode()).hexdigest()
        redis_client.setex(f"email_otp:{user.email}", 600, hashed_otp)
        redis_client.setex(rate_limit_key, 60, "1")
        send_otp_task.delay(user.email, otp)
        logger.warning(f"Попытка входа с неподтвержденным email: {form_data.username}. OTP отправлен.")
        return JSONResponse(
            status_code=401,
            content={
                "data": {"email": user.email},
                "error": {
                    "code": 401,
                    "message": ErrorCode.EMAIL_NOT_VERIFIED.value
                }
            }
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Неверный пароль для email: {form_data.username}")
        return error_response(401, ErrorCode.INVALID_CREDENTIALS)
    
    access_token = create_access_token(data={"sub": user.email})
    logger.info(f"Успешный вход пользователя: {user.email}")
    
    return success_response({
        "access_token": access_token,
        "token_type": "bearer"
    })


@router.post("/forgot-password")
async def forgot_password(forgot_data: ForgotPassword, db: Session = Depends(get_db)):
    """Запрос на восстановление пароля"""
    user = db.query(User).filter(User.email == forgot_data.email).first()
    if not user:
        logger.warning(f"Попытка восстановления пароля для несуществующего email: {forgot_data.email}")
        return error_response(404, ErrorCode.USER_NOT_FOUND)
    
    rate_limit_key = f"otp_rate_limit:{forgot_data.email}"
    last_request = redis_client.get(rate_limit_key)
    if last_request:
        logger.warning(f"Rate limit: повторный запрос OTP для {forgot_data.email}")
        return error_response(429, ErrorCode.TOO_MANY_REQUESTS)
    
    otp = str(random.randint(100000, 999999))
    hashed_otp = hashlib.sha256(otp.encode()).hexdigest()
    
    redis_client.setex(f"reset_otp:{forgot_data.email}", 600, hashed_otp)
    redis_client.setex(rate_limit_key, 60, "1")
    
    send_otp_task.delay(forgot_data.email, otp)
    logger.info(f"OTP для сброса пароля отправлен на email: {forgot_data.email}")
    
    return success_response({"message": "OTP для сброса пароля отправлен на ваш email"})


@router.post("/reset-password")
async def reset_password(reset_data: ResetPassword, db: Session = Depends(get_db)):
    """Сброс пароля через OTP"""
    stored_otp = redis_client.get(f"reset_otp:{reset_data.email}")
    if not stored_otp:
        logger.warning(f"OTP для сброса пароля не найден или истек для email: {reset_data.email}")
        return error_response(400, ErrorCode.OTP_EXPIRED)
    
    hashed_input_otp = hashlib.sha256(reset_data.otp_code.encode()).hexdigest()
    if hashed_input_otp != stored_otp:
        logger.warning(f"Неверный OTP для сброса пароля для email: {reset_data.email}")
        return error_response(400, ErrorCode.INVALID_OTP)
    
    user = db.query(User).filter(User.email == reset_data.email).first()
    if not user:
        logger.error(f"Пользователь не найден при сбросе пароля: {reset_data.email}")
        return error_response(404, ErrorCode.USER_NOT_FOUND)
    
    user.hashed_password = get_password_hash(reset_data.new_password)
    db.commit()
    
    redis_client.delete(f"reset_otp:{reset_data.email}")
    
    logger.info(f"Пароль успешно сброшен для пользователя: {reset_data.email}")
    
    return success_response({"message": "Пароль успешно изменен"})




@router.post("/google")
async def google_auth(google_data: GoogleAuth, db: Session = Depends(get_db)):
    """Авторизация через Google"""
    try:
        google_user = None
        
        # Поддержка credential (JWT token) - старый способ
        if google_data.credential:
            response = requests.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={google_data.credential}"
            )
            
            if response.status_code != 200:
                logger.warning(f"Google credential верификация не удалась")
                return error_response(401, ErrorCode.INVALID_GOOGLE_TOKEN)
            
            google_user = response.json()
        
        # Поддержка access_token - новый способ для кастомной кнопки
        elif google_data.access_token:
            response = requests.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {google_data.access_token}"}
            )
            
            if response.status_code != 200:
                logger.warning(f"Google access_token верификация не удалась")
                return error_response(401, ErrorCode.INVALID_GOOGLE_TOKEN)
            
            google_user = response.json()
        
        else:
            logger.error("Не предоставлен ни credential, ни access_token")
            return error_response(400, ErrorCode.INVALID_GOOGLE_TOKEN)
        
        # Получаем email
        email = google_user.get("email")
        
        if not email:
            logger.error("Google не вернул email")
            return error_response(400, ErrorCode.INVALID_GOOGLE_TOKEN)
        
        # Проверяем существующего пользователя
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Создаем нового пользователя
            user = User(
                email=email,
                first_name=google_user.get("given_name"),
                last_name=google_user.get("family_name") or google_user.get("family_name"),
                hashed_password=get_password_hash(str(random.randint(100000000, 999999999))),
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Создан новый пользователь через Google: {email}")
        
        # Создаем access token для нашей системы
        access_token = create_access_token(data={"sub": user.email})
        logger.info(f"Успешный вход через Google: {user.email}")
        
        return success_response({
            "access_token": access_token,
            "token_type": "bearer"
        })
        
    except Exception as e:
        logger.error(f"Ошибка Google авторизации: {e}")
        return error_response(401, ErrorCode.INVALID_GOOGLE_TOKEN)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Получить данные текущего пользователя"""
    logger.info(f"Запрос данных пользователя: {current_user.email}")
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(update_data: UpdateUserName, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Обновление профиля пользователя"""
    updated_user = update_user_name(db, current_user, update_data.first_name, update_data.last_name)
    logger.info(f"Профиль обновлен для пользователя: {current_user.email}")
    return updated_user


@router.post("/change-email")
async def change_email(email_data: RequestEmailChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Запрос на смену email"""
    success, result = request_email_change(db, current_user, email_data.new_email, email_data.current_password)
    
    if not success:
        logger.warning(f"Ошибка запроса смены email для {current_user.email}: {result}")
        return error_response(400, ErrorCode.INVALID_CREDENTIALS if result == "Invalid password" else ErrorCode.EMAIL_ALREADY_EXISTS)
    
    otp = str(random.randint(100000, 999999))
    store_email_change_otp(current_user.id, otp)
    
    send_email_change_otp_task.delay(email_data.new_email, otp)
    logger.info(f"OTP для смены email отправлен на: {email_data.new_email}")
    
    return success_response({"message": "OTP sent to your new email"})


@router.post("/confirm-change-email", response_model=UserResponse)
async def confirm_change_email_endpoint(confirm_data: ConfirmEmailChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Подтверждение смены email через OTP"""
    stored_otp = get_email_change_otp(current_user.id)
    if not stored_otp:
        logger.warning(f"OTP для смены email не найден или истек для пользователя: {current_user.email}")
        return error_response(400, ErrorCode.OTP_EXPIRED)
    
    hashed_input_otp = hashlib.sha256(confirm_data.otp_code.encode()).hexdigest()
    if hashed_input_otp != stored_otp:
        logger.warning(f"Неверный OTP для смены email для пользователя: {current_user.email}")
        return error_response(400, ErrorCode.INVALID_OTP)
    
    if not current_user.pending_email_token:
        logger.error(f"Токен смены email не найден для пользователя: {current_user.email}")
        return error_response(400, ErrorCode.INVALID_OTP)
    
    success = confirm_email_change(db, current_user, current_user.pending_email_token)
    if not success:
        logger.error(f"Ошибка подтверждения смены email для пользователя: {current_user.email}")
        return error_response(400, ErrorCode.INVALID_OTP)
    
    delete_email_change_otp(current_user.id)
    logger.info(f"Email успешно изменен для пользователя: {current_user.email}")
    
    return current_user


@router.post("/change-password")
async def change_password_endpoint(password_data: RequestPasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Запрос на смену пароля"""
    store_pending_password(db, current_user, password_data.new_password)
    
    otp = str(random.randint(100000, 999999))
    store_password_change_otp(current_user.id, otp)
    
    send_otp_task.delay(current_user.email, otp)
    logger.info(f"OTP для смены пароля отправлен на: {current_user.email}")
    
    return success_response({"message": "OTP sent to your email"})


@router.post("/confirm-change-password")
async def confirm_change_password_endpoint(confirm_data: ConfirmPasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Подтверждение смены пароля через OTP"""
    stored_otp = get_password_change_otp(current_user.id)
    if not stored_otp:
        logger.warning(f"OTP для смены пароля не найден или истек для пользователя: {current_user.email}")
        return error_response(400, ErrorCode.OTP_EXPIRED)
    
    hashed_input_otp = hashlib.sha256(confirm_data.otp_code.encode()).hexdigest()
    if hashed_input_otp != stored_otp:
        logger.warning(f"Неверный OTP для смены пароля для пользователя: {current_user.email}")
        return error_response(400, ErrorCode.INVALID_OTP)
    
    success = confirm_password_change(db, current_user)
    if not success:
        logger.error(f"Ошибка подтверждения смены пароля для пользователя: {current_user.email}")
        return error_response(400, ErrorCode.INVALID_OTP)
    
    delete_password_change_otp(current_user.id)
    logger.info(f"Пароль успешно изменен для пользователя: {current_user.email}")
    
    return success_response({"message": "Password successfully changed"})
