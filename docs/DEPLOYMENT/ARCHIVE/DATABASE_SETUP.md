# Database Setup Guide: Secure File Share

## Overview

This guide explains how to set up the Supabase PostgreSQL database for the Secure File Share application.

## Prerequisites

- Supabase account (free tier available at https://supabase.com)
- Node.js 18+ installed
- Environment variables configured

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign up or log in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: `secure-file-share` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose the region closest to your users
4. Click "Create new project"
5. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: This is your `SUPABASE_SERVICE_ROLE_KEY`

3. Go to **Settings** → **Database**
4. Copy the connection string and extract the `DATABASE_URL`

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   # Supabase Database
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # PostgreSQL Direct Connection
   DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
   
   # Database Connection Pool Configuration
   DB_POOL_MAX=20
   DB_POOL_MIN=2
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=2000
   ```

## Step 4: Initialize the Database Schema

### Option A: Using Supabase SQL Editor (Recommended for First Setup)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `lib/db/migrations.sql`
4. Paste it into the SQL editor
5. Click **Run**
6. Verify that all tables are created successfully

### Option B: Using the Setup Script

1. Ensure your environment variables are set in `.env.local`
2. Run the setup script:
   ```bash
   npm run db:setup
   ```

## Step 5: Verify Database Setup

### Check Tables Exist

In Supabase SQL Editor, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- `users`
- `files`
- `downloads`
- `analytics`

### Check Indexes

```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

You should see indexes like:
- `idx_users_email`
- `idx_files_share_code`
- `idx_files_expires_at`
- `idx_downloads_file_id`
- `idx_analytics_event_type`
- etc.

### Check Views

```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

You should see:
- `active_files`
- `expired_files`
- `download_stats`

## Database Schema

### Users Table
Stores authenticated user accounts.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  subscription_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

**Indexes:**
- `idx_users_email` - For fast email lookups
- `idx_users_is_active` - For filtering active users

### Files Table
Stores file metadata and tracking information.

```sql
CREATE TABLE files (
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
```

**Indexes:**
- `idx_files_share_code` - For fast share code lookups
- `idx_files_expires_at` - For finding expired files
- `idx_files_user_id` - For user file queries
- `idx_files_created_at` - For time-based queries
- `idx_files_is_scanned` - For finding unscanned files

### Downloads Table
Tracks file downloads for analytics.

```sql
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  downloaded_at TIMESTAMP DEFAULT NOW(),
  country VARCHAR(2)
);
```

**Indexes:**
- `idx_downloads_file_id` - For finding downloads by file
- `idx_downloads_downloaded_at` - For time-based queries
- `idx_downloads_ip_address` - For IP-based analysis

### Analytics Table
Tracks system events for monitoring and analysis.

```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_analytics_event_type` - For filtering by event type
- `idx_analytics_created_at` - For time-based queries
- `idx_analytics_file_id` - For file-specific analytics
- `idx_analytics_user_id` - For user-specific analytics
- `idx_analytics_ip_address` - For IP-based analysis

## Connection Pooling

The application uses connection pooling for optimal performance:

- **Max Connections**: 20 (configurable via `DB_POOL_MAX`)
- **Min Connections**: 2 (configurable via `DB_POOL_MIN`)
- **Idle Timeout**: 30 seconds (configurable via `DB_IDLE_TIMEOUT`)
- **Connection Timeout**: 2 seconds (configurable via `DB_CONNECTION_TIMEOUT`)

### Monitoring Pool Health

The pool automatically logs statistics. You can also manually check:

```typescript
import { getPoolStats } from '@/lib/db';

const stats = getPoolStats();
console.log(stats);
// Output: { totalConnections: 5, idleConnections: 3, waitingRequests: 0 }
```

## Using the Database

### Query Functions

The application provides utility functions for common database operations:

```typescript
import {
  getUserByEmail,
  createUser,
  getFileByShareCode,
  createFile,
  createDownload,
  createAnalytics,
} from '@/lib/db';

// Get user by email
const { data: user, error } = await getUserByEmail('user@example.com');

// Create a new user
const { data: newUser, error } = await createUser({
  email: 'user@example.com',
  password_hash: 'hashed_password',
  plan: 'free',
});

// Get file by share code
const { data: file, error } = await getFileByShareCode('123456');

// Create a file record
const { data: newFile, error } = await createFile({
  share_code: '123456',
  file_name: 'document.pdf',
  file_size: 1024000,
  file_type: 'pdf',
  s3_key: 'uploads/123456/document.pdf',
  expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
});

// Record a download
const { data: download, error } = await createDownload({
  file_id: file.id,
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
});

// Record an analytics event
const { data: event, error } = await createAnalytics({
  event_type: 'upload',
  file_id: newFile.id,
  ip_address: '192.168.1.1',
  metadata: { file_size: 1024000 },
});
```

### Direct SQL Queries

For more complex queries, you can use the connection pool:

```typescript
import { query, queryOne } from '@/lib/db';

// Get multiple rows
const { rows } = await query(
  'SELECT * FROM files WHERE user_id = $1 ORDER BY created_at DESC',
  [userId]
);

// Get a single row
const user = await queryOne(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

## Backup and Recovery

### Automatic Backups

Supabase automatically backs up your database:
- Daily backups are retained for 7 days
- Weekly backups are retained for 4 weeks
- Monthly backups are retained for 12 months

### Manual Backup

To create a manual backup:
1. Go to **Settings** → **Backups**
2. Click **Create backup**
3. Enter a name and description
4. Click **Create**

### Restore from Backup

To restore from a backup:
1. Go to **Settings** → **Backups**
2. Find the backup you want to restore
3. Click the three dots menu
4. Click **Restore**
5. Confirm the restoration

## Monitoring and Maintenance

### Database Size

Check your database size in Supabase:
1. Go to **Settings** → **Database**
2. Look for "Database size" in the overview

### Query Performance

Monitor slow queries:
1. Go to **Logs** → **Postgres Logs**
2. Filter by slow queries
3. Optimize indexes as needed

### Connection Monitoring

Monitor active connections:
1. Go to **Settings** → **Database**
2. Look for "Active connections"

## Troubleshooting

### Connection Issues

**Problem**: "Cannot connect to database"

**Solution**:
1. Verify environment variables are set correctly
2. Check that your IP is not blocked by Supabase firewall
3. Ensure the database is running (check Supabase dashboard)
4. Try resetting the connection pool: `npm run db:reset`

### Table Not Found

**Problem**: "relation 'users' does not exist"

**Solution**:
1. Verify the migration script was executed successfully
2. Check that you're using the correct schema (should be 'public')
3. Re-run the migration script

### Slow Queries

**Problem**: Queries are running slowly

**Solution**:
1. Check that all indexes are created
2. Analyze query performance using `EXPLAIN ANALYZE`
3. Consider adding additional indexes for frequently queried columns
4. Check connection pool statistics

### Out of Connections

**Problem**: "too many connections"

**Solution**:
1. Increase `DB_POOL_MAX` in environment variables
2. Check for connection leaks in application code
3. Reduce `DB_IDLE_TIMEOUT` to close idle connections faster
4. Monitor pool statistics: `npm run db:stats`

## Security Best Practices

1. **Never commit `.env.local`** - Add it to `.gitignore`
2. **Use strong database passwords** - Minimum 16 characters
3. **Rotate service role keys regularly** - Every 90 days
4. **Enable Row Level Security (RLS)** - For multi-tenant scenarios
5. **Use parameterized queries** - Always use `$1`, `$2` placeholders
6. **Limit database user permissions** - Use least privilege principle
7. **Monitor database logs** - Check for suspicious activity
8. **Enable SSL connections** - Always use encrypted connections

## Performance Optimization

### Indexes

The schema includes optimized indexes for common queries:
- Share code lookups: `idx_files_share_code`
- Expiration queries: `idx_files_expires_at`
- User queries: `idx_files_user_id`, `idx_users_email`
- Analytics queries: `idx_analytics_event_type`, `idx_analytics_created_at`

### Connection Pooling

The application uses connection pooling to reuse connections:
- Reduces connection overhead
- Improves response times
- Handles concurrent requests efficiently

### Query Optimization

Tips for optimizing queries:
1. Use indexes for WHERE clauses
2. Limit result sets with LIMIT
3. Use EXPLAIN ANALYZE to understand query plans
4. Avoid SELECT * - specify needed columns
5. Use JOINs instead of multiple queries

## Next Steps

1. ✅ Database schema created
2. ✅ Indexes configured
3. ✅ Connection pooling set up
4. Next: Configure AWS S3 or Cloudflare R2 for object storage (Task 1.4)
5. Next: Set up environment variables and secrets management (Task 1.5)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Backup and Recovery](https://supabase.com/docs/guides/platform/backups)

## Support

For issues or questions:
1. Check the [Supabase documentation](https://supabase.com/docs)
2. Visit the [Supabase community](https://github.com/supabase/supabase/discussions)
3. Contact Supabase support through the dashboard
