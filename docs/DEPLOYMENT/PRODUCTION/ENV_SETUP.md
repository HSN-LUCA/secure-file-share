# 🔐 Production Environment Variables Setup Guide

## Overview

This guide walks you through gathering all credentials needed for production deployment. Follow each section in order.

**Time Required**: 30-45 minutes  
**Difficulty**: Beginner-friendly  
**Prerequisites**: Accounts created on Vercel, Supabase, AWS, and Google

---

## ⚠️ Security First

Before you start:
- [ ] Never commit `.env.production` to git
- [ ] Use Vercel's environment variables feature instead
- [ ] Generate NEW secrets for production (don't reuse development keys)
- [ ] Keep all secrets secure and private
- [ ] Enable 2FA on all accounts

---

## Step 1: Supabase Credentials (5 minutes)

### 1.1 Get Supabase URL and Keys

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your production project
3. Click **Settings** → **API**
4. Copy these three values:

```
NEXT_PUBLIC_SUPABASE_URL = [Project URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [anon public]
SUPABASE_SERVICE_ROLE_KEY = [service_role secret]
```

### 1.2 Get Database Connection String

1. In Supabase, go to **Settings** → **Database**
2. Under "Connection string", select **URI**
3. Copy the connection string

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.abc123xyz.supabase.co:5432/postgres
```

---

## Step 2: AWS S3 Credentials (10 minutes)

### 2.1 Create IAM User for S3

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Name: `secure-file-share-prod`
4. Click **Next**
5. Click **Attach policies directly**
6. Search for and select: `AmazonS3FullAccess`
7. Click **Create user**

### 2.2 Create Access Keys

1. Click on the new user
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Select **Application running outside AWS**
5. Click **Next**
6. Copy the two keys:

```
OBJECT_STORAGE_ACCESS_KEY_ID=[Access Key ID]
OBJECT_STORAGE_SECRET_ACCESS_KEY=[Secret Access Key]
```

### 2.3 Create S3 Bucket

1. Go to [S3 Console](https://s3.console.aws.amazon.com/)
2. Click **Create bucket**
3. Name: `secure-file-share-prod`
4. Region: Choose closest to your users
5. Click **Create bucket**

```
OBJECT_STORAGE_BUCKET=secure-file-share-prod
OBJECT_STORAGE_REGION=us-east-1
```

---

## Step 3: Generate Encryption Keys (5 minutes)

### 3.1 Generate AES-256 Encryption Key

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output:

```
ENCRYPTION_KEY=[64-character hex string]
```

### 3.2 Generate JWT Secret

Run this command:

```bash
openssl rand -base64 32
```

Copy the output:

```
JWT_SECRET=[base64 string]
```

---

## Step 4: reCAPTCHA v3 Keys (5 minutes)

### 4.1 Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **Create** or select existing site
3. Name: `Secure File Share Production`
4. reCAPTCHA type: **reCAPTCHA v3**
5. Domains: `yourdomain.com` (your production domain)
6. Accept terms and click **Create**
7. Copy the two keys:

```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=[Site Key]
RECAPTCHA_SECRET_KEY=[Secret Key]
```

---

## Step 5: Stripe Keys (Optional - for Payments) (5 minutes)

### 5.1 Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Live mode** (toggle in top-left)
3. Go to **Developers** → **API keys**
4. Copy the two keys:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR-KEY]
STRIPE_SECRET_KEY=sk_live_[YOUR-KEY]
```

### 5.2 Create Stripe Webhook

1. In Stripe, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. URL: `https://yourdomain.com/api/payments/webhook`
4. Events: Select `checkout.session.completed` and `customer.subscription.updated`
5. Click **Add endpoint**
6. Copy the signing secret:

```
STRIPE_WEBHOOK_SECRET=whsec_[YOUR-SECRET]
```

---

## Step 6: VirusTotal API Key (Optional - for Virus Scanning) (2 minutes)

### 6.1 Get VirusTotal API Key

1. Go to [VirusTotal](https://www.virustotal.com)
2. Sign up or log in
3. Go to your profile → **API key**
4. Copy the API key:

```
VIRUS_SCANNER_API_KEY=[YOUR-API-KEY]
```

---

## Step 7: Optional Services

### 7.1 Redis (Optional - for Caching)

If you want to use Redis for caching:

1. Go to [Upstash Redis](https://upstash.com)
2. Create a new database
3. Copy the connection URL:

```
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
```

### 7.2 Sentry (Optional - for Error Tracking)

If you want error tracking:

1. Go to [Sentry](https://sentry.io)
2. Create a new project (Next.js)
3. Copy the DSN:

```
NEXT_PUBLIC_SENTRY_DSN=[YOUR-DSN]
```

---

## Security Checklist

Before going live:

- [ ] All secrets are in Vercel, not in code
- [ ] `.env.production` is in `.gitignore`
- [ ] No secrets are logged to console
- [ ] 2FA is enabled on all accounts
- [ ] Database backups are configured
- [ ] Monitoring is set up
- [ ] Error tracking is enabled
- [ ] SSL certificate is valid
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled

---

## Quick Reference

| Variable | Source | Required |
|----------|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings → API | ✅ |
| `DATABASE_URL` | Supabase Settings → Database | ✅ |
| `OBJECT_STORAGE_ACCESS_KEY_ID` | AWS IAM | ✅ |
| `OBJECT_STORAGE_SECRET_ACCESS_KEY` | AWS IAM | ✅ |
| `ENCRYPTION_KEY` | Generate new | ✅ |
| `JWT_SECRET` | Generate new | ✅ |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA | ✅ |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA | ✅ |

---

**Status**: ✅ Ready to gather credentials  
**Next**: Follow each step above to collect all required values

Good luck! 🚀
