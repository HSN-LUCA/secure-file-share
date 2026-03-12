# 🚀 Quick Environment Variables Reference

One-page quick reference for all production environment variables.

---

## 📋 All Variables at a Glance

### Required Variables (14)

| Variable | Value | Source | Secret |
|----------|-------|--------|--------|
| `NODE_ENV` | `production` | Manual | ❌ |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Manual | ❌ |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[ID].supabase.co` | Supabase | ❌ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ0eXAi...` | Supabase | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ0eXAi...` | Supabase | ✅ |
| `DATABASE_URL` | `postgresql://...` | Supabase | ✅ |
| `OBJECT_STORAGE_BUCKET` | `secure-file-share-prod` | AWS | ❌ |
| `OBJECT_STORAGE_REGION` | `us-east-1` | AWS | ❌ |
| `OBJECT_STORAGE_ACCESS_KEY_ID` | `AKIA...` | AWS | ✅ |
| `OBJECT_STORAGE_SECRET_ACCESS_KEY` | `wJalr...` | AWS | ✅ |
| `ENCRYPTION_KEY` | `[64-char hex]` | Generate | ✅ |
| `JWT_SECRET` | `[base64]` | Generate | ✅ |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | `6LeIx...` | Google | ❌ |
| `RECAPTCHA_SECRET_KEY` | `6LeIx...` | Google | ✅ |

### Optional Variables (13)

| Variable | Value | Source | Secret |
|----------|-------|--------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe | ❌ |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe | ✅ |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe | ✅ |
| `STRIPE_PRO_PRODUCT_ID` | `prod_...` | Stripe | ❌ |
| `STRIPE_PRO_PRICE_ID` | `price_...` | Stripe | ❌ |
| `STRIPE_ENTERPRISE_PRODUCT_ID` | `prod_...` | Stripe | ❌ |
| `STRIPE_ENTERPRISE_PRICE_ID` | `price_...` | Stripe | ❌ |
| `VIRUS_SCANNER_API_KEY` | `[API-KEY]` | VirusTotal | ✅ |
| `REDIS_URL` | `redis://...` | Upstash | ✅ |
| `NEXT_PUBLIC_SENTRY_DSN` | `[DSN]` | Sentry | ❌ |
| `SENDGRID_API_KEY` | `[API-KEY]` | SendGrid | ✅ |
| `SENDGRID_FROM_EMAIL` | `noreply@yourdomain.com` | Manual | ❌ |
| `OBJECT_STORAGE_PROVIDER` | `aws-s3` | Manual | ❌ |

---

## 🔑 Where to Get Each Variable

### Supabase
1. Go to: https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy: Project URL, anon key, service_role key
5. Settings → Database
6. Copy: Connection string

### AWS S3
1. Go to: https://console.aws.amazon.com/iam/
2. Create IAM user: `secure-file-share-prod`
3. Create access keys
4. Go to: https://s3.console.aws.amazon.com/
5. Create bucket: `secure-file-share-prod`

### Generate Secrets
```bash
# Encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT secret
openssl rand -base64 32
```

### Google reCAPTCHA
1. Go to: https://www.google.com/recaptcha/admin
2. Create site for reCAPTCHA v3
3. Add domain: yourdomain.com
4. Copy: Site key and Secret key

### Stripe (Optional)
1. Go to: https://dashboard.stripe.com
2. Make sure: LIVE mode (not test)
3. Developers → API keys
4. Copy: Publishable key and Secret key
5. Developers → Webhooks
6. Create webhook for: https://yourdomain.com/api/payments/webhook
7. Copy: Signing secret

### VirusTotal (Optional)
1. Go to: https://www.virustotal.com
2. Sign up or log in
3. Profile → API key
4. Copy: API key

### Redis (Optional)
1. Go to: https://upstash.com
2. Create database
3. Copy: Connection URL

### Sentry (Optional)
1. Go to: https://sentry.io
2. Create project (Next.js)
3. Copy: DSN

### SendGrid (Optional)
1. Go to: https://sendgrid.com
2. Create API key
3. Copy: API key

---

## 🚀 Quick Setup Steps

### 1. Generate Secrets (2 minutes)

```bash
# Generate encryption key
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"
```

### 2. Gather Credentials (20 minutes)

