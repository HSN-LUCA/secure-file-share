# S3 Upload/Download Troubleshooting

## How the Upload/Download Flow Works

### Upload Flow
1. User selects file and enters share number (e.g., 1234)
2. File is encrypted locally
3. Encrypted file is uploaded to AWS S3 with key: `uploads/{year}/{month}/{day}/{uuid}`
4. File metadata is stored in Supabase database with:
   - `share_code`: The share number user entered
   - `s3_key`: The S3 storage location
   - `encryption_iv` and `encryption_auth_tag`: For decryption
5. User receives share code to download later

### Download Flow
1. User enters share code (e.g., 1234)
2. App queries database for file with matching `share_code`
3. If found, app retrieves `s3_key` from database
4. App downloads encrypted file from S3 using `s3_key`
5. App decrypts file using stored `encryption_iv` and `encryption_auth_tag`
6. File is returned to user

## Debugging Steps

### Step 1: Check if File is in Database

Run this SQL query in Supabase:

```sql
SELECT id, share_code, file_name, s3_key, expires_at, created_at 
FROM files 
ORDER BY created_at DESC 
LIMIT 10;
```

**If no files appear:**
- Upload failed at database level
- Check server logs for database errors
- Verify database connection is working

**If files appear:**
- Database is working
- Problem is likely with S3 storage

### Step 2: Check if File is in S3

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click on your bucket (`secure-file-share`)
3. Look for files in `uploads/{year}/{month}/{day}/` folders
4. Check the file size (should be larger than original due to encryption)

**If files appear in S3:**
- Upload to S3 is working
- Problem is likely with download/decryption

**If files don't appear in S3:**
- S3 credentials are wrong
- IAM user doesn't have PutObject permission
- Bucket name is wrong

### Step 3: Check Server Logs

Look for error messages in:
- Vercel deployment logs
- Browser console (F12 → Console tab)
- Network tab (F12 → Network tab) to see API responses

Common errors:
- `OBJECT_STORAGE_BUCKET environment variable is required` → Missing S3 config
- `Access Denied` → Wrong credentials or IAM permissions
- `NoSuchBucket` → Bucket doesn't exist or wrong name
- `InvalidAccessKeyId` → Wrong Access Key ID

### Step 4: Verify Environment Variables

Check that these are set correctly in Vercel:

```bash
# In Vercel Dashboard → Settings → Environment Variables
OBJECT_STORAGE_PROVIDER=aws-s3
OBJECT_STORAGE_BUCKET=secure-file-share
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
OBJECT_STORAGE_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### Step 5: Test S3 Connection

Add this temporary test endpoint to verify S3 is working:

Create `secure-file-share/app/api/test-s3/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getStorageConfig, createS3Client } from '@/lib/storage/config';
import { HeadBucketCommand } from '@aws-sdk/client-s3';

export async function GET(request: NextRequest) {
  try {
    const config = getStorageConfig();
    const client = createS3Client();
    
    const command = new HeadBucketCommand({
      Bucket: config.bucket,
    });
    
    await client.send(command);
    
    return NextResponse.json({
      success: true,
      message: 'S3 connection successful',
      config: {
        provider: config.provider,
        bucket: config.bucket,
        region: config.region,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

Then visit: `https://your-app.vercel.app/api/test-s3`

## Common Issues and Solutions

### Issue: "File not found" when downloading

**Cause:** File metadata not in database

**Solution:**
1. Check database query in Step 1
2. Verify share code is correct
3. Check if file has expired

### Issue: "Failed to download file" error

**Cause:** File in database but not in S3

**Solution:**
1. Check S3 bucket in Step 2
2. Verify S3 credentials are correct
3. Check IAM user has GetObject permission

### Issue: Upload succeeds but file not in S3

**Cause:** S3 credentials are wrong or IAM permissions missing

**Solution:**
1. Verify credentials in `.env.local` and Vercel
2. Check IAM user has `s3:PutObject` permission
3. Verify bucket name is correct

### Issue: "Access Denied" error

**Cause:** Wrong credentials or IAM permissions

**Solution:**
1. Regenerate Access Key ID and Secret Access Key
2. Verify IAM user has S3 permissions
3. Check bucket policy allows the IAM user

## Quick Fix Checklist

- [ ] S3 bucket created in AWS
- [ ] IAM user created with S3 permissions
- [ ] Access Key ID and Secret Access Key generated
- [ ] `.env.local` updated with credentials
- [ ] Vercel environment variables updated
- [ ] App redeployed to Vercel
- [ ] Test upload works
- [ ] File appears in S3 bucket
- [ ] Test download works
- [ ] File is decrypted correctly

## Need Help?

If you're still having issues:

1. Check the server logs in Vercel
2. Run the S3 connection test (Step 5)
3. Verify all environment variables are set
4. Check AWS IAM permissions
5. Verify bucket name and region match
