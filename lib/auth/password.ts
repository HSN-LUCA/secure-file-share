/**
 * Password Validation & Hashing Utilities
 * Implements password strength validation and bcrypt hashing
 */

import bcrypt from 'bcrypt';
import { PATTERNS } from '@/lib/constants';

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&)
 */
export function validatePasswordStrength(password: unknown): PasswordValidationResult {
  const errors: string[] = [];

  // Type check
  if (typeof password !== 'string') {
    return {
      valid: false,
      errors: ['Password must be a string'],
    };
  }

  // Empty check
  if (password.length === 0) {
    return {
      valid: false,
      errors: ['Password cannot be empty'],
    };
  }

  // Minimum length check (8 characters)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Maximum length check (128 characters)
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Special character check
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// PASSWORD HASHING & COMPARISON
// ============================================================================

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt
 * Requirement: Use bcrypt with salt rounds 10
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compare password with hash
 * Returns true if password matches hash, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    throw new Error(`Failed to compare password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate password format (basic check)
 * Used for quick validation before hashing
 */
export function validatePasswordFormat(password: unknown): boolean {
  if (typeof password !== 'string') {
    return false;
  }

  // Check if password matches the pattern
  return PATTERNS.PASSWORD.test(password);
}
