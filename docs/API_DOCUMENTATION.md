# Secure File Share - API Documentation

## Overview

The Secure File Share API provides endpoints for uploading, downloading, and managing files with unique numeric share codes. The API supports both anonymous and authenticated users with different plan-based limits.

**Base URL:** `https://secure-file-share.com/api`

**Authentication:** JWT Bearer tokens for authenticated endpoints

---

## Table of Contents

1. [Authentication](#authentication)
2. [File Upload](#file-upload)
3. [File Download](#file-download)
4. [User Management](#user-management)
5. [Dashboard](#dashboard)
6. [Analytics](#analytics)
7. [API Keys](#api-keys)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

### Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "plan": "free",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Email already exists"
}
```

**Validation Rules:**
- Email must be valid format
- Password must be at least 8 characters
- Password must contain uppercase, lowercase, number, and special character

---

### Login User

Authenticate and receive JWT token.

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "plan": "free",
    "subscription_expires_at": null
  },
  "expires_in": 86400
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

## File Upload

### Upload File

Upload a file and receive a unique share code.

**Endpoint:** `POST /upload`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {token} (optional for authenticated users)
```

**Request Parameters:**
- `file` (required): File binary data (max 100MB for free, 1GB for paid)
- `captcha_token` (required): reCAPTCHA v3 token
- `storage_duration` (optional): Minutes to keep file (default: 20 for free, 1440 for paid)

**Response (200):**
```json
{
  "success": true,
  "share_code": "123456789",
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_name": "document.pdf",
  "file_size": 1024000,
  "file_type": "application/pdf",
  "expires_at": "2024-01-30T12:20:00Z",
  "download_url": "https://secure-file-share.com/download/123456789"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "File type not allowed",
  "details": "Only PDF, PNG, JPG, DOCX, XLSX, TXT, ZIP, MP4, WEBM, MP3 are allowed"
}
```

**Error Response (413):**
```json
{
  "success": false,
  "error": "File too large",
  "details": "Maximum file size is 100MB for free plan"
}
```

**Error Response (429):**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "details": "Free plan users can upload 5 files per day"
}
```

**Allowed File Types:**
- Documents: PDF, DOCX, XLSX, PPTX, TXT, RTF, ODT
- Images: PNG, JPG, JPEG, GIF, WEBP, SVG, BMP
- Archives: ZIP, RAR, 7Z, TAR, GZ
- Media: MP4 (50MB max), WEBM (50MB max), MP3, WAV, OGG, M4A
- Code: JSON, XML, CSV, SQL (in archives only)

---

## File Download

### Download File

Download a file using its share code.

**Endpoint:** `GET /download/:code`

**Path Parameters:**
- `code` (required): Numeric share code (e.g., 123456789)

**Response (200):**
- File binary data
- Headers:
  - `Content-Type`: File MIME type
  - `Content-Disposition`: attachment; filename="document.pdf"
  - `Content-Length`: File size in bytes
  - `Cache-Control`: no-cache, no-store, must-revalidate

**Error Response (404):**
```json
{
  "success": false,
  "error": "File not found",
  "details": "Share code does not exist or file has expired"
}
```

**Error Response (410):**
```json
{
  "success": false,
  "error": "File expired",
  "details": "This file was automatically deleted after 20 minutes"
}
```

---

## User Management

### Get User Profile

Retrieve authenticated user's profile information.

**Endpoint:** `GET /auth/profile`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "plan": "free",
    "created_at": "2024-01-15T10:00:00Z",
    "subscription_expires_at": null,
    "is_active": true
  }
}
```

---

### Update User Profile

Update user profile information.

**Endpoint:** `PUT /auth/profile`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "email": "newemail@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newemail@example.com",
    "plan": "free"
  }
}
```

---

### Change Password

Change user password.

**Endpoint:** `POST /auth/change-password`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Dashboard

### Get Dashboard Data

Retrieve user's files, statistics, and share history.

**Endpoint:** `GET /dashboard`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sort` (optional): Sort field (created_at, download_count, file_size)
- `order` (optional): Sort order (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "plan": "free"
  },
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "share_code": "123456789",
      "file_name": "document.pdf",
      "file_size": 1024000,
      "file_type": "application/pdf",
      "created_at": "2024-01-30T12:00:00Z",
      "expires_at": "2024-01-30T12:20:00Z",
      "download_count": 5,
      "download_url": "https://secure-file-share.com/download/123456789"
    }
  ],
  "stats": {
    "total_uploads": 10,
    "total_downloads": 50,
    "storage_used": 5242880,
    "storage_limit": 104857600,
    "uploads_today": 2,
    "uploads_limit": 5
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 10,
    "pages": 1
  }
}
```

---

### Delete File

Delete a file from dashboard.

**Endpoint:** `DELETE /dashboard/files/:fileId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

---

### Extend File Expiration

Extend the expiration time of a file (paid plan only).

