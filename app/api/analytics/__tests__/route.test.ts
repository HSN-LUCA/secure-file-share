/**
 * Analytics Query Functions Tests
 * Tests for analytics query functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  getDownloadStats,
  getFileTypeStats,
  getGeographicStats,
  getBotDetectionMetrics,
  getAnalyticsSummary,
} from '@/lib/db/queries';

describe('Analytics Query Functions', () => {
  describe('getDownloadStats', () => {
    it('should return download statistics structure', async () => {
      const result = await getDownloadStats();
      expect(result).toBeDefined();
      if (result.data) {
        expect(result.data.totalDownloads).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.data.downloadsPerDay)).toBe(true);
        expect(Array.isArray(result.data.mostDownloadedFiles)).toBe(true);
      }
    });
  });

  describe('getFileTypeStats', () => {
    it('should return file type statistics structure', async () => {
      const result = await getFileTypeStats();
      expect(result).toBeDefined();
      if (result.data) {
        expect(result.data.totalUploads).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.data.fileTypeDistribution)).toBe(true);
      }
    });
  });

  describe('getGeographicStats', () => {
    it('should return geographic statistics structure', async () => {
      const result = await getGeographicStats();
      expect(result).toBeDefined();
      if (result.data) {
        expect(result.data.totalCountries).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.data.topCountries)).toBe(true);
      }
    });
  });

  describe('getBotDetectionMetrics', () => {
    it('should return bot detection metrics structure', async () => {
      const result = await getBotDetectionMetrics();
      expect(result).toBeDefined();
      if (result.data) {
        expect(result.data.captchaAttempts).toBeGreaterThanOrEqual(0);
        expect(result.data.captchaSuccesses).toBeGreaterThanOrEqual(0);
        expect(result.data.captchaFailures).toBeGreaterThanOrEqual(0);
        expect(result.data.successRate).toBeGreaterThanOrEqual(0);
        expect(result.data.blockedIps).toBeGreaterThanOrEqual(0);
        expect(result.data.botDetectedEvents).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should return analytics summary structure', async () => {
      const result = await getAnalyticsSummary();
      expect(result).toBeDefined();
      if (result.data) {
        expect(result.data.totalUploads).toBeGreaterThanOrEqual(0);
        expect(result.data.totalDownloads).toBeGreaterThanOrEqual(0);
        expect(result.data.totalUsers).toBeGreaterThanOrEqual(0);
        expect(result.data.totalEvents).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
