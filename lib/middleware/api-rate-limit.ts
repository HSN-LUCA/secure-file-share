/**
 * API Key Rate Limiting Middleware
 * Enforces per-API-key rate limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyRateLimit, recordApiUsage } from '@/lib/db/queries';
import { createClient } from '@supabase/supabase-js';

// In-memory rate limit tracking (for single instance)
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<
  string,
  {
    minute: { count: number; resetAt: number };
    hour: { count: number; resetAt: number };
    day: { count: number; resetAt: number };
  }
>();

/**
 * Get or initialize rate limit tracker for an API key
 */
function getTracker(apiKeyId: string) {
  if (!rateLimitStore.has(apiKeyId)) {
    const now = Date.now();
    rateLimitStore.set(apiKeyId, {
      minute: { count: 0, resetAt: now + 60 * 1000 },
      hour: { count: 0, resetAt: now + 60 * 60 * 1000 },
      day: { count: 0, resetAt: now + 24 * 60 * 60 * 1000 },
    });
  }
  return rateLimitStore.get(apiKeyId)!;
}

/**
 * Check if API key has exceeded rate limits
 */
export async function checkApiRateLimit(
  apiKeyId: string
): Promise<{
  allowed: boolean;
  remaining: { minute: number; hour: number; day: number };
  resetAt: { minute: number; hour: number; day: number };
  error?: string;
}> {
  try {
    // Get rate limit configuration
    const { data: rateLimit, error } = await getApiKeyRateLimit(apiKeyId);
    if (error || !rateLimit) {
      // Default limits if not found
      return {
        allowed: true,
        remaining: { minute: 60, hour: 3600, day: 86400 },
        resetAt: {
          minute: Date.now() + 60 * 1000,
          hour: Date.now() + 60 * 60 * 1000,
          day: Date.now() + 24 * 60 * 60 * 1000,
        },
      };
    }

    const tracker = getTracker(apiKeyId);
    const now = Date.now();

    // Reset counters if time windows have passed
    if (now >= tracker.minute.resetAt) {
      tracker.minute = { count: 0, resetAt: now + 60 * 1000 };
    }
    if (now >= tracker.hour.resetAt) {
      tracker.hour = { count: 0, resetAt: now + 60 * 60 * 1000 };
    }
    if (now >= tracker.day.resetAt) {
      tracker.day = { count: 0, resetAt: now + 24 * 60 * 60 * 1000 };
    }

    // Check if limits exceeded
    const minuteExceeded = tracker.minute.count >= rateLimit.requests_per_minute;
    const hourExceeded = tracker.hour.count >= rateLimit.requests_per_hour;
    const dayExceeded = tracker.day.count >= rateLimit.requests_per_day;

    const allowed = !minuteExceeded && !hourExceeded && !dayExceeded;

    return {
      allowed,
      remaining: {
        minute: Math.max(0, rateLimit.requests_per_minute - tracker.minute.count),
        hour: Math.max(0, rateLimit.requests_per_hour - tracker.hour.count),
        day: Math.max(0, rateLimit.requests_per_day - tracker.day.count),
      },
      resetAt: {
        minute: tracker.minute.resetAt,
        hour: tracker.hour.resetAt,
        day: tracker.day.resetAt,
      },
      error: minuteExceeded
        ? 'Rate limit exceeded (per minute)'
        : hourExceeded
          ? 'Rate limit exceeded (per hour)'
          : dayExceeded
            ? 'Rate limit exceeded (per day)'
            : undefined,
    };
  } catch (error) {
    console.error('Error checking API rate limit:', error);
    return {
      allowed: true,
      remaining: { minute: 60, hour: 3600, day: 86400 },
      resetAt: {
        minute: Date.now() + 60 * 1000,
        hour: Date.now() + 60 * 60 * 1000,
        day: Date.now() + 24 * 60 * 60 * 1000,
      },
    };
  }
}

/**
 * Increment rate limit counters
 */
export function incrementRateLimit(apiKeyId: string): void {
  const tracker = getTracker(apiKeyId);
  tracker.minute.count++;
  tracker.hour.count++;
  tracker.day.count++;
}

/**
 * Middleware to enforce API rate limits
 */
export async function enforceApiRateLimit(
  apiKeyId: string,
  request: NextRequest
): Promise<{ allowed: boolean; response: NextResponse | null }> {
  const rateLimit = await checkApiRateLimit(apiKeyId);

  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      {
        error: rateLimit.error || 'Rate limit exceeded',
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit-Minute', '60');
    response.headers.set('X-RateLimit-Remaining-Minute', String(rateLimit.remaining.minute));
    response.headers.set('X-RateLimit-Reset-Minute', String(Math.ceil(rateLimit.resetAt.minute / 1000)));

    return {
      allowed: false,
      response,
    };
  }

  // Increment counters
  incrementRateLimit(apiKeyId);

  return {
    allowed: true,
    response: null,
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimit: Awaited<ReturnType<typeof checkApiRateLimit>>
): void {
  response.headers.set('X-RateLimit-Limit-Minute', '60');
  response.headers.set('X-RateLimit-Remaining-Minute', String(rateLimit.remaining.minute));
  response.headers.set('X-RateLimit-Reset-Minute', String(Math.ceil(rateLimit.resetAt.minute / 1000)));

  response.headers.set('X-RateLimit-Limit-Hour', '3600');
  response.headers.set('X-RateLimit-Remaining-Hour', String(rateLimit.remaining.hour));
  response.headers.set('X-RateLimit-Reset-Hour', String(Math.ceil(rateLimit.resetAt.hour / 1000)));

  response.headers.set('X-RateLimit-Limit-Day', '86400');
  response.headers.set('X-RateLimit-Remaining-Day', String(rateLimit.remaining.day));
  response.headers.set('X-RateLimit-Reset-Day', String(Math.ceil(rateLimit.resetAt.day / 1000)));
}
