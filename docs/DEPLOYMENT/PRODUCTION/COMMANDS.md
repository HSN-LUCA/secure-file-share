# 🔧 Deployment Commands Reference

Quick command reference for production deployment.

---

## Generate Secrets

### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generate JWT Secret

```bash
openssl rand -base64 32
```

---

## Vercel Commands

### Deploy to Production

```bash
vercel --prod
```

### View Environment Variables

```bash
vercel env list
```

### Pull Environment Variables

```bash
vercel env pull .env.production.local
```

### Set Environment Variable

```bash
vercel env add VARIABLE_NAME
```

### View Deployment Logs

```bash
vercel logs
```

### View Real-time Logs

```bash
vercel logs --follow
```

### Redeploy Latest

```bash
vercel --prod --force
```

---

## Database Commands

### Initialize Database

```bash
npm run db:setup
```

### Check Database Health

```bash
npm run db:health-check
```

### Run Migrations

```bash
npm run db:migrate
```

### Backup Database

```bash
npm run db:backup
```

---

## Testing Commands

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Integration Tests

```bash
npm run test:integration
```

### Run Property-Based Tests

```bash
npm run test:pbt
```

---

## Build Commands

### Build Application

```bash
npm run build
```

### Start Development Server

```bash
npm run dev
```

### Start Production Server

```bash
npm start
```

---

## Linting & Formatting

### Run Linter

```bash
npm run lint
```

### Fix Linting Issues

```bash
npm run lint -- --fix
```

### Format Code

```bash
npm run format
```

### Check Types

```bash
npm run type-check
```

---

## Environment Setup

### Copy Environment Template

```bash
cp .env.example .env.local
```

### Validate Environment Variables

```bash
npm run env:validate
```

---

## Troubleshooting Commands

### Clear npm Cache

```bash
npm cache clean --force
```

### Reinstall Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

### Check Node Version

```bash
node --version
```

### Check npm Version

```bash
npm --version
```

---

## AWS S3 Commands

### List S3 Buckets

```bash
aws s3 ls
```

### List Bucket Contents

```bash
aws s3 ls s3://secure-file-share-prod
```

### Upload File to S3

```bash
aws s3 cp file.txt s3://secure-file-share-prod/
```

### Download File from S3

```bash
aws s3 cp s3://secure-file-share-prod/file.txt .
```

---

## Quick Deployment Checklist

```bash
# 1. Verify everything is ready
npm run build
npm test

# 2. Generate secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
openssl rand -base64 32

# 3. Add to Vercel (via dashboard)
# See VERCEL_SETUP.md

# 4. Deploy
vercel --prod

# 5. Verify deployment
vercel logs
curl https://yourdomain.com

# 6. Test application
# Visit https://yourdomain.com
# Test upload/download
# Check dashboard
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Generate encryption key | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| Generate JWT secret | `openssl rand -base64 32` |
| Deploy to production | `vercel --prod` |
| View logs | `vercel logs` |
| Check database | `npm run db:health-check` |
| Run tests | `npm test` |
| Build application | `npm run build` |
| Start dev server | `npm run dev` |
| List S3 buckets | `aws s3 ls` |
| View env variables | `vercel env list` |

---

Good luck! 🚀
