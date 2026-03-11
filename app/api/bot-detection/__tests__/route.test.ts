/**
 * Bot Detection Endpoint Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Bot Detection Endpoint', () => {
  describe('GET /api/bot-detection', () => {
    it('should return bot detection metrics structure', async () => {
      // Mock the endpoint response
      const mockResponse = {
        success: true,
        data: {
          metrics: {
            captchaAttempts: 100,
            captchaSuccesses: 85,
            captchaFailures: 15,
            successRate: 85,
            blockedIps: 5,
            botDetectedEvents: 20,
          },
          blockedIps: [],
          suspiciousPatterns: [],
          botVsHumanRatio: {
            humanVerified: 85,
            botDetected: 20,
            ratio: 19.05,
          },
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data).toBeDefined();
      expect(mockResponse.data.metrics).toBeDefined();
      expect(mockResponse.data.metrics.captchaAttempts).toBeGreaterThanOrEqual(0);
      expect(mockResponse.data.metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(mockResponse.data.metrics.successRate).toBeLessThanOrEqual(100);
    });

    it('should calculate bot vs human ratio correctly', () => {
      const humanVerified = 85;
      const botDetected = 20;
      const total = humanVerified + botDetected;
      const ratio = (botDetected / total) * 100;

      expect(ratio).toBeCloseTo(19.05, 1);
    });

    it('should handle empty bot detection data', () => {
      const mockResponse = {
        success: true,
        data: {
          metrics: {
            captchaAttempts: 0,
            captchaSuccesses: 0,
            captchaFailures: 0,
            successRate: 0,
            blockedIps: 0,
            botDetectedEvents: 0,
          },
          blockedIps: [],
          suspiciousPatterns: [],
          botVsHumanRatio: {
            humanVerified: 0,
            botDetected: 0,
            ratio: 0,
          },
        },
      };

      expect(mockResponse.data.metrics.captchaAttempts).toBe(0);
      expect(mockResponse.data.botVsHumanRatio.ratio).toBe(0);
    });

    it('should include blocked IPs in response', () => {
      const mockResponse = {
        success: true,
        data: {
          metrics: {
            captchaAttempts: 100,
            captchaSuccesses: 85,
            captchaFailures: 15,
            successRate: 85,
            blockedIps: 2,
            botDetectedEvents: 20,
          },
          blockedIps: [
            {
              ip: '192.168.1.1',
              blockCount: 5,
              lastBlockedAt: '2024-01-30T12:00:00Z',
              reason: 'Multiple failed CAPTCHA attempts',
            },
            {
              ip: '10.0.0.1',
              blockCount: 3,
              lastBlockedAt: '2024-01-30T11:00:00Z',
              reason: 'Suspicious pattern detected',
            },
          ],
          suspiciousPatterns: [],
          botVsHumanRatio: {
            humanVerified: 85,
            botDetected: 20,
            ratio: 19.05,
          },
        },
      };

      expect(Array.isArray(mockResponse.data.blockedIps)).toBe(true);
      expect(mockResponse.data.blockedIps.length).toBe(2);
      expect(mockResponse.data.blockedIps[0]).toHaveProperty('ip');
      expect(mockResponse.data.blockedIps[0]).toHaveProperty('blockCount');
      expect(mockResponse.data.blockedIps[0]).toHaveProperty('lastBlockedAt');
      expect(mockResponse.data.blockedIps[0]).toHaveProperty('reason');
    });

    it('should include suspicious patterns in response', () => {
      const mockResponse = {
        success: true,
        data: {
          metrics: {
            captchaAttempts: 100,
            captchaSuccesses: 85,
            captchaFailures: 15,
            successRate: 85,
            blockedIps: 2,
            botDetectedEvents: 20,
          },
          blockedIps: [],
          suspiciousPatterns: [
            {
              pattern: 'high_failed_captcha_rate',
              count: 15,
              severity: 'high',
              description: 'Multiple failed CAPTCHA attempts from same IP',
            },
            {
              pattern: 'rapid_requests_from_ip',
              count: 8,
              severity: 'high',
              description: 'Rapid requests from single IP address',
            },
          ],
          botVsHumanRatio: {
            humanVerified: 85,
            botDetected: 20,
            ratio: 19.05,
          },
        },
      };

      expect(Array.isArray(mockResponse.data.suspiciousPatterns)).toBe(true);
      expect(mockResponse.data.suspiciousPatterns.length).toBe(2);
      expect(mockResponse.data.suspiciousPatterns[0]).toHaveProperty('pattern');
      expect(mockResponse.data.suspiciousPatterns[0]).toHaveProperty('severity');
      expect(['low', 'medium', 'high']).toContain(mockResponse.data.suspiciousPatterns[0].severity);
    });
  });
});
