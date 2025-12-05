import redis
from app.core.config import settings
import logging
import hashlib
from uuid import UUID

logger = logging.getLogger(__name__)

try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()  # Проверка подключения
    logger.info("✅ Redis подключен")
except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError):
    logger.warning("⚠️ Redis недоступен, используется FakeRedis для тестирования")
    import fakeredis
    redis_client = fakeredis.FakeStrictRedis(decode_responses=True)


def store_email_change_otp(user_id: UUID, otp_code: str) -> None:
    """Сохранить OTP для смены email с TTL 10 минут"""
    key = f"email_change:{user_id}"
    hashed_otp = hashlib.sha256(otp_code.encode()).hexdigest()
    redis_client.setex(key, 600, hashed_otp)


def get_email_change_otp(user_id: UUID) -> str | None:
    """Получить хэшированный OTP для смены email"""
    key = f"email_change:{user_id}"
    return redis_client.get(key)


def delete_email_change_otp(user_id: UUID) -> None:
    """Удалить OTP для смены email"""
    key = f"email_change:{user_id}"
    redis_client.delete(key)


def store_password_change_otp(user_id: UUID, otp_code: str) -> None:
    """Сохранить OTP для смены пароля с TTL 10 минут"""
    key = f"password_change:{user_id}"
    hashed_otp = hashlib.sha256(otp_code.encode()).hexdigest()
    redis_client.setex(key, 600, hashed_otp)


def get_password_change_otp(user_id: UUID) -> str | None:
    """Получить хэшированный OTP для смены пароля"""
    key = f"password_change:{user_id}"
    return redis_client.get(key)


def delete_password_change_otp(user_id: UUID) -> None:
    """Удалить OTP для смены пароля"""
    key = f"password_change:{user_id}"
    redis_client.delete(key)


def acquire_parser_lock() -> bool:
    """Захватывает lock для парсера с TTL 2 часа (7200 секунд)
    
    Returns:
        True если lock успешно захвачен, False если парсер уже запущен
    """
    key = "parser:lock"
    # setnx возвращает True если ключа не было и он был установлен
    # Устанавливаем lock на 2 часа (7200 секунд)
    acquired = redis_client.set(key, "locked", nx=True, ex=7200)
    return bool(acquired)


def release_parser_lock() -> None:
    """Освобождает lock парсера"""
    key = "parser:lock"
    redis_client.delete(key)


def is_parser_locked() -> bool:
    """Проверяет, заблокирован ли парсер
    
    Returns:
        True если парсер в данный момент работает, False если свободен
    """
    key = "parser:lock"
    return bool(redis_client.exists(key))
