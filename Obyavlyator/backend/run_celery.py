"""
Скрипт для запуска Celery worker на Windows
"""
import os
import sys

# Добавляем текущую директорию в PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == '__main__':
    from gevent import monkey
    monkey.patch_all()
    
    from app.tasks.celery_app import celery_app
    
    celery_app.worker_main([
        'worker',
        '--loglevel=info',
        '--pool=gevent',
        '--concurrency=100'
    ])
