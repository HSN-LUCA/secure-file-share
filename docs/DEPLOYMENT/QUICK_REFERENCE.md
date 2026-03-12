# Quick Reference - File Upload & Download

## How to Use the App

### Uploading a File

1. Go to the upload page
2. Select a file to upload
3. **Optional**: Enter a share number (any positive number)
   - If you enter a number → That becomes your share code
   - If you leave it blank → System generates a random code
4. Complete CAPTCHA verification
5. Click Upload
6. **Save the share code** shown in the response

### Downloading a File

1. Go to the download page
2. Enter the share code (the number you used during upload)
3. Click Download
4. File will be decrypted and downloaded to your device

## Important Notes

### Share Code
- The share code is what you use to retrieve your file
- If you provided a number during upload, that's your share code
- If you didn't provide a number, the system generated one for you
- **Keep your share code safe** - anyone with it can download your file

### File Storage
- Files are stored in AWS S3 (encrypted)
- Files expire after 20 minutes (free plan)
- After expiration, files are automatically deleted
- Download counter tracks how many times a file was downloaded

### Security
- All files are encrypted before upload
- Encryption keys are stored securely
- Files are transmitted over HTTPS
- CAPTCHA verification prevents automated abuse

## Troubleshooting

### "File not found" error
- Check that you entered the correct share code
- Verify the file hasn't expired (20 minutes for free plan)
- Make sure you're using the code from the upload response

### "File has expired" error
- The file was stored for 20 minutes and has now expired
- Upload the file again to get a new share code

### Upload fails
- Check file size (max 100MB for free plan)
- Verify CAPTCHA completed successfully
- Check your internet connection

## API Endpoints

### Upload
```
POST /api/upload
Content-Type: multipart/form-data

Parameters:
- file: File to upload (required)
- share_number: Share code (optional, any positive number)
- captcha_token: reCAPTCHA token (required)
- storage_duration: Duration in minutes (optional, authenticated users only)

Response:
{
  "success": true,
  "shareCode": "12345",
  "expiresAt": "2024-01-30T12:20:00Z",
  "fileName": "document.pdf",
  "fileSize": 1024000
}
```

### Download
```
GET /api/download/:code

Parameters:
- code: Share code (URL parameter)
- info: Set to "true" to get file info without downloading

Response:
- File binary data (with Content-Disposition header for download)
- Or JSON with file metadata if info=true
```

## Environment Variables

### Required for Production
```
OBJECT_STORAGE_PROVIDER=aws-s3
OBJECT_STORAGE_BUCKET=your-bucket-name
OBJECT_STORAGE_REGION=us-east-1
OBJECT_STORAGE_ACCESS_KEY_ID=your-access-key
OBJECT_STORAGE_SECRET_ACCESS_KEY=your-secret-key
OBJECT_STORAGE_ENDPOINT=https://s3.amazonaws.com
```

### Set in Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add the variables above
5. Redeploy for changes to take effect
