# Supabase Setup Guide - Step by Step

This guide walks you through setting up Supabase and connecting it to your Secure File Share application.

## Table of Contents

1. [Create Supabase Project](#create-supabase-project)
2. [Get Your Credentials](#get-your-credentials)
3. [Configure Environment Variables](#configure-environment-variables)
4. [Create Database Schema](#create-database-schema)
5. [Verify Connection](#verify-connection)
6. [Test the Application](#test-the-application)

---

## Create Supabase Project

### Step 1: Sign Up or Log In

1. Go to https://supabase.com
2. Click **"Sign Up"** or **"Sign In"**
3. Use your email, GitHub, or Google account
4. Verify your email if needed

### Step 2: Create a New Project

1. Click **"New Project"** or **"Create a new project"**
2. Fill in the project details:

   | Field | Value | Notes |
   |-------|-------|-------|
   | **Project Name** | `secure-file-share` | Can be any name you prefer |
   | **Database Password** | Create a strong password | Min 8 characters, mix of upper/lower/numbers/symbols |
   | **Region** | Choose closest to you | e.g., us-east-1, eu-west-1, ap-southeast-1 |

3. Click **"Create new project"**
4. Wait 2-5 minutes for the project to be created

### Step 3: Verify Project Creation

Once created, you'll see:
- Project dashboard
- Database status showing "Healthy"
- API keys section

---

## Get Your Credentials

### Step 1: Navigate to API Settings

1. In your Supabase project, click **"Settings"** (bottom left)
2. Click **"API"** in the left sidebar
3. You'll see three important keys:

### Step 2: Copy Your Keys

**Copy these three values:**

1. **Project URL** (labeled as "Project URL")
   - Format: `https://your-project-id.supabase.co`
   - This is your `NEXT_PUBLIC_SUPABASE_URL`

2. **Anon Public Key** (labeled as "anon public")
   - Long string starting with `eyJ...`
   - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Service Role Secret** (labeled as "service_role secret")
   - Long string starting with `eyJ...`
   - This is your `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **KEEP THIS SECRET** - Never share or commit to git

### Step 3: Get Database Connection String

1. Still in **Settings** → **API**
2. Scroll down to find **"Connection string"** section
3. Select **"URI"** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. This is your `DATABASE_URL`

**Example:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

---

## Configure Environment Variables

### Step 1: Create .env.local File

1. In your project root (`secure-file-share/`), create a file named `.env.local`
2. Copy the contents from `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

### Step 2: Fill in Supabase Variables

Open `.env.local` and update these variables with your credentials:

```env
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

# PostgreSQL Direct Connection
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres

# Database Connection Pool Configuration
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

### Step 3: Fill in Other Required Variables

You also need to set these (use test values for development):

```env
# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Object Storage (AWS S3 or Cloudflare R2)
OBJECT_STORAGE_PROVIDER=aws-s3
OBJECT_STORAGE_BUCKET=secure-file-share
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_ACCESS_KEY_ID=your_access_key
OBJECT_STORAGE_SECRET_ACCESS_KEY=your_secret_key

# File Encryption
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# reCAPTCHA (use test keys for development)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe

# JWT Secret
JWT_SECRET=your_jwt_secret_key_min_32_characters_long_here

# Virus Scanner
VIRUS_SCANNER_TYPE=clamav
VIRUS_SCANNER_API_KEY=your_api_key_here
```

### Step 4: Verify .env.local is in .gitignore

Make sure `.env.local` is in your `.gitignore` file:

```bash
# Check if it's already there
grep ".env.local" .gitignore

# If not, add it
echo ".env.local" >> .gitignore
```

---

## Create Database Schema

### Option A: Using Supabase SQL Editor (Recommended)

#### Step 1: Open SQL Editor

1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**

#### Step 2: Copy Migration Script

1. Open `secure-file-share/lib/db/migrations.sql` in your editor
2. Copy the entire contents

#### Step 3: Run Migration

1. Paste the SQL into the Supabase SQL editor
2. Click **"Run"** button
3. Wait for the query to complete (should see "Success" message)

#### Step 4: Verify Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:
- `users`
- `files`
- `downloads`
- `analytics`
- `refresh_tokens`
- `enterprise_plans`
- `api_keys`
- `api_key_rate_limits`
- `api_usage`
- `api_webhooks`
- `webhook_events`
- `branding_configs`
- `domain_verifications`
- `logo_uploads`
- `branding_audit_logs`
- `user_sessions`
- `page_views`
- `click_events`
- `user_flows`
- `custom_reports`
- `scheduled_reports`
- `report_exports`
- `user_consents`
- `data_export_requests`
- `data_deletion_requests`
- `gdpr_audit_logs`
- `data_processing_agreements`
- `data_retention_policies`
- `user_opt_outs`
- `ccpa_disclosure_requests`
- `ccpa_audit_logs`
- `ccpa_privacy_notices`
- `ccpa_data_categories`

### Option B: Using Setup Script

If you prefer to use a script:

```bash
# Make sure .env.local is configured first
npm run db:setup
```

---

## Verify Connection

### Step 1: Test Database Connection

Run this command to test the connection:

```bash
npm run db:health-check
```

Expected output:
```
✓ Database connection successful
✓ All tables created
✓ Connection pool initialized
```

### Step 2: Check Tables in Supabase

1. In Supabase dashboard, click **"Table Editor"** (left sidebar)
2. You should see all the tables listed
3. Click on `files` table to verify it has the correct columns

### Step 3: Verify Indexes

Run this query in SQL Editor:

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

You should see many indexes like:
- `idx_users_email`
- `idx_files_share_code`
- `idx_files_expires_at`
- etc.

---

## Test the Application

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

You should see:
```
> next dev
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
```

### Step 3: Test Upload Feature

1. Open http://localhost:3000 in your browser
2. Click the purple circle to upload a file
3. Select a test file
4. Enter a share number (optional, 4-8 digits)
5. Click "Upload File"
6. You should see a success message with a share code

### Step 4: Verify Data in Database

1. Go to Supabase dashboard
2. Click **"Table Editor"**
3. Click on `files` table
4. You should see your uploaded file record

### Step 5: Test Download Feature

1. Go to http://localhost:3000/download
2. Enter the share code from your upload
3. Click "Find Files"
4. You should see the file details
5. Click "Download File" to download it

---

## Troubleshooting

### Connection Failed

**Error:** `Cannot connect to database`

**Solution:**
1. Verify `DATABASE_URL` is correct in `.env.local`
2. Check that your Supabase project is active (green status in dashboard)
3. Verify your IP is not blocked (Supabase allows all IPs by default)
4. Restart the development server: `npm run dev`

### Tables Not Found

**Error:** `relation 'files' does not exist`

**Solution:**
1. Verify migration script was executed successfully
2. Check that tables exist in Supabase Table Editor
3. Re-run the migration script if needed

### Wrong Credentials

**Error:** `invalid password` or `authentication failed`

**Solution:**
1. Double-check your credentials in `.env.local`
2. Make sure you copied the full key (no extra spaces)
3. Verify you're using the correct key (anon vs service_role)
4. Get fresh credentials from Supabase Settings → API

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Use a different port
npm run dev -- -p 3001
```

### Environment Variables Not Loading

**Error:** `NEXT_PUBLIC_SUPABASE_URL is undefined`

**Solution:**
1. Verify `.env.local` exists in the project root
2. Restart the development server after creating `.env.local`
3. Check that variable names are exactly correct (case-sensitive)
4. Make sure there are no extra spaces in the file

---

## Next Steps

1. ✅ Supabase project created
2. ✅ Database schema initialized
3. ✅ Environment variables configured
4. ✅ Connection verified
5. Next: Set up AWS S3 or Cloudflare R2 for file storage
6. Next: Configure reCAPTCHA for bot protection
7. Next: Set up Stripe for payments (optional)

---

## Security Reminders

⚠️ **Important:**

1. **Never commit `.env.local`** - It's in `.gitignore` for a reason
2. **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - Never share or expose to frontend
3. **Rotate keys regularly** - Every 90 days in production
4. **Use strong database password** - Minimum 16 characters
5. **Enable HTTPS** - Always use encrypted connections in production
6. **Monitor database logs** - Check for suspicious activity

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

## Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Visit the [Supabase community](https://github.com/supabase/supabase/discussions)
3. Check the [troubleshooting section](#troubleshooting) above
4. Contact Supabase support through the dashboard
