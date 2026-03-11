/**
 * Rate Limit Store Implementations
 * In-memory and Redis-ready stores for rate limiting
 */

import { IRateLimitStore } from './types';

/**
 * In-memory rate limit store
 * Suitable for single-instance deployments
 * For distributed deployments, use Redis store
 */
export class InMemoryRateLimitStore implements IRateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Increment counter for key
   */
  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return 1;
    }

    // Increment existing entry
    entry.count++;
    return entry.count;
  }

  /**
   * Get current count for key
   */
  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      this.store.delete(key);
      return null;
    }

    return entry.count;
  }

  /**
   * Reset counter for key
   */
  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Get store size
   */
  getSize(): number {
    return this.store.size;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));
  }

  /**
   * Destroy store and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

/**
 * Redis rate limit store (placeholder)
 * For distributed deployments
 */
export class RedisRateLimitStore implements IRateLimitStore {
  // Placeholder for Redis implementation
  // In production, this would use redis client

  async increment(key: string, windowMs: number): Promise<number> {
    // TODO: Implement Redis INCR with EXPIRE
    throw new Error('Redis store not implemented');
  }

  async get(key: string): Promise<number | null> {
    // TODO: Implement Redis GET
    throw new Error('Redis store not implemented');
  }

  async reset(key: string): Promise<void> {
    // TODO: Implement Redis DEL
    throw new Error('Redis store not implemented');
  }

  async clear(): Promise<void> {
    // TODO: Implement Redis FLUSHDB
    throw new Error('Redis store not implemented');
  }
}
