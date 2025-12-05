import json
import time
from typing import List, Optional, Dict, Any
from bs4 import BeautifulSoup
from loguru import logger
from pydantic import ValidationError

from ..base_list import BaseListPageParser
from ..models import Item, ItemsResponse
from .page import RealtyPageParser


class RealtyListPageParser(BaseListPageParser):
    """Parser for Avito realty list pages"""
    
    def __init__(
        self,
        driver,
        category: str,
        deal_type: str,
        location: str,
        with_saving_csv: bool = False,
        with_extra_data: bool = False,
        additional_settings: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize realty list parser
        
        Args:
            driver: Selenium/requests session
            category: Category type
            deal_type: Deal type
            location: Location name
            with_saving_csv: Save to CSV
            with_extra_data: Parse extra data from item pages
            additional_settings: Additional settings
        """
        super().__init__(
            category=category,
            deal_type=deal_type,
            location=location,
            with_saving_csv=with_saving_csv,
            additional_settings=additional_settings
        )
        
        self.driver = driver
        self.with_extra_data = with_extra_data
    
    def parse_list_page(
        self,
        html: str,
        page_number: int,
        attempt_number: int = 0
    ) -> tuple[bool, int, bool]:
        """
        Parse single list page
        
        Args:
            html: Page HTML content
            page_number: Current page number
            attempt_number: Retry attempt number
            
        Returns:
            Tuple of (success, new_attempt_number, is_last_page)
        """
        try:
            # Try to find JSON data in page (like in original parser)
            catalog_data = self.find_json_on_page(html)
            
            if not catalog_data:
                logger.warning(f"No catalog data found on page {page_number}")
                return False, attempt_number + 1, False
            
            # Parse items using ItemsResponse model (like in original)
            try:
                ads_models = ItemsResponse(**catalog_data)
                items = ads_models.items
                    
            except ValidationError as err:
                logger.error(f"Validation error parsing items: {err}")
                return False, attempt_number + 1, False
            
            # Clean null ads (like in original)
            items = [item for item in items if item.id]
            
            if not items:
                logger.warning(f"No items parsed on page {page_number}")
                return False, attempt_number + 1, True
            
            logger.info(f"Page {page_number}: {len(items)} items found")
            
            # Process each item
            for idx, item in enumerate(items):
                self.parse_item(item)
                self.print_parse_progress(page_number, len(items), idx)
            
            print()  # New line after progress
            time.sleep(2)
            
            # Check if last page (less items than expected)
            is_last_page = len(items) < 50
            
            return True, 0, is_last_page
            
            
        except Exception as e:
            logger.error(f"Error parsing page {page_number}: {e}")
            import traceback
            logger.debug(traceback.format_exc())
            return False, attempt_number + 1, False
    
    def find_json_on_page(self, html: str) -> Optional[Dict]:
        """
        Find and extract JSON data from page HTML (matches original parser logic)
        
        Args:
            html: Page HTML
            
        Returns:
            Catalog dictionary with items or None
        """
        try:
            import html as html_module
            soup = BeautifulSoup(html, 'html.parser')
            
            # Find script tag with type='mime/invalid' (like in original parser)
            for script in soup.select('script'):
                script_type = script.get('type')
                
                if script_type == 'mime/invalid':
                    try:
                        script_content = html_module.unescape(script.text)
                        parsed_data = json.loads(script_content)
                        
                        # Check for 'state' key (like in original)
                        if 'state' in parsed_data:
                            state_data = parsed_data['state']
                            catalog = state_data.get('data', {}).get('catalog', {})
                            if catalog:
                                logger.debug("Found catalog in state.data.catalog")
                                return catalog
                        
                        # Check for 'data' key
                        elif 'data' in parsed_data:
                            catalog = parsed_data['data'].get('catalog', {})
                            if catalog:
                                logger.debug("Found catalog in data.catalog")
                                return catalog
                            
                    except Exception as e:
                        logger.debug(f"Error parsing script: {e}")
                        continue
            
            logger.warning("No JSON data found in page")
            return None
            
        except Exception as e:
            logger.error(f"Error finding JSON on page: {e}")
            return None
    
    def parse_items(self, items_data: List[Dict]) -> List[Item]:
        """
        Parse items from JSON data
        
        Args:
            items_data: List of item dictionaries
            
        Returns:
            List of Item objects
        """
        items = []
        
        for item_data in items_data:
            try:
                item = Item(**item_data)
                items.append(item)
            except Exception as e:
                logger.debug(f"Error parsing item: {e}")
                continue
        
        return items
    
    def parse_item(self, item: Item):
        """
        Parse single item and add to results
        
        Args:
            item: Item object
        """
        # Skip if already parsed
        if item.id in self.result_set:
            return
        
        # Parse extra data if needed
        if self.with_extra_data and item.urlPath:
            try:
                page_parser = RealtyPageParser(
                    driver=self.driver,
                    url=f"https://www.avito.ru{item.urlPath}"
                )
                extra_data = page_parser.parse_page()
                
                # Merge extra data into item
                if extra_data:
                    item.total_views = extra_data.get('total_views')
                    item.today_views = extra_data.get('today_views')
                
                time.sleep(3)
                
            except Exception as e:
                logger.error(f"Error parsing extra data for {item.urlPath}: {e}")
        
        # Add to results
        self.add_item(item)
    
    def check_if_last_page(self, html: str) -> bool:
        """
        Check if this is the last page
        
        Args:
            html: Page HTML
            
        Returns:
            True if last page
        """
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Look for pagination
            pagination = soup.find('div', {'data-marker': 'pagination'})
            
            if not pagination:
                return True
            
            # Check if "next" button is disabled
            next_button = pagination.find('a', {'data-marker': 'pagination/next'})
            
            return next_button is None
            
        except Exception as e:
            logger.error(f"Error checking last page: {e}")
            return False
