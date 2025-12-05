"""
Manages cookies for Avito parser
"""

import json
import asyncio
from pathlib import Path
from typing import Optional, Dict
from loguru import logger

from .config import Proxy


class CookiesManager:
    """Manages saving, loading, and refreshing cookies"""
    
    def __init__(self, cookies_file: str = "avito_cookies.json"):
        """
        Initialize cookies manager
        
        Args:
            cookies_file: Path to cookies file
        """
        self.cookies_file = Path(cookies_file)
        self.cookies: Optional[Dict] = None
        self.user_agent: Optional[str] = None
    
    def save_cookies(self, cookies: Optional[Dict] = None) -> None:
        """
        Save cookies to file
        
        Args:
            cookies: Cookies dict to save (uses self.cookies if None)
        """
        if cookies is None:
            cookies = self.cookies
        
        if not cookies:
            return
        
        try:
            with open(self.cookies_file, 'w', encoding='utf-8') as f:
                json.dump(cookies, f, indent=2)
            logger.debug(f"Cookies saved to {self.cookies_file}")
        except Exception as e:
            logger.error(f"Error saving cookies: {e}")
    
    def load_cookies(self) -> Optional[Dict]:
        """
        Load cookies from file
        
        Returns:
            Cookies dict or None
        """
        if not self.cookies_file.exists():
            logger.debug(f"Cookies file {self.cookies_file} not found")
            return None
        
        try:
            with open(self.cookies_file, 'r', encoding='utf-8') as f:
                self.cookies = json.load(f)
            logger.debug(f"Cookies loaded from {self.cookies_file}")
            return self.cookies
        except Exception as e:
            logger.error(f"Error loading cookies: {e}")
            return None
    
    def clear_cookies(self) -> None:
        """Clear cookies file"""
        try:
            if self.cookies_file.exists():
                self.cookies_file.unlink()
            self.cookies = None
            logger.debug("Cookies cleared")
        except Exception as e:
            logger.error(f"Error clearing cookies: {e}")
    
    def get_fresh_cookies(
        self,
        proxy: Optional[Proxy] = None,
        headless: bool = True,
        max_retries: int = 3
    ) -> tuple[Optional[Dict], Optional[str]]:
        """
        Get fresh cookies from Avito using Playwright
        
        Args:
            proxy: Proxy configuration
            headless: Run browser in headless mode
            max_retries: Maximum number of retry attempts
            
        Returns:
            Tuple of (cookies_dict, user_agent)
        """
        from .playwright_cookies import get_avito_cookies
        
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"Getting fresh cookies (attempt {attempt}/{max_retries})...")
                
                # Get cookies using Playwright
                cookies, user_agent = asyncio.run(
                    get_avito_cookies(proxy=proxy, headless=headless)
                )
                
                if cookies:
                    self.cookies = cookies
                    self.user_agent = user_agent
                    self.save_cookies(cookies)
                    logger.info("Fresh cookies obtained successfully")
                    return cookies, user_agent
                else:
                    logger.warning(f"Attempt {attempt} failed: No cookies received")
                    
            except Exception as e:
                logger.error(f"Attempt {attempt} failed: {e}")
            
            if attempt < max_retries:
                import time
                wait_time = 5 * attempt
                logger.info(f"Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
        
        logger.error("Failed to get fresh cookies after all attempts")
        return None, None
    
    def get_cookies(self) -> Optional[Dict]:
        """
        Get cookies (load from file or return cached)
        
        Returns:
            Cookies dict or None
        """
        if self.cookies:
            return self.cookies
        
        return self.load_cookies()
