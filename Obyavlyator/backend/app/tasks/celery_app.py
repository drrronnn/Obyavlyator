from celery import Celery
from celery.schedules import crontab
from datetime import timedelta
import sys
import os
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.autodiscover_tasks(["app.tasks.email_tasks", "app.tasks.parser_tasks"])

# Настройка для Windows - используем абсолютный путь к файлу расписания
if sys.platform == 'win32':
    # Получаем абсолютный путь к директории проекта
    project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    schedule_file = os.path.join(project_dir, 'celerybeat-schedule')
    celery_app.conf.beat_schedule_filename = schedule_file

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=False,
    worker_prefetch_multiplier=4,
    task_track_started=True,
    # Убраны task_time_limit и task_soft_time_limit
    # Парсинг может длиться сколько нужно (час, два или более)
    # Redis lock с TTL 2 часа защищает от зависших задач
)

# Используем timedelta для расписания
celery_app.conf.beat_schedule = {
    "run-parser-every-interval": {
        "task": "run_parser_task",
        "schedule": timedelta(minutes=settings.PARSER_INTERVAL_MINUTES),
    },
}
