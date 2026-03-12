# Supabase Setup - Complete Guide

## Overview
Supabase is a PostgreSQL database hosted in the cloud. It's perfect for this app because:
- Free tier includes 500MB storage
- Built-in authentication support
- Real-time capabilities
- Easy backups and recovery

## Part 1: Create Supabase Account & Project

### 1.1 Sign Up
1. Visit https://supabase.com
2. Click "Start your project"
3. Sign up with:
   - Email
   - GitHub (recommended - easier)
   - Google

### 1.2 Create Project
1. After login, click "New Project"
2. Fill in project details:
   - **Organization**: Create new or select existing
   - **Project Name**: `secure-file-share`
   - **Database Password**: 
     - Must be 12+ characters
     - Use mix of uppercase, lowercase, numbers, symbols
     - Example: `SecurePass123!@#`
     - **SAVE THIS PASSWORD** - you'll need it
   - **Region**: 
     - Choose closest to your users
     - US East (N. Virginia) is default
     - EU (Ireland) for Europe
3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

### 1.3 Verify Project Created
- You'll see a green checkmark when ready
- Dashboard will show your project name
- You can now access the SQL editor

## Part 2: Get Database Credentials

### 2.1 Find Connection String
1. In Supabase dashboard, click **Settings** (bottom left)
2. Go to **Database** tab
3. Scroll to "Connection string" section
4. You'll see options:
   - **URI** (what we need)
   - **Psql** (for command line)
   - **JDBC** (for Java)
   - **Go** (for Go)

### 2.2 Copy Connection String
1. Click "URI" tab
2. Copy the full string (looks like):
   ```
   postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
3. Replace `[password]` with your database password from Step 1.2

### 2.3 Extract Individual Credentials
From the connection string, you'll need:
- **Host**: `aws-0-[region].pooler.supabase.com`
- **Port**: `6543` (or `5432` for direct connection)
- **Database**: `postgres`
- **User**: `postgres.[project-id]`
- **Password**: Your database password

## Part 3: Run Database Migrations

### 3.1 Set Environment Variable
```bash
# Windows PowerShell
$env:DATABASE_URL = "postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"

# Windows CMD
set DATABASE_URL=postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# macOS/Linux
export DATABASE_URL="postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

### 3.2 Run Migrations
```bash
cd secure-file-share
npm run db:migrate
```

Expected output:
```
✓ Migrations completed successfully
✓ Tables created: users, files, shares, api_keys, etc.
✓ Indexes created
✓ Triggers enabled
```

### 3.3 Verify Tables Created
In Supabase dashboard:
1. Go to **SQL Editor**
2. Run:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
3. You should see tables like:
   - `users`
   - `files`
   - `shares`
   - `api_keys`
   - `support_tickets`
   - `custom_reports`
   - `behavior_tracking`

## Part 4: Configure Environment Variables

### 4.1 Update .env.local
Add to `secure-file-share/.env.local`:
```
# Database
DATABASE_URL=postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Optional: Direct connection (for local development)
DATABASE_URL_DIRECT=postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### 4.2 Test Connection
```bash
npm run db:test
```

Expected output:
```
✓ Database connection successful
✓ Connected to: postgres
✓ Tables: 12 found
```

## Part 5: Backup & Security

### 5.1 Enable Automated Backups
1. In Supabase dashboard, go to **Settings** → **Backups**
2. Backups are automatic (daily for free tier)
3. You can manually trigger backups anytime

### 5.2 Set Up IP Whitelist (Optional but Recommended)
1. Go to **Settings** → **Network**
2. Add your IP address to whitelist
3. This restricts database access to your IP only

### 5.3 Rotate Password Regularly
1. Go to **Settings** → **Database**
2. Click "Reset password"
3. Update `.env.local` with new password
4. Redeploy to Vercel

## Part 6: Verify Everything Works

### 6.1 Test with Sample Query
```bash
npm run db:query "SELECT COUNT(*) as user_count FROM users;"
```

### 6.2 Check Logs
In Supabase dashboard:
1. Go to **Logs** (bottom left)
2. You should see your connection attempts
3. No errors should appear

## Troubleshooting

### Connection Refused
- Check password is correct
- Verify IP whitelist (if enabled)
- Try direct connection URL (port 5432 instead of 6543)

### Migrations Failed
- Check DATABASE_URL is set correctly
- Verify all special characters in password are escaped
- Try running migrations again

### Tables Not Created
- Check migration files exist in `lib/db/migrations.sql`
- Run migrations manually in SQL Editor
- Check for error messages in logs

## Next Steps
1. ✅ Database created and configured
2. ⏭️ Deploy to Vercel (see `VERCEL_SETUP.md`)
3. ⏭️ Configure other environment variables (API keys, etc.)
4. ⏭️ Test the application

---

**Connection String Format Reference:**
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Common Issues:**
- Password contains special characters? Encode them (e.g., `@` → `%40`)
- Connection timeout? Check firewall/IP whitelist
- Wrong database? Ensure you're using `postgres` database, not `template1`
