/**
 * Database Setup Script
 * Initializes the Supabase PostgreSQL database with schema and indexes
 */

import { supabaseServer } from './config';

/**
 * SQL migration script content
 * This is the same as migrations.sql but embedded for programmatic execution
 */
const MIGRATION_SQL = `
-- Secure File Share Database Schema
-- PostgreSQL migration script for Supabase

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'paid', 'enterprise')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  subscription_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================================================
-- FILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  download_count INT DEFAULT 0,
  is_scanned BOOLEAN DEFAULT FALSE,
  is_safe BOOLEAN DEFAULT NULL,
  storage_duration_minutes INT DEFAULT 20,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_files_share_code ON files(share_code);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_is_scanned ON files(is_scanned);

-- ============================================================================
-- DOWNLOADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  downloaded_at TIMESTAMP DEFAULT NOW(),
  country VARCHAR(2)
);

CREATE INDEX IF NOT EXISTS idx_downloads_file_id ON downloads(file_id);
CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON downloads(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_downloads_ip_address ON downloads(ip_address);

-- ============================================================================
-- ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('upload', 'download', 'bot_detected', 'virus_detected')),
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_file_id ON analytics(file_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_ip_address ON analytics(ip_address);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

CREATE OR REPLACE VIEW active_files AS
SELECT * FROM files
WHERE expires_at > NOW();

CREATE OR REPLACE VIEW expired_files AS
SELECT * FROM files
WHERE expires_at <= NOW();

CREATE OR REPLACE VIEW download_stats AS
SELECT
  f.id,
  f.share_code,
  f.file_name,
  COUNT(d.id) as total_downloads,
  MAX(d.downloaded_at) as last_download,
  f.created_at,
  f.expires_at
FROM files f
LEFT JOIN downloads d ON f.id = d.file_id
GROUP BY f.id, f.share_code, f.file_name, f.created_at, f.expires_at;
`;

/**
 * Initialize the database schema
 * This function should be called once during setup
 */
export async function initializeDatabase(): Promise<void> {
  if (!supabaseServer) {
    throw new Error(
      'Supabase service role key not configured. Cannot initialize database.'
    );
  }

  try {
    console.log('Starting database initialization...');

    // Execute the migration SQL
    const { error } = await supabaseServer.rpc('exec_sql', {
      sql: MIGRATION_SQL,
    });

    if (error) {
      throw error;
    }

    console.log('✓ Database schema created successfully');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Verify database connection
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseServer
      ?.from('users')
      .select('count(*)', { count: 'exact', head: true })
      .limit(1) || { data: null, error: new Error('No client') };

    if (error) {
      console.error('Database connection failed:', error);
      return false;
    }

    console.log('✓ Database connection verified');
    return true;
  } catch (error) {
    console.error('Database verification failed:', error);
    return false;
  }
}

/**
 * Check if tables exist
 */
export async function checkTablesExist(): Promise<{
  users: boolean;
  files: boolean;
  downloads: boolean;
  analytics: boolean;
}> {
  try {
    const tables = ['users', 'files', 'downloads', 'analytics'];
    const results: Record<string, boolean> = {};

    for (const table of tables) {
      try {
        const { error } = await supabaseServer
          ?.from(table)
          .select('*', { count: 'exact', head: true })
          .limit(1) || { error: new Error('No client') };

        results[table] = !error;
      } catch {
        results[table] = false;
      }
    }

    return {
      users: results['users'] || false,
      files: results['files'] || false,
      downloads: results['downloads'] || false,
      analytics: results['analytics'] || false,
    };
  } catch (error) {
    console.error('Error checking tables:', error);
    return {
      users: false,
      files: false,
      downloads: false,
      analytics: false,
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  userCount: number;
  fileCount: number;
  downloadCount: number;
  analyticsCount: number;
}> {
  try {
    const [usersResult, filesResult, downloadsResult, analyticsResult] =
      await Promise.all([
        supabaseServer
          ?.from('users')
          .select('*', { count: 'exact', head: true }) || { count: 0 },
        supabaseServer
          ?.from('files')
          .select('*', { count: 'exact', head: true }) || { count: 0 },
        supabaseServer
          ?.from('downloads')
          .select('*', { count: 'exact', head: true }) || { count: 0 },
        supabaseServer
          ?.from('analytics')
          .select('*', { count: 'exact', head: true }) || { count: 0 },
      ]);

    return {
      userCount: usersResult?.count || 0,
      fileCount: filesResult?.count || 0,
      downloadCount: downloadsResult?.count || 0,
      analyticsCount: analyticsResult?.count || 0,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      userCount: 0,
      fileCount: 0,
      downloadCount: 0,
      analyticsCount: 0,
    };
  }
}
