import time
import re
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
from loguru import logger


class RealtyPageParser:
    """Parser for individual Avito realty item pages"""
    
    def __init__(self, driver, url: str):
        """
        Initialize realty page parser
        
        Args:
            driver: Selenium/requests session
            url: Item page URL
        """
        self.driver = driver
        self.url = url
        self.html = None
        self.soup = None
    
    def load_page(self):
        """Load page HTML"""
        try:
            if hasattr(self.driver, 'get'):
                # Selenium driver
                self.driver.get(self.url)
                time.sleep(3)
                self.html = self.driver.page_source
            else:
                # Requests session
                response = self.driver.get(self.url, timeout=30)
                self.html = response.text
            
            self.soup = BeautifulSoup(self.html, 'html.parser')
            
        except Exception as e:
            logger.error(f"Error loading page {self.url}: {e}")
            raise
    
    def parse_page(self) -> Dict[str, Any]:
        """
        Parse item page and extract additional data
        
        Returns:
            Dictionary with extra data
        """
        self.load_page()
        
        page_data = {
            'total_views': None,
            'today_views': None,
            'phone': None,
            'seller_name': None,
            'seller_type': None,
            'images': [],
        }
        
        # Parse views
        views_data = self.parse_views()
        if views_data:
            page_data.update(views_data)
        
        # Parse seller info
        seller_data = self.parse_seller()
        if seller_data:
            page_data.update(seller_data)
        
        # Parse images
        images = self.parse_images()
        if images:
            page_data['images'] = images
        
        return page_data
    
    def parse_views(self) -> Optional[Dict[str, int]]:
        """
        Parse view statistics
        
        Returns:
            Dictionary with view counts
        """
        try:
            # Find views block
            views_block = self.soup.find('div', {'data-marker': 'item-view/total-views'})
            
            if not views_block:
                return None
            
            views_text = views_block.get_text()
            
            # Extract numbers
            total_match = re.search(r'(\d+)\s*просмотр', views_text)
            today_match = re.search(r'(\d+)\s*сегодня', views_text)
            
            return {
                'total_views': int(total_match.group(1)) if total_match else None,
                'today_views': int(today_match.group(1)) if today_match else None,
            }
            
        except Exception as e:
            logger.debug(f"Error parsing views: {e}")
            return None
    
    def parse_seller(self) -> Optional[Dict[str, str]]:
        """
        Parse seller information
        
        Returns:
            Dictionary with seller data
        """
        try:
            # Find seller block
            seller_block = self.soup.find('div', {'data-marker': 'seller-info'})
            
            if not seller_block:
                return None
            
            seller_data = {}
            
            # Seller name
            name_elem = seller_block.find('div', {'data-marker': 'seller-info/name'})
            if name_elem:
                seller_data['seller_name'] = name_elem.get_text(strip=True)
            
            # Seller type
            type_elem = seller_block.find('div', {'data-marker': 'seller-info/label'})
            if type_elem:
                seller_data['seller_type'] = type_elem.get_text(strip=True)
            
            return seller_data
            
        except Exception as e:
            logger.debug(f"Error parsing seller: {e}")
            return None
    
    def parse_images(self) -> list:
        """
        Parse item images
        
        Returns:
            List of image URLs
        """
        try:
            images = []
            
            # Find gallery
            gallery = self.soup.find('div', {'data-marker': 'image-gallery'})
            
            if not gallery:
                return images
            
            # Find all image elements
            img_elements = gallery.find_all('img')
            
            for img in img_elements:
                src = img.get('src') or img.get('data-src')
                if src and src.startswith('http'):
                    images.append(src)
            
            return images
            
        except Exception as e:
            logger.debug(f"Error parsing images: {e}")
            return []
    
    def parse_characteristics(self) -> Dict[str, str]:
        """
        Parse item characteristics (rooms, area, floor, etc.)
        
        Returns:
            Dictionary with characteristics
        """
        try:
            characteristics = {}
            
            # Find params list
            params = self.soup.find_all('li', {'class': 'params-paramsList__item'})
            
            for param in params:
                key_elem = param.find('span', {'class': 'params-paramsList__item-key'})
                value_elem = param.find('span', {'class': 'params-paramsList__item-value'})
                
                if key_elem and value_elem:
                    key = key_elem.get_text(strip=True)
                    value = value_elem.get_text(strip=True)
                    characteristics[key] = value
            
            return characteristics
            
        except Exception as e:
            logger.debug(f"Error parsing characteristics: {e}")
            return {}
