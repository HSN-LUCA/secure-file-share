# Environment Variables Setup Guide

This guide explains how to set up and configure environment variables for the Secure File Share application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables Reference](#environment-variables-reference)
3. [Development Setup](#development-setup)
4. [Staging Setup](#staging-setup)
5. [Production Setup](#production-setup)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Copy the Template

```bash
cp .env.local.template .env.local
```

### 2. Fill in Required Values

Edit `.env.local` and fill in the values for your environment. See [Environment Variables Reference](#environment-variables-reference) for details.

### 3. Verify Configuration

```bash
npm run env:validate
```

### 4. Start Development

```bash
npm run dev
```

## Environment Variables Reference

### Application Settings

#### `NODE_ENV`
- **Type**: `development` | `staging` | `production`
- **Default**: `development`
- **Description**: Specifies the application environment
- **Example**: `NODE_ENV=development`

#### `NEXT_PUBLIC_APP_URL`
- **Type**: URL string
- **Description**: The public URL of the application (used for redirects, emails, etc.)
- **Example**: `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- **Note**: Must be a valid URL starting with `http://` or `https://`

### Database - Supabase

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Type**: URL string
- **Description**: Supabase project URL
- **How to get**: 
  1. Go to https://app.supabase.com
  2. Select your project
  3. Go to Settings → API
  4. Copy the "Project URL"
- **Example**: `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co`

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Type**: String
- **Description**: Supabase anonymous key (safe to expose to frontend)
- **How to get**:
  1. Go to https://app.supabase.com
  2. Select your project
  3. Go to Settings → API
  4. Copy the "anon public" key
- **Example**: `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...`

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Type**: String
- **Description**: Supabase service role key (KEEP SECRET - backend only)
- **How to get**:
  1. Go to https://app.supabase.com
  2. Select your project
  3. Go to Settings → API
  4. Copy the "service_role secret" key
- **Example**: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...`
- **⚠️ IMPORTANT**: Never expose this key to the frontend or commit to version control

### Database - Direct Connection (Optional)

#### `DATABASE_URL`
- **Type**: PostgreSQL connection string
- **Description**: Direct PostgreSQL connection URL (optional, for connection pooling)
- **Format**: `postgresql://user:password@host:port/database`
- **Example**: `DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres`
- **Note**: Only needed if using direct database connection pooling

### Database - Connection Pool Configuration

#### `DB_POOL_MAX`
- **Type**: Number
- **Default**: `20`
- **Description**: Maximum number of connections in the pool
- **Example**: `DB_POOL_MAX=20`

#### `DB_POOL_MIN`
- **Type**: Number
- **Default**: `2`
- **Description**: Minimum number of connections in the pool
- **Example**: `DB_POOL_MIN=2`

#### `DB_IDLE_TIMEOUT`
- **Type**: Number (milliseconds)
- **Default**: `30000`
- **Description**: How long before idle connections are closed
- **Example**: `DB_IDLE_TIMEOUT=30000`

#### `DB_CONNECTION_TIMEOUT`
- **Type**: Number (milliseconds)
- **Default**: `2000`
- **Description**: How long to wait for a connection
- **Example**: `DB_CONNECTION_TIMEOUT=2000`

### Object Storage

#### `OBJECT_STORAGE_PROVIDER`
- **Type**: `aws-s3` | `cloudflare-r2`
- **Default**: `aws-s3`
- **Description**: Which object storage provider to use
- **Example**: `OBJECT_STORAGE_PROVIDER=aws-s3`

#### `OBJECT_STORAGE_BUCKET`
- **Type**: String
- **Description**: S3 bucket name
- **Example**: `OBJECT_STORAGE_BUCKET=secure-file-share`

#### `OBJECT_STORAGE_REGION`
- **Type**: String
- **Description**: AWS region (e.g., us-east-1, eu-west-1)
- **Example**: `OBJECT_STORAGE_REGION=us-east-1`
- **Common regions**:
  - `us-east-1` - US East (N. Virginia)
  - `eu-west-1` - EU (Ireland)
  - `ap-southeast-1` - Asia Pacific (Singapore)

#### `OBJECT_STORAGE_ACCESS_KEY_ID`
- **Type**: String
- **Description**: AWS S3 access key ID
- **How to get**:
  1. Go to https://console.aws.amazon.com/iam/home#/security_credentials
  2. Create a new access key
  3. Copy the "Access Key ID"
- **Example**: `OBJECT_STORAGE_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE`
- **⚠️ IMPORTANT**: Keep this secret

#### `OBJECT_STORAGE_SECRET_ACCESS_KEY`
- **Type**: String
- **Description**: AWS S3 secret access key (KEEP SECRET)
- **How to get**:
  1. Go to https://console.aws.amazon.com/iam/home#/security_credentials
  2. Create a new access key
  3. Copy the "Secret Access Key"
- **Example**: `OBJECT_STORAGE_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **⚠️ IMPORTANT**: Never expose this key

#### `OBJECT_STORAGE_ENDPOINT`
- **Type**: URL string
- **Default**: `https://s3.amazonaws.com`
- **Description**: S3 endpoint (for custom S3-compatible services)
- **Examples**:
  - AWS S3: `https://s3.amazonaws.com`
  - Cloudflare R2: `https://[account-id].r2.cloudflarestorage.com`
  - MinIO: `http://localhost:9000`

### File Encryption

#### `ENCRYPTION_KEY`
- **Type**: 64-character hex string (256-bit key)
- **Description**: AES-256 encryption key for file encryption
- **How to generate**:
  ```bash
  npm run storage:generate-key
  ```
- **Format**: Must be exactly 64 hexadecimal characters (0-9, a-f)
- **Example**: `ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`
- **⚠️ IMPORTANT**: 
  - Keep this secret
  - Never change this key in production (files won't be decryptable)
  - Store in a secure secrets manager

### Virus Scanning

#### `VIRUS_SCANNER_TYPE`
- **Type**: `clamav` | `virustotal`
- **Default**: `clamav`
- **Description**: Which virus scanner to use
- **Example**: `VIRUS_SCANNER_TYPE=clamav`

#### `VIRUS_SCANNER_API_KEY`
- **Type**: String
- **Description**: Virus scanner API key
- **For ClamAV**: Not needed if using local ClamAV daemon
- **For VirusTotal**:
  1. Go to https://www.virustotal.com/gui/home/upload
  2. Sign up for a free account
  3. Get your API key from the settings
- **Example**: `VIRUS_SCANNER_API_KEY=your_api_key_here`

### reCAPTCHA v3

#### `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- **Type**: String
- **Description**: reCAPTCHA site key (safe to expose to frontend)
- **How to get**:
  1. Go to https://www.google.com/recaptcha/admin
  2. Create a new site
  3. Select reCAPTCHA v3
  4. Copy the "Site Key"
- **Example**: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`

#### `RECAPTCHA_SECRET_KEY`
- **Type**: String
- **Description**: reCAPTCHA secret key (KEEP SECRET - backend only)
- **How to get**:
  1. Go to https://www.google.com/recaptcha/admin
  2. Select your site
  3. Copy the "Secret Key"
- **Example**: `RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`
- **⚠️ IMPORTANT**: Never expose this key to the frontend

### JWT Authentication

#### `JWT_SECRET`
- **Type**: String (minimum 32 characters)
- **Description**: Secret key for signing JWT tokens
- **How to generate**:
  ```bash
  openssl rand -base64 32
  ```
- **Example**: `JWT_SECRET=your_jwt_secret_key_min_32_characters_long_here`
- **⚠️ IMPORTANT**: 
  - Must be at least 32 characters
  - Keep this secret
  - Never change in production (existing tokens won't be valid)

### Stripe Payments (Optional)

#### `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Type**: String
- **Description**: Stripe publishable key (safe to expose to frontend)
- **How to get**:
  1. Go to https://dashboard.stripe.com/apikeys
  2. Copy the "Publishable key"
- **Example**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key`

#### `STRIPE_SECRET_KEY`
- **Type**: String
- **Description**: Stripe secret key (KEEP SECRET - backend only)
- **How to get**:
  1. Go to https://dashboard.stripe.com/apikeys
  2. Copy the "Secret key"
- **Example**: `STRIPE_SECRET_KEY=sk_test_your_secret_key`
- **⚠️ IMPORTANT**: Never expose this key

#### `STRIPE_WEBHOOK_SECRET`
- **Type**: String
- **Description**: Stripe webhook secret (KEEP SECRET)
- **How to get**:
  1. Go to https://dashboard.stripe.com/webhooks
  2. Create a new webhook endpoint
  3. Copy the "Signing secret"
- **Example**: `STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret`
- **⚠️ IMPORTANT**: Keep this secret

### Redis (Optional)

#### `REDIS_URL`
- **Type**: URL string
- **Description**: Redis connection URL (for rate limiting and caching)
- **Examples**:
  - Local: `redis://localhost:6379`
  - Upstash: `redis://default:[password]@[host]:[port]`
- **Note**: Optional for MVP, required for production rate limiting

## Development Setup

### 1. Create `.env.local`

```bash
cp .env.local.template .env.local
```

### 2. Set Up Supabase

1. Go to https://app.supabase.com
2. Create a new project (free tier available)
3. Copy the URL and keys to `.env.local`

### 3. Set Up AWS S3

1. Create an AWS account (free tier available)
2. Create an S3 bucket
3. Create IAM credentials with S3 access
4. Copy the credentials to `.env.local`

### 4. Generate Encryption Key

```bash
npm run storage:generate-key
```

Copy the generated key to `ENCRYPTION_KEY` in `.env.local`.

### 5. Set Up reCAPTCHA (Optional)

1. Go to https://www.google.com/recaptcha/admin
2. Create a new site
3. Use test keys for development
4. Copy the keys to `.env.local`

### 6. Verify Configuration

```bash
npm run env:validate
```

### 7. Start Development

```bash
npm run dev
```

## Staging Setup

### 1. Create `.env.staging`

Copy `.env.example` to `.env.staging` and fill in staging values.

### 2. Use Production-like Services

- Use production Supabase project (or separate staging project)
- Use production AWS S3 bucket (or separate staging bucket)
- Use production reCAPTCHA keys (or separate staging keys)

### 3. Enable All Security Features

- Set `enableRateLimiting: true`
- Set `enableCaptcha: true`
- Set `enableVirusScanning: true`

### 4. Set Up Monitoring

- Enable error tracking
- Enable metrics collection
- Set up alerts

## Production Setup

### 1. Use Secure Secrets Manager

Never store secrets in `.env` files in production. Use:

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Cloud Secret Manager**
- **Vercel Environment Variables** (for Vercel deployments)

### 2. Set Environment Variables

Set all environment variables in your deployment platform:

```bash
# Example for Vercel
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OBJECT_STORAGE_SECRET_ACCESS_KEY
# ... etc
```

### 3. Enable All Security Features

- Set `NODE_ENV=production`
- Enable rate limiting
- Enable CAPTCHA
- Enable virus scanning
- Enable monitoring and alerting

### 4. Use Production Services

- Use production Supabase project
- Use production AWS S3 bucket
- Use production reCAPTCHA keys
- Use production Stripe keys

### 5. Security Checklist

- [ ] All secrets are stored in a secure secrets manager
- [ ] `.env.local` is in `.gitignore` and never committed
- [ ] All API keys are rotated regularly
- [ ] Database credentials are strong and unique
- [ ] Encryption keys are securely generated and stored
- [ ] HTTPS is enabled for all connections
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Monitoring and alerting are configured
- [ ] Backup and disaster recovery procedures are in place

## Security Best Practices

### 1. Never Commit Secrets

Add to `.gitignore`:

```
.env.local
.env.*.local
.env.production
```

### 2. Use Environment-Specific Files

- `.env.local` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment (use secrets manager instead)

### 3. Rotate Secrets Regularly

- Rotate API keys every 90 days
- Rotate encryption keys when necessary
- Rotate JWT secrets when necessary

### 4. Use Strong Secrets

- Minimum 32 characters for JWT secret
- Use cryptographically secure random generation
- Use unique secrets for each environment

### 5. Limit Secret Access

- Only expose necessary secrets to each service
- Use IAM roles and policies to limit access
- Audit secret access logs

### 6. Monitor Secret Usage

- Log all secret access
- Alert on suspicious access patterns
- Rotate secrets if compromised

## Troubleshooting

### "Environment validation failed"

**Problem**: Environment variables are missing or invalid.

**Solution**:
1. Check `.env.local` exists
2. Run `npm run env:validate` to see which variables are missing
3. Fill in missing values
4. Restart the development server

### "Cannot find module 'zod'"

**Problem**: Zod is not installed.

**Solution**:
```bash
npm install zod
```

### "Invalid encryption key"

**Problem**: Encryption key is not a valid 64-character hex string.

**Solution**:
1. Generate a new key: `npm run storage:generate-key`
2. Copy the generated key to `ENCRYPTION_KEY`

### "Supabase connection failed"

**Problem**: Cannot connect to Supabase.

**Solution**:
1. Check `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Check internet connection
4. Check Supabase project is active

### "S3 access denied"

**Problem**: Cannot access S3 bucket.

**Solution**:
1. Check `OBJECT_STORAGE_ACCESS_KEY_ID` is correct
2. Check `OBJECT_STORAGE_SECRET_ACCESS_KEY` is correct
3. Check IAM user has S3 permissions
4. Check bucket name is correct

### "reCAPTCHA verification failed"

**Problem**: reCAPTCHA verification is failing.

**Solution**:
1. Check `RECAPTCHA_SECRET_KEY` is correct
2. Check reCAPTCHA site is configured correctly
3. Check domain is whitelisted in reCAPTCHA settings

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
