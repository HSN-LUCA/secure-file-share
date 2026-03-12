# Share Code Fix - Upload/Download Flow

## Problem
Users were unable to download files using the share number they entered during upload. The app was generating its own random share code instead of using the user-provided number.

### What Was Happening
1. User uploads file and enters share number (e.g., "12345")
2. System ignores the user's number and generates random code (e.g., "654321")
3. User tries to download with their number ("12345")
4. Download fails because system looks for the auto-generated code ("654321")

## Solution
Modified the upload endpoint to use the user-provided `share_number` as the `shareCode` instead of generating a random one.

### Changes Made
**File**: `secure-file-share/app/api/upload/route.ts`

**Before**:
```typescript
// Generate unique file ID and share code
const fileId = uuidv4();
const shareCode = generateShareCode(); // Always generates random code
```

**After**:
```typescript
// Validate share number if provided
let shareCode: string;
if (shareNumberStr) {
  const parsed = parseInt(shareNumberStr, 10);
  if (isNaN(parsed) || parsed < 1) {
    return NextResponse.json(
      { success: false, error: 'Share number must be a positive number' },
      { status: 400 }
    );
  }
  shareCode = parsed.toString();
} else {
  // Generate random share code if not provided
  shareCode = generateShareCode();
}

// Generate unique file ID
const fileId = uuidv4();
```

## How It Works Now

### Upload Flow
1. User selects file and enters share number (optional)
2. If share number provided → Use it as the share code
3. If no share number → Generate random share code
4. File encrypted and uploaded to S3
5. Metadata stored in database with the share code

### Download Flow
1. User enters share code (the number they used during upload)
2. System queries database for file with that share code
3. File retrieved from S3 and decrypted
4. File returned to user

## Testing
To verify the fix works:

1. **Upload a file with a specific number** (e.g., "12345")
   - Response should show: `"shareCode": "12345"`

2. **Download using that same number**
   - Use the download page or API: `/api/download/12345`
   - File should download successfully

3. **Upload without specifying a number**
   - System generates random code (e.g., "654321")
   - Download using that generated code

## Backward Compatibility
- Existing files in the database are unaffected
- The change only affects new uploads
- Download functionality remains the same
