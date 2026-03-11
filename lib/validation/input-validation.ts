/**
 * Input Validation & Sanitization Utilities
 * Comprehensive validation and sanitization for all API inputs
 * Prevents XSS, SQL injection, path traversal, and other attacks
 */

import { PATTERNS } from '@/lib/constants';

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================================================
// SHARE CODE VALIDATION
// ============================================================================

/**
 * Validate share code format (must be exactly 6 digits)
 * Requirement: Share codes must be numeric, exactly 6 digits
 */
export function validateShareCode(code: unknown): ValidationResult {
  // Type check
  if (typeof code !== 'string') {
    return {
      valid: false,
      error: 'Share code must be a string',
    };
  }

  // Length and format check
  if (!/^\d{6}$/.test(code)) {
    return {
      valid: false,
      error: 'Share code must be exactly 6 digits',
    };
  }

  return { valid: true };
}

/**
 * Sanitize share code to ensure numeric format
 */
export function sanitizeShareCode(code: string): string {
  // Remove all non-digit characters
  return code.replace(/\D/g, '').slice(0, 6);
}

// ============================================================================
// FILE NAME VALIDATION & SANITIZATION
// ============================================================================

/**
 * Validate file name
 * Requirement: Max 255 chars, no path traversal, no null bytes
 */
export function validateFileName(fileName: unknown): ValidationResult {
  // Type check
  if (typeof fileName !== 'string') {
    return {
      valid: false,
      error: 'File name must be a string',
    };
  }

  // Empty check
  if (fileName.trim().length === 0) {
    return {
      valid: false,
      error: 'File name cannot be empty',
    };
  }

  // Length check (max 255 characters)
  if (fileName.length > 255) {
    return {
      valid: false,
      error: 'File name must not exceed 255 characters',
    };
  }

  // Null byte check
  if (fileName.includes('\0')) {
    return {
      valid: false,
      error: 'File name contains invalid characters',
    };
  }

  // Path traversal check
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'File name contains invalid path characters',
    };
  }

  return { valid: true };
}

/**
 * Sanitize file name to prevent path traversal and XSS attacks
 * Requirement: Remove path traversal characters (.., /, \), max 255 chars
 */
export function sanitizeFileName(fileName: string): string {
  // Remove null bytes
  let sanitized = fileName.replace(/\0/g, '');

  // Remove path traversal sequences
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '_');

  // Remove leading/trailing whitespace and dots
  sanitized = sanitized.trim().replace(/^\.+/, '').replace(/\.+$/, '');

  // Limit to 255 characters
  if (sanitized.length > 255) {
    const lastDotIndex = sanitized.lastIndexOf('.');
    if (lastDotIndex > 0 && lastDotIndex < sanitized.length - 1) {
      // Preserve extension
      const extension = sanitized.substring(lastDotIndex);
      const maxNameLength = 255 - extension.length;
      sanitized = sanitized.substring(0, maxNameLength) + extension;
    } else {
      sanitized = sanitized.substring(0, 255);
    }
  }

  return sanitized;
}

// ============================================================================
// FILE SIZE VALIDATION
// ============================================================================

/**
 * Validate file size
 * Requirement: Must be positive, max 100MB for free plan
 */
