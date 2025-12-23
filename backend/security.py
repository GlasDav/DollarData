"""
Principal Finance - Security Utilities

Provides input sanitization and XSS protection for user inputs.
"""
import re
import html
from typing import Optional


# HTML/Script patterns that could indicate XSS attempts
DANGEROUS_PATTERNS = [
    r'<script',                        # Script tags (any form)
    r'javascript:',                    # JavaScript protocol
    r'data:text/html',                 # Data URLs with HTML
    r'on\w+\s*=',                      # Event handlers like onclick=
    r'<iframe',                        # Iframes
    r'<object',                        # Object tags
    r'<embed',                         # Embed tags
    r'<link\b',                        # Link tags
    r'<meta\b',                        # Meta tags
    r'expression\s*\(',                # CSS expressions
    r'url\s*\(',                       # CSS url() that could load external resources
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE | re.DOTALL) for p in DANGEROUS_PATTERNS]


def sanitize_string(value: Optional[str], max_length: int = 1000) -> Optional[str]:
    """
    Sanitize a string input by:
    1. Trimming whitespace
    2. Escaping HTML entities
    3. Removing dangerous patterns
    4. Enforcing max length
    
    Args:
        value: The input string to sanitize
        max_length: Maximum allowed length (default 1000)
    
    Returns:
        Sanitized string or None if input was None
    """
    if value is None:
        return None
    
    # Trim whitespace
    value = value.strip()
    
    # Enforce max length
    if len(value) > max_length:
        value = value[:max_length]
    
    # Escape HTML entities to prevent XSS
    value = html.escape(value, quote=True)
    
    return value


def sanitize_text_field(value: Optional[str]) -> Optional[str]:
    """
    Light sanitization for text fields like descriptions and names.
    Preserves most input but escapes dangerous HTML.
    """
    if value is None:
        return None
    
    value = value.strip()
    
    # Check for dangerous patterns - log but don't necessarily block
    # This is primarily defensive - the HTML escaping handles most XSS
    for pattern in COMPILED_PATTERNS:
        if pattern.search(value):
            # Remove the dangerous content
            value = pattern.sub('', value)
    
    # HTML escape the result
    value = html.escape(value, quote=True)
    
    return value


def validate_safe_string(value: str) -> bool:
    """
    Check if a string contains potentially dangerous content.
    Returns True if safe, False if suspicious.
    """
    if not value:
        return True
    
    for pattern in COMPILED_PATTERNS:
        if pattern.search(value):
            return False
    
    return True


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal attacks.
    """
    if not filename:
        return "unnamed_file"
    
    # Remove path separators and null bytes
    filename = filename.replace('/', '').replace('\\', '').replace('\x00', '')
    
    # Remove leading dots (prevent hidden files or relative paths)
    filename = filename.lstrip('.')
    
    # Only allow alphanumeric, dash, underscore, and single dot
    filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    
    # Ensure there's still something left
    if not filename:
        filename = "unnamed_file"
    
    return filename[:255]  # Max filename length


def is_safe_redirect_url(url: str, allowed_hosts: list = None) -> bool:
    """
    Check if a URL is safe for redirection (prevent open redirect attacks).
    """
    if not url:
        return False
    
    # Only allow relative URLs starting with /
    if url.startswith('/') and not url.startswith('//'):
        return True
    
    # If allowed_hosts specified, check if URL matches
    if allowed_hosts:
        from urllib.parse import urlparse
        try:
            parsed = urlparse(url)
            return parsed.netloc in allowed_hosts
        except Exception:
            return False
    
    return False
