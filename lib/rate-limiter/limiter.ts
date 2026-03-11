/**
 * Rate Limiter
 * Implements rate limiting with configurable windows
 */

import { IRateLimitStore, RateLimitResult, RateLimitConfig, RateLimitViolation } from './types';
import { InMemoryRateLimitStore } from './store';

/**
 * Rate Limiter Implementation
 */
export class RateLimiter {
  private store: IRateLimitStore;
  private config: RateLimitConfig;
  private violations: Map<string, RateLimitViolation> = new Map();
  private blockedKeys: Map<string, Date> = new Map();

  constructor(config: RateLimitConfig, store?: IRateLimitStore) {
    this.config = config;
    this.store = store || new InMemoryRateLimitStore();
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    // Check if key is blocked
    const blockedUntil = this.blockedKeys.get(key);
    if (blockedUntil && new Date() < blockedUntil) {
      const retryAfter = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil,
        retryAfter,
      };
    }

    // Remove expired block
    if (blockedUntil) {
      this.blockedKeys.delete(key);
    }

    // Increment counter
    const count = await this.store.increment(key, this.config.windowMs);
    const remaining = Math.max(0, this.config.maxRequests - count);
    const resetTime = new Date(Date.now() + this.config.windowMs);

    // Check if limit exceeded
    if (count > this.config.maxRequests) {
      this.recordViolation(key);
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(this.config.windowMs / 1000),
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime,
    };
  }

  /**
   * Block key for specified duration
   */
  async blockKey(key: string, durationMs: number): Promise<void> {
    const blockedUntil = new Date(Date.now() + durationMs);
    this.blockedKeys.set(key, blockedUntil);
    await this.store.reset(key);
  }

  /**
   * Unblock key
   */
  async unblockKey(key: string): Promise<void> {
    this.blockedKeys.delete(key);
  }

  /**
   * Reset counter for key
   */
  async resetKey(key: string): Promise<void> {
    await this.store.reset(key);
  }

  /**
   * Record violation
   */
  private recordViolation(key: string): void {
    const existing = this.violations.get(key);
    if (existing) {
      existing.violationCount++;
      existing.timestamp = new Date();
    } else {
      this.violations.set(key, {
        key,
        type: 'ip',
        timestamp: new Date(),
        violationCount: 1,
      });
    }
  }

  /**
   * Get violations
   */
  getViolations(): RateLimitViolation[] {
    return Array.from(this.violations.values());
  }

  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeKeys: this.violations.size,
      blockedKeys: this.blockedKeys.size,
      violations: this.getViolations(),
    };
  }
}

/**
 * Create rate limiter for IP-based limiting
 */
export function createIPRateLimiter(
  requestsPerMinute: number = 100,
  store?: IRateLimitStore
): RateLimiter {
  return new RateLimiter(
    {
      enabled: true,
      windowMs: 60000, // 1 minute
      maxRequests: requestsPerMinute,
      keyGenerator: (req: any) => req.ip || 'unknown',
    },
    store
  );
}

/**
 * Create rate limiter for daily limiting
 */
export function createDailyRateLimiter(
  requestsPerDay: number = 5,
  store?: IRateLimitStore
): RateLimiter {
  return new RateLimiter(
    {
      enabled: true,
      windowMs: 86400000, // 24 hours
      maxRequests: requestsPerDay,
      keyGenerator: (req: any) => `${req.ip || 'unknown'}:daily`,
    },
    store
  );
}

/**
 * Create rate limiter for user-based limiting
 */
export function createUserRateLimiter(
  requestsPerDay: number = 5,
  store?: IRateLimitStore
): RateLimiter {
  return new RateLimiter(
    {
      enabled: true,
      windowMs: 86400000, // 24 hours
      maxRequests: requestsPerDay,
      keyGenerator: (req: any) => `user:${req.userId || 'anonymous'}:daily`,
    },
    store
  );
}
