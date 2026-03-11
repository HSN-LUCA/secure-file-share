import fc from 'fast-check';
import { validateColor } from '@/lib/branding/branding-service';

/**
 * Property-Based Tests for Branding Color Validation
 * **Validates: Requirements 31.2**
 */

describe('Branding Color Validation Properties', () => {
  /**
   * Property 1: Valid hex colors should always be recognized as valid
   */
  it('should recognize all valid hex colors as valid', () => {
    fc.assert(
      fc.property(fc.hexaString({ minLength: 6, maxLength: 6 }), (hexStr) => {
        const color = `#${hexStr}`;
        const result = validateColor(color);
        expect(result.valid).toBe(true);
      })
    );
  });

  /**
   * Property 2: Invalid hex colors should always be rejected
   */
  it('should reject all invalid hex color formats', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.oneof(fc.constant('x'), fc.constant('y'), fc.constant('z'), fc.integer({ min: 0, max: 9 }).map(String)), { minLength: 1, maxLength: 10 }),
        (invalidHex) => {
          const color = `#${invalidHex}`;
          // Skip if it happens to be valid
          if (/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(color)) {
            return true;
          }
          const result = validateColor(color);
          expect(result.valid).toBe(false);
        }
      )
    );
  });

  /**
   * Property 3: Color validation should be deterministic
   */
  it('should return consistent results for the same color', () => {
    fc.assert(
      fc.property(fc.hexaString({ minLength: 6, maxLength: 6 }), (hexStr) => {
        const color = `#${hexStr}`;
        const result1 = validateColor(color);
        const result2 = validateColor(color);
        expect(result1.valid).toBe(result2.valid);
        expect(result1.wcag_aa).toBe(result2.wcag_aa);
        expect(result1.wcag_aaa).toBe(result2.wcag_aaa);
      })
    );
  });

  /**
   * Property 4: Black should always have high contrast
   */
  it('should recognize black as having high contrast', () => {
    const result = validateColor('#000000');
    expect(result.valid).toBe(true);
    expect(result.wcag_aa).toBe(true);
    expect(result.wcag_aaa).toBe(true);
  });

  /**
   * Property 5: White should always have high contrast
   */
  it('should recognize white as having high contrast', () => {
    const result = validateColor('#ffffff');
    expect(result.valid).toBe(true);
    expect(result.wcag_aa).toBe(true);
    expect(result.wcag_aaa).toBe(true);
  });

  /**
   * Property 6: Color validation should handle case-insensitive hex values
   */
  it('should handle both uppercase and lowercase hex values', () => {
    fc.assert(
      fc.property(fc.hexaString({ minLength: 6, maxLength: 6 }), (hexStr) => {
        const colorLower = `#${hexStr.toLowerCase()}`;
        const colorUpper = `#${hexStr.toUpperCase()}`;
        const resultLower = validateColor(colorLower);
        const resultUpper = validateColor(colorUpper);
        expect(resultLower.valid).toBe(resultUpper.valid);
        expect(resultLower.wcag_aa).toBe(resultUpper.wcag_aa);
        expect(resultLower.wcag_aaa).toBe(resultUpper.wcag_aaa);
      })
    );
  });

  /**
   * Property 7: 3-digit hex colors should be valid
   */
  it('should accept 3-digit hex color format', () => {
    fc.assert(
      fc.property(fc.hexaString({ minLength: 3, maxLength: 3 }), (hexStr) => {
        const color = `#${hexStr}`;
        const result = validateColor(color);
        expect(result.valid).toBe(true);
      })
    );
  });

  /**
   * Property 8: Colors missing hash prefix should be invalid
   */
  it('should reject colors without hash prefix', () => {
    fc.assert(
      fc.property(fc.hexaString({ minLength: 6, maxLength: 6 }), (hexStr) => {
        const result = validateColor(hexStr); // No # prefix
        expect(result.valid).toBe(false);
      })
    );
  });
});
