# Supabase Setup - Visual Guide

This guide includes visual diagrams and screenshots to help you set up Supabase.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                         │
│                  (Next.js on localhost:3000)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Uses credentials from .env.local
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────┐          ┌──────────────────┐
│  Supabase Auth   │          │  Supabase DB     │
│  (PostgreSQL)    │          │  (PostgreSQL)    │
│                  │          │                  │
│ - Users          │          │ - Files          │
│ - Sessions       │          │ - Downloads      │
│ - Tokens         │          │ - Analytics      │
└──────────────────┘          └──────────────────┘
        │                             │
        └─────────────┬───────────────┘
                      │
                      ▼
            ┌──────────────────────┐
            │  Supabase Project    │
            │  (Cloud Hosted)      │
            │                      │
            │ Region: us-east-1    │
            │ (or your choice)     │
            └──────────────────────┘
```

## Step-by-Step Visual Guide

### Step 1: Create Supabase Project

```
1. Go to https://supabase.com
   ↓
2. Click "Sign Up" or "Sign In"
   ↓
3. Click "New Project"
   ↓
4. Fill in form:
   ┌─────────────────────────────────┐
   │ Project Name: secure-file-share │
   │ Password: ••••••••••••••••••    │
   │ Region: us-east-1 ▼             │
   │                                 │
   │ [Create new project]            │
   └─────────────────────────────────┘
   ↓
5. Wait 2-5 minutes for creation
   ↓
6. See dashboard with "Healthy" status ✓
```

### Step 2: Get Credentials

```
Supabase Dashboard
├── Settings (bottom left)
│   └── API
│       ├── Project URL
│       │   └── Copy → NEXT_PUBLIC_SUPABASE_URL
│       │       Example: https://abc123.supabase.co
│       │
│       ├── anon public
│       │   └── Copy → NEXT_PUBLIC_SUPABASE_ANON_KEY
│       │       Example: eyJ0eXAiOiJKV1QiLCJhbGc...
│       │
│       └── service_role secret
│           └── Copy → SUPABASE_SERVICE_ROLE_KEY
│               Example: eyJ0eXAiOiJKV1QiLCJhbGc...
│
└── Settings
    └── Database
        └── Connection string
            └── Copy → DATABASE_URL
                Example: postgresql://postgres:password@db.abc123.supabase.co:5432/postgres
```

### Step 3: Create .env.local

```
Project Root (secure-file-share/)
│
├── .env.example (template)
│   └── Copy to .env.local
│
└── .env.local (your configuration)
    ├── NEXT_PUBLIC_SUPABASE_URL=https://abc123.supabase.co
    ├── NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
    ├── SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
    ├── DATABASE_URL=postgresql://postgres:password@...
    ├── NODE_ENV=development
    ├── NEXT_PUBLIC_APP_URL=http://localhost:3000
    └── ... (other variables)
```

### Step 4: Create Database Schema

```
Supabase Dashboard
│
├── SQL Editor (left sidebar)
│   │
│   ├── Click "New Query"
│   │
│   ├── Paste contents of:
│   │   secure-file-share/lib/db/migrations.sql
│   │
│   ├── Click "Run"
│   │
│   └── See "Success" message ✓
│
└── Table Editor (left sidebar)
    └── Verify tables created:
        ├── users ✓
        ├── files ✓
        ├── downloads ✓
        ├── analytics ✓
        └── ... (more tables)
```

### Step 5: Start Development

```
Terminal
│
├── npm install
│   └── Install dependencies
│
├── npm run dev
│   └── Start development server
│
└── Open http://localhost:3000
    └── See your app running ✓
```

## Data Flow Diagram

### Upload Flow

```
User Browser
│
├── Click purple circle
│   └── Select file
│
├── Enter share number (optional)
│   └── Click "Upload File"
│
└── Send to API
    │
    ├── POST /api/upload
    │   │
    │   ├── Validate file
    │   │
    │   ├── Encrypt file
    │   │
    │   ├── Upload to S3/R2
    │   │   └── Get s3_key
    │   │
    │   └── Save to Database
    │       │
    │       └── INSERT INTO files
    │           ├── id: UUID
    │           ├── share_code: "123456"
    │           ├── file_name: "document.pdf"
    │           ├── file_size: 1024000
    │           ├── s3_key: "uploads/..."
    │           ├── share_number: 5678 (optional)
    │           └── expires_at: timestamp
    │
    └── Return share code to user
        └── Display success screen ✓
