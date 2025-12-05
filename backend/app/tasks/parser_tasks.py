import logging
import redis
from celery.signals import worker_ready
from app.tasks.celery_app import celery_app
from app.db import SessionLocal
from app.parsers.manager import run_parsers
from app.core.config import settings

logger = logging.getLogger(__name__)
redis_client = redis.from_url(settings.REDIS_URL)

@celery_app.task(name="run_parser_task", bind=True, max_retries=3)
def run_parser_task(self):
    """Задача для запуска парсера"""
    db = SessionLocal()
    
    # Публикуем событие "parser started" и сохраняем статус
    redis_client.set("parser_status", "running", ex=3600)  # Expires in 1 hour
    redis_client.publish("parser_events", '{"type":"parser_status","status":"running"}')
    
    try:
        logger.info("🚀 Запуск парсера через Celery")
        new_listings = run_parsers(db)
        logger.info(f"✅ Парсинг завершен. Найдено {len(new_listings)} новых объявлений")
        
        # Публикуем событие "parser completed" и обновляем статус
        redis_client.set("parser_status", "completed", ex=10)  # Auto-reset to idle after 10 seconds
        redis_client.publish("parser_events", f'{{"type":"parser_status","status":"completed","new_count":{len(new_listings)}}}')
        
        return {"status": "success", "new_listings_count": len(new_listings)}
    except Exception as e:
        logger.error(f"❌ Ошибка парсинга: {e}")
        
        # Публикуем событие "parser error" и обновляем статус
        redis_client.set("parser_status", "error", ex=300)  # Keep error status for 5 minutes
        redis_client.publish("parser_events", '{"type":"parser_status","status":"error"}')
        
        db.rollback()
        raise self.retry(exc=e, countdown=300)
    finally:
        db.close()

@worker_ready.connect
def on_worker_ready(sender, **kwargs):
    """Запускаем парсер сразу при старте worker"""
    logger.info("🎯 Worker готов! Запускаем парсер через 10 секунд...")
    # Запускаем задачу с небольшой задержкой, чтобы worker успел полностью инициализироваться
    run_parser_task.apply_async(countdown=10)
