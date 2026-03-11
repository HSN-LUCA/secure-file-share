/**
 * Rate Limiter Tests
 * Tests for rate limiting functionality
 */

import { RateLimiter, createIPRateLimiter, createDailyRateLimiter } from '../limiter';
import { InMemoryRateLimitStore } from '../store';

describe('RateLimiter', () => {
  let store: InMemoryRateLimitStore;
  let limiter: RateLimiter;

  beforeEach(() => {
    store = new InMemoryRateLimitStore();
    limiter = new RateLimiter(
      {
        enabled: true,
        windowMs: 1000, // 1 second for testing
        maxRequests: 3,
        keyGenerator: (req: any) => req.ip || 'unknown',
      },
      store
    );
  });

  afterEach(() => {
    store.destroy();
  });

  describe('checkLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should track multiple requests', async () => {
      const result1 = await limiter.checkLimit('test-key');
      const result2 = await limiter.checkLimit('test-key');
      const result3 = await limiter.checkLimit('test-key');

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should reject requests exceeding limit', async () => {
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');
      const result4 = await limiter.checkLimit('test-key');

      expect(result4.allowed).toBe(false);
      expect(result4.remaining).toBe(0);
      expect(result4.retryAfter).toBeDefined();
    });

    it('should reset after window expires', async () => {
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should handle different keys independently', async () => {
      await limiter.checkLimit('key1');
      await limiter.checkLimit('key1');
      await limiter.checkLimit('key1');

      const result = await limiter.checkLimit('key2');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });
  });

  describe('blockKey', () => {
    it('should block key for specified duration', async () => {
      await limiter.blockKey('test-key', 1000);

      const result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    it('should unblock key after duration expires', async () => {
      await limiter.blockKey('test-key', 500);

      // Wait for block to expire
      await new Promise(resolve => setTimeout(resolve, 600));

      const result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(true);
    });
  });

  describe('resetKey', () => {
    it('should reset counter for key', async () => {
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');
      await limiter.resetKey('test-key');

      const result = await limiter.checkLimit('test-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });
  });

  describe('violations', () => {
    it('should record violations', async () => {
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key'); // Violation

      const violations = limiter.getViolations();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].violationCount).toBe(1);
    });

    it('should increment violation count', async () => {
      for (let i = 0; i < 5; i++) {
        await limiter.checkLimit('test-key');
      }

      const violations = limiter.getViolations();
      expect(violations[0].violationCount).toBe(2);
    });

    it('should clear violations', async () => {
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');
      await limiter.checkLimit('test-key');

      limiter.clearViolations();
      const violations = limiter.getViolations();
      expect(violations.length).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should return statistics', async () => {
      await limiter.checkLimit('key1');
      await limiter.checkLimit('key2');
      await limiter.checkLimit('key1');
      await limiter.checkLimit('key1');
      await limiter.checkLimit('key1'); // Violation

      const stats = limiter.getStats();
      expect(stats.activeKeys).toBeGreaterThan(0);
      expect(stats.violations).toBeDefined();
    });
  });
});

describe('createIPRateLimiter', () => {
  it('should create IP-based rate limiter', async () => {
    const limiter = createIPRateLimiter(5);
    const result = await limiter.checkLimit('192.168.1.1');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});

describe('createDailyRateLimiter', () => {
  it('should create daily rate limiter', async () => {
    const limiter = createDailyRateLimiter(5);
    const result = await limiter.checkLimit('192.168.1.1:daily');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});

describe('InMemoryRateLimitStore', () => {
  let store: InMemoryRateLimitStore;

  beforeEach(() => {
    store = new InMemoryRateLimitStore();
  });

  afterEach(() => {
    store.destroy();
  });

  describe('increment', () => {
    it('should increment counter', async () => {
      const count1 = await store.increment('key1', 1000);
      const count2 = await store.increment('key1', 1000);

      expect(count1).toBe(1);
      expect(count2).toBe(2);
    });

    it('should reset counter after window expires', async () => {
      await store.increment('key1', 100);
      await new Promise(resolve => setTimeout(resolve, 150));

      const count = await store.increment('key1', 100);
      expect(count).toBe(1);
    });
  });

  describe('get', () => {
    it('should get current count', async () => {
      await store.increment('key1', 1000);
      const count = await store.get('key1');

      expect(count).toBe(1);
    });

    it('should return null for non-existent key', async () => {
      const count = await store.get('non-existent');
      expect(count).toBeNull();
    });

    it('should return null for expired entry', async () => {
      await store.increment('key1', 100);
      await new Promise(resolve => setTimeout(resolve, 150));

      const count = await store.get('key1');
      expect(count).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset counter', async () => {
      await store.increment('key1', 1000);
      await store.reset('key1');

      const count = await store.get('key1');
      expect(count).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all entries', async () => {
      await store.increment('key1', 1000);
      await store.increment('key2', 1000);
      await store.clear();

      const count1 = await store.get('key1');
      const count2 = await store.get('key2');

      expect(count1).toBeNull();
      expect(count2).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should cleanup expired entries', async () => {
      await store.increment('key1', 100);
      await store.increment('key2', 100);

      const initialSize = store.getSize();

      await new Promise(resolve => setTimeout(resolve, 150));

      // Trigger cleanup by incrementing another key
      await store.increment('key3', 1000);

      const finalSize = store.getSize();
      expect(finalSize).toBeLessThanOrEqual(initialSize);
    });
  });
});