```

### Download Flow

```
User Browser
│
├── Go to /download
│   └── Enter share code
│
├── Click "Find Files"
│   │
│   └── GET /api/download/[code]?info=true
│       │
│       ├── Query Database
│       │   │
│       │   └── SELECT * FROM files
│       │       WHERE share_code = '123456'
│       │
│       └── Return file info
│           ├── fileName
│           ├── fileSize
│           └── expiresAt
│
├── See file details
│   └── Click "Download File"
│
└── GET /api/download/[code]
    │
    ├── Verify file exists
    │
    ├── Download from S3/R2
    │   └── Using s3_key
    │
    ├── Decrypt file
    │
    ├── Record download
    │   │
    │   └── INSERT INTO downloads
    │       ├── file_id
    │       ├── ip_address
    │       └── downloaded_at
    │
    └── Send file to browser ✓
```

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      users           │
├──────────────────────┤
│ id (UUID) PK         │
│ email (VARCHAR)      │
│ password_hash        │
│ plan (free/paid)     │
│ created_at           │
│ subscription_expires │
└──────────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────┐
│      files           │
├──────────────────────┤
│ id (UUID) PK         │
│ share_code (VARCHAR) │
│ user_id (FK)         │
│ file_name            │
│ file_size            │
│ file_type            │
│ s3_key               │
│ share_number (INT)   │ ← NEW!
│ expires_at           │
│ created_at           │
│ download_count       │
│ is_scanned           │
│ is_safe              │
└──────────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────┐
│    downloads         │
├──────────────────────┤
│ id (UUID) PK         │
│ file_id (FK)         │
│ ip_address           │
│ user_agent           │
│ downloaded_at        │
│ country              │
└──────────────────────┘

┌──────────────────────┐
│    analytics         │
├──────────────────────┤
│ id (UUID) PK         │
│ event_type           │
│ file_id (FK)         │
│ user_id (FK)         │
│ ip_address           │
│ metadata (JSONB)     │
│ created_at           │
└──────────────────────┘
```

## Environment Variables Structure

```
.env.local
│
├── Application Settings
│   ├── NODE_ENV=development
│   └── NEXT_PUBLIC_APP_URL=http://localhost:3000
│
├── Supabase (Public - Safe for Frontend)
│   ├── NEXT_PUBLIC_SUPABASE_URL=https://...
│   └── NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
│
├── Supabase (Secret - Backend Only)
│   ├── SUPABASE_SERVICE_ROLE_KEY=eyJ...
│   └── DATABASE_URL=postgresql://...
│
├── Database Pool Configuration
│   ├── DB_POOL_MAX=20
│   ├── DB_POOL_MIN=2
│   ├── DB_IDLE_TIMEOUT=30000
│   └── DB_CONNECTION_TIMEOUT=2000
│
├── Object Storage
│   ├── OBJECT_STORAGE_PROVIDER=aws-s3
│   ├── OBJECT_STORAGE_BUCKET=secure-file-share
│   ├── OBJECT_STORAGE_REGION=us-east-1
│   ├── OBJECT_STORAGE_ACCESS_KEY_ID=...
│   └── OBJECT_STORAGE_SECRET_ACCESS_KEY=...
│
├── Security
│   ├── ENCRYPTION_KEY=0123456789abcdef...
│   ├── JWT_SECRET=your_jwt_secret...
│   ├── RECAPTCHA_SECRET_KEY=...
│   └── VIRUS_SCANNER_API_KEY=...
│
└── Public Keys (Safe for Frontend)
    ├── NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
    └── NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

## Connection Flow

```
Your App (localhost:3000)
│
├── Reads .env.local
│   │
│   ├── Gets NEXT_PUBLIC_SUPABASE_URL
│   ├── Gets NEXT_PUBLIC_SUPABASE_ANON_KEY
│   └── Gets DATABASE_URL
│
├── Initializes Connection Pool
│   │
│   ├── Creates 2-20 connections
│   ├── Reuses connections for queries
│   └── Closes idle connections after 30s
│
└── Makes Database Queries
    │
    ├── SELECT * FROM files WHERE share_code = '123456'
    ├── INSERT INTO files (...)
    ├── UPDATE files SET download_count = ...
    └── DELETE FROM files WHERE expires_at < NOW()
