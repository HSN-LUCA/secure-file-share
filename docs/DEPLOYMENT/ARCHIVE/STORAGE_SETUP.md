# Object Storage Setup Guide

This guide covers setting up AWS S3 or Cloudflare R2 for the Secure File Share application.

## Table of Contents

1. [Overview](#overview)
2. [AWS S3 Setup](#aws-s3-setup)
3. [Cloudflare R2 Setup](#cloudflare-r2-setup)
4. [Configuration](#configuration)
5. [Encryption](#encryption)
6. [Auto-Expiration Policies](#auto-expiration-policies)
7. [CLI Commands](#cli-commands)
8. [Troubleshooting](#troubleshooting)

## Overview

The application supports two object storage providers:

- **AWS S3**: Industry standard, widely used, pay-per-request pricing
- **Cloudflare R2**: S3-compatible, unlimited requests, lower costs

### Key Features

- ✅ File encryption at rest (AES-256-GCM)
- ✅ Automatic expiration policies (20 min for free, 24h for paid)
- ✅ Secure file upload/download
- ✅ Metadata tracking
- ✅ Storage statistics

## AWS S3 Setup

### Step 1: Create AWS Account

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Sign up or log in
3. Navigate to S3 service

### Step 2: Create S3 Bucket

1. Click "Create bucket"
2. Enter bucket name: `secure-file-share-{your-name}`
3. Select region: `us-east-1` (or your preferred region)
4. **Block Public Access**: Keep all settings enabled (checked)
5. Click "Create bucket"

### Step 3: Create IAM User

1. Go to IAM service
2. Click "Users" → "Create user"
3. Enter username: `secure-file-share-app`
4. Click "Next"
5. Click "Attach policies directly"
6. Search for and select: `AmazonS3FullAccess`
7. Click "Next" → "Create user"

### Step 4: Create Access Keys

1. Click on the user you just created
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Select "Application running outside AWS"
5. Click "Next"
6. Copy the **Access Key ID** and **Secret Access Key**
7. Store these securely

### Step 5: Configure Environment Variables

Add to `.env.local`:

```env
OBJECT_STORAGE_PROVIDER=aws-s3
OBJECT_STORAGE_BUCKET=secure-file-share-{your-name}
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
OBJECT_STORAGE_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
OBJECT_STORAGE_ENDPOINT=https://s3.amazonaws.com
```

### Step 6: Enable Versioning (Optional)

For better data protection:

1. Go to S3 bucket
2. Click "Properties"
3. Find "Versioning"
4. Click "Edit"
5. Select "Enable"
6. Click "Save changes"

## Cloudflare R2 Setup

### Step 1: Create Cloudflare Account

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Sign up or log in
3. Navigate to R2 service

### Step 2: Create R2 Bucket

1. Click "Create bucket"
2. Enter bucket name: `secure-file-share`
3. Click "Create bucket"

### Step 3: Create API Token

1. Go to "Account Settings" → "API Tokens"
2. Click "Create API Token"
3. Select "Edit Cloudflare Workers" template
4. Or create custom token with R2 permissions:
   - `Account.R2.Buckets.Read`
   - `Account.R2.Buckets.Write`
   - `Account.R2.Buckets.List`
5. Click "Continue to summary"
6. Click "Create Token"
7. Copy the token

### Step 4: Create R2 API Token (Alternative)

If using R2 API Token instead of Cloudflare API Token:

1. Go to R2 bucket settings
2. Click "API Tokens"
3. Click "Create API Token"
4. Select "Read and Write" permissions
5. Copy the token

### Step 5: Get R2 Endpoint

1. Go to R2 bucket settings
2. Find "S3 API" section
3. Copy the endpoint URL (format: `https://abc123.r2.cloudflarestorage.com`)

### Step 6: Configure Environment Variables

Add to `.env.local`:

```env
OBJECT_STORAGE_PROVIDER=cloudflare-r2
OBJECT_STORAGE_BUCKET=secure-file-share
OBJECT_STORAGE_REGION=auto
OBJECT_STORAGE_ENDPOINT=https://abc123.r2.cloudflarestorage.com
OBJECT_STORAGE_ACCESS_KEY_ID=your_access_key_id
OBJECT_STORAGE_SECRET_ACCESS_KEY=your_secret_access_key
```

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OBJECT_STORAGE_PROVIDER` | Yes | Storage provider | `aws-s3` or `cloudflare-r2` |
| `OBJECT_STORAGE_BUCKET` | Yes | Bucket name | `secure-file-share` |
| `OBJECT_STORAGE_REGION` | Yes | AWS region or `auto` for R2 | `us-east-1` or `auto` |
| `OBJECT_STORAGE_ACCESS_KEY_ID` | Yes | Access key | `AKIA...` |
| `OBJECT_STORAGE_SECRET_ACCESS_KEY` | Yes | Secret key | `wJalr...` |
| `OBJECT_STORAGE_ENDPOINT` | No | Custom endpoint | `https://s3.amazonaws.com` |
| `ENCRYPTION_KEY` | Yes | 256-bit encryption key (hex) | `a1b2c3d4...` |

### Generating Encryption Key

Generate a new encryption key:

```bash
npm run storage:generate-key
```

This will output a 256-bit key in hex format. Add it to `.env.local`:

```env
ENCRYPTION_KEY=your_generated_key_here
```

### Validating Configuration

Validate your encryption key:

```bash
npm run storage:validate-key your_key_here
```

## Encryption

### How It Works

Files are encrypted using **AES-256-GCM** before being uploaded to storage:

1. **Encryption**: File data → AES-256-GCM → Encrypted data
2. **Storage**: Encrypted data stored in S3/R2
3. **Download**: Encrypted data → AES-256-GCM → Original file
4. **Authentication**: GCM mode provides authenticity verification

### Key Management

- **Development**: Use environment variable
- **Production**: Use AWS KMS or Cloudflare Key Management
- **Rotation**: Implement key rotation policy

### Security Considerations

- ✅ AES-256 encryption (256-bit keys)
- ✅ GCM mode (authenticated encryption)
- ✅ Random IV for each file
- ✅ Authentication tag verification
- ✅ HTTPS for all transfers

## Auto-Expiration Policies

### How It Works

S3/R2 lifecycle policies automatically delete files after expiration:

- **Free Plan**: 20 minutes
- **Paid Plan**: 24 hours
- **Enterprise**: 30 days (configurable)

### Setting Up Policies

Initialize storage with policies:

```bash
npm run storage:init
```

This will:
1. Validate configuration
2. Test connection
3. Set up lifecycle policies
4. Verify policies are active

### Verifying Policies

Check if policies are configured:

```bash
npm run storage:verify
```

### Policy Details

Policies are configured in `lib/storage/expiration.ts`:

```typescript
{
  id: 'free-plan-expiration',
  prefix: 'uploads/free/',
  expirationDays: 1,
  description: 'Free plan files expire after 20 minutes'
}
```

## CLI Commands

### Initialize Storage

```bash
npm run storage:init
```

Initializes object storage and sets up expiration policies.

**Output:**
```
📦 Initializing Object Storage

  ✓ Validating configuration...
    Provider: AWS S3
    Bucket: secure-file-share
    Region: us-east-1
  ✓ Testing connection...
    Connection successful
  ✓ Setting up expiration policies...
    Policies configured
  ✓ Verifying policies...
    3 policies active

✅ Storage initialized successfully!
```

### Verify Storage

```bash
npm run storage:verify
```

Verifies storage configuration and connection.

### Check Storage Status

```bash
npm run storage:status
```

Shows current storage status and configuration.

### Generate Encryption Key

```bash
npm run storage:generate-key
```

Generates a new 256-bit encryption key.

### Validate Encryption Key

```bash
npm run storage:validate-key <key>
```

Validates an encryption key format.

## Usage Examples

### Upload File

```typescript
import { uploadFile } from '@/lib/storage';

const fileData = Buffer.from('file content');
const result = await uploadFile('file-uuid', fileData, {
  contentType: 'application/pdf',
  expirationMinutes: 20,
  metadata: {
    'original-name': 'document.pdf',
  },
});

console.log(result.key); // uploads/2024/01/30/file-uuid
console.log(result.encryptionData); // { encrypted, iv, authTag }
```

### Download File

```typescript
import { downloadFile } from '@/lib/storage';

const result = await downloadFile(s3Key, encryptionData);
console.log(result.data); // Decrypted file buffer
console.log(result.contentType); // application/pdf
```

### Delete File

```typescript
import { deleteFile } from '@/lib/storage';

await deleteFile(s3Key);
```

### Check File Exists

```typescript
import { fileExists } from '@/lib/storage';

const exists = await fileExists(s3Key);
```

### Get File Metadata

```typescript
import { getFileMetadata } from '@/lib/storage';

const metadata = await getFileMetadata(s3Key);
console.log(metadata.size); // File size in bytes
console.log(metadata.uploadedAt); // Upload timestamp
console.log(metadata.expiresAt); // Expiration timestamp
```

## Troubleshooting

### Connection Failed

**Error**: `Failed to connect to bucket`

**Solutions**:
1. Verify bucket name is correct
2. Check access key and secret key
3. Verify IAM permissions
4. Check region is correct
5. For R2, verify endpoint URL

### Invalid Credentials

**Error**: `InvalidAccessKeyId` or `SignatureDoesNotMatch`

**Solutions**:
1. Verify access key ID
2. Verify secret access key
3. Check for extra spaces or characters
4. Regenerate credentials if needed

### Encryption Key Error

**Error**: `ENCRYPTION_KEY must be 64 hex characters`

**Solutions**:
1. Generate new key: `npm run storage:generate-key`
2. Verify key is 64 hex characters (32 bytes)
3. Check for spaces or invalid characters

### Lifecycle Policy Error

**Error**: `Failed to set up expiration policies`

**Solutions**:
1. Verify bucket exists
2. Check IAM permissions include `s3:PutLifecycleConfiguration`
3. For R2, verify API token has correct permissions
4. Try running `npm run storage:init` again

### File Not Found

**Error**: `File not found in storage`

**Solutions**:
1. Verify file key is correct
2. Check if file has expired
3. Verify bucket name
4. Check S3/R2 console for file

### Encryption/Decryption Error

**Error**: `Decryption failed` or `Authentication tag verification failed`

**Solutions**:
1. Verify encryption key hasn't changed
2. Verify IV and auth tag are correct
3. Check file wasn't corrupted during transfer
4. Verify file is encrypted (check metadata)

## Best Practices

### Security

- ✅ Use strong encryption keys
- ✅ Rotate keys regularly
- ✅ Use HTTPS for all transfers
- ✅ Enable bucket versioning
- ✅ Enable access logging
- ✅ Use IAM roles instead of access keys when possible

### Performance

- ✅ Use multipart upload for large files
- ✅ Enable CloudFront CDN for downloads
- ✅ Use S3 Transfer Acceleration
- ✅ Monitor request rates
- ✅ Use appropriate storage class

### Cost Optimization

- ✅ Use lifecycle policies for cleanup
- ✅ Use Cloudflare R2 for unlimited requests
- ✅ Monitor storage usage
- ✅ Archive old files
- ✅ Use S3 Intelligent-Tiering

### Monitoring

- ✅ Enable CloudWatch metrics
- ✅ Set up alerts for errors
- ✅ Monitor storage usage
- ✅ Track request patterns
- ✅ Review access logs

## Next Steps

1. ✅ Configure object storage (AWS S3 or Cloudflare R2)
2. ✅ Set up encryption
3. ✅ Initialize storage and policies
4. Next: Task 1.5 - Set up environment variables and secrets management
5. Next: Task 1.6 - Configure Vercel deployment pipeline
6. Next: Task 3 - File Upload API implementation

## Support

For issues or questions:

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Project Issues](https://github.com/your-repo/issues)
