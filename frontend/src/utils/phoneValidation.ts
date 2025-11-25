/**
 * Philippine Phone Number Validation
 * 
 * Validates Philippine phone numbers in various formats:
 * - Mobile: 09XX XXX XXXX, +63 9XX XXX XXXX, 63 9XX XXX XXXX
 * - Landline: (0X) XXX-XXXX, +63 X XXX-XXXX
 * 
 * Accepts formats with or without spaces, dashes, parentheses, and country code
 */

/**
 * Validates if a phone number is a valid Philippine phone number
 * 
 * @param phoneNumber - The phone number to validate
 * @returns true if valid Philippine phone number, false otherwise
 */
export function isValidPhilippinePhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  // Remove all spaces, dashes, parentheses, and plus signs for validation
  const cleaned = phoneNumber.replace(/[\s\-()+]/g, '');

  // Philippine mobile numbers: 09XX XXX XXXX (11 digits starting with 09)
  // Also accepts: +63 9XX XXX XXXX or 63 9XX XXX XXXX (13 digits starting with 639)
  const mobilePattern = /^(09|639)\d{9}$/;

  // Philippine landline numbers: (0X) XXX-XXXX (8-10 digits)
  // Also accepts: +63 X XXX-XXXX (12-13 digits starting with 63)
  // Area codes: 02 (Manila), 03X (other regions), etc.
  const landlinePattern = /^(0[2-9]|63[2-9])\d{7,9}$/;

  // Check if it matches mobile or landline pattern
  return mobilePattern.test(cleaned) || landlinePattern.test(cleaned);
}

/**
 * Formats a Philippine phone number for display
 * 
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number string
 */
export function formatPhilippinePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';

  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // If starts with 63, convert to 0 format for display
  if (cleaned.startsWith('63') && cleaned.length === 12) {
    return `0${cleaned.substring(2)}`;
  }

  // If starts with +63, convert to 0 format for display
  if (cleaned.startsWith('+63') && cleaned.length === 13) {
    return `0${cleaned.substring(3)}`;
  }

  return cleaned;
}

