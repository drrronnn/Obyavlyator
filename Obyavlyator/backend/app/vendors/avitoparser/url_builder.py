from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from typing import Optional, Dict, Any

from .constants import BASE_URL


class URLBuilder:
    """Builds and modifies Avito URLs"""
    
    def __init__(self, base_url: str = BASE_URL):
        """
        Initialize URL builder
        
        Args:
            base_url: Base Avito URL
        """
        self.base_url = base_url
    
    def parse_url(self, url: str) -> Dict[str, Any]:
        """
        Parse Avito URL into components
        
        Args:
            url: Full Avito URL
            
        Returns:
            Dictionary with URL components
        """
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        
        return {
            'scheme': parsed.scheme,
            'netloc': parsed.netloc,
            'path': parsed.path,
            'params': query_params,
            'fragment': parsed.fragment
        }
    
    def build_url(self, path: str, params: Optional[Dict[str, Any]] = None) -> str:
        """
        Build full URL from path and parameters
        
        Args:
            path: URL path
            params: Query parameters
            
        Returns:
            Full URL
        """
        if not path.startswith('/'):
            path = '/' + path
        
        url = self.base_url + path
        
        if params:
            query_string = urlencode(params, doseq=True)
            url += '?' + query_string
        
        return url
    
    def add_page_param(self, url: str, page: int) -> str:
        """
        Add or update page parameter in URL
        
        Args:
            url: Original URL
            page: Page number
            
        Returns:
            URL with page parameter
        """
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        
        # Update page parameter
        query_params['p'] = [str(page)]
        
        # Rebuild URL
        new_query = urlencode(query_params, doseq=True)
        new_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))
        
        return new_url
    
    def get_next_page_url(self, url: str) -> Optional[str]:
        """
        Get URL for next page
        
        Args:
            url: Current page URL
            
        Returns:
            Next page URL or None
        """
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        
        # Get current page number
        current_page = int(query_params.get('p', ['1'])[0])
        next_page = current_page + 1
        
        # Update page parameter
        query_params['p'] = [str(next_page)]
        
        # Rebuild URL
        new_query = urlencode(query_params, doseq=True)
        new_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))
        
        return new_url
    
    def extract_location(self, url: str) -> Optional[str]:
        """
        Extract location from URL path
        
        Args:
            url: Avito URL
            
        Returns:
            Location name or None
        """
        parsed = urlparse(url)
        path_parts = parsed.path.strip('/').split('/')
        
        # URL format: /city/category/...
        if len(path_parts) >= 1:
            return path_parts[0]
        
        return None
    
    def extract_category(self, url: str) -> Optional[str]:
        """
        Extract category from URL path
        
        Args:
            url: Avito URL
            
        Returns:
            Category name or None
        """
        parsed = urlparse(url)
        path_parts = parsed.path.strip('/').split('/')
        
        # URL format: /city/category/...
        if len(path_parts) >= 2:
            return path_parts[1]
        
        return None
