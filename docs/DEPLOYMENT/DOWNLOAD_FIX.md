# Download Form Fix - Share Code Validation

## Problem
The download form was rejecting valid share codes because it was enforcing a strict 6-digit format requirement. This prevented users from downloading files when they entered share numbers that weren't exactly 6 digits.

### What Was Happening
1. User uploads file with share number (e.g., "123" or "12345678")
2. System accepts it and stores it
3. User tries to download with same number
4. Download form rejects it with error: "Share code must be 6 digits"
5. Download fails even though the file exists

## Solution
Modified the download form validation to accept any positive number, matching the upload endpoint behavior.

### Changes Made
**File**: `secure-file-share/components/forms/DownloadForm.tsx`

**Before**:
```typescript
// Validate share code format (numeric, 6 digits)
const isValidShareCode = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};

// Input limited to 6 characters max
maxLength={6}
placeholder="000000"
```

**After**:
```typescript
// Validate share code format (numeric, any positive number)
const isValidShareCode = (code: string): boolean => {
  return /^\d+$/.test(code) && parseInt(code, 10) > 0;
};

// No character limit
placeholder="Enter share code"
```

## How It Works Now

### Upload
- Accept any positive number as share code
- Store it in database

### Download
- Accept any positive number as share code
- Query database for matching file
- Download succeeds if file exists

## Testing
To verify the fix works:

1. **Upload with any number** (e.g., "1", "123", "12345", "999999999")
   - System accepts it

2. **Download with same number**
   - Enter the exact number you used during upload
   - File downloads successfully

3. **Try invalid numbers**
   - "0" → Rejected (must be positive)
   - "abc" → Rejected (must be numeric)
   - Empty → Rejected (required)

## Backward Compatibility
- Existing files with 6-digit codes still work
- New files with any positive number now work
- No database changes needed
