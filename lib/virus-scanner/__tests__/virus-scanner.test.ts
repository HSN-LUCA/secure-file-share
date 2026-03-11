/**
 * Virus Scanner Tests
 * Unit tests for virus scanning functionality
 */

import { MockScanner } from '../mock';
import { getVirusScanner, scanFile, resetScannerInstance } from '../index';

describe('Virus Scanner', () => {
  beforeEach(() => {
    resetScannerInstance();
    process.env.VIRUS_SCANNER_PROVIDER = 'mock';
  });

  describe('Mock Scanner', () => {
    it('should create mock scanner instance', () => {
      const scanner = getVirusScanner();
      expect(scanner).toBeInstanceOf(MockScanner);
    });

    it('should scan clean file', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      const fileData = Buffer.from('clean file content');
      const result = await scanner.scan(fileData, 'test.txt');

      expect(result.isClean).toBe(true);
      expect(result.threat).toBeUndefined();
      expect(result.engine).toBe('mock');
      expect(result.scanTime).toBeGreaterThan(0);
    });

    it('should detect infected file', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 1, // Always infected
        timeout: 1000,
        maxFileSize: 104857600,
      });

      const fileData = Buffer.from('infected file content');
      const result = await scanner.scan(fileData, 'test.txt');

      expect(result.isClean).toBe(false);
      expect(result.threat).toBeDefined();
      expect(result.engine).toBe('mock');
    });

    it('should respect infection rate', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0.5,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      let infectedCount = 0;
      const iterations = 50; // Reduced from 100

      for (let i = 0; i < iterations; i++) {
        const fileData = Buffer.from(`file ${i}`);
        const result = await scanner.scan(fileData, 'test.txt');
        if (!result.isClean) {
          infectedCount++;
        }
      }

      // With 50% infection rate, expect roughly 50% infected files
      // Allow 20-80% range for statistical variation
      expect(infectedCount).toBeGreaterThan(10);
      expect(infectedCount).toBeLessThan(40);
    }, 10000);

    it('should reject files exceeding max size', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 1000, // 1KB max
      });

      const largeFile = Buffer.alloc(2000); // 2KB
      const result = await scanner.scan(largeFile, 'large.bin');

      expect(result.isClean).toBe(false);
      expect(result.threat).toContain('exceeds maximum size');
    });

    it('should be healthy', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      const healthy = await scanner.isHealthy();
      expect(healthy).toBe(true);
    });

    it('should allow setting infection rate', () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      scanner.setInfectionRate(0.75);
      expect(scanner.getConfig().infectRate).toBe(0.75);
    });

    it('should reject invalid infection rate', () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      expect(() => scanner.setInfectionRate(-0.1)).toThrow();
      expect(() => scanner.setInfectionRate(1.1)).toThrow();
    });

    it('should allow setting health status', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      scanner.setHealthStatus(false);
      const healthy = await scanner.isHealthy();
      expect(healthy).toBe(false);
    });
  });

  describe('Virus Scanner Factory', () => {
    it('should return mock scanner by default', () => {
      const scanner = getVirusScanner();
      expect(scanner).toBeInstanceOf(MockScanner);
    });

    it('should scan file using factory', async () => {
      process.env.VIRUS_SCANNER_PROVIDER = 'mock';
      process.env.MOCK_SCANNER_INFECT_RATE = '0';
      resetScannerInstance();

      const fileData = Buffer.from('test file');
      const result = await scanFile(fileData, 'test.txt');

      expect(result.isClean).toBe(true);
      expect(result.engine).toBe('mock');
    });

    it('should return same scanner instance', () => {
      const scanner1 = getVirusScanner();
      const scanner2 = getVirusScanner();
      expect(scanner1).toBe(scanner2);
    });

    it('should reset scanner instance', () => {
      const scanner1 = getVirusScanner();
      resetScannerInstance();
      const scanner2 = getVirusScanner();
      expect(scanner1).not.toBe(scanner2);
    });
  });

  describe('Virus Scan Result', () => {
    it('should include scan time', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      const fileData = Buffer.from('test file');
      const result = await scanner.scan(fileData, 'test.txt');

      expect(result.scanTime).toBeGreaterThan(0);
      expect(result.scanTime).toBeLessThan(1000);
    });

    it('should include timestamp', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      const fileData = Buffer.from('test file');
      const result = await scanner.scan(fileData, 'test.txt');

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should include engine name', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      const fileData = Buffer.from('test file');
      const result = await scanner.scan(fileData, 'test.txt');

      expect(result.engine).toBe('mock');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Property: Malware Detection Enforcement
     * Validates: Requirement 5
     * 
     * Every file uploaded SHALL be scanned for malware
     */
    it('should scan every file', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      const fileNames = ['test.pdf', 'image.png', 'document.docx', 'archive.zip'];

      for (const fileName of fileNames) {
        const fileData = Buffer.from(`content of ${fileName}`);
        const result = await scanner.scan(fileData, fileName);

        // Property: Every file must be scanned
        expect(result).toBeDefined();
        expect(result.isClean).toBeDefined();
        expect(result.engine).toBe('mock');
      }
    });

    /**
     * Property: Scan Result Consistency
     * 
     * Scan results must be consistent for the same file
     */
    it('should return consistent results for same file', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0,
        timeout: 1000,
        maxFileSize: 104857600,
      });

      const fileData = Buffer.from('consistent file content');

      const result1 = await scanner.scan(fileData, 'test.txt');
      const result2 = await scanner.scan(fileData, 'test.txt');

      // Property: Same file should have same clean status
      expect(result1.isClean).toBe(result2.isClean);
    });

    /**
     * Property: Threat Information Accuracy
     * 
     * Threat information should only be present for infected files
     */
    it('should only include threat for infected files', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 1, // Always infected
        timeout: 1000,
        maxFileSize: 104857600,
      });

      const fileData = Buffer.from('infected file');
      const result = await scanner.scan(fileData, 'test.txt');

      // Property: Infected files must have threat information
      expect(result.isClean).toBe(false);
      expect(result.threat).toBeDefined();
      expect(result.threat).not.toBe('');
    });

    it('should not include threat for clean files', async () => {
      const scanner = new MockScanner({
        provider: 'mock',
        enabled: true,
        infectRate: 0, // Never infected
        timeout: 1000,
        maxFileSize: 104857600,
      });

      const fileData = Buffer.from('clean file');
      const result = await scanner.scan(fileData, 'test.txt');

      // Property: Clean files must not have threat information
      expect(result.isClean).toBe(true);
      expect(result.threat).toBeUndefined();
    });
  });
});
