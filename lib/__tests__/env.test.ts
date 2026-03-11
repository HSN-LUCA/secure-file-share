/**
 * Tests for environment variable configuration
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getEnv, getEnvVar, isDevelopment, isStaging, isProduction, validateEnvironment, getMaskedEnv } from '../env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Save original environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getEnv()', () => {
    it('should return parsed environment variables', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
      process.env.OBJECT_STORAGE_BUCKET = 'test-bucket';
      process.env.OBJECT_STORAGE_REGION = 'us-east-1';
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test_access_key';
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.VIRUS_SCANNER_API_KEY = 'test_virus_scanner_key';
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test_site_key';
      process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
      process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';

      const env = getEnv();

      expect(env.NODE_ENV).toBe('development');
      expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
    });

    it('should throw error if required variables are missing', () => {
      process.env = {};

      expect(() => getEnv()).toThrow();
    });

    it('should validate NODE_ENV enum', () => {
      process.env.NODE_ENV = 'invalid';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
      process.env.OBJECT_STORAGE_BUCKET = 'test-bucket';
      process.env.OBJECT_STORAGE_REGION = 'us-east-1';
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test_access_key';
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.VIRUS_SCANNER_API_KEY = 'test_virus_scanner_key';
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test_site_key';
      process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
      process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';

      expect(() => getEnv()).toThrow();
    });

    it('should validate encryption key format', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
      process.env.OBJECT_STORAGE_BUCKET = 'test-bucket';
      process.env.OBJECT_STORAGE_REGION = 'us-east-1';
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test_access_key';
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.ENCRYPTION_KEY = 'invalid_key'; // Not 64 hex characters
      process.env.VIRUS_SCANNER_API_KEY = 'test_virus_scanner_key';
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test_site_key';
      process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
      process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';

      expect(() => getEnv()).toThrow();
    });

    it('should validate JWT secret minimum length', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
      process.env.OBJECT_STORAGE_BUCKET = 'test-bucket';
      process.env.OBJECT_STORAGE_REGION = 'us-east-1';
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test_access_key';
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.VIRUS_SCANNER_API_KEY = 'test_virus_scanner_key';
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test_site_key';
      process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
      process.env.JWT_SECRET = 'short'; // Less than 32 characters

      expect(() => getEnv()).toThrow();
    });
  });

  describe('getEnvVar()', () => {
    it('should return a specific environment variable', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
      process.env.OBJECT_STORAGE_BUCKET = 'test-bucket';
      process.env.OBJECT_STORAGE_REGION = 'us-east-1';
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test_access_key';
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.VIRUS_SCANNER_API_KEY = 'test_virus_scanner_key';
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test_site_key';
      process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
      process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';

      const nodeEnv = getEnvVar('NODE_ENV');
      expect(nodeEnv).toBe('development');

      const appUrl = getEnvVar('NEXT_PUBLIC_APP_URL');
      expect(appUrl).toBe('http://localhost:3000');
    });
  });

  describe('isDevelopment()', () => {
    it('should return true when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
      process.env.OBJECT_STORAGE_BUCKET = 'test-bucket';
      process.env.OBJECT_STORAGE_REGION = 'us-east-1';
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test_access_key';
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.VIRUS_SCANNER_API_KEY = 'test_virus_scanner_key';
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test_site_key';
      process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
      process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';

      expect(isDevelopment()).toBe(true);
    });

    it('should return false when NODE_ENV is not development', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
      process.env.OBJECT_STORAGE_BUCKET = 'test-bucket';
      process.env.OBJECT_STORAGE_REGION = 'us-east-1';
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test_access_key';
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.VIRUS_SCANNER_API_KEY = 'test_virus_scanner_key';
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test_site_key';
      process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
      process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';

      expect(isDevelopment()).toBe(false);
    });
  });

  describe('isProduction()', () => {
    it('should return true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
      process.env.OBJECT_STORAGE_BUCKET = 'test-bucket';
      process.env.OBJECT_STORAGE_REGION = 'us-east-1';
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test_access_key';
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.VIRUS_SCANNER_API_KEY = 'test_virus_scanner_key';
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test_site_key';
      process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
      process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';

      expect(isProduction()).toBe(true);
    });
  });

  describe('validateEnvironment()', () => {
    it('should return valid when all required variables are set', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
      process.env.OBJECT_STORAGE_BUCKET = 'test-bucket';
      process.env.OBJECT_STORAGE_REGION = 'us-east-1';
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test_access_key';
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test_secret_key';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.VIRUS_SCANNER_API_KEY = 'test_virus_scanner_key';
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test_site_key';
      process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
      process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';

      const result = validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when required variables are missing', () => {
      process.env = {};

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getMaskedEnv()', () => {
    it('should mask sensitive environment variables', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key_secret';
      process.env.OBJECT_STORAGE_BUCKET = 'test-bucket';
      process.env.OBJECT_STORAGE_REGION = 'us-east-1';
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID = 'test_access_key';
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = 'test_secret_key_secret';
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      process.env.VIRUS_SCANNER_API_KEY = 'test_virus_scanner_key';
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = 'test_site_key';
      process.env.RECAPTCHA_SECRET_KEY = 'test_secret_key';
      process.env.JWT_SECRET = 'test_jwt_secret_min_32_characters_long';

      const masked = getMaskedEnv();

      // Check that sensitive keys are masked
      expect(masked.SUPABASE_SERVICE_ROLE_KEY).toMatch(/^\*\*\*\w{4}$/);
      expect(masked.OBJECT_STORAGE_SECRET_ACCESS_KEY).toMatch(/^\*\*\*\w{4}$/);
      expect(masked.ENCRYPTION_KEY).toMatch(/^\*\*\*\w{4}$/);
      expect(masked.JWT_SECRET).toMatch(/^\*\*\*\w{4}$/);

      // Check that non-sensitive keys are not masked
      expect(masked.NODE_ENV).toBe('development');
      expect(masked.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
    });
  });
});
