# Vercel Deployment - Complete Guide

## Overview
Vercel is the platform built by the creators of Next.js. It's perfect for deploying this app because:
- Automatic deployments from GitHub
- Free tier includes unlimited deployments
- Built-in SSL/HTTPS
- Global CDN for fast performance
- Serverless functions (your API routes)
- Environment variable management

## Prerequisites
Before deploying to Vercel, you need:
- ✅ GitHub repository pushed (done)
- ✅ Supabase database set up (done)
- ✅ All environment variables ready

## Part 1: Create Vercel Account

### 1.1 Sign Up
1. Visit https://vercel.com
2. Click "Sign Up"
3. Choose sign-up method:
   - **GitHub** (recommended - easiest)
   - **GitLab**
   - **Bitbucket**
   - **Email**
4. Complete sign-up process

### 1.2 Authorize GitHub
If using GitHub sign-up:
1. You'll be redirected to GitHub
2. Click "Authorize Vercel"
3. Vercel will have access to your repositories

## Part 2: Import Project

### 2.1 Import from GitHub
1. In Vercel dashboard, click "Add New..." → "Project"
2. Click "Import Git Repository"
3. Find `secure-file-share` in the list
4. Click "Import"

### 2.2 Configure Project
Vercel will show configuration page:

**Framework Preset**: Should auto-detect "Next.js"
- If not, select "Next.js" manually

**Root Directory**: Should be `secure-file-share`
- If showing wrong path, update it

**Build Command**: Should be `npm run build`
- Verify this is correct

**Output Directory**: Should be `.next`
- This is auto-detected, usually correct

## Part 3: Add Environment Variables

### 3.1 Database Connection
1. In the configuration page, scroll to "Environment Variables"
2. Add:
   ```
   Name: DATABASE_URL
   Value: postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
3. Click "Add"

### 3.2 API Configuration
Add these variables:
```
NEXT_PUBLIC_API_URL=https://[your-project].vercel.app
NEXT_PUBLIC_APP_NAME=Secure File Share
NODE_ENV=production
```

### 3.3 Stripe Keys
Add your Stripe keys:
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3.4 AWS S3 Configuration
Add your AWS credentials:
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### 3.5 Google reCAPTCHA
Add your reCAPTCHA keys:
```
GOOGLE_RECAPTCHA_SECRET_KEY=...
GOOGLE_RECAPTCHA_SITE_KEY=...
```

### 3.6 Other Services (Optional)
If you have these configured:
```
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3.7 Review All Variables
Before deploying, verify:
- [ ] All required variables are added
- [ ] No typos in variable names
- [ ] Sensitive values are correct
- [ ] No test keys in production

## Part 4: Deploy

### 4.1 Start Deployment
1. Click "Deploy" button
2. Vercel will:
   - Clone your GitHub repository
   - Install dependencies (`npm install`)
   - Build the project (`npm run build`)
   - Deploy to Vercel's servers

### 4.2 Monitor Deployment
1. You'll see a deployment log
2. Watch for any errors
3. Typical build time: 2-5 minutes

### 4.3 Deployment Complete
When you see "✓ Deployment successful":
1. Your app is live!
2. You'll get a URL like: `https://secure-file-share-[random].vercel.app`
3. Or your custom domain if configured

## Part 5: Verify Deployment

### 5.1 Test Your App
1. Click the deployment URL
2. You should see your app homepage
3. Test key features:
   - [ ] Homepage loads
   - [ ] Upload page works
   - [ ] Download page works
   - [ ] Authentication works

### 5.2 Check Logs
1. In Vercel dashboard, click your project
2. Go to "Deployments" tab
3. Click the latest deployment
4. View "Logs" to see any errors

### 5.3 Monitor Performance
1. Go to "Analytics" tab
2. Check:
   - Page load times
   - Error rates
   - Request counts

## Part 6: Custom Domain (Optional)

### 6.1 Add Custom Domain
1. In project settings, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `files.example.com`)
4. Follow DNS configuration instructions

### 6.2 Configure DNS
1. Go to your domain registrar
2. Add CNAME record pointing to Vercel
3. Wait for DNS propagation (5-48 hours)
4. Vercel will auto-generate SSL certificate

## Part 7: Continuous Deployment

### 7.1 How It Works
- Every push to `main` branch triggers deployment
- Vercel automatically builds and deploys
- Takes 2-5 minutes per deployment
- You can see deployment history in dashboard

### 7.2 Deployment Preview
- Pull requests get preview deployments
- Test changes before merging
- Each PR gets unique preview URL

### 7.3 Rollback
If deployment fails:
1. Go to "Deployments" tab
2. Find previous successful deployment
3. Click "Promote to Production"
4. Your app reverts to previous version

## Troubleshooting

### Build Fails
**Error: "npm ERR! code ERESOLVE"**
- Solution: Update `package-lock.json` locally and push

**Error: "Cannot find module"**
- Solution: Check all imports are correct
- Run `npm install` locally to verify

### Environment Variables Not Working
- Verify variable names match exactly (case-sensitive)
- Check values don't have extra spaces
- Redeploy after adding variables

### Database Connection Fails
- Verify DATABASE_URL is correct
- Check Supabase IP whitelist includes Vercel IPs
- Try direct connection URL (port 5432)

### App Crashes After Deploy
1. Check Vercel logs for error messages
2. Verify all environment variables are set
3. Check database migrations ran successfully
4. Rollback to previous deployment

## Performance Optimization

### 7.1 Enable Caching
Vercel automatically caches:
- Static files (images, CSS, JS)
- API responses (configurable)

### 7.2 Monitor Metrics
1. Go to "Analytics" tab
2. Track:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)

### 7.3 Optimize Images
- Use Next.js Image component
- Vercel auto-optimizes images
- Reduces bandwidth and improves performance

## Next Steps

After Vercel deployment:
1. ✅ App deployed and live
2. ⏭️ Configure custom domain (optional)
3. ⏭️ Set up monitoring and alerts
4. ⏭️ Configure backup strategy
5. ⏭️ Test all features thoroughly

---

**Vercel Documentation:** https://vercel.com/docs
**Next.js Deployment:** https://nextjs.org/docs/deployment

**Common Environment Variables:**
```
DATABASE_URL          # Supabase connection string
NEXT_PUBLIC_API_URL   # Your app's public URL
STRIPE_SECRET_KEY     # Stripe secret key
AWS_ACCESS_KEY_ID     # AWS credentials
GOOGLE_RECAPTCHA_*    # reCAPTCHA keys
```
