# Virus Scanner Quick Reference Guide

## Overview

The virus scanning system provides a flexible, pluggable architecture for scanning files for malware. It supports multiple scanning engines:

- **ClamAV** - Local virus scanning via ClamAV daemon
- **VirusTotal** - Cloud-based virus scanning via VirusTotal API
- **Mock** - Mock scanner for testing and development

## Quick Start

### 1. Configure Environment

```bash
# For development (mock scanner)
export VIRUS_SCANNER_PROVIDER=mock
export MOCK_SCANNER_INFECT_RATE=0.1

# For production (VirusTotal)
export VIRUS_SCANNER_PROVIDER=virustotal
export VIRUSTOTAL_API_KEY=your_api_key

# For production (ClamAV)
export VIRUS_SCANNER_PROVIDER=clamav
export CLAMAV_HOST=localhost
export CLAMAV_PORT=3310
```

### 2. Scan File

```typescript
import { scanFile } from '@/lib/virus-scanner';

const fileData = Buffer.from(fileContent);
const result = await scanFile(fileData, 'document.pdf');

if (!result.isClean) {
  console.log(`Infected: ${result.threat}`);
}
```

### 3. Check Health

```typescript
import { isVirusScannerHealthy } from '@/lib/virus-scanner';

const healthy = await isVirusScannerHealthy();
if (!healthy) {
  console.error('Scanner unavailable');
}
```

## Scan Result

```typescript
interface VirusScanResult {
  isClean: boolean;           // true if file is clean
  threat?: string;            // threat name if infected
  engine?: string;            // scanner engine used
  scanTime: number;           // scan duration in ms
  timestamp: Date;            // when scan was performed
}
```

## Configuration

### Mock Scanner

```env
VIRUS_SCANNER_PROVIDER=mock
MOCK_SCANNER_INFECT_RATE=0.1        # 0-1, probability of infection
MOCK_SCANNER_TIMEOUT=1000           # milliseconds
MOCK_SCANNER_MAX_FILE_SIZE=104857600 # 100MB
```

### ClamAV Scanner

```env
VIRUS_SCANNER_PROVIDER=clamav
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
CLAMAV_TIMEOUT=30000                # milliseconds
CLAMAV_MAX_FILE_SIZE=104857600      # 100MB
```

### VirusTotal Scanner

```env
VIRUS_SCANNER_PROVIDER=virustotal
VIRUSTOTAL_API_KEY=your_api_key
VIRUSTOTAL_API_URL=https://www.virustotal.com
VIRUSTOTAL_TIMEOUT=30000            # milliseconds
VIRUSTOTAL_MAX_FILE_SIZE=104857600  # 100MB
```

## API Reference

### scanFile(fileData, fileName)

Scan a file for viruses.

**Parameters:**
- `fileData` (Buffer) - File content
- `fileName` (string) - File name

**Returns:** Promise<VirusScanResult>

**Example:**
```typescript
const result = await scanFile(fileData, 'document.pdf');
```

### isVirusScannerHealthy()

Check if virus scanner is healthy and accessible.

**Returns:** Promise<boolean>

**Example:**
```typescript
const healthy = await isVirusScannerHealthy();
```

### getVirusScannerConfig()

Get current scanner configuration.

**Returns:** VirusScannerConfig

**Example:**
```typescript
const config = getVirusScannerConfig();
console.log(config.provider);
```

### getVirusScanner()

Get virus scanner instance.

**Returns:** IVirusScanner

**Example:**
```typescript
const scanner = getVirusScanner();
```

## Integration with Upload API

### Step 1: Import Scanner

```typescript
import { scanFile } from '@/lib/virus-scanner';
```

### Step 2: Add Scanning to Upload

```typescript
// After file format validation
const validationResult = validateFile({ fileSize, fileName, mimeType });
if (!validationResult.valid) {
  return NextResponse.json({ error: validationResult.error }, { status: 400 });
}

// Scan file for viruses
const scanResult = await scanFile(fileBuffer, fileName);
if (!scanResult.isClean) {
  // Log virus detection
  await createAnalytics({
    event_type: 'virus_detected',
    metadata: {
      threat: scanResult.threat,
      engine: scanResult.engine,
      fileName,
    },
  });

  return NextResponse.json(
    { success: false, error: `File contains malware: ${scanResult.threat}` },
    { status: 400 }
  );
}

// Continue with encryption and storage
```

