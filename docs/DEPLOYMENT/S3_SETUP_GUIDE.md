# AWS S3 Configuration Guide

## Problem
Files are not being saved or retrieved because AWS S3 credentials are not configured. The app currently has placeholder values in `.env.local`.

## Solution: Configure AWS S3

### Step 1: Create AWS S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. Enter bucket name: `secure-file-share` (or your preferred name)
4. Choose region: `us-east-1` (or your preferred region)
5. Block all public access (keep defaults)
6. Click "Create bucket"

### Step 2: Create IAM User for S3 Access

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Enter username: `secure-file-share-app`
4. Click "Next"
5. Click "Attach policies directly"
6. Search for and select: `AmazonS3FullAccess` (or create custom policy below)
7. Click "Next" → "Create user"

### Step 3: Create Access Keys

1. Click on the newly created user
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Select "Application running outside AWS"
5. Click "Next"
6. Copy the **Access Key ID** and **Secret Access Key**
7. Store these securely

### Step 4: Update Environment Variables

Update `.env.local` with your actual credentials:

```env
OBJECT_STORAGE_PROVIDER="aws-s3"
OBJECT_STORAGE_BUCKET="secure-file-share"
OBJECT_STORAGE_REGION="us-east-1"
OBJECT_STORAGE_ACCESS_KEY_ID="YOUR_ACCESS_KEY_ID"
OBJECT_STORAGE_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
OBJECT_STORAGE_ENDPOINT="https://s3.amazonaws.com"
```

### Step 5: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add/update these variables:
   - `OBJECT_STORAGE_ACCESS_KEY_ID`
   - `OBJECT_STORAGE_SECRET_ACCESS_KEY`
   - `OBJECT_STORAGE_BUCKET`
   - `OBJECT_STORAGE_REGION`

### Step 6: Test the Configuration

1. Restart your app (or redeploy to Vercel)
2. Try uploading a file
3. Check AWS S3 console to verify the file appears in the bucket
4. Try downloading the file using the share code

## Custom IAM Policy (Optional)

If you want to restrict permissions, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::secure-file-share",
        "arn:aws:s3:::secure-file-share/*"
      ]
    }
  ]
}
```

## Troubleshooting

### Files not appearing in S3
- Check that credentials are correct
- Verify bucket name matches
- Check IAM user has S3 permissions
- Look at server logs for errors

### Download fails
- Verify file exists in S3 bucket
- Check encryption keys are correct
- Ensure IAM user has GetObject permission

### "Access Denied" errors
- Verify Access Key ID and Secret Access Key
- Check IAM user has correct permissions
- Ensure bucket policy allows the IAM user

## Alternative: Use Cloudflare R2

If you prefer Cloudflare R2 instead of AWS S3:

```env
OBJECT_STORAGE_PROVIDER="cloudflare-r2"
OBJECT_STORAGE_BUCKET="secure-file-share"
OBJECT_STORAGE_ACCESS_KEY_ID="YOUR_R2_ACCESS_KEY"
OBJECT_STORAGE_SECRET_ACCESS_KEY="YOUR_R2_SECRET_KEY"
OBJECT_STORAGE_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
```

See [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/) for setup instructions.
