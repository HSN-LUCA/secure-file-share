# Rate Limiting & Bot Detection Guide

## Overview

This guide explains how to use the rate limiting and bot detection systems in the Secure File Share application.

## Quick Start

### For Developers

The rate limiting and bot detection are automatically integrated into the upload API. No additional configuration is needed for basic usage.

```typescript
// The upload API automatically:
// 1. Checks for bot activity
// 2. Enforces rate limits
// 3. Verifies CAPTCHA tokens
```

### For DevOps/Deployment

Ensure the following environment variables are set:

```bash
# reCAPTCHA Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

## Rate Limiting

### Configuration

Rate limits are configured in `lib/constants.ts`:

```typescript
export const RATE_LIMITS = {
  UPLOADS_PER_MINUTE: 5,      // 5 uploads per minute per IP
  REQUESTS_PER_MINUTE: 100,   // 100 requests per minute per IP
};

export const FILE_CONSTRAINTS = {
  FREE_PLAN: {
    UPLOADS_PER_DAY: 5,        // 5 uploads per day for free users
    // ...
  },
  // ...
};
```

### How It Works

1. **Per-Minute Limit**: Prevents rapid-fire uploads from a single IP
   - Limit: 5 uploads per minute
   - Window: 60 seconds
   - Response: HTTP 429 if exceeded

2. **Per-Day Limit**: Prevents abuse by free users
   - Limit: 5 uploads per day
   - Window: 24 hours
   - Response: HTTP 429 if exceeded

3. **General Request Limit**: Protects API from overload
   - Limit: 100 requests per minute
   - Window: 60 seconds
   - Response: HTTP 429 if exceeded

### Error Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "retryAfter": 45,
  "resetTime": "2024-01-30T12:05:00Z"
}
```

HTTP Headers:
- `Retry-After: 45` - Seconds to wait before retrying
- `X-RateLimit-Reset: 2024-01-30T12:05:00Z` - When limit resets

### Customizing Rate Limits

To change rate limits, modify `lib/middleware/rate-limiting.ts`:

```typescript
const rateLimitMiddleware = createRateLimitingMiddleware({
  uploadsPerMinute: 10,    // Change to 10 uploads per minute
  uploadsPerDay: 20,       // Change to 20 uploads per day
  requestsPerMinute: 200,  // Change to 200 requests per minute
  enableLogging: true,     // Enable/disable logging
});
```

## Bot Detection

### Configuration

Bot detection is configured in `lib/middleware/bot-detection.ts`:

```typescript
const botDetectionMiddleware = createBotDetectionMiddleware({
  enableUserAgentCheck: true,      // Check user agent
  enableRateLimitCheck: true,      // Check rate limits
  enableHeaderCheck: true,         // Check browser headers
  botScoreThreshold: 0.7,          // Score threshold (0.0-1.0)
  blockDurationMs: 15 * 60 * 1000, // Block for 15 minutes
});
```

### Detection Methods

1. **User-Agent Analysis**
   - Detects common bot patterns (curl, wget, bot, crawler, etc.)
   - Detects missing user agent
   - Score: 0.3-0.5 for suspicious agents

2. **Header Analysis**
   - Checks for missing accept-language header
   - Checks for missing accept-encoding header
   - Checks for suspicious header combinations
   - Score: 0.1-0.2 per missing header

3. **IP Blocking**
   - Blocks IPs after suspicious activity
   - Automatic unblock after configured duration
   - Manual block/unblock available

### Bot Score

The bot detection system assigns a score from 0.0 to 1.0:

- **0.0-0.3**: Likely human (normal browser)
- **0.3-0.7**: Suspicious (might be bot)
- **0.7-1.0**: Likely bot (block)

Default threshold: 0.7 (blocks requests with score >= 0.7)

### Error Response

When bot is detected:

```json
{
  "success": false,
  "error": "Suspicious activity detected. Please try again later."
}
```

HTTP Status: 403 Forbidden

## CAPTCHA Verification

### Configuration

CAPTCHA verification is configured in `lib/captcha/verifier.ts`:

```typescript
const result = await verifyCaptchaToken(
  token,           // Token from frontend
  'upload',        // Expected action
  0.5              // Score threshold (0.0-1.0)
);
```

