# Download API Quick Reference Guide

## Endpoint

```
GET /api/download/:code
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | 6-digit numeric share code (e.g., "123456") |

## Request Headers

| Header | Example | Description |
|--------|---------|-------------|
| `x-forwarded-for` | `192.168.1.100` | Client IP address (optional, used for analytics) |
| `user-agent` | `Mozilla/5.0` | Browser user agent (optional, used for analytics) |

## Response - Success (200 OK)

**Headers:**
```
Content-Type: application/pdf
Content-Length: 1024000
Content-Disposition: attachment; filename="document.pdf"
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

**Body:** Binary file data

## Response - Errors

### Invalid Share Code Format (400 Bad Request)
```json
{
  "success": false,
  "error": "Invalid share code format"
}
```

**Causes:**
- Share code is not 6 digits
- Share code contains non-numeric characters
- Share code is empty

### File Not Found (404 Not Found)
```json
{
  "success": false,
  "error": "File not found"
}
```

**Causes:**
- Share code doesn't exist in database
- File was deleted
- Database query failed

### File Expired (410 Gone)
```json
{
  "success": false,
  "error": "File has expired and is no longer available"
}
```

**Causes:**
- File expiration time has passed
- File was automatically deleted by cleanup job

### Storage Error (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Failed to download file"
}
```

**Causes:**
- S3 connection failed
- File decryption failed
- Storage service unavailable

### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

**Causes:**
- Unexpected server error
- Database connection failed
- Unhandled exception

## Usage Examples

### cURL

```bash
# Download file
curl -X GET "http://localhost:3000/api/download/123456" \
  -H "x-forwarded-for: 192.168.1.100" \
  -H "user-agent: Mozilla/5.0" \
  -o document.pdf

# Check if file exists (without downloading)
curl -I "http://localhost:3000/api/download/123456"
```

### JavaScript/Fetch

```javascript
// Download file
async function downloadFile(shareCode) {
  try {
    const response = await fetch(`/api/download/${shareCode}`, {
      method: 'GET',
      headers: {
        'x-forwarded-for': getClientIp(),
        'user-agent': navigator.userAgent,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition');
    const fileName = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'download';

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download failed:', error);
  }
}
```

### Python

```python
import requests

def download_file(share_code):
    url = f"http://localhost:3000/api/download/{share_code}"
    headers = {
        'x-forwarded-for': '192.168.1.100',
        'user-agent': 'Python-Requests/2.28.0',
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        # Save file
        filename = response.headers.get('content-disposition').split('filename=')[1]
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"File downloaded: {filename}")
    else:
        error = response.json()
        print(f"Error: {error['error']}")

# Usage
download_file('123456')
```

## Data Flow

```
1. Client sends GET request with share code
   ↓
2. Server validates share code format
   ↓
3. Server queries database for file by share code
   ↓
4. Server checks if file exists
   ↓
5. Server checks if file has expired
   ↓
6. Server downloads encrypted file from S3
   ↓
7. Server decrypts file using stored encryption data
   ↓
8. Server increments download counter (non-blocking)
   ↓
9. Server records download event (non-blocking)
   ↓
10. Server logs analytics (non-blocking)
   ↓
11. Server returns file with proper headers
   ↓
12. Client receives file and saves to disk
```

## Analytics Recorded

For each successful download, the following data is recorded:

| Field | Example | Purpose |
|-------|---------|---------|
| `event_type` | `download` | Event classification |
| `file_id` | `uuid-123` | File identifier |
| `ip_address` | `192.168.1.100` | Downloader IP |
| `user_agent` | `Mozilla/5.0` | Browser information |
| `timestamp` | `2024-01-30T12:00:00Z` | Download time |
| `download_count` | `6` | Total downloads for file |

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Share code lookup | < 10ms | Indexed database query |
| File download | Depends on file size | Streamed from S3 |
| Decryption | < 100ms | Hardware-accelerated AES-256-GCM |
| Counter update | < 50ms | Non-blocking, doesn't delay response |
| Analytics logging | < 100ms | Non-blocking, doesn't delay response |

## Security Features

1. **Share Code Validation**
   - Only 6-digit numeric codes accepted
   - Prevents injection attacks

2. **Expiration Checking**
   - Files automatically expire after configured duration
   - Prevents access to old files

3. **Encryption**
   - AES-256-GCM encryption at rest
   - Authentication tag verification
   - Ensures data integrity

4. **HTTPS/TLS**
   - All transfers encrypted in transit
   - Prevents man-in-the-middle attacks

5. **Cache Control**
   - No-cache headers prevent browser caching
   - Protects sensitive files

6. **IP Tracking**
   - Records downloader IP for abuse detection
   - Enables rate limiting

7. **Error Messages**
   - Generic error messages prevent information leakage
   - Detailed logging for debugging

## Rate Limiting

The download endpoint respects the following rate limits:

| Plan | Limit | Window |
|------|-------|--------|
| Free | 100 requests | Per minute per IP |
| Paid | 1000 requests | Per minute per IP |
| Enterprise | Custom | Custom |

*Note: Rate limiting is implemented in Task 6*

## Troubleshooting

### "Invalid share code format"
- Ensure share code is exactly 6 digits
- Ensure share code contains only numbers
- Example: `123456` ✓, `12345` ✗, `abc123` ✗

### "File not found"
- Verify share code is correct
- Check if file was already downloaded and deleted
- Check if file was manually deleted

### "File has expired"
- File expiration time has passed
- Free plan files expire after 20 minutes
- Paid plan files expire after 24 hours
- Enterprise plan files expire after custom duration

### "Failed to download file"
- Check S3 connection
- Check encryption key configuration
- Check file exists in S3
- Check server logs for details

### "Internal server error"
- Check server logs
- Verify database connection
- Verify S3 credentials
- Verify encryption key is valid

## Integration with Frontend

The download endpoint is designed to be called from the frontend download interface:

```typescript
// In frontend component
const handleDownload = async (shareCode: string) => {
  try {
    const response = await fetch(`/api/download/${shareCode}`);
    
    if (!response.ok) {
      const error = await response.json();
      setError(error.error);
      return;
    }
    
    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('content-disposition')
      .split('filename=')[1]
      .replace(/"/g, '');
    a.click();
  } catch (error) {
    setError('Download failed: ' + error.message);
  }
};
```

## Related Tasks

- **Task 3**: File Upload API - Creates files that are downloaded
- **Task 5**: Virus Scanning - Scans files before upload
- **Task 6**: Bot Detection & Rate Limiting - Protects download endpoint
- **Task 7**: Frontend Upload Interface - Uploads files
- **Task 8**: Frontend Download Interface - Downloads files using this endpoint
- **Task 9**: Background Jobs - Cleans up expired files

## API Versioning

Current version: **v1**

Future versions may include:
- Streaming progress tracking
- Partial file downloads (Range requests)
- File preview before download
- Download history tracking
- Download notifications

