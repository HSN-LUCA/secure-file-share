# GitHub Deployment Information

## Your Repository Details

**Repository Name:** `secure-file-share`
**Repository URL:** `https://github.com/yourusername/secure-file-share`
**Branch:** `main`
**Root Directory:** `secure-file-share`

---

## Quick Deployment Steps

### Step 1: Push Code to GitHub

```bash
cd secure-file-share
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/new
2. Click "Select a Git Repository"
3. Search for and select: **secure-file-share**
4. Click "Import"

### Step 3: Configure Vercel Project

- **Framework:** Next.js
- **Root Directory:** `secure-file-share`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Step 4: Add Environment Variables

In Vercel Settings → Environment Variables, add all variables from `.env.production.template`:

```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-KEY]
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
OBJECT_STORAGE_BUCKET=secure-file-share-prod
OBJECT_STORAGE_ACCESS_KEY_ID=[YOUR-AWS-KEY]
OBJECT_STORAGE_SECRET_ACCESS_KEY=[YOUR-AWS-SECRET]
ENCRYPTION_KEY=[GENERATE-NEW]
JWT_SECRET=[GENERATE-NEW]
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=[YOUR-KEY]
RECAPTCHA_SECRET_KEY=[YOUR-KEY]
```

### Step 5: Deploy

Click "Deploy" and wait 5-10 minutes for your app to go live!

---

## GitHub Integration Benefits

✅ Automatic deployments on every push to `main`
✅ Preview deployments for pull requests
✅ Automatic rollbacks if deployment fails
✅ Environment variables managed securely
✅ Deployment logs and analytics
✅ Custom domain support

---

## Deployment Workflow

```
1. Make changes locally
   ↓
2. Commit to git
   ↓
3. Push to GitHub (main branch)
   ↓
4. Vercel automatically deploys
   ↓
5. Your app is live!
```

---

## Useful Commands

```bash
# Check git status
git status

# View git log
git log --oneline

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# Create a new branch
git checkout -b feature/your-feature

# Switch to main branch
git checkout main
```

---

## Vercel Dashboard

After connecting your GitHub repo, you can:

1. **View Deployments:** https://vercel.com/dashboard
2. **Monitor Performance:** Analytics tab
3. **Manage Environment Variables:** Settings → Environment Variables
4. **Configure Custom Domain:** Settings → Domains
5. **View Logs:** Deployments tab

---

## Continuous Deployment

Every time you push to `main`:
- Vercel automatically builds your app
- Runs tests (if configured)
- Deploys to production
- Updates your live URL

---

## Rollback Procedure

If something goes wrong:

```bash
# Revert last commit
git revert HEAD

# Push to GitHub
git push origin main

# Vercel will automatically redeploy with previous version
```

Or use Vercel dashboard:
1. Go to Deployments
2. Find the previous successful deployment
3. Click "Redeploy"

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Connect GitHub to Vercel
3. ✅ Add environment variables
4. ✅ Deploy
5. ✅ Monitor and celebrate!

---

**Your Repository:** `https://github.com/yourusername/secure-file-share`
**Deployment Guide:** `secure-file-share/QUICK_DEPLOY.md`
**Status:** Ready for deployment ✅
