from app.tasks.celery_app import celery_app
from app.core.config import settings
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.email_tasks.send_otp_task", bind=True, max_retries=3, default_retry_delay=60)
def send_otp_task(self, email: str, otp_code: str):
    """Celery задача для отправки OTP"""
    logger.info(f"🚀 Начало отправки OTP на: {email}")
    try:
        msg = MIMEMultipart()
        msg['From'] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg['To'] = email
        msg['Subject'] = "Your verification code"
        
        body = f"Your OTP code is: {otp_code}"
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
            server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"✅ OTP успешно отправлен на: {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка отправки email: {e}")
        logger.info(f"🔑 OTP КОД: {otp_code}")
        raise self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(name="app.tasks.email_tasks.send_email_change_otp_task", bind=True, max_retries=3, default_retry_delay=60)
def send_email_change_otp_task(self, email: str, otp_code: str):
    """Celery задача для отправки OTP при смене email"""
    return send_otp_task(email, otp_code)
