"""
Playwright setup utilities
Based on original AvitoParser implementation
"""

import subprocess
import sys
import os
from loguru import logger


def ensure_playwright_installed(browser: str = "chromium"):
    """
    Проверяет наличие браузеров Playwright и переопределяет путь для exe-сборки.
    Устанавливает их при необходимости.
    
    Args:
        browser: Browser to install (chromium, firefox, webkit)
    """
    try:
        # === Указываем правильный путь к браузерам ===
        ms_playwright_dir = os.path.join(
            os.path.expanduser("~"), "AppData", "Local", "ms-playwright"
        )
        os.environ["PLAYWRIGHT_BROWSERS_PATH"] = ms_playwright_dir

        from playwright._impl._driver import compute_driver_executable

        result = compute_driver_executable()
        if isinstance(result, tuple):
            driver_path, _ = result
        else:
            driver_path = result

        browsers_exist = os.path.exists(driver_path) or os.path.exists(ms_playwright_dir)

        if not browsers_exist:
            logger.info(f"Playwright не найден. Устанавливаю {browser}...")
            subprocess.run([sys.executable, "-m", "playwright", "install", browser], check=True)
        else:
            logger.debug("Playwright уже установлен")

    except Exception as e:
        logger.warning(f"Ошибка при установке/проверке Playwright: {e}")