### Step 3: Update Database

```typescript
// Store scan results
await createFile({
  ...fileData,
  is_scanned: true,
  is_safe: true,
});
```

## Testing

### Run Tests

```bash
npm test -- --testPathPattern="virus-scanner"
```

### Test with Mock Scanner

```typescript
import { MockScanner } from '@/lib/virus-scanner';

const scanner = new MockScanner({
  provider: 'mock',
  enabled: true,
  infectRate: 0.5,  // 50% of files infected
  timeout: 1000,
  maxFileSize: 104857600,
});

const result = await scanner.scan(fileData, 'test.pdf');
```

### Set Infection Rate

```typescript
const scanner = new MockScanner({...});
scanner.setInfectionRate(0.1);  // 10% infection rate
```

### Control Health Status

```typescript
const scanner = new MockScanner({...});
scanner.setHealthStatus(false);  // Simulate unhealthy scanner
```

## Error Handling

### File Too Large

```json
{
  "isClean": false,
  "threat": "File exceeds maximum size of 104857600 bytes",
  "engine": "mock",
  "scanTime": 5,
  "timestamp": "2024-01-30T12:00:00Z"
}
```

### Scan Timeout

```typescript
try {
  const result = await scanFile(fileData, 'document.pdf');
} catch (error) {
  console.error('Scan failed:', error.message);
  // Handle timeout or other errors
}
```

### Scanner Unavailable

```typescript
const healthy = await isVirusScannerHealthy();
if (!healthy) {
  // Use fallback or reject upload
  return NextResponse.json(
    { error: 'Virus scanner unavailable' },
    { status: 503 }
  );
}
```

## Performance Tips

1. **Use Mock Scanner for Development**
   - Fast, no external dependencies
   - Configurable for testing

2. **Use ClamAV for Local Scanning**
   - Fast, no API calls
   - Requires ClamAV daemon

3. **Use VirusTotal for Cloud Scanning**
   - Comprehensive detection
   - Requires API key
   - Slower due to network latency

4. **Set Appropriate Timeouts**
   - Development: 1-5 seconds
   - Production: 30-60 seconds

5. **Monitor Scan Times**
   - Log scan times for analysis
   - Alert if scans exceed threshold

## Troubleshooting

### Scanner Not Found

**Error:** `Cannot find module '@/lib/virus-scanner'`

**Solution:** Ensure virus-scanner directory exists with all files

### API Key Invalid

**Error:** `VirusTotal API error: 401`

**Solution:** Check VIRUSTOTAL_API_KEY environment variable

### ClamAV Connection Failed

**Error:** `ClamAV scan failed: Connection refused`

**Solution:** Ensure ClamAV daemon is running on configured host:port

### Timeout Exceeded

**Error:** `Scan timeout exceeded`

**Solution:** Increase VIRUS_SCANNER_TIMEOUT or reduce file size

## Best Practices

1. **Always Check Health**
   ```typescript
   const healthy = await isVirusScannerHealthy();
   if (!healthy) {
     // Handle unavailable scanner
   }
   ```

2. **Log Scan Results**
   ```typescript
   await createAnalytics({
     event_type: 'virus_scan',
     metadata: {
       isClean: result.isClean,
       threat: result.threat,
       engine: result.engine,
       scanTime: result.scanTime,
     },
   });
   ```

3. **Handle Errors Gracefully**
   ```typescript
   try {
     const result = await scanFile(fileData, fileName);
   } catch (error) {
     console.error('Scan error:', error);
     // Reject upload or use fallback
   }
   ```

4. **Monitor Performance**
   - Track scan times
   - Alert on slow scans
   - Adjust timeouts as needed

5. **Test Regularly**
   - Use EICAR test file
   - Test with mock scanner
   - Test with real scanner

## EICAR Test File

To test virus detection, use the EICAR test file:

```
X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*
```

This file is recognized by all antivirus engines as a test file and will trigger detection without being an actual virus.

## Related Tasks

- **Task 3**: File Upload API - Where scanning is integrated
- **Task 4**: File Download API - Uses scan results
- **Task 6**: Bot Detection & Rate Limiting
- **Task 7-8**: Frontend interfaces

## Support

For issues or questions:
1. Check logs for error messages
2. Verify environment configuration
3. Test with mock scanner
4. Check scanner health status
5. Review documentation