### How It Works

1. Frontend generates reCAPTCHA v3 token
2. Token is sent with upload request
3. Backend verifies token with Google's API
4. Score is checked against threshold
5. Action is validated

### Score Interpretation

reCAPTCHA v3 returns a score from 0.0 to 1.0:

- **0.9-1.0**: Very likely human
- **0.5-0.9**: Likely human
- **0.1-0.5**: Suspicious
- **0.0-0.1**: Very likely bot

Default threshold: 0.5 (accepts scores >= 0.5)

### Error Response

When CAPTCHA verification fails:

```json
{
  "success": false,
  "error": "Suspicious activity detected. Please try again."
}
```

HTTP Status: 403 Forbidden

## Monitoring & Analytics

### Events Logged

The system logs the following events to the analytics table:

1. **Bot Detection Events**
   - Event type: `bot_detected`
   - Includes: score, reasons, IP address

2. **Rate Limit Violations**
   - Event type: `rate_limit_exceeded`
   - Includes: limit type, remaining, reset time

3. **CAPTCHA Failures**
   - Event type: `bot_detected`
   - Includes: error codes, score

### Querying Analytics

```sql
-- Get bot detection events
SELECT * FROM analytics 
WHERE event_type = 'bot_detected' 
ORDER BY created_at DESC;

-- Get rate limit violations
SELECT * FROM analytics 
WHERE event_type = 'rate_limit_exceeded' 
ORDER BY created_at DESC;

-- Get events by IP
SELECT * FROM analytics 
WHERE ip_address = '192.168.1.1' 
ORDER BY created_at DESC;
```

## Troubleshooting

### Users Getting Blocked

**Problem**: Legitimate users are getting blocked

**Solutions**:
1. Lower bot score threshold (more permissive)
2. Disable specific detection methods
3. Whitelist specific IPs
4. Check user-agent string

### Rate Limits Too Strict

**Problem**: Users hitting rate limits too quickly

**Solutions**:
1. Increase uploads per minute limit
2. Increase uploads per day limit
3. Implement user authentication (higher limits for authenticated users)
4. Implement tiered rate limiting based on user plan

### CAPTCHA Not Working

**Problem**: CAPTCHA verification failing

**Solutions**:
1. Verify reCAPTCHA keys are correct
2. Check reCAPTCHA API is accessible
3. Verify token is being sent correctly
4. Check token hasn't expired (tokens expire after 2 minutes)

## Advanced Usage

### Manual IP Blocking

```typescript
const middleware = createBotDetectionMiddleware();

// Block an IP for 1 hour
middleware.blockIP('192.168.1.1', 60 * 60 * 1000);

// Unblock an IP
middleware.unblockIP('192.168.1.1');

// Get list of blocked IPs
const blocked = middleware.getBlockedIPs();
```

### Resetting Rate Limits

```typescript
const middleware = createRateLimitingMiddleware();

// Reset rate limit for an IP
await middleware.resetLimit('192.168.1.1');

// Clear all rate limits
await middleware.clear();
```

### Getting Statistics

```typescript
const middleware = createRateLimitingMiddleware();

// Get rate limiting statistics
const stats = middleware.getStats();
console.log(stats.minuteLimiter);
console.log(stats.dayLimiter);
console.log(stats.requestLimiter);
```

## Best Practices

1. **Monitor Analytics**: Regularly check analytics for bot patterns
2. **Adjust Thresholds**: Fine-tune thresholds based on real traffic
3. **Whitelist Trusted IPs**: Add trusted IPs to whitelist if needed
4. **Test Thoroughly**: Test rate limiting with various scenarios
5. **Document Changes**: Document any custom rate limit configurations
6. **Plan for Scale**: Consider Redis for multi-instance deployments

## Future Enhancements

- [ ] Redis integration for distributed rate limiting
- [ ] Machine learning-based bot detection
- [ ] Adaptive rate limiting based on traffic patterns
- [ ] Geographic-based rate limiting
- [ ] User reputation scoring
- [ ] Advanced CAPTCHA challenges for suspicious users

## Support

For issues or questions:
1. Check the analytics table for event logs
2. Review error messages in application logs
3. Verify environment variables are set correctly
4. Test with curl to debug API behavior
