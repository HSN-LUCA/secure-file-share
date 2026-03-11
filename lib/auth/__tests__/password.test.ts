/**
 * Password Validation & Hashing Tests
 */

import {
  validatePasswordStrength,
  hashPassword,
  comparePassword,
  validatePasswordFormat,
} from '@/lib/auth/password';

describe('Password Validation & Hashing', () => {
  // ========================================================================
  // PASSWORD STRENGTH VALIDATION TESTS
  // ========================================================================

  describe('validatePasswordStrength', () => {
    it('should reject non-string passwords', () => {
      const result = validatePasswordStrength(123);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be a string');
    });

    it('should reject empty passwords', () => {
      const result = validatePasswordStrength('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password cannot be empty');
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords longer than 128 characters', () => {
      const longPassword = 'A' + 'a1!' + 'x'.repeat(125);
      const result = validatePasswordStrength(longPassword);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must not exceed 128 characters');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePasswordStrength('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)');
    });

    it('should accept valid passwords', () => {
      const validPasswords = [
        'ValidPass123!',
        'MyPassword@456',
        'Test$ecure789',
        'Secure*Pass999',
        'Complex&Pass123',
      ];

      validPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should return multiple errors for invalid passwords', () => {
      const result = validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  // ========================================================================
  // PASSWORD HASHING & COMPARISON TESTS
  // ========================================================================

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'ValidPass123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for invalid input', async () => {
      try {
        await hashPassword('');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password);
      const match = await comparePassword(password, hash);

      expect(match).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password);
      const match = await comparePassword('DifferentPass456!', hash);

      expect(match).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password);
      const match = await comparePassword('', hash);

      expect(match).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const password = 'ValidPass123!';
      const hash = await hashPassword(password);
      const match = await comparePassword('validpass123!', hash);

      expect(match).toBe(false);
    });
  });

  // ========================================================================
  // PASSWORD FORMAT VALIDATION TESTS
  // ========================================================================

  describe('validatePasswordFormat', () => {
    it('should return true for valid password format', () => {
      const result = validatePasswordFormat('ValidPass123!');
      expect(result).toBe(true);
    });

    it('should return false for invalid password format', () => {
      const result = validatePasswordFormat('weak');
      expect(result).toBe(false);
    });

    it('should return false for non-string input', () => {
      const result = validatePasswordFormat(123);
      expect(result).toBe(false);
    });
  });

  // ========================================================================
  // PROPERTY-BASED TESTS
  // ========================================================================

  describe('Password Hashing Properties', () => {
    it('should never return the same hash for the same password (probabilistic)', async () => {
      const password = 'ValidPass123!';
      const hashes = await Promise.all([
        hashPassword(password),
        hashPassword(password),
        hashPassword(password),
      ]);

      // All hashes should be different (extremely high probability)
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(3);
    });

    it('should always verify correct password regardless of hash', async () => {
      const password = 'ValidPass123!';
      const hashes = await Promise.all([
        hashPassword(password),
        hashPassword(password),
        hashPassword(password),
      ]);

      for (const hash of hashes) {
        const match = await comparePassword(password, hash);
        expect(match).toBe(true);
      }
    });
  });
});
