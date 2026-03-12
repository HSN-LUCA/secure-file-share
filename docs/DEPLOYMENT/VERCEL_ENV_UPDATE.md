# Update Vercel Environment Variables for S3

## Quick Steps

### Option 1: Update via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **share-file**
3. Click **Settings** → **Environment Variables**
4. Add or update these variables:

| Variable Name | Value |
|---|---|
| `OBJECT_STORAGE_PROVIDER` | `aws-s3` |
| `OBJECT_STORAGE_BUCKET` | `t-share-file` |
| `OBJECT_STORAGE_REGION` | `us-east-1` |
| `OBJECT_STORAGE_ACCESS_KEY_ID` | Your AWS Access Key ID |
| `OBJECT_STORAGE_SECRET_ACCESS_KEY` | Your AWS Secret Access Key |
| `OBJECT_STORAGE_ENDPOINT` | `https://s3.amazonaws.com` |

5. For each variable:
   - Click **Add New**
   - Enter the variable name
   - Enter the value
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

6. After adding all variables, redeploy your project:
   - Go to **Deployments**
   - Click the three dots on the latest deployment
   - Select **Redeploy**

### Option 2: Update via Vercel CLI

If you have Vercel CLI installed:

```bash
cd secure-file-share

# Set each environment variable
vercel env add OBJECT_STORAGE_PROVIDER
# Enter: aws-s3

vercel env add OBJECT_STORAGE_BUCKET
# Enter: t-share-file

vercel env add OBJECT_STORAGE_REGION
# Enter: us-east-1

vercel env add OBJECT_STORAGE_ACCESS_KEY_ID
# Enter: Your AWS Access Key ID

vercel env add OBJECT_STORAGE_SECRET_ACCESS_KEY
# Enter: Your AWS Secret Access Key

vercel env add OBJECT_STORAGE_ENDPOINT
# Enter: https://s3.amazonaws.com

# Redeploy
vercel --prod
```

## Verify Configuration

After updating environment variables:

1. Wait for Vercel to redeploy (check Deployments tab)
2. Once deployment is complete, test the app:
   - Upload a file with a share number (e.g., 1234)
   - Check if you get a success response
   - Try downloading with the share code
   - Verify file appears in S3 bucket

## Troubleshooting

### Variables not taking effect
- Ensure you selected all environments (Production, Preview, Development)
- Wait for deployment to complete
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Still getting "File not found" on download
- Check S3 bucket in AWS console
- Verify credentials are correct
- Check IAM user has S3 permissions

### "Access Denied" errors
- Verify Access Key ID and Secret Access Key are correct
- Check IAM user has `s3:GetObject` and `s3:PutObject` permissions

## Next Steps

1. ✅ Update Vercel environment variables (this guide)
2. ✅ Redeploy the app
3. Test upload/download functionality
4. Monitor S3 bucket for uploaded files
5. Check Vercel logs if issues occur

## Environment Variables Summary

Your S3 configuration:
- **Provider**: AWS S3
- **Bucket**: t-share-file
- **Region**: us-east-1
- **Access Key**: [Your AWS Access Key ID]
- **Endpoint**: https://s3.amazonaws.com

> **Note**: Keep your AWS credentials secure. Never commit them to version control. Use Vercel's environment variables to store sensitive data.

Files will be stored in S3 at: `uploads/{year}/{month}/{day}/{uuid}`

Example: `uploads/2024/01/30/550e8400-e29b-41d4-a716-446655440000`
