/**
 * File Encryption Utilities
 * Implements AES-256 encryption for files at rest
 */

import crypto from 'crypto';

export interface EncryptionResult {
  encrypted: Buffer;
  iv: string;
  authTag: string;
}

export interface DecryptionInput {
  encrypted: Buffer;
  iv: string;
  authTag: string;
}

/**
 * Get encryption key from environment or generate one
 * In production, this should be managed by AWS KMS or similar
 */
function getEncryptionKey(): Buffer {
  const keyString = process.env.ENCRYPTION_KEY;

  if (!keyString) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  // Key should be 32 bytes (256 bits) for AES-256
  const key = Buffer.from(keyString, 'hex');

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes for AES-256)');
  }

  return key;
}

/**
 * Encrypt file data using AES-256-GCM
 * GCM mode provides both confidentiality and authenticity
 */
export function encryptFile(data: Buffer): EncryptionResult {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16); // 128-bit IV for GCM

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt file data using AES-256-GCM
 */
export function decryptFile(input: DecryptionInput): Buffer {
  const key = getEncryptionKey();
  const iv = Buffer.from(input.iv, 'hex');
  const authTag = Buffer.from(input.authTag, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(input.encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
}

/**
 * Generate a random encryption key (for setup/testing)
 * In production, use AWS KMS or similar key management service
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(32); // 256 bits
  return key.toString('hex');
}

/**
 * Validate encryption key format
 */
export function validateEncryptionKey(keyString: string): boolean {
  try {
    const key = Buffer.from(keyString, 'hex');
    return key.length === 32;
  } catch {
    return false;
  }
}
