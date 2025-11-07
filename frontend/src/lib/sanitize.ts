/**
 * Input Sanitization Utility
 * 
 * Implements DOMPurify for XSS protection following CIA Triad principles:
 * - Confidentiality: Prevents malicious script injection
 * - Integrity: Ensures data displayed matches data stored
 * - Availability: Protects against DOM-based attacks
 * 
 * Usage:
 * - sanitizeInput(): For user text inputs (forms, textareas)
 * - sanitizeHTML(): For rich HTML content (limited tags allowed)
 * - sanitizeURL(): For link validation
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize plain text user input
 * Strips all HTML tags and malicious scripts
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Strip all HTML tags for plain text input
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  });
}

/**
 * Sanitize HTML content with limited safe tags
 * Allows basic formatting while blocking scripts
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') return '';
  
  // Allow only safe formatting tags
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'p', 'br',
      'ul', 'ol', 'li', 'a', 'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'class', 'style'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Sanitize URLs to prevent javascript: and data: URI attacks
 */
export function sanitizeURL(url: string): string {
  if (typeof url !== 'string') return '';
  
  const sanitized = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  
  // Block dangerous protocols
  if (
    sanitized.startsWith('javascript:') ||
    sanitized.startsWith('data:') ||
    sanitized.startsWith('vbscript:')
  ) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitize object by sanitizing all string values
 * Useful for form data validation
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key] as string);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>);
    }
  }
  
  return sanitized as T;
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeInput(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * React hook for sanitizing input in controlled components
 * Usage: const [value, setValue] = useSanitizedInput('')
 */
export function useSanitizedInput(initialValue: string = '') {
  const [value, setValueInternal] = React.useState(sanitizeInput(initialValue));
  
  const setValue = (newValue: string) => {
    setValueInternal(sanitizeInput(newValue));
  };
  
  return [value, setValue] as const;
}

// Import React for the hook
import React from 'react';
