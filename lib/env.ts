/**
 * Environment variables configuration and validation
 * Provides type-safe access to all environment variables
 */

import { z } from 'zod';

/**
 * Environment variable schema for validation
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Supabase Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // PostgreSQL Direct Connection (optional)
  DATABASE_URL: z.string().optional(),

  // Database Connection Pool Configuration
  DB_POOL_MAX: z.coerce.number().default(20),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_IDLE_TIMEOUT: z.coerce.number().default(30000),
  DB_CONNECTION_TIMEOUT: z.coerce.number().default(2000),

  // Object Storage
  OBJECT_STORAGE_PROVIDER: z.string().trim().pipe(z.enum(['aws-s3', 'cloudflare-r2'])).default('aws-s3'),
  OBJECT_STORAGE_BUCKET: z.string().min(1),
  OBJECT_STORAGE_REGION: z.string().min(1),
  OBJECT_STORAGE_ACCESS_KEY_ID: z.string().min(1),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  OBJECT_STORAGE_ENDPOINT: z.string().url().optional(),

  // File Encryption
  ENCRYPTION_KEY: z.string().trim().regex(/^[a-f0-9]{64}$/, 'Must be a 64-character hex string (256-bit key)'),

  // Virus Scanning
  VIRUS_SCANNER_API_KEY: z.string().min(1),
  VIRUS_SCANNER_TYPE: z.string().trim().pipe(z.enum(['clamav', 'virustotal'])).default('clamav'),

  // reCAPTCHA
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().min(1),
  RECAPTCHA_SECRET_KEY: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),

  // Stripe (optional for MVP)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Redis (optional for MVP)
  REDIS_URL: z.string().optional(),

  // Email Configuration (optional for enterprise support)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SUPPORT_EMAIL: z.string().email().optional(),
});

/**
 * Parsed and validated environment variables
 */
let parsedEnv: z.infer<typeof envSchema> | null = null;

/**
 * Gets validated environment variables
 * Throws error if validation fails
 */
export function getEnv(): z.infer<typeof envSchema> {
  if (parsedEnv) {
    return parsedEnv;
  }

  try {
    parsedEnv = envSchema.parse(process.env);
    return parsedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

/**
 * Gets a specific environment variable with type safety
 */
export function getEnvVar<K extends keyof z.infer<typeof envSchema>>(
  key: K
): z.infer<typeof envSchema>[K] {
  return getEnv()[key];
}

/**
 * Checks if running in development environment
 */
export function isDevelopment(): boolean {
  return getEnvVar('NODE_ENV') === 'development';
}

/**
 * Checks if running in staging environment
 */
export function isStaging(): boolean {
  return getEnvVar('NODE_ENV') === 'staging';
}

/**
 * Checks if running in production environment
 */
export function isProduction(): boolean {
  return getEnvVar('NODE_ENV') === 'production';
}

/**
 * Gets environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = getEnv();
  const nodeEnv = env.NODE_ENV;

  return {
    isDev: nodeEnv === 'development',
    isStaging: nodeEnv === 'staging',
    isProd: nodeEnv === 'production',
    environment: nodeEnv,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    databaseUrl: env.DATABASE_URL,
    objectStorage: {
      provider: env.OBJECT_STORAGE_PROVIDER,
      bucket: env.OBJECT_STORAGE_BUCKET,
      region: env.OBJECT_STORAGE_REGION,
      accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
      endpoint: env.OBJECT_STORAGE_ENDPOINT,
    },
    encryption: {
      key: env.ENCRYPTION_KEY,
    },
    virusScanner: {
      apiKey: env.VIRUS_SCANNER_API_KEY,
      type: env.VIRUS_SCANNER_TYPE,
    },
    recaptcha: {
      siteKey: env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      secretKey: env.RECAPTCHA_SECRET_KEY,
    },
    jwt: {
      secret: env.JWT_SECRET,
    },
    stripe: {
      publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
    redis: {
      url: env.REDIS_URL,
    },
    db: {
      pool: {
        max: env.DB_POOL_MAX,
        min: env.DB_POOL_MIN,
        idleTimeout: env.DB_IDLE_TIMEOUT,
        connectionTimeout: env.DB_CONNECTION_TIMEOUT,
      },
    },
    email: {
      smtpHost: env.SMTP_HOST,
      smtpPort: env.SMTP_PORT,
      smtpUser: env.SMTP_USER,
      smtpPassword: env.SMTP_PASSWORD,
      smtpSecure: env.SMTP_SECURE,
      supportEmail: env.SUPPORT_EMAIL,
    },
  };
}

/**
 * Validates that all required environment variables are set
 * Useful for startup checks
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  try {
    getEnv();
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, errors: [error.message] };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Gets a masked version of environment variables for logging
 * Hides sensitive values
 */
export function getMaskedEnv(): Record<string, string | undefined> {
  const env = getEnv();
  const sensitiveKeys = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'OBJECT_STORAGE_ACCESS_KEY_ID',
    'OBJECT_STORAGE_SECRET_ACCESS_KEY',
    'ENCRYPTION_KEY',
    'VIRUS_SCANNER_API_KEY',
    'RECAPTCHA_SECRET_KEY',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'REDIS_URL',
    'DATABASE_URL',
  ];

  const masked: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(env)) {
    if (sensitiveKeys.includes(key) && value) {
      masked[key] = `***${String(value).slice(-4)}`;
    } else {
      masked[key] = String(value);
    }
  }

  return masked;
}
