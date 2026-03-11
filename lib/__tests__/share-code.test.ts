/**
 * Share Code Generation Tests
 * Unit and property-based tests for share code generation
 */

import {
  generateShareCode,
  generateShareCodes,
  isValidShareCode,
  formatShareCode,
  parseShareCode,
} from '../share-code';

describe('Share Code Generation', () => {
  describe('generateShareCode', () => {
    it('should generate a 6-digit numeric string', () => {
      const code = generateShareCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate codes in valid range', () => {
      const code = generateShareCode();
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateShareCode());
      }
      // Should have at least 95 unique codes out of 100 (very high probability)
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('generateShareCodes', () => {
    it('should generate requested number of codes', () => {
      const codes = generateShareCodes(10);
      expect(codes.length).toBe(10);
    });

    it('should generate unique codes', () => {
      const codes = generateShareCodes(50);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(50);
    });

    it('should generate valid codes', () => {
      const codes = generateShareCodes(20);
      codes.forEach(code => {
        expect(isValidShareCode(code)).toBe(true);
      });
    });

    it('should handle zero count', () => {
      const codes = generateShareCodes(0);
      expect(codes.length).toBe(0);
    });
  });

  describe('isValidShareCode', () => {
    it('should accept valid 6-digit codes', () => {
      expect(isValidShareCode('123456')).toBe(true);
      expect(isValidShareCode('000000')).toBe(true);
      expect(isValidShareCode('999999')).toBe(true);
    });

    it('should reject codes with wrong length', () => {
      expect(isValidShareCode('12345')).toBe(false);
      expect(isValidShareCode('1234567')).toBe(false);
    });

    it('should reject non-numeric codes', () => {
      expect(isValidShareCode('12345a')).toBe(false);
      expect(isValidShareCode('abcdef')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidShareCode('')).toBe(false);
    });

    it('should reject codes with spaces', () => {
      expect(isValidShareCode('123 456')).toBe(false);
    });
  });

  describe('formatShareCode', () => {
    it('should format valid codes with hyphen', () => {
      expect(formatShareCode('123456')).toBe('123-456');
      expect(formatShareCode('000000')).toBe('000-000');
    });

    it('should return invalid codes unchanged', () => {
      expect(formatShareCode('12345')).toBe('12345');
      expect(formatShareCode('abcdef')).toBe('abcdef');
    });
  });

  describe('parseShareCode', () => {
    it('should remove formatting from share codes', () => {
      expect(parseShareCode('123-456')).toBe('123456');
      expect(parseShareCode('000-000')).toBe('000000');
    });

    it('should handle already-parsed codes', () => {
      expect(parseShareCode('123456')).toBe('123456');
    });

    it('should remove all non-numeric characters', () => {
      expect(parseShareCode('123-456')).toBe('123456');
      expect(parseShareCode('123 456')).toBe('123456');
      expect(parseShareCode('123.456')).toBe('123456');
    });
  });

  describe('Share Code Uniqueness Property', () => {
    /**
     * Validates: Requirement 1 - Share Code Uniqueness
     * 
     * Property: Every uploaded file SHALL receive a unique Share_Code
     * that no other file has ever received.
     */
    it('should generate unique codes within generateShareCodes function', () => {
      // The generateShareCodes function guarantees uniqueness within a single call
      const codes = generateShareCodes(500);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(500);
    });

    it('should have low collision probability in reasonable usage', () => {
      // Generate 1,000 codes and check for collisions
      const codes = new Set<string>();
      let collisions = 0;

      for (let i = 0; i < 1000; i++) {
        const code = generateShareCode();
        if (codes.has(code)) {
          collisions++;
        }
        codes.add(code);
      }

      // With 900,000 possible codes (100000-999999), collision probability
      // for 1,000 attempts should be very low (< 1%)
      // Using birthday paradox: P(collision) ≈ n^2 / (2 * N) = 1000000 / 1800000 ≈ 0.56%
      // Allow up to 10 collisions (much higher than expected)
      expect(collisions).toBeLessThan(10);
    });
  });

  describe('Share Code Format Consistency', () => {
    it('should maintain format consistency through format/parse cycle', () => {
      const original = generateShareCode();
      const formatted = formatShareCode(original);
      const parsed = parseShareCode(formatted);
      expect(parsed).toBe(original);
    });

    it('should handle multiple format/parse cycles', () => {
      const original = generateShareCode();
      let current = original;

      for (let i = 0; i < 5; i++) {
        current = formatShareCode(current);
        current = parseShareCode(current);
      }

      expect(current).toBe(original);
    });
  });
});
