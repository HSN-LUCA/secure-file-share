# 🔧 Deployment Commands Reference

Quick command reference for production deployment.

---

## 📋 Table of Contents

1. [Generate Secrets](#generate-secrets)
2. [Vercel Commands](#vercel-commands)
3. [Database Commands](#database-commands)
4. [Testing Commands](#testing-commands)
5. [Troubleshooting Commands](#troubleshooting-commands)

---

## Generate Secrets

### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Output**: 64-character hex string  
**Use for**: `ENCRYPTION_KEY`

### Generate JWT Secret

```bash
openssl rand -base64 32
```

**Output**: Base64 string  
**Use for**: `JWT_SECRET`

### Generate Random String (Alternative)

```bash
openssl rand -hex 32
```

**Output**: 64-character hex string  
**Use for**: Any secret key

---

## Vercel Commands

### Login to Vercel

```bash
vercel login
```

### Link Project to Vercel

```bash
vercel link
```

### Deploy to Production

```bash
vercel --prod
```

### Deploy to Preview

```bash
vercel
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

### Remove Environment Variable

```bash
vercel env rm VARIABLE_NAME
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

### Seed Database

```bash
npm run db:seed
```

### Reset Database

```bash
npm run db:reset
```

### Backup Database

```bash
npm run db:backup
```

### Restore Database

```bash
npm run db:restore
```

---

## Testing Commands

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Specific Test File

```bash
npm test -- path/to/test.ts
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

### Run E2E Tests

```bash
npm run test:e2e
```

---

## Build Commands

### Build Application

```bash
npm run build
```

### Build and Start

```bash
npm run build && npm start
```

### Start Development Server

```bash
npm run dev
```

### Start Production Server

```bash
npm start
```

### Check Build Size

```bash
npm run build -- --analyze
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

### Copy Production Template

```bash
cp .env.production.template .env.production
```

### Validate Environment Variables

```bash
npm run env:validate
```

### List Environment Variables

```bash
npm run env:list
```

---

## Troubleshooting Commands

### Check Node Version

```bash
node --version
```

### Check npm Version

```bash
npm --version
```

### Clear npm Cache

```bash
npm cache clean --force
```

### Reinstall Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

### Check Disk Space

```bash
df -h
```

### Check Memory Usage

```bash
free -h
```

### View System Info

```bash
uname -a
```

---

## Git Commands

### Check Git Status

```bash
git status
```

### View Git Log

```bash
git log --oneline
```

### Create Git Tag

```bash
git tag -a v1.0.0 -m "Production release"
```

### Push Git Tag

```bash
git push origin v1.0.0
```

### View Remote URL

```bash
git remote -v
```

---

## Docker Commands (If Using)

### Build Docker Image

```bash
docker build -t secure-file-share:latest .
```

### Run Docker Container

```bash
docker run -p 3000:3000 secure-file-share:latest
```

### View Docker Images

```bash
docker images
```

### View Running Containers

```bash
docker ps
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

### Sync Directory to S3

```bash
aws s3 sync ./local-dir s3://secure-file-share-prod/
```

---

## Supabase Commands

### Connect to Supabase

```bash
supabase link --project-ref [PROJECT-ID]
```

### Pull Remote Schema

```bash
supabase db pull
```

### Push Local Schema

```bash
supabase db push
```

### Create Migration

```bash
supabase migration new [migration-name]
```

### View Migrations

```bash
supabase migration list
```

---

## Monitoring Commands

### View Application Logs

```bash
npm run logs
```

### View Error Logs

```bash
npm run logs:errors
```

### View Performance Metrics

```bash
npm run metrics
```

### View Database Metrics

```bash
npm run db:metrics
```

---

## Deployment Script

### Run Automated Deployment

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Run with Specific Environment

```bash
./scripts/deploy.sh --env production
```

### Run with Specific Region

```bash
./scripts/deploy.sh --region us-east-1
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
# See VERCEL_ENV_SETUP.md

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

## Common Issues & Solutions

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Tests Fail

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test
npm test -- path/to/test.ts
```

### Database Connection Fails

```bash
# Check database health
npm run db:health-check

# Verify connection string
echo $DATABASE_URL
```

### Deployment Fails

```bash
# Check Vercel logs
vercel logs

# Redeploy
vercel --prod --force
```

---

## Environment Variable Commands

### Add Variable to Vercel

```bash
vercel env add VARIABLE_NAME
# Then enter the value when prompted
```

### Remove Variable from Vercel

```bash
vercel env rm VARIABLE_NAME
```

### List All Variables

```bash
vercel env list
```

### Pull Variables Locally

```bash
vercel env pull .env.production.local
```

---

## Performance Commands

### Analyze Bundle Size

```bash
npm run build -- --analyze
```

### Check Performance

```bash
npm run performance
```

### Profile Application

```bash
npm run profile
```

---

## Security Commands

### Check for Vulnerabilities

```bash
npm audit
```

### Fix Vulnerabilities

```bash
npm audit fix
```

### Check for Secrets in Git

```bash
git log -p | grep -i "password\|secret\|key"
```

### Scan for Exposed Secrets

```bash
npm run security:scan
```

---

## Backup & Recovery

### Backup Database

```bash
npm run db:backup
```

### Restore Database

```bash
npm run db:restore
```

### Backup Files

```bash
aws s3 sync s3://secure-file-share-prod ./backup/
```

### Restore Files

```bash
aws s3 sync ./backup/ s3://secure-file-share-prod
```

---

## Useful Aliases

Add these to your `.bashrc` or `.zshrc`:

```bash
# Deployment
alias deploy="vercel --prod"
alias deploy-preview="vercel"
alias deploy-logs="vercel logs"

# Testing
alias test="npm test"
alias test-watch="npm test -- --watch"
alias test-coverage="npm test -- --coverage"

# Database
alias db-setup="npm run db:setup"
alias db-health="npm run db:health-check"
alias db-migrate="npm run db:migrate"

# Development
alias dev="npm run dev"
alias build="npm run build"
alias lint="npm run lint"
alias format="npm run format"

# Git
alias gs="git status"
alias gl="git log --oneline"
alias gp="git push"
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

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **AWS Docs**: https://docs.aws.amazon.com
- **npm Docs**: https://docs.npmjs.com

---

Good luck! 🚀
