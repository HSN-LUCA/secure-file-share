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

### AWS (5)
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

---

## 🔐 Security Checklist

- [ ] All secrets are in Vercel, not in code
- [ ] `.env.production` is in `.gitignore`
- [ ] No secrets are logged to console
- [ ] 2FA enabled on all accounts
- [ ] Secrets are unique for production
- [ ] Secrets are rotated regularly

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
2. **Gather credentials** (20 min)
3. **Add to Vercel** (10 min)
4. **Deploy** (5 min)
5. **Test** (10 min)

---

**Status**: ✅ Ready for deployment  
**Time to deploy**: ~1 hour  
**Next action**: Start gathering credentials

Good luck! 🚀
