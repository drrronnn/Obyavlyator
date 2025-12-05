from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

fm = FastMail(conf)


async def send_otp_email(email: str, otp_code: str):
    """Отправка OTP кода на email"""
    message = MessageSchema(
        subject="Your verification code",
        recipients=[email],
        body=f"Your OTP code is: {otp_code}",
        subtype="plain"
    )
    await fm.send_message(message)
    return True