**Endpoint:** `POST /dashboard/files/:fileId/extend`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "additional_minutes": 1440
}
```

**Response (200):**
```json
{
  "success": true,
  "file": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "share_code": "123456789",
    "expires_at": "2024-01-31T12:20:00Z"
  }
}
```

---

## Analytics

### Get Analytics Dashboard

Retrieve analytics data for uploaded files.

**Endpoint:** `GET /analytics`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `start_date` (optional): ISO 8601 date (default: 30 days ago)
- `end_date` (optional): ISO 8601 date (default: today)
- `metric` (optional): downloads, uploads, file_types, geography

**Response (200):**
```json
{
  "success": true,
  "period": {
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-30T23:59:59Z"
  },
  "summary": {
    "total_uploads": 100,
    "total_downloads": 500,
    "total_files_deleted": 50,
    "average_file_size": 2097152,
    "unique_downloaders": 250
  },
  "downloads_by_date": [
    {
      "date": "2024-01-30",
      "count": 25
    }
  ],
  "file_types": [
    {
      "type": "application/pdf",
      "count": 45,
      "percentage": 45
    }
  ],
  "geography": [
    {
      "country": "US",
      "count": 200,
      "percentage": 40
    }
  ]
}
```

---

## API Keys

### Create API Key

Generate a new API key for programmatic access (enterprise plan).

**Endpoint:** `POST /api-keys`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Production API Key",
  "rate_limit": 1000
}
```

**Response (201):**
```json
{
  "success": true,
  "api_key": {
    "id": "key_550e8400e29b41d4a716446655440000",
    "name": "Production API Key",
    "key": "sk_live_51234567890abcdefghijklmnop",
    "rate_limit": 1000,
    "created_at": "2024-01-30T12:00:00Z",
    "last_used_at": null
  }
}
```

---

### List API Keys

List all API keys for the user.

**Endpoint:** `GET /api-keys`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "api_keys": [
    {
      "id": "key_550e8400e29b41d4a716446655440000",
      "name": "Production API Key",
      "rate_limit": 1000,
      "created_at": "2024-01-30T12:00:00Z",
      "last_used_at": "2024-01-30T15:30:00Z"
    }
  ]
}
```

---

### Delete API Key

Revoke an API key.

**Endpoint:** `DELETE /api-keys/:keyId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

---

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error code or message",
  "details": "Detailed error description",
  "request_id": "req_550e8400e29b41d4a716446655440000"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_REQUEST | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Authentication required or failed |
| FORBIDDEN | 403 | Access denied |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMITED | 429 | Too many requests |
| FILE_TOO_LARGE | 413 | File exceeds size limit |
| INVALID_FILE_TYPE | 400 | File type not allowed |
| VIRUS_DETECTED | 400 | File contains malware |
| EXPIRED | 410 | Resource has expired |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

### Rate Limits by Plan

| Plan | Uploads/Day | Requests/Min | File Size |
|------|-------------|--------------|-----------|
| Free | 5 | 10 | 100MB |
| Paid | Unlimited | 100 | 1GB |
| Enterprise | Unlimited | 1000 | 10GB |

---

## Examples

### Upload File with cURL

```bash
curl -X POST https://secure-file-share.com/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf" \
  -F "captcha_token=YOUR_CAPTCHA_TOKEN"
```

### Download File with cURL

```bash
curl -X GET https://secure-file-share.com/api/download/123456789 \
  -o downloaded_file.pdf
```

### Get Dashboard with cURL

```bash
curl -X GET https://secure-file-share.com/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Webhooks

### File Uploaded Event

Sent when a file is successfully uploaded.

**Event:** `file.uploaded`

**Payload:**
```json
{
  "event": "file.uploaded",
  "timestamp": "2024-01-30T12:00:00Z",
  "data": {
    "file_id": "550e8400-e29b-41d4-a716-446655440000",
    "share_code": "123456789",
    "file_name": "document.pdf",
    "file_size": 1024000,
    "user_id": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

### File Downloaded Event

Sent when a file is downloaded.

**Event:** `file.downloaded`

**Payload:**
```json
{
  "event": "file.downloaded",
  "timestamp": "2024-01-30T12:05:00Z",
  "data": {
    "file_id": "550e8400-e29b-41d4-a716-446655440000",
    "share_code": "123456789",
    "download_count": 5,
    "ip_address": "192.0.2.1",
    "country": "US"
  }
}
```

### File Expired Event

Sent when a file expires and is deleted.

**Event:** `file.expired`

**Payload:**
```json
{
  "event": "file.expired",
  "timestamp": "2024-01-30T12:20:00Z",
  "data": {
    "file_id": "550e8400-e29b-41d4-a716-446655440000",
    "share_code": "123456789",
    "total_downloads": 5
  }
}
```

---

## Support

For API support, contact: api-support@secure-file-share.com

Last Updated: January 2024
