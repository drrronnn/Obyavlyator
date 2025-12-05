import re
from typing import List, Dict, Any
from datetime import datetime, timedelta


def clean_price(price_str: str) -> int:
    """
    Extract numeric price from string
    
    Args:
        price_str: Price string like "50 000 ₽"
        
    Returns:
        Integer price value
    """
    if not price_str:
        return 0
    
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', price_str)
    return int(digits) if digits else 0


def is_phrase_in_text(text: str, phrases: List[str]) -> bool:
    """
    Check if any phrase from list is in text (case-insensitive)
    
    Args:
        text: Text to search in
        phrases: List of phrases to search for
        
    Returns:
        True if any phrase found
    """
    if not text or not phrases:
        return False
    
    text_lower = text.lower()
    return any(phrase.lower() in text_lower for phrase in phrases)


def is_recent(timestamp_ms: int, max_age_seconds: int) -> bool:
    """
    Check if timestamp is recent enough
    
    Args:
        timestamp_ms: Timestamp in milliseconds
        max_age_seconds: Maximum age in seconds
        
    Returns:
        True if recent enough
    """
    if not timestamp_ms:
        return False
    
    timestamp_sec = timestamp_ms / 1000
    current_time = datetime.now().timestamp()
    age_seconds = current_time - timestamp_sec
    
    return age_seconds <= max_age_seconds


def extract_id_from_url(url: str) -> str:
    """
    Extract item ID from Avito URL
    
    Args:
        url: Avito item URL
        
    Returns:
        Item ID as string
    """
    if not url:
        return ""
    
    # URL format: https://www.avito.ru/category/item_12345678
    match = re.search(r'_(\d+)$', url)
    return match.group(1) if match else ""


def format_location(location_data: Dict[str, Any]) -> str:
    """
    Format location data into readable string
    
    Args:
        location_data: Location dictionary
        
    Returns:
        Formatted location string
    """
    if not location_data:
        return ""
    
    parts = []
    
    if 'name' in location_data:
        parts.append(location_data['name'])
    
    if 'district' in location_data:
        parts.append(location_data['district'])
    
    return ", ".join(parts)


def clean_text(text: str) -> str:
    """
    Clean text from HTML entities and extra whitespace
    
    Args:
        text: Text to clean
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove HTML entities
    import html
    text = html.unescape(text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()


def extract_digits(text: str) -> int:
    """
    Extract first number from text
    
    Args:
        text: Text containing numbers
        
    Returns:
        First number found or 0
    """
    if not text:
        return 0
    
    match = re.search(r'\d+', text)
    return int(match.group()) if match else 0


def build_full_url(path: str, base_url: str = "https://www.avito.ru") -> str:
    """
    Build full URL from path
    
    Args:
        path: URL path
        base_url: Base URL
        
    Returns:
        Full URL
    """
    if not path:
        return ""
    
    if path.startswith('http'):
        return path
    
    if not path.startswith('/'):
        path = '/' + path
    
    return base_url + path


def extract_area(text: str) -> float | None:
    """
    Extract area in square meters from text
    
    Args:
        text: Text containing area (e.g., "45 м²", "45.5м²")
        
    Returns:
        Area in square meters or None
    """
    if not text:
        return None
    
    # Patterns: "45 м²", "45м²", "45.5 м²"
    match = re.search(r'(\d+(?:[.,]\d+)?)\s*м²', text)
    if match:
        area_str = match.group(1).replace(',', '.')
        try:
            return float(area_str)
        except ValueError:
            return None
    
    return None


def extract_rooms(text: str) -> int | None:
    """
    Extract number of rooms from text
    
    Args:
        text: Text containing room count (e.g., "1-комн", "2-комн", "3-к.")
        
    Returns:
        Number of rooms or None
    """
    if not text:
        return None
    
    text_lower = text.lower()
    
    # Check for studio
    if 'студия' in text_lower:
        return 0  # Studio = 0 rooms
    
    # Pattern 1: "3-к." (Avito format)
    match = re.search(r'(\d+)-к\.', text_lower)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return None
    
    # Pattern 2: "1-комн", "2-комн", "3-комн"
    match = re.search(r'(\d+)-комн', text_lower)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return None
    
    return None


def extract_floor(text: str) -> str | None:
    """
    Extract floor information from text
    
    Args:
        text: Text containing floor (e.g., "5/10 эт.", "5/10")
        
    Returns:
        Floor string in format "current/total" or None
    """
    if not text:
        return None
    
    # Patterns: "5/10 эт.", "5/10", "5 из 10"
    match = re.search(r'(\d+)\s*/\s*(\d+)\s*(?:эт\.?)?', text)
    if match:
        return f"{match.group(1)}/{match.group(2)}"
    
    match = re.search(r'(\d+)\s+из\s+(\d+)', text)
    if match:
        return f"{match.group(1)}/{match.group(2)}"
    
    return None


def extract_home_type(text: str) -> str | None:
    """
    Extract home type from text
    
    Args:
        text: Text containing home type
        
    Returns:
        Home type: "studio", "flat", "apartment" or None
    """
    if not text:
        return None
    
    text_lower = text.lower()
    
    if 'студия' in text_lower:
        return 'studio'
    elif 'апартамент' in text_lower:
        return 'apartment'
    elif 'квартира' in text_lower:
        return 'flat'
    
    # Default to flat for real estate
    return 'flat'


def parse_characteristics_from_text(title: str, description: str = "") -> dict:
    """
    Parse all characteristics from title and description
    
    Args:
        title: Item title
        description: Item description (optional)
        
    Returns:
        Dictionary with parsed characteristics
    """
    combined_text = f"{title} {description}"
    
    return {
        'total_meters': extract_area(combined_text),
        'rooms_count': extract_rooms(title),  # Usually in title
        'floor': extract_floor(combined_text),
        'home_type': extract_home_type(title)
    }
