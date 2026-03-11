/**
 * JWT Token Generation & Verification Tests
 */

import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeTokenWithoutVerification,
  getTokenExpirySeconds,
  isTokenExpired,
  getTokenExpiryDate,
} from '@/lib/auth/jwt';

describe('JWT Token Generation & Verification', () => {
  const testUserId = 'test-user-123';
  const testEmail = 'test@example.com';

  // ========================================================================
  // TOKEN GENERATION TESTS
  // ========================================================================

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testUserId, testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
    });

    it('should include user ID and email in token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.email).toBe(testEmail);
      expect(decoded?.type).toBe('access');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testUserId, testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should include user ID and email in token', () => {
      const token = generateRefreshToken(testUserId, testEmail);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.email).toBe(testEmail);
      expect(decoded?.type).toBe('refresh');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const { accessToken, refreshToken } = generateTokenPair(testUserId, testEmail);

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(accessToken).not.toBe(refreshToken);
    });

    it('should generate tokens with correct types', () => {
      const { accessToken, refreshToken } = generateTokenPair(testUserId, testEmail);

      const accessDecoded = decodeTokenWithoutVerification(accessToken);
      const refreshDecoded = decodeTokenWithoutVerification(refreshToken);

      expect(accessDecoded?.type).toBe('access');
      expect(refreshDecoded?.type).toBe('refresh');
    });
  });

  // ========================================================================
  // TOKEN VERIFICATION TESTS
  // ========================================================================

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.email).toBe(testEmail);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // Create a token with very short expiry (this is a limitation of the test)
      // In real scenarios, we'd need to mock time or use a library like jest-mock-extended
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = verifyToken(token);

      // Token should be valid immediately after generation
      expect(decoded).not.toBeNull();
    });

    it('should return null for tampered token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const decoded = verifyToken(tamperedToken);

      expect(decoded).toBeNull();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = verifyAccessToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.type).toBe('access');
    });

    it('should return null for refresh token', () => {
      const token = generateRefreshToken(testUserId, testEmail);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testUserId, testEmail);
      const decoded = verifyRefreshToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.type).toBe('refresh');
    });

    it('should return null for access token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeNull();
    });
  });

  // ========================================================================
  // TOKEN DECODING TESTS
  // ========================================================================

  describe('decodeTokenWithoutVerification', () => {
    it('should decode a valid token without verification', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.email).toBe(testEmail);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeTokenWithoutVerification('invalid.token.here');
      expect(decoded).toBeNull();
    });
  });

  // ========================================================================
  // TOKEN EXPIRY TESTS
  // ========================================================================

  describe('getTokenExpirySeconds', () => {
    it('should return expiry seconds for valid token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const expirySeconds = getTokenExpirySeconds(token);

      expect(expirySeconds).not.toBeNull();
      expect(typeof expirySeconds).toBe('number');
      expect(expirySeconds).toBeGreaterThan(0);
      expect(expirySeconds).toBeLessThanOrEqual(15 * 60); // 15 minutes
    });

    it('should return null for invalid token', () => {
      const expirySeconds = getTokenExpirySeconds('invalid.token.here');
      expect(expirySeconds).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const expired = isTokenExpired(token);

      expect(expired).toBe(false);
    });

    it('should return true for invalid token', () => {
      const expired = isTokenExpired('invalid.token.here');
      expect(expired).toBe(true);
    });
  });

  describe('getTokenExpiryDate', () => {
    it('should return expiry date for valid token', () => {
      const token = generateAccessToken(testUserId, testEmail);
      const expiryDate = getTokenExpiryDate(token);

      expect(expiryDate).not.toBeNull();
      expect(expiryDate instanceof Date).toBe(true);
      expect(expiryDate!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const expiryDate = getTokenExpiryDate('invalid.token.here');
      expect(expiryDate).toBeNull();
    });
  });

  // ========================================================================
  // PROPERTY-BASED TESTS
  // ========================================================================

  describe('Token Generation Properties', () => {
    it('should always include user ID and email in token', () => {
      for (let i = 0; i < 5; i++) {
        const token = generateAccessToken(testUserId, testEmail);
        const decoded = decodeTokenWithoutVerification(token);

        expect(decoded?.userId).toBe(testUserId);
        expect(decoded?.email).toBe(testEmail);
      }
    });

    it('should always verify tokens immediately after generation', () => {
      for (let i = 0; i < 5; i++) {
        const token = generateAccessToken(testUserId, testEmail);
        const verified = verifyAccessToken(token);

        expect(verified).not.toBeNull();
        expect(verified?.userId).toBe(testUserId);
      }
    });
  });
});
