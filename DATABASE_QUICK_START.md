# Database Quick Start Guide

## 1. Set Up Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Copy your credentials:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Configure Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

## 3. Initialize Database

```bash
npm run db:init
```

This will:
- Create all 4 tables (users, files, downloads, analytics)
- Create all indexes for performance
- Create views for common queries
- Set up triggers for auto-updating timestamps

## 4. Verify Setup

```bash
npm run db:verify    # Check connection
npm run db:check     # Check tables exist
npm run db:stats     # Get record counts
```

## 5. Use Database in Code

```typescript
import {
  createUser,
  getFileByShareCode,
  createDownload,
  createAnalytics,
} from '@/lib/db';

// Create user
const { data: user } = await createUser({
  email: 'user@example.com',
  password_hash: 'hashed_password',
  plan: 'free',
});

// Get file
const { data: file } = await getFileByShareCode('123456');

// Record download
const { data: download } = await createDownload({
  file_id: file.id,
  ip_address: '192.168.1.1',
});

// Record event
const { data: event } = await createAnalytics({
  event_type: 'download',
  file_id: file.id,
});
```

## Database Schema

### Users
- `id` (UUID)
- `email` (unique)
- `password_hash`
- `plan` (free/paid/enterprise)
- `subscription_expires_at`
- `is_active`

### Files
- `id` (UUID)
- `share_code` (unique numeric)
- `user_id` (optional)
- `file_name`, `file_size`, `file_type`
- `s3_key` (object storage path)
- `expires_at` (auto-deletion time)
- `download_count`
- `is_scanned`, `is_safe` (malware status)

### Downloads
- `id` (UUID)
- `file_id` (foreign key)
- `ip_address`
- `user_agent`
- `downloaded_at`
- `country`

### Analytics
- `id` (UUID)
- `event_type` (upload/download/bot_detected/virus_detected)
- `file_id`, `user_id` (optional)
- `ip_address`
- `metadata` (JSON)
- `created_at`

## Available Query Functions

### Users
- `getUserById(id)`
- `getUserByEmail(email)`
- `createUser(data)`
- `updateUser(id, updates)`

### Files
- `getFileByShareCode(code)`
- `getFileById(id)`
- `getUserFiles(userId)`
- `createFile(data)`
- `updateFile(id, updates)`
- `deleteFile(id)`
- `getExpiredFiles()`

### Downloads
- `createDownload(data)`
- `getFileDownloads(fileId)`
- `getDownloadCount(fileId)`

### Analytics
- `createAnalytics(data)`
- `getAnalyticsByEventType(type)`
- `getFileAnalytics(fileId)`
- `getUserAnalytics(userId)`
- `getAnalyticsCount(type)`

## CLI Commands

```bash
npm run db:init      # Initialize database
npm run db:verify    # Verify connection
npm run db:check     # Check tables
npm run db:stats     # Get statistics
npm run db:help      # Show help
```

## Connection Pooling

Automatically configured with:
- Max: 20 connections
- Min: 2 connections
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

Configure via environment variables:
```env
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

## Troubleshooting

### Connection Failed
- Check environment variables are set
- Verify Supabase project is running
- Check IP is not blocked

### Tables Not Found
- Run `npm run db:init` to create tables
- Check you're using correct schema (public)

### Slow Queries
- Check indexes are created: `npm run db:check`
- Monitor pool: `npm run db:stats`

## Next Steps

1. ✅ Database configured
2. Next: Configure object storage (S3/R2)
3. Next: Implement file upload API
4. Next: Implement file download API

## More Information

See `DATABASE_SETUP.md` for comprehensive documentation.
