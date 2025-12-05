import csv
import pathlib
from datetime import datetime
from typing import List, Optional, Dict, Any
from loguru import logger

from .models import Item
from .constants import FILE_NAME_FORMAT


class BaseListPageParser:
    """Base class for parsing Avito list pages"""
    
    def __init__(
        self,
        category: str,
        deal_type: str,
        location: str,
        with_saving_csv: bool = False,
        additional_settings: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize base list parser
        
        Args:
            category: Category type (flat, house, etc.)
            deal_type: Deal type (sale, rent)
            location: Location name
            with_saving_csv: Whether to save results to CSV
            additional_settings: Additional parser settings
        """
        self.category = category
        self.deal_type = deal_type
        self.location = location
        self.with_saving_csv = with_saving_csv
        self.additional_settings = additional_settings or {}
        
        self.result: List[Item] = []
        self.result_set = set()
        self.average_price = 0
        self.count_parsed_offers = 0
        
        # Pagination settings
        self.start_page = self.additional_settings.get("start_page", 1)
        self.end_page = self.additional_settings.get("end_page", 100)
        
        self.file_path = self.build_file_path()
    
    def build_file_path(self) -> pathlib.Path:
        """
        Build file path for saving results
        
        Returns:
            Path object for CSV file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = FILE_NAME_FORMAT.format(
            category=self.category,
            deal_type=self.deal_type,
            location=self.location,
            start_page=self.start_page,
            end_page=self.end_page,
            timestamp=timestamp
        )
        
        return pathlib.Path(pathlib.Path.cwd(), file_name)
    
    def define_average_price(self, item: Item):
        """
        Update average price with new item
        
        Args:
            item: Parsed item
        """
        if not item.priceDetailed or not item.priceDetailed.value:
            return
        
        price = item.priceDetailed.value
        self.average_price = (
            (self.average_price * self.count_parsed_offers + price) / 
            (self.count_parsed_offers + 1)
        )
    
    def print_parse_progress(self, page_number: int, items_count: int, current_index: int):
        """
        Print parsing progress
        
        Args:
            page_number: Current page number
            items_count: Total items on page
            current_index: Current item index
        """
        progress_percent = int((current_index + 1) * 100 / items_count)
        
        print(
            f"\r Page {page_number} | "
            f"[{'=' * (progress_percent // 5)}{' ' * (20 - progress_percent // 5)}] "
            f"{progress_percent}% | "
            f"Total parsed: {self.count_parsed_offers} | "
            f"Avg price: {int(self.average_price):,} ₽",
            end="\r",
            flush=True
        )
    
    def save_results(self):
        """Save results to CSV file"""
        if not self.result:
            logger.warning("No results to save")
            return
        
        try:
            # Convert items to dictionaries
            rows = []
            for item in self.result:
                row = self._item_to_dict(item)
                rows.append(row)
            
            # Get all unique keys
            all_keys = set()
            for row in rows:
                all_keys.update(row.keys())
            
            keys = sorted(all_keys)
            
            # Write to CSV
            with open(self.file_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=keys, delimiter=';')
                writer.writeheader()
                writer.writerows(rows)
            
            logger.info(f"Results saved to {self.file_path}")
            
        except Exception as e:
            logger.error(f"Error saving results: {e}")
    
    def _item_to_dict(self, item: Item) -> Dict[str, Any]:
        """
        Convert Item to dictionary for CSV
        
        Args:
            item: Item object
            
        Returns:
            Dictionary representation
        """
        result = {
            'id': item.id,
            'title': item.title,
            'description': item.description,
            'url': f"https://www.avito.ru{item.urlPath}" if item.urlPath else "",
            'price': item.priceDetailed.value if item.priceDetailed else None,
            'location': item.location.name if item.location else "",
            'category': item.category.name if item.category else "",
            'timestamp': item.sortTimeStamp,
            'seller_id': item.sellerId,
            'is_promotion': item.isPromotion,
            'is_reserved': item.isReserved,
            'total_views': item.total_views,
            'today_views': item.today_views,
        }
        
        # Add address if available
        if item.addressDetailed:
            result['address'] = item.addressDetailed.locationName
        
        # Add geo if available
        if item.geo:
            result['formatted_address'] = item.geo.formattedAddress
        
        return result
    
    def add_item(self, item: Item):
        """
        Add item to results
        
        Args:
            item: Parsed item
        """
        # Check if already added
        if item.id in self.result_set:
            return
        
        self.result.append(item)
        self.result_set.add(item.id)
        self.count_parsed_offers += 1
        self.define_average_price(item)
        
        if self.with_saving_csv:
            self.save_results()
