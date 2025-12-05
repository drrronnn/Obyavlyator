import requests
from typing import Optional
from loguru import logger
import urllib3

# Отключаем предупреждения о непроверенных HTTPS запросах
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from .config import Proxy


class ProxyPool:
    """Manages proxy connections and IP rotation"""
    
    def __init__(self, proxy_obj: Optional[Proxy] = None):
        """
        Initialize proxy pool
        
        Args:
            proxy_obj: Proxy configuration object
        """
        self.proxy_obj = proxy_obj
    
    def get_proxy_dict(self) -> Optional[dict]:
        """
        Get proxy dictionary for requests
        
        Returns:
            Proxy dict or None
        """
        if not self.proxy_obj or not self.proxy_obj.proxy_string:
            return None
        
        # Use proxy string as-is (format: login:password@ip:port)
        proxy_url = f"http://{self.proxy_obj.proxy_string}"
        
        return {
            'https': proxy_url  # Only HTTPS like in original
        }
    
    def change_ip(self) -> bool:
        """
        Change IP address using proxy change link
        
        Returns:
            True if successful
        """
        if not self.proxy_obj or not self.proxy_obj.change_ip_link:
            logger.warning("No proxy or change IP link configured")
            return False
        
        try:
            # Add &format=json to get structured response
            url = self.proxy_obj.change_ip_link
            if '&format=json' not in url:
                url += '&format=json'
            
            response = requests.get(url, timeout=10, verify=False)  # verify=False для истёкшего SSL
            
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
    
    def is_enabled(self) -> bool:
        """
        Check if proxy is enabled
        
        Returns:
            True if proxy is configured
        """
        return self.proxy_obj is not None and self.proxy_obj.proxy_string is not None
