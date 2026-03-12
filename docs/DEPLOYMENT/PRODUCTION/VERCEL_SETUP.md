# 🚀 Adding Environment Variables to Vercel

Quick step-by-step guide to add your production environment variables to Vercel.

---

## Prerequisites

- [ ] You have gathered all credentials (see `ENV_SETUP.md`)
- [ ] You have a Vercel account
- [ ] Your project is deployed on Vercel
- [ ] You have access to the project settings

---

## Step 1: Go to Vercel Dashboard

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Secure File Share** project
3. Click **Settings** (top navigation)

---

## Step 2: Navigate to Environment Variables

1. In Settings, click **Environment Variables** (left sidebar)
2. You should see a form to add new variables

---

## Step 3: Add Each Variable

For each variable, follow these steps:

### 3.1 Click "Add New"

Click the **Add New** button

### 3.2 Enter Variable Name

In the first field, enter the variable name exactly as shown:

```
NEXT_PUBLIC_SUPABASE_URL
```

### 3.3 Enter Variable Value

In the second field, paste the value you gathered:

```
https://abc123xyz.supabase.co
```

### 3.4 Select Environment

Click the dropdown and select **Production**

⚠️ **IMPORTANT**: Make sure you select "Production", not "Preview" or "Development"

### 3.5 Click Save

Click the **Save** button

---

## Required Variables (Add These First)

Add these 14 variables in order:

### 1. Application Settings

```
Name: NODE_ENV
Value: production
Environment: Production
```

```
Name: NEXT_PUBLIC_APP_URL
Value: https://yourdomain.com
Environment: Production
```

### 2. Supabase

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://[PROJECT-ID].supabase.co
Environment: Production
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJ0eXAiOiJKV1QiLCJhbGc...
Environment: Production
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJ0eXAiOiJKV1QiLCJhbGc...
Environment: Production
```

```
Name: DATABASE_URL
Value: postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
Environment: Production
```

### 3. AWS S3

```
Name: OBJECT_STORAGE_PROVIDER
Value: aws-s3
Environment: Production
```

```
Name: OBJECT_STORAGE_BUCKET
Value: secure-file-share-prod
Environment: Production
```

```
Name: OBJECT_STORAGE_REGION
Value: us-east-1
Environment: Production
```

```
Name: OBJECT_STORAGE_ACCESS_KEY_ID
Value: AKIA...
Environment: Production
```

```
Name: OBJECT_STORAGE_SECRET_ACCESS_KEY
Value: wJalr...
Environment: Production
```

### 4. Encryption & JWT

```
Name: ENCRYPTION_KEY
Value: [64-character hex string]
Environment: Production
```

```
Name: JWT_SECRET
Value: [base64 string]
Environment: Production
```

### 5. reCAPTCHA

```
Name: NEXT_PUBLIC_RECAPTCHA_SITE_KEY
Value: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
Environment: Production
```

```
Name: RECAPTCHA_SECRET_KEY
Value: 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
Environment: Production
```

---

## Optional Variables (Add If Using)

### Stripe (for Payments)

```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_live_...
Environment: Production
```

```
Name: STRIPE_SECRET_KEY
Value: sk_live_...
Environment: Production
```

```
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_...
Environment: Production
```

### VirusTotal (for Virus Scanning)

```
Name: VIRUS_SCANNER_API_KEY
Value: [YOUR-API-KEY]
Environment: Production
```

### Redis (for Caching)

```
Name: REDIS_URL
Value: redis://default:[PASSWORD]@[HOST]:[PORT]
Environment: Production
```

### Sentry (for Error Tracking)

```
Name: NEXT_PUBLIC_SENTRY_DSN
Value: [YOUR-DSN]
Environment: Production
```

---

## Step 4: Verify Variables

After adding all variables:

1. Scroll down to see all variables listed
2. Verify each variable is set to **Production**
3. Check that no variables are missing

---

## Step 5: Redeploy Your Application

After adding variables, you need to redeploy:

### Option 1: Via Vercel Dashboard

1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Option 2: Via CLI

```bash
cd secure-file-share
vercel --prod
```

---

## Step 6: Verify Deployment

After redeployment:

1. Visit your production URL: `https://yourdomain.com`
2. Test the application:
   - [ ] Can you upload a file?
   - [ ] Can you download a file?
   - [ ] Does the dashboard work?
   - [ ] Can you log in?

---

## Troubleshooting

### Variables Not Working

**Problem**: Application still not working after adding variables

**Solution**:
1. Make sure all variables are set to **Production**
2. Make sure you redeployed after adding variables
3. Check for typos in variable names
4. Verify values are correct

### Deployment Failed

**Problem**: Deployment failed after adding variables

**Solution**:
1. Check Vercel deployment logs
2. Look for error messages
3. Verify all required variables are present
4. Check for invalid characters in values

---

## Quick Checklist

- [ ] Logged into Vercel Dashboard
- [ ] Selected correct project
- [ ] Went to Settings → Environment Variables
- [ ] Added all 14 required variables
- [ ] Set each variable to "Production"
- [ ] Verified all variables are listed
- [ ] Redeployed application
- [ ] Tested application at production URL
- [ ] All features working

---

## Next Steps

1. ✅ Add variables to Vercel (this guide)
2. ✅ Redeploy application
3. ✅ Test all features
4. ✅ Monitor logs
5. ✅ Celebrate! 🎉

---

## Security Reminders

- ✅ Never commit `.env.production` to git
- ✅ Use Vercel's environment variables feature
- ✅ Keep all secrets secure
- ✅ Don't share secrets via email or chat
- ✅ Enable 2FA on Vercel account
- ✅ Rotate secrets regularly

---

Good luck! 🚀
