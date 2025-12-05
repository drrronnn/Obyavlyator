#!/usr/bin/env python3
"""
Скрипт для запуска FastAPI приложения
"""

import uvicorn
import logging
from app.core.config import settings

if __name__ == "__main__":
    # Настройка логирования
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("[START] Запуск Cian Parser API...")
    print(f"[CONFIG] Интервал парсинга: {settings.PARSER_INTERVAL_MINUTES} минут")
    print(f"[CONFIG] Headless режим: {settings.PARSER_HEADLESS}")
    print(f"[CONFIG] Максимум страниц: {settings.PARSER_MAX_PAGES}")
    print("[INFO] API будет доступно по адресу: http://localhost:8001")
    print("[INFO] Документация API: http://localhost:8001/docs")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,  # Отключаем reload для стабильности парсера
        log_level=settings.LOG_LEVEL.lower()
    )