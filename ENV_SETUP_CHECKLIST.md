# ✅ Environment Variables Setup Checklist

Use this checklist to track your progress gathering credentials.

---

## 📋 Supabase Credentials

- [ ] **NEXT_PUBLIC_SUPABASE_URL**
  - Source: Supabase Dashboard → Settings → API → Project URL
  - Value: `https://[PROJECT-ID].supabase.co`
  - Status: ⏳ Pending

- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY**
  - Source: Supabase Dashboard → Settings → API → anon public
  - Value: `eyJ0eXAiOiJKV1QiLCJhbGc...`
  - Status: ⏳ Pending

- [ ] **SUPABASE_SERVICE_ROLE_KEY**
  - Source: Supabase Dashboard → Settings → API → service_role secret
  - Value: `eyJ0eXAiOiJKV1QiLCJhbGc...`
  - Status: ⏳ Pending
  - ⚠️ KEEP SECRET!

- [ ] **DATABASE_URL**
  - Source: Supabase Dashboard → Settings → Database → Connection string
  - Value: `postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres`
  - Status: ⏳ Pending

---

## 🔑 AWS S3 Credentials

- [ ] **Create IAM User**
  - Go to: AWS IAM Console → Users → Create user
  - Name: `secure-file-share-prod`
  - Status: ⏳ Pending

- [ ] **Create Access Keys**
  - Go to: IAM User → Security credentials → Create access key
  - Status: ⏳ Pending

- [ ] **OBJECT_STORAGE_ACCESS_KEY_ID**
  - Source: AWS IAM → Access Key ID
  - Value: `AKIA...`
  - Status: ⏳ Pending

- [ ] **OBJECT_STORAGE_SECRET_ACCESS_KEY**
  - Source: AWS IAM → Secret Access Key
  - Value: `wJalr...`
  - Status: ⏳ Pending
  - ⚠️ KEEP SECRET!

- [ ] **Create S3 Bucket**
  - Go to: S3 Console → Create bucket
  - Name: `secure-file-share-prod`
  - Status: ⏳ Pending

- [ ] **OBJECT_STORAGE_BUCKET**
  - Value: `secure-file-share-prod`
  - Status: ⏳ Pending

- [ ] **OBJECT_STORAGE_REGION**
  - Value: `us-east-1` (or your region)
  - Status: ⏳ Pending

---

## 🔐 Encryption Keys (Generate New)

- [ ] **ENCRYPTION_KEY**
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Value: `[64-character hex string]`
  - Status: ⏳ Pending
  - ⚠️ KEEP SECRET!

- [ ] **JWT_SECRET**
  - Generate: `openssl rand -base64 32`
  - Value: `[base64 string]`
  - Status: ⏳ Pending
  - ⚠️ KEEP SECRET!

---

## 🤖 reCAPTCHA v3 Keys

- [ ] **NEXT_PUBLIC_RECAPTCHA_SITE_KEY**
  - Source: Google reCAPTCHA Admin → Site Key
  - Go to: https://www.google.com/recaptcha/admin
  - Value: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
  - Status: ⏳ Pending

- [ ] **RECAPTCHA_SECRET_KEY**
  - Source: Google reCAPTCHA Admin → Secret Key
  - Value: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`
  - Status: ⏳ Pending
  - ⚠️ KEEP SECRET!

---

## 💳 Stripe Keys (Optional - for Payments)

- [ ] **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
  - Source: Stripe Dashboard → Developers → API keys (LIVE mode)
  - Value: `pk_live_...`
  - Status: ⏳ Pending
  - Optional: ❌

- [ ] **STRIPE_SECRET_KEY**
  - Source: Stripe Dashboard → Developers → API keys (LIVE mode)
  - Value: `sk_live_...`
  - Status: ⏳ Pending
  - Optional: ❌
  - ⚠️ KEEP SECRET!

- [ ] **STRIPE_WEBHOOK_SECRET**
  - Source: Stripe Dashboard → Developers → Webhooks
  - Value: `whsec_...`
  - Status: ⏳ Pending
  - Optional: ❌
  - ⚠️ KEEP SECRET!

- [ ] **STRIPE_PRO_PRODUCT_ID**
  - Source: Stripe Dashboard → Products
  - Value: `prod_...`
  - Status: ⏳ Pending
  - Optional: ❌

- [ ] **STRIPE_PRO_PRICE_ID**
  - Source: Stripe Dashboard → Products → Pro Plan
  - Value: `price_...`
  - Status: ⏳ Pending
  - Optional: ❌

- [ ] **STRIPE_ENTERPRISE_PRODUCT_ID**
  - Source: Stripe Dashboard → Products
  - Value: `prod_...`
  - Status: ⏳ Pending
  - Optional: ❌

- [ ] **STRIPE_ENTERPRISE_PRICE_ID**
  - Source: Stripe Dashboard → Products → Enterprise Plan
  - Value: `price_...`
  - Status: ⏳ Pending
  - Optional: ❌

---

## 🦠 VirusTotal API Key (Optional - for Virus Scanning)

- [ ] **VIRUS_SCANNER_API_KEY**
  - Source: VirusTotal → Profile → API key
  - Go to: https://www.virustotal.com
  - Value: `[API-KEY]`
  - Status: ⏳ Pending
  - Optional: ❌
  - ⚠️ KEEP SECRET!

---

## 📦 Redis (Optional - for Caching)

- [ ] **REDIS_URL**
  - Source: Upstash Redis → Database
  - Go to: https://upstash.com
  - Value: `redis://default:[PASSWORD]@[HOST]:[PORT]`
  - Status: ⏳ Pending
  - Optional: ❌
  - ⚠️ KEEP SECRET!

