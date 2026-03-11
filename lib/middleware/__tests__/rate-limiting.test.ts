/**
 * Rate Limiting Middleware Tests
 * Unit tests for rate limiting functionality
 */

import {
  createRateLimitingMiddleware,
  getClientIp,
  createRateLimitErrorResponse,
} from '../rate-limiting';
import { NextRequest } from 'next/server';

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
  }),
}));

describe('Rate Limiting Middleware', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: new Map([
        ['x-forwarded-for', '192.168.1.1'],
        ['user-agent', 'Mozilla/5.0'],
      ]),
    };
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const ip = getClientIp(mockRequest as NextRequest);
      expect(ip).toBe('192.168.1.1');
    });

    it('should handle multiple IPs in x-forwarded-for', () => {
      mockRequest.headers = new Map([
        ['x-forwarded-for', '192.168.1.1, 10.0.0.1, 172.16.0.1'],
      ]);

      const ip = getClientIp(mockRequest as NextRequest);
      expect(ip).toBe('192.168.1.1');
    });

    it('should return default IP if header missing', () => {
      mockRequest.headers = new Map();

      const ip = getClientIp(mockRequest as NextRequest);
      expect(ip).toBe('0.0.0.0');
    });
  });

  describe('Rate Limit Enforcement', () => {
    it('should allow requests within limit', async () => {
      const middleware = createRateLimitingMiddleware({
        uploadsPerMinute: 5,
        uploadsPerDay: 10,
        enableLogging: false,
      });

      const result = await middleware.checkUploadLimit(mockRequest as NextRequest);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should reject requests exceeding per-minute limit', async () => {
      const middleware = createRateLimitingMiddleware({
        uploadsPerMinute: 1,
        uploadsPerDay: 100,
        enableLogging: false,
      });

      // First request should pass
      let result = await middleware.checkUploadLimit(mockRequest as NextRequest);
      expect(result.allowed).toBe(true);

      // Second request should fail
      result = await middleware.checkUploadLimit(mockRequest as NextRequest);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('minute');
    });

    it('should reject requests exceeding per-day limit', async () => {
      const middleware = createRateLimitingMiddleware({
        uploadsPerMinute: 100,
        uploadsPerDay: 1,
        enableLogging: false,
      });

      // First request should pass
      let result = await middleware.checkUploadLimit(mockRequest as NextRequest);
      expect(result.allowed).toBe(true);

      // Second request should fail
      result = await middleware.checkUploadLimit(mockRequest as NextRequest);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('day');
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset per-minute limit after timeout', async () => {
      const middleware = createRateLimitingMiddleware({
        uploadsPerMinute: 1,
        uploadsPerDay: 100,
        enableLogging: false,
      });

      // First request should pass
      let result = await middleware.checkUploadLimit(mockRequest as NextRequest);
      expect(result.allowed).toBe(true);

      // Wait for minute to pass (simulated)
      jest.useFakeTimers();
      jest.advanceTimersByTime(61 * 1000);

      // Next request should pass again
      result = await middleware.checkUploadLimit(mockRequest as NextRequest);
      expect(result.allowed).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('Different IPs', () => {
    it('should track rate limits per IP', async () => {
      const middleware = createRateLimitingMiddleware({
        uploadsPerMinute: 1,
        uploadsPerDay: 100,
        enableLogging: false,
      });

      // First IP
      let result = await middleware.checkUploadLimit(mockRequest as NextRequest);
      expect(result.allowed).toBe(true);

      // Second request from same IP should fail
      result = await middleware.checkUploadLimit(mockRequest as NextRequest);
      expect(result.allowed).toBe(false);

      // Different IP should pass
      mockRequest.headers = new Map([
        ['x-forwarded-for', '10.0.0.1'],
      ]);

      result = await middleware.checkUploadLimit(mockRequest as NextRequest);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Error Response', () => {
    it('should create proper rate limit error response', () => {
      const rateLimitResult = {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfter: 60,
      };

      const response = createRateLimitErrorResponse(rateLimitResult);

      expect(response.status).toBe(429);
      expect(response.headers.get('retry-after')).toBe('60');
    });

    it('should include error message in response body', async () => {
      const rateLimitResult = {
        allowed: false,
        reason: 'Too many requests',
        retryAfter: 30,
      };

      const response = createRateLimitErrorResponse(rateLimitResult);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many requests');
    });
  });

  describe('Logging', () => {
    it('should log rate limit events when enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const middleware = createRateLimitingMiddleware({
        uploadsPerMinute: 1,
        uploadsPerDay: 100,
        enableLogging: true,
      });

      await middleware.checkUploadLimit(mockRequest as NextRequest);
      await middleware.checkUploadLimit(mockRequest as NextRequest);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not log when disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const middleware = createRateLimitingMiddleware({
        uploadsPerMinute: 1,
        uploadsPerDay: 100,
        enableLogging: false,
      });

      await middleware.checkUploadLimit(mockRequest as NextRequest);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Remaining Requests', () => {
    it('should return remaining requests count', async () => {
      const middleware = createRateLimitingMiddleware({
        uploadsPerMinute: 5,
        uploadsPerDay: 100,
        enableLogging: false,
      });

      const result = await middleware.checkUploadLimit(mockRequest as NextRequest);

      expect(result.remaining).toBeDefined();
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.remaining).toBeLessThanOrEqual(5);
    });
  });
});
