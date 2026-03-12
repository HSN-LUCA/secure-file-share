# Quick Deploy Guide: Secure File Share

## 🚀 Deploy in 10 Minutes

### Step 1: Prepare Your Code (2 minutes)

```bash
# Navigate to project
cd secure-file-share

# Make sure everything is committed
git status

# If there are changes, commit them
git add .
git commit -m "Ready for production deployment"

# Push to GitHub
git push origin main
```

### Step 2: Create Production Environment File (3 minutes)

```bash
# Copy template
cp .env.production.template .env.production

# Edit with your production values
nano .env.production
```

**Minimum required values to fill in:**
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

### Step 3: Deploy to Vercel (5 minutes)

#### Option A: Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Click "Select a Git Repository"
3. Find and select your repository
4. Click "Import"
5. Configure project:
   - Framework: Next.js
   - Root Directory: `secure-file-share`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Click "Environment Variables"
7. Add all variables from `.env.production`
8. Click "Deploy"
9. Wait 5-10 minutes for deployment

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
cd secure-file-share
vercel --prod
```

**Your GitHub Repository:**
- Repository: `https://github.com/yourusername/secure-file-share`
- Branch: `main`
- Root Directory: `secure-file-share`

### Step 4: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Add your domain
3. Update DNS records at your domain registrar:
   - Add CNAME: `cname.vercel.com`
   - Or add A records: `76.76.19.89` and `76.76.19.90`
4. Wait 5-10 minutes for DNS propagation
5. Vercel will automatically enable HTTPS

### Step 5: Verify Deployment (1 minute)

```bash
# Test the API
curl https://yourdomain.com/api/health

# Or open in browser
https://yourdomain.com
```

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Code is committed and pushed to GitHub
- [ ] `.env.production` is created with all values
- [ ] `.env.production` is in `.gitignore` (not committed)
- [ ] Supabase database is set up
- [ ] AWS S3 bucket is created
- [ ] reCAPTCHA keys are generated
- [ ] Encryption key is generated
- [ ] JWT secret is generated

After deploying:
- [ ] Application loads at production URL
- [ ] HTTPS is working
- [ ] Can upload a file
- [ ] Can download a file
- [ ] Can create an account
- [ ] Can login
- [ ] No errors in logs

---

## 🔧 Generate Required Secrets

### Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generate JWT Secret
```bash
openssl rand -base64 32
```

---

## 📊 Monitor After Deployment

### View Logs
```bash
vercel logs --prod
```

### View Analytics
```bash
vercel analytics
```

### View Deployments
```bash
vercel list
```

---

## 🆘 Troubleshooting

### Build Failed
```bash
# Check build logs
vercel logs --prod

# Rebuild
vercel --prod --force
```

### Environment Variables Not Working
```bash
# List environment variables
vercel env list

# Pull environment variables
vercel env pull .env.production.local
```

### Domain Not Working
- Wait 5-10 minutes for DNS propagation
- Check DNS records are correct
- Verify domain in Vercel settings

### Database Connection Error
- Verify DATABASE_URL is correct
- Check Supabase project is running
- Verify network access is allowed

---

## 📚 Full Documentation

For detailed information, see:
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Pre/post deployment checklist
- `DEPLOYMENT_SUMMARY.md` - Deployment overview

---

## 🎉 You're Done!

Your application is now live in production!

### Next Steps:
1. Share the URL with users
2. Monitor logs and performance
3. Gather user feedback
4. Plan improvements

### Keep Monitoring:
- Check error logs daily
- Review analytics weekly
- Update security regularly
- Plan capacity upgrades as needed

---

**Questions?** Check the full `DEPLOYMENT_GUIDE.md` for detailed instructions.

**Ready?** Start with Step 1 above! 🚀
