# Supabase Setup - Quick Start (5 minutes)

## Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `secure-file-share` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait 2-3 minutes

## Step 2: Get Connection String
1. In Supabase dashboard, go to **Settings** → **Database**
2. Find "Connection string" section
3. Copy the **URI** (starts with `postgresql://`)
4. Replace `[YOUR-PASSWORD]` with your database password

## Step 3: Run Migrations
```bash
cd secure-file-share
DATABASE_URL="postgresql://..." npm run db:migrate
```

## Step 4: Add to Environment
Add to `.env.local`:
```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```

## Done!
Your database is ready. Next: Deploy to Vercel.

---

**Need help?** See `SETUP_GUIDE.md` for detailed steps.
