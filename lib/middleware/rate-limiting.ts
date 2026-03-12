/**
 * Rate Limiting Middleware
 * Enforces rate limits on API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, createIPRateLimiter, createDailyRateLimiter } from '@/lib/rate-limiter/limiter';
import { InMemoryRateLimitStore } from '@/lib/rate-limiter/store';
import { createAnalytics } from '@/lib/db/queries';
import { RATE_LIMITS, FILE_CONSTRAINTS } from '@/lib/constants';

/**
 * Rate limiting result
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

/**
 * Rate limiting middleware configuration
 */
export interface RateLimitMiddlewareConfig {
  uploadsPerMinute?: number;
  uploadsPerDay?: number;
  requestsPerMinute?: number;
  enableLogging?: boolean;
}

/**
 * Default rate limiting configuration
 */
const DEFAULT_CONFIG: RateLimitMiddlewareConfig = {
  uploadsPerMinute: RATE_LIMITS.UPLOADS_PER_MINUTE,
  uploadsPerDay: FILE_CONSTRAINTS.FREE_PLAN.UPLOADS_PER_DAY,
  requestsPerMinute: RATE_LIMITS.REQUESTS_PER_MINUTE,
  enableLogging: true,
};

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Create rate limiting middleware
 */
export function createRateLimitingMiddleware(
  config: Partial<RateLimitMiddlewareConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const store = new InMemoryRateLimitStore();

  // Create rate limiters
  const minuteLimiter = createIPRateLimiter(finalConfig.uploadsPerMinute || 5, store);
  const dayLimiter = createDailyRateLimiter(finalConfig.uploadsPerDay || 5, store);
  const requestLimiter = createIPRateLimiter(finalConfig.requestsPerMinute || 100, store);

  return {
    /**
     * Check upload rate limit
     */
    async checkUploadLimit(request: NextRequest): Promise<RateLimitCheckResult> {
      const ip = getClientIp(request);
      const minuteKey = `upload:${ip}:minute`;
      const dayKey = `upload:${ip}:day`;

      // Check minute limit
      const minuteResult = await minuteLimiter.checkLimit(minuteKey);
      if (!minuteResult.allowed) {
        if (finalConfig.enableLogging) {
          await logRateLimitEvent(ip, 'upload_minute', minuteResult);
        }
        return minuteResult;
      }

      // Check day limit
      const dayResult = await dayLimiter.checkLimit(dayKey);
      if (!dayResult.allowed) {
        if (finalConfig.enableLogging) {
          await logRateLimitEvent(ip, 'upload_day', dayResult);
        }
        return dayResult;
      }

      return {
        allowed: true,
        remaining: Math.min(minuteResult.remaining, dayResult.remaining),
        resetTime: minuteResult.resetTime,
      };
    },

    /**
     * Check general request rate limit
     */
    async checkRequestLimit(request: NextRequest): Promise<RateLimitCheckResult> {
      const ip = getClientIp(request);
      const key = `request:${ip}`;

      const result = await requestLimiter.checkLimit(key);
      if (!result.allowed && finalConfig.enableLogging) {
        await logRateLimitEvent(ip, 'request', result);
      }

      return result;
    },

    /**
     * Reset rate limit for IP
     */
    async resetLimit(ip: string): Promise<void> {
      await minuteLimiter.resetKey(`upload:${ip}:minute`);
      await dayLimiter.resetKey(`upload:${ip}:day`);
      await requestLimiter.resetKey(`request:${ip}`);
    },

    /**
     * Get rate limit statistics
     */
    getStats() {
      return {
        minuteLimiter: minuteLimiter.getStats(),
        dayLimiter: dayLimiter.getStats(),
        requestLimiter: requestLimiter.getStats(),
      };
    },

    /**
     * Clear all rate limits
     */
    async clear(): Promise<void> {
      await store.clear();
    },
  };
}

/**
 * Log rate limit event
 */
async function logRateLimitEvent(
  ip: string,
  limitType: string,
  result: any
): Promise<void> {
  try {
    await createAnalytics({
      event_type: 'security',
      ip_address: ip,
      metadata: {
        limitType,
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter,
      },
    });
  } catch (error) {
    console.error('Failed to log rate limit event:', error);
  }
}

/**
 * Create rate limit error response
 */
export function createRateLimitErrorResponse(
  result: RateLimitCheckResult
): NextResponse {
  const retryAfter = result.retryAfter || Math.ceil((result.resetTime.getTime() - Date.now()) / 1000);

  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter,
      resetTime: result.resetTime.toISOString(),
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': result.resetTime.toISOString(),
      },
    }
  );
}