---

## 🚨 Sentry (Optional - for Error Tracking)

- [ ] **NEXT_PUBLIC_SENTRY_DSN**
  - Source: Sentry → Project Settings
  - Go to: https://sentry.io
  - Value: `[DSN]`
  - Status: ⏳ Pending
  - Optional: ❌

---

## 📧 SendGrid (Optional - for Email)

- [ ] **SENDGRID_API_KEY**
  - Source: SendGrid → API Keys
  - Go to: https://sendgrid.com
  - Value: `[API-KEY]`
  - Status: ⏳ Pending
  - Optional: ❌
  - ⚠️ KEEP SECRET!

- [ ] **SENDGRID_FROM_EMAIL**
  - Value: `noreply@yourdomain.com`
  - Status: ⏳ Pending
  - Optional: ❌

---

## 🌐 Application Settings

- [ ] **NODE_ENV**
  - Value: `production`
  - Status: ⏳ Pending

- [ ] **NEXT_PUBLIC_APP_URL**
  - Value: `https://yourdomain.com`
  - Status: ⏳ Pending

---

## 📊 Progress Summary

### Required Variables (Must Complete)
- [ ] Supabase (4 variables)
- [ ] AWS S3 (4 variables)
- [ ] Encryption Keys (2 variables)
- [ ] reCAPTCHA (2 variables)
- [ ] Application Settings (2 variables)

**Total Required**: 14 variables

### Optional Variables (Nice to Have)
- [ ] Stripe (8 variables)
- [ ] VirusTotal (1 variable)
- [ ] Redis (1 variable)
- [ ] Sentry (1 variable)
- [ ] SendGrid (2 variables)

**Total Optional**: 13 variables

---

## 🚀 Next Steps

### Phase 1: Gather Required Credentials (30 minutes)
1. [ ] Complete all required variables above
2. [ ] Verify all values are correct
3. [ ] Keep secrets secure

### Phase 2: Add to Vercel (10 minutes)
1. [ ] Go to Vercel Dashboard
2. [ ] Select your project
3. [ ] Go to Settings → Environment Variables
4. [ ] Add each variable
5. [ ] Select "Production" for each
6. [ ] Click Save

### Phase 3: Deploy (5 minutes)
1. [ ] Run: `vercel --prod`
2. [ ] Wait for deployment
3. [ ] Test your application

### Phase 4: Verify (10 minutes)
1. [ ] Visit your production URL
2. [ ] Test file upload
3. [ ] Test file download
4. [ ] Check dashboard
5. [ ] Verify everything works

---

## 📝 Notes

Use this space to track any issues or notes:

```
[Your notes here]
```

---

## ✅ Final Checklist

Before deploying:

- [ ] All required variables gathered
- [ ] All values verified for accuracy
- [ ] All secrets are secure
- [ ] Variables added to Vercel
- [ ] Variables set to "Production"
- [ ] No secrets in code or git
- [ ] `.env.production` in `.gitignore`
- [ ] Ready to deploy

---

## 🎯 Status

**Overall Progress**: 0/14 required variables ⏳

**Last Updated**: [Your date]

**Next Action**: Start gathering credentials from PRODUCTION_ENV_SETUP.md

---

Good luck! 🚀
