"""
Avito Parser - Main parser class using Playwright
"""

import time
import random
import json
from typing import List, Optional, Dict, Any
from loguru import logger
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
from curl_cffi import requests as curl_requests  # Используем curl_cffi как в оригинале

from .config import AvitoConfig, Proxy, ProxySplit
from .proxy_pool import ProxyPool
from .cookies_manager import CookiesManager
from .url_builder import URLBuilder
from .realty.list import RealtyListPageParser
from .constants import DEFAULT_MAX_RETRIES, DEFAULT_BACKOFF_FACTOR
from .models import Item


class AvitoParser:
    """
    Main Avito parser class using Playwright
    """
    
    def __init__(
        self,
        location: str,
        category: str = "kvartiry",
        proxies: Optional[str] = None,
        proxy_change_url: Optional[str] = None,
        headless: bool = True
    ):
        self.location = location
        self.category = category
        self.headless = headless
        
        # Setup proxy
        if not proxies:
            from app.core.config import settings
            proxies = settings.AVITO_PROXY
            proxy_change_url = settings.AVITO_PROXY_CHANGE_URL

        self.proxy_obj = None
        self.proxy_split = None
        
        if proxies:
            self.proxy_obj = Proxy(
                proxy_string=proxies,
                change_ip_link=proxy_change_url
            )
            # Parse proxy for Playwright
            self.proxy_split = self._parse_proxy(proxies)
        
        self.proxy_pool = ProxyPool(self.proxy_obj)
        self.url_builder = URLBuilder()
        
        # curl_cffi session для запросов (как в оригинале)
        self.session = curl_requests.Session()
        self.cookies = None
        
        # Playwright setup
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        
        # Statistics
        self.good_request_count = 0
        self.bad_request_count = 0
        
        # Initialize browser
        self._init_browser()
        
        logger.info(f"AvitoParser initialized for {location}/{category}")

    def _parse_proxy(self, proxy_str: str) -> Optional[ProxySplit]:
        """Parse proxy string into components (matches original logic)"""
        try:
            # Remove protocol if present
            if "://" in proxy_str:
                proxy_str = proxy_str.split("://")[1]
            
            if "@" in proxy_str:
                # Split by @
                left, right = proxy_str.split("@")
                
                # Determine which part is ip:port by checking for dot
                # If right part has dot, it's likely the IP (e.g., user:pass@ip:port)
                # Otherwise it's ip:port@user:pass
                if "." in right:
                    # Format: user:pass@ip:port
                    user_pass = left
                    ip_port = right
                else:
                    # Forma: ip:port@user:pass
                    ip_port = left
                    user_pass = right
                
                login, password = user_pass.split(":")
            else:
                # Format: user:pass:ip:port or ip:port:user:pass
                parts = proxy_str.split(":")
                if len(parts) == 4:
                    # Check which format by looking for dot
                    if "." in parts[0]:
                        # ip:port:user:pass
                        ip_port = f"{parts[0]}:{parts[1]}"
                        login = parts[2]
                        password = parts[3]
                    else:
                        # user:pass:ip:port
                        login = parts[0]
                        password = parts[1]
                        ip_port = f"{parts[2]}:{parts[3]}"
                else:
                    return None
            
            # ВАЖНО: curl_cffi использует HTTP формат прокси (как в оригинале)
            # Даже если прокси-сервер SOCKS5, curl_cffi обрабатывает его как HTTP
            # НЕ добавляем socks5:// префикс!
            if not ip_port.startswith(("http://", "https://", "socks")):
                ip_port = f"http://{ip_port}"
            
            result = ProxySplit(
                ip_port=ip_port,
                login=login,
                password=password,
                change_ip_link=self.proxy_obj.change_ip_link if self.proxy_obj else None
            )
            
            logger.debug(f"Parsed proxy: server={result.ip_port}, login={result.login}")
            return result
        except Exception as e:
            logger.error(f"Error parsing proxy: {e}")
            return None

    def _init_browser(self):
        """Initialize Playwright browser"""
        try:
            self.playwright = sync_playwright().start()
            
            launch_args = {
                "headless": self.headless,
                "chromium_sandbox": False,
                "args": [
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--start-maximized",
                    "--window-size=1920,1080",
                ]
            }
            
            self.browser = self.playwright.chromium.launch(**launch_args)
            
            context_args = {
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
                "viewport": {"width": 1920, "height": 1080},
                "screen": {"width": 1920, "height": 1080},
                "device_scale_factor": 1,
                "is_mobile": False,
                "has_touch": False,
            }
            
            # ВАЖНО: Playwright НЕ поддерживает SOCKS5 с аутентификацией!
            # Поэтому мы НЕ используем прокси для Playwright
            # Прокси будет использоваться только для requests/httpx запросов
            if self.proxy_split and False:  # Временно отключено
                # Playwright expects server with scheme (http://, https://, socks5://)
                proxy_config = {
                    "server": self.proxy_split.ip_port,
                    "username": self.proxy_split.login,
                    "password": self.proxy_split.password
                }
                context_args["proxy"] = proxy_config
                
                logger.info(f"Configuring proxy: {self.proxy_split.ip_port} (user: {self.proxy_split.login})")
            else:
                if self.proxy_split:
                    logger.warning("Proxy configured but NOT used for Playwright (SOCKS5 auth not supported)")
                    logger.warning("Playwright will work WITHOUT proxy. This may cause IP blocks.")
            
            self.context = self.browser.new_context(**context_args)
            
            # Add stealth scripts
            self.context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
                Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
                window.chrome = { runtime: {} };
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            """)
            
            self.page = self.context.new_page()
            
        except Exception as e:
            logger.error(f"Failed to init browser: {e}")
            self.close()
            raise

    def close(self):
        """Close browser and cleanup"""
        if self.page:
            self.page.close()
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        logger.info("AvitoParser closed")
    
    def fetch_data(self, url: str, retries: int = 3, backoff_factor: int = 1) -> Optional[str]:
        """
        Fetch data using curl_cffi (like original parser)
        
        Args:
            url: URL to fetch
            retries: Number of retry attempts
            backoff_factor: Backoff multiplier for retries
        """
        # Подготовка прокси для curl_cffi (HTTP формат)
        proxy_data = None
        if self.proxy_obj:
            # curl_cffi использует HTTP прокси с auth (работает с SOCKS5 сервером!)
            proxy_data = {
                "https": f"http://{self.proxy_obj.proxy_string}"
            }
        
        for attempt in range(1, retries + 1):
            try:
                logger.debug(f"Attempt {attempt}: Fetching {url}")
                
                response = self.session.get(
                    url=url,
                    proxies=proxy_data,
                    cookies=self.cookies,
                    impersonate="chrome",  # Важно! Имитация Chrome
                    timeout=20,
                    verify=False,
                )
                
                logger.debug(f"Attempt {attempt}: Status {response.status_code}")
                
                # Обработка ошибок сервера
                if response.status_code >= 500:
                    raise curl_requests.RequestsError(f"Server error: {response.status_code}")
                
                # Слишком много запросов
                if response.status_code == 429:
                    self.bad_request_count += 1
                    self.session = curl_requests.Session()
                    self.proxy_pool.change_ip()
                    if attempt >= 3:
                        # Получаем новые cookies через Playwright
                        self.cookies = self._get_fresh_cookies()
                    raise curl_requests.RequestsError(f"Too many requests: {response.status_code}")
                
                # Блокировка
                if response.status_code in [403, 302]:
                    self.cookies = self._get_fresh_cookies()
                    raise curl_requests.RequestsError(f"Blocked: {response.status_code}")
                
                # Проверка на блокировку по контенту
                if "Доступ ограничен" in response.text or "проблема с IP" in response.text.lower():
                    logger.warning("IP blocked detected in content!")
                    self.bad_request_count += 1
                    
                    if attempt >= retries:
                        logger.error(f"Max retries ({retries}) reached. Giving up.")
                        return None
                    
                    # Меняем IP и пробуем снова
                    if self.proxy_pool.change_ip():
                        logger.info("IP changed, retrying...")
                        time.sleep(backoff_factor * attempt)
                        continue
                    return None
                
                self.good_request_count += 1
                return response.text
                
            except curl_requests.RequestsError as e:
                logger.debug(f"Attempt {attempt} failed: {e}")
                if attempt < retries:
                    sleep_time = backoff_factor * attempt
                    logger.debug(f"Retrying in {sleep_time} seconds...")
                    time.sleep(sleep_time)
                else:
                    logger.info("All attempts failed")
                    return None
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                self.bad_request_count += 1
                return None
        
        return None
    
    def _get_fresh_cookies(self) -> Optional[Dict]:
        """Get fresh cookies using Playwright (like original)"""
        try:
            logger.info("Getting fresh cookies via Playwright...")
            from .playwright_cookies import get_avito_cookies
            import asyncio
            
            cookies, user_agent = asyncio.run(
                get_avito_cookies(proxy=self.proxy_obj, headless=self.headless)
            )
            
            if cookies:
                logger.info("Fresh cookies obtained successfully")
                return cookies
            else:
                logger.warning("Failed to get fresh cookies")
                return None
                
        except Exception as e:
            logger.error(f"Error getting fresh cookies: {e}")
            return None
    
    def get_realty(
        self,
        deal_type: str = "sale",
        with_saving_csv: bool = False,
        with_extra_data: bool = False,
        additional_settings: Optional[Dict[str, Any]] = None
    ) -> List[Item]:
        """Get realty listings"""
        url = self._build_realty_url(deal_type, additional_settings)
        logger.info(f"Starting realty parsing: {url}")
        
        parser = RealtyListPageParser(
            driver=self,
            category=self.category,
            deal_type=deal_type,
            location=self.location,
            with_saving_csv=with_saving_csv,
            with_extra_data=with_extra_data,
            additional_settings=additional_settings
        )
        
        self._run_parser(parser, url, additional_settings)
        
        logger.info(f"Parsing completed. Total items: {len(parser.result)}")
        return parser.result
    
    def _build_realty_url(self, deal_type: str, additional_settings: Optional[Dict[str, Any]] = None) -> str:
        path = f"/{self.location}/{self.category}"
        
        params = {}
        if additional_settings:
            if "min_price" in additional_settings:
                params["pmin"] = additional_settings["min_price"]
            if "max_price" in additional_settings:
                params["pmax"] = additional_settings["max_price"]
        return self.url_builder.build_url(path, params)
    
    def _run_parser(self, parser: RealtyListPageParser, url: str, additional_settings: Optional[Dict[str, Any]] = None):
        start_page = additional_settings.get("start_page", 1) if additional_settings else 1
        end_page = additional_settings.get("end_page", 100) if additional_settings else 100
        
        current_url = url
        page_number = start_page
        
        while page_number <= end_page:
            logger.info(f"Parsing page {page_number}")
            html = self.fetch_data(current_url)
            
            if not html:
                break
            
            success, _, is_last_page = parser.parse_list_page(html, page_number, 0)
            
            if not success:
                break
                
            if is_last_page:
                break
                
            current_url = self.url_builder.get_next_page_url(current_url)
            page_number += 1
            time.sleep(random.uniform(2, 5))
        
        if parser.with_saving_csv:
            parser.save_results()


def get_locations() -> List[str]:
    """Get list of available locations"""
    return [
        "moskva",
        "sankt-peterburg",
        "novosibirsk",
        "ekaterinburg",
        "kazan",
        "nizhniy_novgorod",
        "chelyabinsk",
        "samara",
        "omsk",
        "rostov-na-donu",
    ]


def get_categories() -> List[str]:
    """Get list of available categories"""
    return [
        "kvartiry",
        "komnaty",
        "doma_dachi_kottedzhi",
        "zemelnye_uchastki",
        "garazhi_i_mashinomesta",
        "kommercheskaya_nedvizhimost",
    ]