```

## Troubleshooting Decision Tree

```
App not connecting to database?
│
├─ Check .env.local exists?
│  ├─ NO → Create it: cp .env.example .env.local
│  └─ YES → Continue
│
├─ Check DATABASE_URL is correct?
│  ├─ NO → Copy from Supabase Settings → Database
│  └─ YES → Continue
│
├─ Check Supabase project is active?
│  ├─ NO → Go to Supabase dashboard, check status
│  └─ YES → Continue
│
├─ Restart dev server?
│  ├─ NO → Run: npm run dev
│  └─ YES → Continue
│
└─ Still not working?
   └─ Run: npm run db:health-check
      └─ Check error message for details
```

## File Upload Process

```
┌─────────────────────────────────────────────────────────────┐
│                    User Uploads File                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  1. Select File                │
        │     - Click purple circle      │
        │     - Choose file from device  │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  2. Enter Share Number         │
        │     - Optional (4-8 digits)    │
        │     - For grouping uploads     │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  3. Click Upload               │
        │     - Sends to /api/upload     │
        │     - Includes CAPTCHA token   │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  4. Backend Processing         │
        │     - Validate file            │
        │     - Encrypt file             │
        │     - Upload to S3/R2          │
        │     - Save to database         │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  5. Success Screen             │
        │     - Show share code          │
        │     - User can share code      │
        │     - Others can download      │
        └────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
└─────────────────────────────────────────────────────────────┘

Layer 1: Frontend
├── reCAPTCHA v3 (bot detection)
├── Input validation
└── HTTPS only

Layer 2: API
├── Rate limiting (5 uploads/min)
├── Bot detection
├── CAPTCHA verification
└── File validation

Layer 3: Storage
├── File encryption (AES-256)
├── Virus scanning
├── Secure S3/R2 storage
└── Expiration (auto-delete)

Layer 4: Database
├── PostgreSQL (Supabase)
├── Connection pooling
├── Parameterized queries
└── Row-level security (optional)

Layer 5: Infrastructure
├── HTTPS/TLS encryption
├── Firewall rules
├── DDoS protection
└── Regular backups
```

## Next Steps After Setup

```
✓ Supabase Project Created
  │
  ├─ ✓ Database Schema Created
  │   │
  │   ├─ ✓ Environment Variables Configured
  │   │   │
  │   │   ├─ ✓ App Connected to Database
  │   │   │   │
  │   │   │   ├─ Next: Set up AWS S3 (STORAGE_SETUP.md)
  │   │   │   │
  │   │   │   ├─ Next: Configure reCAPTCHA (ENV_SETUP.md)
  │   │   │   │
  │   │   │   └─ Next: Set up Stripe (PAYMENT_INTEGRATION_GUIDE.md)
```

---

## Quick Reference

| Item | Location | Example |
|------|----------|---------|
| Project URL | Supabase Settings → API | `https://abc123.supabase.co` |
| Anon Key | Supabase Settings → API | `eyJ0eXAiOiJKV1QiLCJhbGc...` |
| Service Role | Supabase Settings → API | `eyJ0eXAiOiJKV1QiLCJhbGc...` |
| Database URL | Supabase Settings → Database | `postgresql://postgres:...` |
| .env.local | Project root | `secure-file-share/.env.local` |
| Migrations | Database setup | `secure-file-share/lib/db/migrations.sql` |
| Dev Server | Terminal | `npm run dev` |
| App URL | Browser | `http://localhost:3000` |

---

## Support

- 📚 [Supabase Docs](https://supabase.com/docs)
- 💬 [Supabase Community](https://github.com/supabase/supabase/discussions)
- 📖 [Full Setup Guide](./SUPABASE_SETUP_GUIDE.md)
- ⚡ [Quick Start](./SUPABASE_QUICK_START.md)
