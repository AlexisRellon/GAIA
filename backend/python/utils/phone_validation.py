"""
Philippine Phone Number Validation
Validates Philippine phone numbers in various formats
"""

import re
from typing import Optional


def is_valid_philippine_phone_number(phone_number: str) -> bool:
    """
    Validates if a phone number is a valid Philippine phone number
    
    Args:
        phone_number: The phone number to validate
        
    Returns:
        True if valid Philippine phone number, False otherwise
    """
    if not phone_number or not isinstance(phone_number, str):
        return False

    # Remove all spaces, dashes, parentheses, and plus signs for validation
    cleaned = re.sub(r'[\s\-()\+]', '', phone_number)

    # Philippine mobile numbers: 09XX XXX XXXX (11 digits starting with 09)
    # Also accepts: +63 9XX XXX XXXX or 63 9XX XXX XXXX (13 digits starting with 639)
    mobile_pattern = re.compile(r'^(09|639)\d{9}$')

    # Philippine landline numbers: (0X) XXX-XXXX (8-10 digits)
    # Also accepts: +63 X XXX-XXXX (12-13 digits starting with 63)
    # Area codes: 02 (Manila), 03X (other regions), etc.
    landline_pattern = re.compile(r'^(0[2-9]|63[2-9])\d{7,9}$')

    # Check if it matches mobile or landline pattern
    return bool(mobile_pattern.match(cleaned) or landline_pattern.match(cleaned))


def format_philippine_phone_number(phone_number: str) -> Optional[str]:
    """
    Formats a Philippine phone number for storage/display
    
    Args:
        phone_number: The phone number to format
        
    Returns:
        Formatted phone number string or None if invalid
    """
    if not phone_number:
        return None

    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone_number)

    # If starts with 63, convert to 0 format for display
    if cleaned.startswith('63') and len(cleaned) == 12:
        return f"0{cleaned[2:]}"

    # If starts with +63, convert to 0 format for display
    if cleaned.startswith('+63') and len(cleaned) == 13:
        return f"0{cleaned[3:]}"

    return cleaned

