// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Set up environment variables for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-min-32-characters-long-for-testing';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
process.env.OBJECT_STORAGE_PROVIDER = process.env.OBJECT_STORAGE_PROVIDER || 'aws-s3';
process.env.OBJECT_STORAGE_BUCKET = process.env.OBJECT_STORAGE_BUCKET || 'test-bucket';
process.env.OBJECT_STORAGE_REGION = process.env.OBJECT_STORAGE_REGION || 'us-east-1';
process.env.OBJECT_STORAGE_ACCESS_KEY_ID = process.env.OBJECT_STORAGE_ACCESS_KEY_ID || 'test-key';
process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY || 'test-secret';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.VIRUS_SCANNER_API_KEY = process.env.VIRUS_SCANNER_API_KEY || 'test-api-key';
process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'test-site-key';
process.env.RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || 'test-secret-key';
process.env.NODE_ENV = 'test';

