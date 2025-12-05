"""
Скрипт для запуска Celery Beat (планировщик задач)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == '__main__':
    from app.tasks.celery_app import celery_app
    
    # Для Windows указываем явный путь к файлу расписания
    if sys.platform == 'win32':
        project_dir = os.path.dirname(os.path.abspath(__file__))
        schedule_file = os.path.join(project_dir, 'celerybeat-schedule')
        celery_app.start([
            'beat',
            '--loglevel=info',
            f'--schedule={schedule_file}'
        ])
    else:
        celery_app.start(['beat', '--loglevel=info'])
