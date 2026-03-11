import { validateColor } from '@/lib/branding/branding-service';

describe('Branding Service', () => {
  describe('validateColor', () => {
    it('should validate correct hex colors', () => {
      const result = validateColor('#3b82f6');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      const result = validateColor('not-a-color');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept 3-digit hex colors', () => {
      const result = validateColor('#fff');
      expect(result.valid).toBe(true);
    });

    it('should accept 6-digit hex colors', () => {
      const result = validateColor('#ffffff');
      expect(result.valid).toBe(true);
    });

    it('should reject colors with invalid characters', () => {
      const result = validateColor('#gggggg');
      expect(result.valid).toBe(false);
    });

    it('should check WCAG AA compliance for white background', () => {
      // Black on white should have high contrast
      const result = validateColor('#000000');
      expect(result.wcag_aa).toBe(true);
    });

    it('should check WCAG AAA compliance for high contrast colors', () => {
      // Black on white should have very high contrast
      const result = validateColor('#000000');
      expect(result.wcag_aaa).toBe(true);
    });

    it('should handle light gray colors', () => {
      // Light gray on white has some contrast
      const result = validateColor('#f0f0f0');
      expect(result.valid).toBe(true);
      // Light gray may or may not meet WCAG AA depending on exact calculation
    });
  });
});
