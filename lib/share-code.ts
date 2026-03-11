/**
 * Share Code Generation
 * Generates unique 6-digit numeric share codes
 */

import crypto from 'crypto';

/**
 * Generate a random 6-digit numeric share code
 * Returns a string like "123456"
 */
export function generateShareCode(): string {
  // Generate random number between 100000 and 999999
  const randomNum = crypto.randomInt(100000, 1000000);
  return randomNum.toString();
}

/**
 * Generate multiple unique share codes
 * Useful for batch operations
 */
export function generateShareCodes(count: number): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    codes.add(generateShareCode());
  }

  return Array.from(codes);
}

/**
 * Validate share code format
 */
export function isValidShareCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Format share code for display (e.g., "123-456")
 */
export function formatShareCode(code: string): string {
  if (!isValidShareCode(code)) {
    return code;
  }

  return `${code.substring(0, 3)}-${code.substring(3)}`;
}

/**
 * Parse formatted share code back to plain format
 */
export function parseShareCode(formattedCode: string): string {
  return formattedCode.replace(/[^0-9]/g, '');
}