export function validateFileSize(
  fileSize: unknown,
  maxSizeBytes: number = 100 * 1024 * 1024
): ValidationResult {
  // Type check
  if (typeof fileSize !== 'number') {
    return {
      valid: false,
      error: 'File size must be a number',
    };
  }

  // Positive check
  if (fileSize <= 0) {
    return {
      valid: false,
      error: 'File size must be greater than 0',
    };
  }

  // Max size check
  if (fileSize > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size must not exceed ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

// ============================================================================
// CAPTCHA TOKEN VALIDATION
// ============================================================================

/**
 * Validate CAPTCHA token
 * Requirement: Must be non-empty string, max 1000 chars
 */
export function validateCaptchaToken(token: unknown): ValidationResult {
  // Type check
  if (typeof token !== 'string') {
    return {
      valid: false,
      error: 'CAPTCHA token must be a string',
    };
  }

  // Empty check
  if (token.trim().length === 0) {
    return {
      valid: false,
      error: 'CAPTCHA token cannot be empty',
    };
  }

  // Length check (max 1000 characters)
  if (token.length > 1000) {
    return {
      valid: false,
      error: 'CAPTCHA token is too long',
    };
  }

  return { valid: true };
}

/**
 * Sanitize CAPTCHA token (trim whitespace)
 */
export function sanitizeCaptchaToken(token: string): string {
  return token.trim().slice(0, 1000);
}

// ============================================================================
// IP ADDRESS VALIDATION
// ============================================================================

/**
 * Validate IPv4 address format
 */
function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;

  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Validate IPv6 address format (simplified check)
 */
function isValidIPv6(ip: string): boolean {
  // Simplified IPv6 validation - checks for valid hex characters and colons
  const ipv6Regex = /^([\da-fA-F]{0,4}:){2,7}[\da-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * Validate IP address (IPv4 or IPv6)
 * Requirement: Valid IPv4 or IPv6 format
 */
export function validateIPAddress(ip: unknown): ValidationResult {
  // Type check
  if (typeof ip !== 'string') {
    return {
      valid: false,
      error: 'IP address must be a string',
    };
  }

  // Empty check
  if (ip.trim().length === 0) {
    return {
      valid: false,
      error: 'IP address cannot be empty',
    };
  }

  // IPv4 or IPv6 check
  if (!isValidIPv4(ip) && !isValidIPv6(ip)) {
    return {
      valid: false,
      error: 'Invalid IP address format',
    };
  }

  return { valid: true };
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validate email format
 */
export function validateEmail(email: unknown): ValidationResult {
  // Type check
  if (typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email must be a string',
    };
  }

  // Empty check
  if (email.trim().length === 0) {
    return {
      valid: false,
      error: 'Email cannot be empty',
    };
  }

  // Length check (max 255 characters)
  if (email.length > 255) {
    return {
      valid: false,
      error: 'Email is too long',
    };
  }

  // Format check
  if (!PATTERNS.EMAIL.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format',
    };
  }

  return { valid: true };
}

/**
 * Sanitize email (trim whitespace, lowercase)
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 255);
}

// ============================================================================
// STRING SANITIZATION (XSS PREVENTION)
// ============================================================================

/**
 * Escape HTML entities to prevent XSS attacks
 * Converts special characters to HTML entities
 */
export function escapeHtmlEntities(str: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'\/]/g, char => htmlEscapeMap[char] || char);
}

/**
 * Sanitize string to remove XSS-prone characters
 * Requirement: Remove XSS-prone characters
 */
export function sanitizeString(str: string, maxLength: number = 1000): string {
  // Trim whitespace
  let sanitized = str.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Escape HTML entities for safe display
  sanitized = escapeHtmlEntities(sanitized);

  return sanitized;
}

/**
 * Sanitize user input for database storage
 * Removes potentially dangerous characters while preserving content
 */
export function sanitizeUserInput(input: string, maxLength: number = 1000): string {
  // Trim whitespace
  let sanitized = input.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

// ============================================================================
// GENERIC VALIDATION HELPERS
// ============================================================================

/**
 * Validate that a value is a non-empty string
 */
export function validateNonEmptyString(
  value: unknown,
  fieldName: string = 'value',
  maxLength: number = 1000
): ValidationResult {
  if (typeof value !== 'string') {
    return {
      valid: false,
      error: `${fieldName} must be a string`,
    };
  }

  if (value.trim().length === 0) {
    return {
      valid: false,
      error: `${fieldName} cannot be empty`,
    };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${maxLength} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validate that a value is a positive integer
 */
export function validatePositiveInteger(
  value: unknown,
  fieldName: string = 'value',
  maxValue?: number
): ValidationResult {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return {
      valid: false,
      error: `${fieldName} must be an integer`,
    };
  }

  if (value <= 0) {
    return {
      valid: false,
      error: `${fieldName} must be greater than 0`,
    };
  }

  if (maxValue !== undefined && value > maxValue) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${maxValue}`,
    };
  }

  return { valid: true };
}

/**
 * Validate that a value is one of allowed options
 */
export function validateEnum(
  value: unknown,
  allowedValues: readonly string[],
  fieldName: string = 'value'
): ValidationResult {
  if (!allowedValues.includes(String(value))) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
    };
  }

  return { valid: true };
}

// ============================================================================
// BATCH VALIDATION
// ============================================================================

/**
 * Validate multiple fields at once
 */
export interface ValidationField {
  name: string;
  value: unknown;
  validator: (value: unknown) => ValidationResult;
}

export function validateFields(fields: ValidationField[]): ValidationResult {
  for (const field of fields) {
    const result = field.validator(field.value);
    if (!result.valid) {
      return {
        valid: false,
        error: `${field.name}: ${result.error}`,
      };
    }
  }

  return { valid: true };
}