- [ ] Supabase: URL, anon key, service role key, database URL
- [ ] AWS: Access key ID, secret access key, bucket name, region
- [ ] Google: reCAPTCHA site key, secret key
- [ ] Optional: Stripe, VirusTotal, Redis, Sentry, SendGrid

### 3. Add to Vercel (10 minutes)

1. Go to: https://vercel.com/dashboard
2. Select project
3. Settings → Environment Variables
4. Add each variable
5. Select "Production"
6. Click Save

### 4. Deploy (5 minutes)

```bash
vercel --prod
```

### 5. Test (10 minutes)

- [ ] Visit: https://yourdomain.com
- [ ] Upload file
- [ ] Download file
- [ ] Check dashboard

---

## 📝 Variable Checklist

### Supabase (4)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`

### AWS (4)
- [ ] `OBJECT_STORAGE_PROVIDER`
- [ ] `OBJECT_STORAGE_BUCKET`
- [ ] `OBJECT_STORAGE_REGION`
- [ ] `OBJECT_STORAGE_ACCESS_KEY_ID`
- [ ] `OBJECT_STORAGE_SECRET_ACCESS_KEY`

### Secrets (2)
- [ ] `ENCRYPTION_KEY`
- [ ] `JWT_SECRET`

### reCAPTCHA (2)
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- [ ] `RECAPTCHA_SECRET_KEY`

### Application (2)
- [ ] `NODE_ENV`
- [ ] `NEXT_PUBLIC_APP_URL`

### Optional
- [ ] Stripe (8 variables)
- [ ] VirusTotal (1 variable)
- [ ] Redis (1 variable)
- [ ] Sentry (1 variable)
- [ ] SendGrid (2 variables)

---

## 🔐 Security Checklist

- [ ] All secrets are in Vercel, not in code
- [ ] `.env.production` is in `.gitignore`
- [ ] No secrets are logged to console
- [ ] 2FA enabled on all accounts
- [ ] Secrets are unique for production
- [ ] Secrets are rotated regularly
- [ ] Access logs are monitored
- [ ] HTTPS is enabled everywhere

---

## 🆘 Troubleshooting

### Variables Not Working
1. Check Vercel dashboard for typos
2. Make sure variables are set to "Production"
3. Redeploy: `vercel --prod`

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

## 📚 Full Guides

For detailed information, see:
- `PRODUCTION_DEPLOYMENT_INDEX.md` - Master index
- `PRODUCTION_ENV_SETUP.md` - Detailed credential gathering
- `VERCEL_ENV_SETUP.md` - Vercel configuration
- `ENV_SETUP_CHECKLIST.md` - Progress tracking
- `DEPLOYMENT_COMMANDS.md` - Command reference

---

## ⏱️ Time Estimate

| Task | Time |
|------|------|
| Generate secrets | 2 min |
| Gather credentials | 20 min |
| Add to Vercel | 10 min |
| Deploy | 5 min |
| Test | 10 min |
| **Total** | **47 min** |

---

## 🎯 Next Steps

1. **Generate secrets** (2 min)
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   openssl rand -base64 32
   ```

2. **Gather credentials** (20 min)
   - Use the "Where to Get Each Variable" section above

3. **Add to Vercel** (10 min)
   - Go to Vercel dashboard
   - Settings → Environment Variables
   - Add each variable

4. **Deploy** (5 min)
   ```bash
   vercel --prod
   ```

5. **Test** (10 min)
   - Visit your production URL
   - Test all features

---

## 💡 Pro Tips

- Use a password manager to store secrets securely
- Generate new secrets for production (don't reuse development keys)
- Enable 2FA on all accounts
- Rotate secrets every 90 days
- Monitor access logs regularly
- Keep backups of important credentials
- Use Vercel's environment variables feature (not `.env` files)

---

## 📞 Support

- **Quick questions**: See this file
- **Detailed help**: See `PRODUCTION_ENV_SETUP.md`
- **Vercel help**: https://vercel.com/docs
- **Supabase help**: https://supabase.com/docs
- **AWS help**: https://docs.aws.amazon.com

---

**Status**: ✅ Ready for deployment  
**Time to deploy**: ~1 hour  
**Next action**: Start gathering credentials

Good luck! 🚀
