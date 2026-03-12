# Vercel Deployment - Quick Start (10 minutes)

## Step 1: Connect GitHub
1. Go to https://vercel.com
2. Sign up or log in
3. Click "Import Project"
4. Select "GitHub"
5. Authorize Vercel to access your GitHub
6. Find and select `secure-file-share` repository

## Step 2: Configure Environment Variables
1. Vercel will show "Environment Variables" section
2. Add these variables:
   ```
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
   STRIPE_SECRET_KEY=sk_...
   STRIPE_PUBLISHABLE_KEY=pk_...
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=...
   GOOGLE_RECAPTCHA_SECRET_KEY=...
   GOOGLE_RECAPTCHA_SITE_KEY=...
   ```
3. Click "Deploy"

## Step 3: Wait for Deployment
- Vercel will build and deploy automatically
- Takes 2-5 minutes
- You'll see a green checkmark when done

## Step 4: Get Your URL
- Your app is live at: `https://[project-name].vercel.app`
- Or use your custom domain

## Done!
Your app is deployed. Test it at your Vercel URL.

---

**Need help?** See `SETUP_GUIDE.md` for detailed steps.
