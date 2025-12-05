"""
Playwright client for getting cookies from Avito
Based on original parser implementation
"""

import asyncio
import random
import httpx
from loguru import logger
from playwright.async_api import async_playwright
from typing import Optional, Dict

from .config import Proxy, ProxySplit


class PlaywrightCookieGetter:
    """Gets cookies from Avito using Playwright browser"""
    
    def __init__(
        self,
        proxy: Optional[Proxy] = None,
        headless: bool = True,
        user_agent: Optional[str] = None
    ):
        self.proxy = proxy
        self.proxy_split = self._parse_proxy() if proxy else None
        self.headless = headless
        self.user_agent = user_agent or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
        self.context = None
        self.page = None
        self.browser = None
        self.playwright = None
    
    def _parse_proxy(self) -> Optional[ProxySplit]:
        """Parse proxy string into components"""
        if not self.proxy or not self.proxy.proxy_string:
            return None
        
        try:
            proxy_str = self.proxy.proxy_string
            
            # Remove protocol if present
            if "://" in proxy_str:
                proxy_str = proxy_str.split("://")[1]
            
            # Format: login:password@ip:port
            if "@" in proxy_str:
                auth, ip_port = proxy_str.split("@")
                login, password = auth.split(":")
            else:
                # Format: login:password:ip:port
                parts = proxy_str.split(":")
                if len(parts) == 4:
                    login, password, ip, port = parts
                    ip_port = f"{ip}:{port}"
                else:
                    logger.error("Invalid proxy format")
                    return None
            
            # ВАЖНО: Используем HTTP формат (как в оригинале)
            if not ip_port.startswith(("http://", "https://", "socks")):
                ip_port = f"http://{ip_port}"
            
            return ProxySplit(
                ip_port=ip_port,
                login=login,
                password=password,
                change_ip_link=self.proxy.change_ip_link if self.proxy else None
            )
        except Exception as e:
            logger.error(f"Error parsing proxy: {e}")
            return None
    
    @staticmethod
    def _parse_cookie_string(cookie_str: str) -> dict:
        """Parse cookie string into dictionary"""
        return dict(pair.split("=", 1) for pair in cookie_str.split("; ") if "=" in pair)
    
    async def _launch_browser(self):
        """Launch Playwright browser"""
        try:
            # Ensure Playwright is installed
            from .playwright_setup import ensure_playwright_installed
            ensure_playwright_installed("chromium")
            
            # Import and setup stealth
            try:
                from playwright_stealth import Stealth
                stealth = Stealth()
                # Wrap async_playwright with stealth
                self.playwright_context = stealth.use_async(async_playwright())
                playwright = await self.playwright_context.__aenter__()
                self.playwright = playwright
                use_stealth = True
            except ImportError:
                logger.warning("playwright-stealth not installed, using without stealth")
                self.playwright = await async_playwright().start()
                use_stealth = False
            
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
            
            self.browser = await self.playwright.chromium.launch(**launch_args)
            
            context_args = {
                "user_agent": self.user_agent,
                "viewport": {"width": 1920, "height": 1080},
                "screen": {"width": 1920, "height": 1080},
                "device_scale_factor": 1,
                "is_mobile": False,
                "has_touch": False,
            }
            
            # Add proxy if configured
            if self.proxy_split:
                context_args["proxy"] = {
                    "server": self.proxy_split.ip_port,
                    "username": self.proxy_split.login,
                    "password": self.proxy_split.password
                }
            
            self.context = await self.browser.new_context(**context_args)
            self.page = await self.context.new_page()
            
            # Apply additional stealth if not using playwright-stealth
            if not use_stealth:
                await self.page.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
                    Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
                    window.chrome = { runtime: {} };
                    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
                    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                """)
            
        except Exception as e:
            logger.error(f"Error launching browser: {e}")
            raise
    
    async def _load_page_and_get_cookies(self, url: str) -> dict:
        """Load page and extract cookies"""
        try:
            await self.page.goto(
                url=url,
                timeout=60000,
                wait_until="domcontentloaded"
            )
            
            # Wait for cookies to be set
            for attempt in range(10):
                await asyncio.sleep(2)
                
                # Check for IP blocking
                await self._check_block()
                
                raw_cookie = await self.page.evaluate("() => document.cookie")
                cookie_dict = self._parse_cookie_string(raw_cookie)
                
                # Check if we have the required cookie
                if cookie_dict.get("ft") or cookie_dict.get("u"):
                    logger.info("Cookies successfully obtained")
                    return cookie_dict
            
            logger.warning("Failed to get required cookies")
            return {}
            
        except Exception as e:
            logger.error(f"Error loading page: {e}")
            return {}
    
    async def _check_block(self):
        """Check if IP is blocked and handle it"""
        from .constants import BAD_IP_TITLE
        
        try:
            title = await self.page.title()
            logger.debug(f"Page title: {title}")
            
            if BAD_IP_TITLE in str(title).lower():
                logger.warning("IP blocked detected!")
                await self.context.clear_cookies()
                
                # Try to change IP
                if await self.change_ip():
                    logger.info("IP changed, reloading page...")
                    await self.page.reload(timeout=60000)
                else:
                    logger.error("Failed to change IP")
                    
        except Exception as e:
            logger.debug(f"Error checking block: {e}")
    
    async def get_cookies(self, url: str = None) -> tuple[dict, str]:
        """
        Get cookies from Avito
        
        Returns:
            Tuple of (cookies_dict, user_agent)
        """
        if url is None:
            # Use random ad ID
            ads_id = str(random.randint(1111111111, 9999999999))
            url = f"https://www.avito.ru/{ads_id}"
        
        try:
            await self._launch_browser()
            cookies = await self._load_page_and_get_cookies(url)
            return cookies, self.user_agent
            
        finally:
            # Cleanup
            if self.browser:
                await self.browser.close()
            if hasattr(self, 'playwright') and self.playwright:
                await self.playwright.stop()
            if hasattr(self, 'playwright_context') and self.playwright_context:
                await self.playwright_context.__aexit__(None, None, None)
    
    async def change_ip(self) -> bool:
        """Change IP using proxy API"""
        if not self.proxy_split or not self.proxy_split.change_ip_link:
            logger.warning("No proxy change URL configured")
            return False
        
        try:
            # Add &format=json to get structured response
            url = self.proxy_split.change_ip_link
            if '&format=json' not in url:
                url += '&format=json'
            
            response = httpx.get(url, timeout=20)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    new_ip = data.get('new_ip', 'unknown')
                    logger.info(f"IP changed successfully to {new_ip}")
                except Exception:
                    logger.info("IP changed successfully")
                return True
            else:
                logger.error(f"Failed to change IP: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error changing IP: {e}")
            return False


async def get_avito_cookies(
    proxy: Optional[Proxy] = None,
    headless: bool = True
) -> tuple[dict, str]:
    """
    Helper function to get cookies from Avito
    
    Args:
        proxy: Proxy configuration
        headless: Run browser in headless mode
        
    Returns:
        Tuple of (cookies_dict, user_agent)
    """
    logger.info("Getting cookies from Avito...")
    
    client = PlaywrightCookieGetter(
        proxy=proxy,
        headless=headless
    )
    
    return await client.get_cookies()
