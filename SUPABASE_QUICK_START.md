# Supabase Quick Start Checklist

Complete these steps in order to get your app running with Supabase.

## ✅ Step 1: Create Supabase Project (5 minutes)

- [ ] Go to https://supabase.com
- [ ] Sign up or log in
- [ ] Click "New Project"
- [ ] Enter project name: `secure-file-share`
- [ ] Create a strong database password
- [ ] Choose your region (closest to you)
- [ ] Click "Create new project"
- [ ] Wait for project to be created (2-5 minutes)

## ✅ Step 2: Get Your Credentials (2 minutes)

- [ ] Go to **Settings** → **API**
- [ ] Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Copy **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Go to **Settings** → **Database**
- [ ] Copy connection string → `DATABASE_URL` (replace `[YOUR-PASSWORD]`)

## ✅ Step 3: Create .env.local File (2 minutes)

```bash
# In your project root (secure-file-share/)
cp .env.example .env.local
```

## ✅ Step 4: Fill in .env.local (5 minutes)

Open `.env.local` and update these variables:

```env
# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Pool (keep defaults)
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Storage (use test values for now)
OBJECT_STORAGE_PROVIDER=aws-s3
OBJECT_STORAGE_BUCKET=secure-file-share
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_ACCESS_KEY_ID=test_key
OBJECT_STORAGE_SECRET_ACCESS_KEY=test_secret

# Encryption (generate with: npm run storage:generate-key)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# reCAPTCHA (test keys - development only)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_characters_long_here

# Virus Scanner
VIRUS_SCANNER_TYPE=clamav
VIRUS_SCANNER_API_KEY=test_key
```

## ✅ Step 5: Create Database Schema (5 minutes)

### Option A: Using Supabase SQL Editor (Recommended)

1. [ ] Go to Supabase dashboard
2. [ ] Click **"SQL Editor"** (left sidebar)
3. [ ] Click **"New Query"**
4. [ ] Open `secure-file-share/lib/db/migrations.sql`
5. [ ] Copy entire contents
6. [ ] Paste into SQL editor
7. [ ] Click **"Run"**
8. [ ] Wait for success message

### Option B: Using Script

```bash
npm run db:setup
```

## ✅ Step 6: Verify Connection (2 minutes)

```bash
# Test database connection
npm run db:health-check
```

Expected output:
```
✓ Database connection successful
✓ All tables created
✓ Connection pool initialized
```

## ✅ Step 7: Start Development Server (1 minute)

```bash
npm run dev
```

You should see:
```
> next dev
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
```

## ✅ Step 8: Test the App (5 minutes)

1. [ ] Open http://localhost:3000
2. [ ] Click the purple circle to upload a file
3. [ ] Select a test file
4. [ ] Click "Upload File"
5. [ ] You should see a success message with a share code
6. [ ] Go to http://localhost:3000/download
7. [ ] Enter the share code
8. [ ] Click "Find Files"
9. [ ] Click "Download File"

## ✅ Verify in Supabase Dashboard

1. [ ] Go to Supabase dashboard
2. [ ] Click **"Table Editor"**
3. [ ] Click **"files"** table
4. [ ] You should see your uploaded file record

---

## 🎉 You're Done!

Your app is now connected to Supabase and ready to use!

### Next Steps (Optional)

- [ ] Set up AWS S3 for file storage (see STORAGE_SETUP.md)
- [ ] Configure reCAPTCHA for production (see ENV_SETUP.md)
- [ ] Set up Stripe for payments (see PAYMENT_INTEGRATION_GUIDE.md)
- [ ] Deploy to production (see deployment docs)

---

## ⚠️ Important Reminders

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - Never share it
3. **Use strong passwords** - Minimum 16 characters
4. **Rotate keys regularly** - Every 90 days in production
5. **Enable HTTPS** - Always use encrypted connections

---

## 🆘 Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` is correct
- Verify Supabase project is active (green status)
- Restart dev server: `npm run dev`

### "Tables not found"
- Verify migration script ran successfully
- Check Supabase Table Editor for tables
- Re-run migration if needed

### "Wrong credentials"
- Double-check credentials in `.env.local`
- Make sure no extra spaces
- Get fresh credentials from Supabase Settings → API

### "Port 3000 already in use"
```bash
npm run dev -- -p 3001
```

### "Environment variables not loading"
- Verify `.env.local` exists in project root
- Restart dev server after creating `.env.local`
- Check variable names are exactly correct (case-sensitive)

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Full Setup Guide](./SUPABASE_SETUP_GUIDE.md)
- [Database Setup Guide](./DATABASE_SETUP.md)
- [Environment Variables Guide](./ENV_SETUP.md)
