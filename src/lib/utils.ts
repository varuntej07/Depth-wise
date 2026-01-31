import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Input Sanitization Utilities

interface SanitizeQueryResult {
  isValid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Sanitizes user query input with the following protections:
 * - Max length enforcement (500 chars)
 * - Prompt injection detection
 * - HTML/Script tag removal
 * - Excessive whitespace normalization
 * - Null byte removal
 */
export function sanitizeQuery(input: unknown, maxLength = 500): SanitizeQueryResult {
  // Type check
  if (typeof input !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      error: 'Query must be a string',
    };
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Check if empty after trim
  if (sanitized.length === 0) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Query cannot be empty',
    };
  }

  // Enforce max length
  if (sanitized.length > maxLength) {
    return {
      isValid: false,
      sanitized: '',
      error: `Query must be ${maxLength} characters or less`,
    };
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Detect prompt injection attempts
  const injectionPatterns = [
    /ignore\s+(previous|above|prior)\s+(instructions|prompts?|commands?)/gi,
    /disregard\s+(previous|above|prior)\s+(instructions|prompts?|commands?)/gi,
    /forget\s+(previous|above|prior)\s+(instructions|prompts?|commands?)/gi,
    /new\s+(instructions|prompts?|commands?)\s*:/gi,
    /system\s*(prompt|message|role)\s*:/gi,
    /\[SYSTEM\]/gi,
    /\<\|.*?\|\>/g, // Special tokens
    /<sys>/gi,
    /you\s+are\s+(now|a)\s+(different|new)/gi,
    /act\s+as\s+(if|though|a)/gi,
    /pretend\s+(to\s+be|you\s+are)/gi,
    /roleplay\s+as/gi,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      return {
        isValid: false,
        sanitized: '',
        error: 'Query contains potentially harmful content',
      };
    }
  }

  // Remove HTML tags and script content
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // Normalize whitespace (replace multiple spaces/newlines with single space)
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Validates UUID format (both v4 and v7)
 */
export function isValidUUID(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validates and sanitizes boolean input
 */
export function sanitizeBoolean(input: unknown): { isValid: boolean; value?: boolean; error?: string } {
  if (typeof input === 'boolean') {
    return { isValid: true, value: input };
  }

  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    if (lower === 'true') return { isValid: true, value: true };
    if (lower === 'false') return { isValid: true, value: false };
  }

  return {
    isValid: false,
    error: 'Value must be a boolean',
  };
}

/**
 * Gets or creates a unique client ID for rate limiting
 * This allows anonymous users on shared IPs (mobile carriers with CGNAT)
 * to have their own rate limit bucket
 */
export function getClientId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const storageKey = 'depthwise_client_id';
  let clientId = localStorage.getItem(storageKey);

  if (!clientId) {
    // Generate a random ID using crypto API if available, fallback to Math.random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      clientId = crypto.randomUUID();
    } else {
      // Fallback for older browsers
      clientId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    localStorage.setItem(storageKey, clientId);
  }

  return clientId;
}
