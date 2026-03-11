# Deployment Guide: Secure File Share

## Overview

This guide walks you through deploying the Secure File Share application to production on Vercel with Supabase as the database and AWS S3 for file storage.

## Prerequisites

Before deploying, ensure you have:

1. **Vercel Account** - https://vercel.com (free tier available)
2. **Supabase Project** - Already set up with production database
3. **AWS Account** - For S3 bucket (or use Cloudflare R2)
4. **Stripe Account** - For payment processing (optional for MVP)
5. **Git Repository** - GitHub, GitLab, or Bitbucket

## Deployment Steps

### Step 1: Prepare Your Git Repository

```bash
# Initialize git if not already done
cd secure-file-share
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Secure File Share production ready"

# Add remote repository (replace with your repo URL)
git remote add origin https://github.com/yourusername/secure-file-share.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 2: Set Up Production Supabase Project

1. **Create Production Database** (if not already done):
   - Go to https://app.supabase.com
   - Create a new project or use existing one
   - Note the project URL and API keys

2. **Run Database Migrations**:
   ```bash
   # Connect to production database
   psql postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   
   # Run migrations from lib/db/migrations.sql
   \i lib/db/migrations.sql
   ```

3. **Verify Database Connection**:
   ```bash
   npm run db:test
   ```

### Step 3: Set Up AWS S3 for Production

1. **Create S3 Bucket**:
   - Go to https://console.aws.amazon.com/s3
   - Click "Create bucket"
   - Name: `secure-file-share-prod` (must be globally unique)
   - Region: Choose closest to your users
   - Block public access: Keep enabled
   - Click "Create bucket"

2. **Configure Bucket Lifecycle Policy**:
   - Go to bucket → Lifecycle
   - Add rule:
     - Prefix: `uploads/`
     - Expiration: 30 days (for safety)
     - Click "Create rule"

3. **Create IAM User for App**:
   - Go to https://console.aws.amazon.com/iam
   - Users → Create user
   - Name: `secure-file-share-app`
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - Create access key
   - Save Access Key ID and Secret Access Key

4. **Enable CORS on S3 Bucket**:
   - Go to bucket → Permissions → CORS
   - Add CORS configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

### Step 4: Set Up Stripe (Optional but Recommended)

1. **Create Stripe Account**:
   - Go to https://stripe.com
   - Sign up and verify email
   - Go to Dashboard → API keys
   - Copy Publishable Key and Secret Key

2. **Create Products**:
   - Dashboard → Products → Add product
   - Create "Pro Plan" ($4.99/month)
   - Create "Enterprise Plan" (custom pricing)
   - Note the Product IDs and Price IDs

### Step 5: Create Production Environment File

Create `.env.production` in the `secure-file-share` directory:

```bash
# Copy template
cp .env.local .env.production

# Edit with production values
nano .env.production
```

Update with production values:

```env
################################################################################
# PRODUCTION ENVIRONMENT VARIABLES
################################################################################

NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

################################################################################
# SUPABASE PRODUCTION
################################################################################

NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

################################################################################
# AWS S3 PRODUCTION
################################################################################

OBJECT_STORAGE_PROVIDER=aws-s3
OBJECT_STORAGE_BUCKET=secure-file-share-prod
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_ACCESS_KEY_ID=[YOUR-ACCESS-KEY-ID]
OBJECT_STORAGE_SECRET_ACCESS_KEY=[YOUR-SECRET-ACCESS-KEY]

################################################################################
# ENCRYPTION
################################################################################

ENCRYPTION_KEY=[GENERATE-NEW-KEY]

# Generate new encryption key:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

################################################################################
# JWT
################################################################################

JWT_SECRET=[GENERATE-NEW-SECRET]

# Generate new JWT secret:
# openssl rand -base64 32

################################################################################
# STRIPE PRODUCTION
################################################################################

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR-LIVE-KEY]
STRIPE_SECRET_KEY=sk_live_[YOUR-LIVE-KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR-WEBHOOK-SECRET]
STRIPE_PRO_PRODUCT_ID=prod_[YOUR-PRO-ID]
STRIPE_PRO_PRICE_ID=price_[YOUR-PRO-PRICE-ID]
STRIPE_ENTERPRISE_PRODUCT_ID=prod_[YOUR-ENTERPRISE-ID]
STRIPE_ENTERPRISE_PRICE_ID=price_[YOUR-ENTERPRISE-PRICE-ID]

################################################################################
# REDIS PRODUCTION
################################################################################

REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]

# Use Upstash Redis: https://upstash.com
# Free tier available

################################################################################
# reCAPTCHA PRODUCTION
################################################################################

NEXT_PUBLIC_RECAPTCHA_SITE_KEY=[YOUR-PRODUCTION-SITE-KEY]
RECAPTCHA_SECRET_KEY=[YOUR-PRODUCTION-SECRET-KEY]

# Get from: https://www.google.com/recaptcha/admin

################################################################################
# SENTRY (Error Tracking)
################################################################################

NEXT_PUBLIC_SENTRY_DSN=[YOUR-SENTRY-DSN]

# Get from: https://sentry.io
```

### Step 6: Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd secure-file-share
vercel --prod
```

#### Option B: Using GitHub Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to https://vercel.com/new
   - Select "Import Git Repository"
   - Choose your GitHub repository
   - Click "Import"

3. **Configure Project**:
   - Framework: Next.js
   - Root Directory: `secure-file-share`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Add Environment Variables**:
   - Go to Settings → Environment Variables
   - Add all variables from `.env.production`
   - Select "Production" for each variable

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (5-10 minutes)

