/**
 * Secrets management utilities
 * Provides secure access to sensitive environment variables
 */

import { getEnv } from './env';

/**
 * Secrets interface for type-safe access
 */
export interface Secrets {
  // Database
  supabaseServiceRoleKey: string;
  databaseUrl?: string;

  // Object Storage
  objectStorageAccessKeyId: string;
  objectStorageSecretAccessKey: string;

  // Encryption
  encryptionKey: string;

  // Virus Scanning
  virusScannerApiKey: string;

  // reCAPTCHA
  recaptchaSecretKey: string;

  // JWT
  jwtSecret: string;

  // Stripe
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;

  // Redis
  redisUrl?: string;
}

/**
 * Gets all secrets
 * IMPORTANT: Only call this on the server side!
 */
export function getSecrets(): Secrets {
  if (typeof window !== 'undefined') {
    throw new Error('getSecrets() should only be called on the server side');
  }

  const env = getEnv();

  return {
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    databaseUrl: env.DATABASE_URL,
    objectStorageAccessKeyId: env.OBJECT_STORAGE_ACCESS_KEY_ID,
    objectStorageSecretAccessKey: env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    encryptionKey: env.ENCRYPTION_KEY,
    virusScannerApiKey: env.VIRUS_SCANNER_API_KEY,
    recaptchaSecretKey: env.RECAPTCHA_SECRET_KEY,
    jwtSecret: env.JWT_SECRET,
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    redisUrl: env.REDIS_URL,
  };
}

/**
 * Gets a specific secret
 * IMPORTANT: Only call this on the server side!
 */
export function getSecret<K extends keyof Secrets>(key: K): Secrets[K] {
  if (typeof window !== 'undefined') {
    throw new Error('getSecret() should only be called on the server side');
  }

  return getSecrets()[key];
}

/**
 * Validates that all required secrets are available
 */
export function validateSecrets(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const secrets = getSecrets();

    // Check required secrets
    if (!secrets.supabaseServiceRoleKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
    }
    if (!secrets.objectStorageAccessKeyId) {
      errors.push('OBJECT_STORAGE_ACCESS_KEY_ID is required');
    }
    if (!secrets.objectStorageSecretAccessKey) {
      errors.push('OBJECT_STORAGE_SECRET_ACCESS_KEY is required');
    }
    if (!secrets.encryptionKey) {
      errors.push('ENCRYPTION_KEY is required');
    }
    if (!secrets.virusScannerApiKey) {
      errors.push('VIRUS_SCANNER_API_KEY is required');
    }
    if (!secrets.recaptchaSecretKey) {
      errors.push('RECAPTCHA_SECRET_KEY is required');
    }
    if (!secrets.jwtSecret) {
      errors.push('JWT_SECRET is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Gets a masked version of secrets for logging
 * Hides sensitive values
 */
export function getMaskedSecrets(): Record<string, string | undefined> {
  const secrets = getSecrets();
  const masked: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(secrets)) {
    if (value) {
      masked[key] = `***${String(value).slice(-4)}`;
    } else {
      masked[key] = undefined;
    }
  }

  return masked;
}

/**
 * Checks if a secret is available
 */
export function hasSecret(key: keyof Secrets): boolean {
  try {
    const secret = getSecret(key);
    return !!secret;
  } catch {
    return false;
  }
}

/**
 * Gets encryption key as a Buffer
 */
export function getEncryptionKeyBuffer(): Buffer {
  const encryptionKey = getSecret('encryptionKey');
  return Buffer.from(encryptionKey, 'hex');
}

/**
 * Gets JWT secret
 */
export function getJwtSecret(): string {
  return getSecret('jwtSecret');
}

/**
 * Gets Supabase service role key
 */
export function getSupabaseServiceRoleKey(): string {
  return getSecret('supabaseServiceRoleKey');
}

/**
 * Gets object storage credentials
 */
export function getObjectStorageCredentials() {
  return {
    accessKeyId: getSecret('objectStorageAccessKeyId'),
    secretAccessKey: getSecret('objectStorageSecretAccessKey'),
  };
}

/**
 * Gets reCAPTCHA secret key
 */
export function getRecaptchaSecretKey(): string {
  return getSecret('recaptchaSecretKey');
}

/**
 * Gets Stripe secret key (if available)
 */
export function getStripeSecretKey(): string | undefined {
  return getSecret('stripeSecretKey');
}

/**
 * Gets Stripe webhook secret (if available)
 */
export function getStripeWebhookSecret(): string | undefined {
  return getSecret('stripeWebhookSecret');
}

/**
 * Gets Redis URL (if available)
 */
export function getRedisUrl(): string | undefined {
  return getSecret('redisUrl');
}

/**
 * Gets virus scanner API key
 */
export function getVirusScannerApiKey(): string {
  return getSecret('virusScannerApiKey');
}
