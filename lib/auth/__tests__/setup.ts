/**
 * Test setup for authentication tests
 * Sets up required environment variables
 */

// Set required environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long-for-testing';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NODE_ENV = 'test';