### Step 7: Configure Custom Domain

1. **Add Domain to Vercel**:
   - Go to Project Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `fileshare.com`)
   - Click "Add"

2. **Update DNS Records**:
   - Go to your domain registrar
   - Add CNAME record:
     - Name: `@` or leave blank
     - Value: `cname.vercel.com`
   - Or add A records (if CNAME not available):
     - `76.76.19.89`
     - `76.76.19.90`

3. **Verify Domain**:
   - Wait 5-10 minutes for DNS propagation
   - Vercel will automatically verify and enable HTTPS

### Step 8: Set Up Monitoring and Logging

1. **Enable Sentry**:
   - Go to https://sentry.io
   - Create new project
   - Select "Next.js"
   - Copy DSN
   - Add to environment variables

2. **Configure Vercel Analytics**:
   - Go to Project Settings → Analytics
   - Enable Web Analytics
   - Enable Real Experience Monitoring

3. **Set Up Uptime Monitoring**:
   - Use Vercel's built-in monitoring
   - Or use external service like UptimeRobot

### Step 9: Test Production Deployment

```bash
# Test upload endpoint
curl -X POST https://yourdomain.com/api/upload \
  -F "file=@test.pdf" \
  -F "captcha_token=test_token"

# Test download endpoint
curl https://yourdomain.com/api/download/123456

# Test authentication
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Step 10: Set Up Automated Backups

1. **Supabase Backups**:
   - Go to Project Settings → Backups
   - Enable daily backups
   - Set retention to 30 days

2. **S3 Backups**:
   - Enable versioning on S3 bucket
   - Set lifecycle policy to archive old versions

### Step 11: Configure Security Headers

Vercel automatically adds security headers. Verify in `next.config.js`:

```javascript
// next.config.js
module.exports = {
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

### Step 12: Set Up CI/CD Pipeline

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install
        working-directory: secure-file-share
      
      - name: Run tests
        run: npm test
        working-directory: secure-file-share
      
      - name: Build
        run: npm run build
        working-directory: secure-file-share
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: secure-file-share
```

## Post-Deployment Checklist

- [ ] Domain is accessible and HTTPS is working
- [ ] Database migrations completed successfully
- [ ] S3 bucket is configured and accessible
- [ ] Stripe webhooks are configured
- [ ] reCAPTCHA is working in production
- [ ] Email notifications are sending (if configured)
- [ ] Analytics dashboard is tracking data
- [ ] Error monitoring (Sentry) is active
- [ ] Backups are scheduled and working
- [ ] SSL certificate is valid
- [ ] Security headers are present
- [ ] Rate limiting is active
- [ ] Bot detection is working
- [ ] File expiration cleanup job is running

## Monitoring and Maintenance

### Daily Tasks
- Check error logs in Sentry
- Monitor API response times
- Verify file cleanup job ran

### Weekly Tasks
- Review analytics dashboard
- Check storage usage
- Monitor rate limiting metrics
- Review security logs

### Monthly Tasks
- Review and update security policies
- Audit user access and permissions
- Check compliance status
- Plan capacity upgrades if needed

## Troubleshooting

### Build Fails on Vercel
```bash
# Check build logs
vercel logs --prod

# Rebuild
vercel --prod --force
```

### Database Connection Issues
```bash
# Test connection
psql postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# Check environment variables
vercel env list
```

### S3 Upload Fails
- Verify IAM user has S3 permissions
- Check bucket CORS configuration
- Verify bucket name and region

### Stripe Webhooks Not Working
- Verify webhook URL in Stripe dashboard
- Check webhook secret in environment variables
- Review webhook logs in Stripe dashboard

## Rollback Procedure

If deployment has critical issues:

```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous commit
git revert HEAD
git push origin main
```

## Performance Optimization

### Vercel Optimizations
- Enable Edge Caching
- Use Vercel Analytics
- Enable Incremental Static Regeneration (ISR)

### Database Optimizations
- Enable connection pooling
- Add database indexes
- Monitor slow queries

### S3 Optimizations
- Enable CloudFront CDN
- Use S3 Transfer Acceleration
- Enable multipart uploads

## Security Hardening

1. **Enable 2FA on all accounts**
   - Vercel
   - Supabase
   - AWS
   - Stripe

2. **Rotate secrets regularly**
   - API keys every 90 days
   - Database passwords every 6 months
   - Encryption keys (plan for rotation)

3. **Monitor access logs**
   - Vercel deployment logs
   - Database access logs
   - S3 access logs

4. **Set up alerts**
   - Failed deployments
   - High error rates
   - Unusual traffic patterns
   - Failed authentication attempts

## Support and Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **AWS S3 Docs**: https://docs.aws.amazon.com/s3/
- **Next.js Docs**: https://nextjs.org/docs
- **Stripe Docs**: https://stripe.com/docs

## Next Steps After Deployment

1. **Monitor Performance**
   - Check Core Web Vitals
   - Monitor API response times
   - Track error rates

2. **Gather User Feedback**
   - Set up feedback form
   - Monitor support tickets
   - Track user behavior

3. **Plan Improvements**
   - Analyze usage patterns
   - Identify bottlenecks
   - Plan feature enhancements

4. **Scale Infrastructure**
   - Monitor database performance
   - Plan database upgrades
   - Consider multi-region deployment

---

**Deployment Status**: Ready for production
**Last Updated**: 2024
**Next Review**: After first week of production
