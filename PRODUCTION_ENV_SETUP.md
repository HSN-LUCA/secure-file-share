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

**Example:**
```
NEXT_PUBLIC_SUPABASE_URL=https://abc123xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.2 Get Database Connection String

1. In Supabase, go to **Settings** → **Database**
2. Under "Connection string", select **URI**
3. Copy the connection string

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.abc123xyz.supabase.co:5432/postgres
```

**Note**: Replace `[PASSWORD]` with your database password (set during project creation)

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

**Example:**
```
OBJECT_STORAGE_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
OBJECT_STORAGE_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
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

**Example:**
```
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
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

**Example:**
```
JWT_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890+/==
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

**Example:**
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
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

### 5.3 Create Stripe Products

1. Go to **Products** → **Add product**
2. Create "Pro Plan":
   - Name: `Pro Plan`
   - Price: $9.99/month
   - Copy the Product ID and Price ID
3. Create "Enterprise Plan":
   - Name: `Enterprise Plan`
   - Price: $99.99/month
   - Copy the Product ID and Price ID

```
STRIPE_PRO_PRODUCT_ID=prod_[YOUR-ID]
STRIPE_PRO_PRICE_ID=price_[YOUR-ID]
STRIPE_ENTERPRISE_PRODUCT_ID=prod_[YOUR-ID]
STRIPE_ENTERPRISE_PRICE_ID=price_[YOUR-ID]
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

### 7.3 SendGrid (Optional - for Email)

If you want email notifications:

1. Go to [SendGrid](https://sendgrid.com)
2. Create an API key
3. Copy the key:

```
SENDGRID_API_KEY=[YOUR-API-KEY]
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

---

## Step 8: Add Variables to Vercel (10 minutes)

### 8.1 Go to Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**

### 8.2 Add Each Variable

For each variable from the steps above:

1. Click **Add New**
2. Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Enter the value
4. Select **Production** (important!)
5. Click **Save**

**Required Variables** (must add):
- `NODE_ENV` = `production`
- `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `OBJECT_STORAGE_PROVIDER` = `aws-s3`
- `OBJECT_STORAGE_BUCKET`
- `OBJECT_STORAGE_REGION`
- `OBJECT_STORAGE_ACCESS_KEY_ID`
- `OBJECT_STORAGE_SECRET_ACCESS_KEY`
- `ENCRYPTION_KEY`
- `JWT_SECRET`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `RECAPTCHA_SECRET_KEY`

**Optional Variables** (add if using):
- `STRIPE_*` (if using Stripe)
- `REDIS_URL` (if using Redis)
- `NEXT_PUBLIC_SENTRY_DSN` (if using Sentry)
- `SENDGRID_*` (if using SendGrid)
- `VIRUS_SCANNER_API_KEY` (if using VirusTotal)

### 8.3 Verify Variables

1. In Vercel, run:
```bash
vercel env list
```

2. You should see all your variables listed

---

## Step 9: Deploy to Production (5 minutes)

### 9.1 Deploy via Vercel CLI

```bash
cd secure-file-share
vercel --prod
```

### 9.2 Verify Deployment

1. Go to your Vercel project
2. Check the deployment status
3. Once complete, visit your production URL
4. Test the application:
   - [ ] Can you upload a file?
   - [ ] Can you download a file?
   - [ ] Does the dashboard work?
   - [ ] Can you log in?

---

## Troubleshooting

### Variables Not Working

1. Check Vercel dashboard for typos
2. Make sure variables are set to "Production"
3. Redeploy after adding variables:
   ```bash
   vercel --prod
   ```

### Database Connection Failed

1. Verify `DATABASE_URL` is correct
2. Check Supabase project is running
3. Verify IP whitelist (if applicable)

### S3 Upload Fails

1. Verify AWS credentials are correct
2. Check S3 bucket exists
3. Verify IAM user has S3 permissions

### reCAPTCHA Not Working

1. Verify domain is added to reCAPTCHA settings
2. Check keys are for production (not test keys)
3. Verify keys are correct in Vercel

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

## Next Steps

1. ✅ Gather all credentials (this guide)
2. ✅ Add variables to Vercel
3. ✅ Deploy to production
4. ✅ Test all features
5. ✅ Monitor logs and performance
6. ✅ Celebrate! 🎉

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
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | ❌ |
| `STRIPE_SECRET_KEY` | Stripe | ❌ |
| `STRIPE_WEBHOOK_SECRET` | Stripe | ❌ |
| `REDIS_URL` | Upstash | ❌ |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | ❌ |

---

## Support

For detailed deployment information, see:
- `QUICK_DEPLOY.md` - 10-minute deployment guide
- `DEPLOYMENT_GUIDE.md` - Comprehensive guide
- `.env.production.template` - Environment variables reference

Good luck with your deployment! 🚀
