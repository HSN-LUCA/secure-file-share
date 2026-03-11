/**
 * API Key Generation and Hashing Utilities
 */

import crypto from 'crypto';

/**
 * Generate a new API key
 * Format: sk_live_[random_string]
 * Returns both the full key (for display once) and the prefix (for storage)
 */
export function generateApiKey(): {
  key: string;
  prefix: string;
  hash: string;
} {
  // Generate 32 random bytes and convert to base64url
  const randomBytes = crypto.randomBytes(32);
  const randomString = randomBytes.toString('base64url').substring(0, 40);
  
  const key = `sk_live_${randomString}`;
  const prefix = key.substring(0, 20); // First 20 chars for display
  const hash = hashApiKey(key);
  
  return { key, prefix, hash };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  return hashApiKey(key) === hash;
}

/**
 * Extract prefix from API key (first 20 chars)
 */
export function getApiKeyPrefix(key: string): string {
  return key.substring(0, 20);
}
