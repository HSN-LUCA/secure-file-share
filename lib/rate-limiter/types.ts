/**
 * Rate Limiter Types
 * Type definitions for rate limiting functionality
 */

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator: (req: any) => string; // Function to generate rate limit key
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // Seconds to wait before retry
}

/**
 * Rate limit store interface
 */
export interface IRateLimitStore {
  increment(key: string, windowMs: number): Promise<number>;
  get(key: string): Promise<number | null>;
  reset(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * IP-based rate limit config
 */
export interface IPRateLimitConfig extends RateLimitConfig {
  type: 'ip';
  perMinute?: number; // Requests per minute
  perHour?: number; // Requests per hour
  perDay?: number; // Requests per day
}

/**
 * User-based rate limit config
 */
export interface UserRateLimitConfig extends RateLimitConfig {
  type: 'user';
  perMinute?: number;
  perHour?: number;
  perDay?: number;
}

/**
 * Rate limit violation
 */
export interface RateLimitViolation {
  key: string;
  type: 'ip' | 'user';
  timestamp: Date;
  violationCount: number;
  blockedUntil?: Date;
}

/**
 * Rate limit statistics
 */
export interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  activeKeys: number;
  violations: RateLimitViolation[];
}
