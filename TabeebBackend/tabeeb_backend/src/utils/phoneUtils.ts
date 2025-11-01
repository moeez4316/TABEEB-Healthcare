/**
 * Utility functions for phone number formatting
 */

/**
 * Normalize phone number for database storage (remove all non-digits except leading +)
 * Stores in format: +923001234567
 */
export function normalizePhoneForDB(phone: string | null | undefined): string | null {
  if (!phone || phone.trim() === '') {
    return null;
  }

  // Remove all characters except digits and +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If empty after cleaning, return null
  if (!cleaned || cleaned === '+') {
    return null;
  }

  return cleaned;
}

/**
 * Format phone number for display (add dashes)
 * Converts +923001234567 to +92-300-1234567
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) {
    return '';
  }

  // Remove all non-digits except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +92, return as-is
  if (!cleaned.startsWith('+92')) {
    return phone;
  }

  // Extract parts: +92 and the rest
  const countryCode = '+92';
  const number = cleaned.slice(3); // Remove +92
  
  if (number.length <= 3) {
    return `${countryCode}-${number}`;
  } else if (number.length <= 10) {
    return `${countryCode}-${number.slice(0, 3)}-${number.slice(3)}`;
  } else {
    return `${countryCode}-${number.slice(0, 3)}-${number.slice(3, 10)}`;
  }
}
