/**
 * Database Configuration
 * Handles Supabase PostgreSQL connection setup
 */

import { createClient } from '@supabase/supabase-js';

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client for client-side operations
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client for server-side operations (with service role)
export const supabaseServer = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Export configuration
export const dbConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey,
};

export default supabaseClient;
