/**
 * JWT Token Generation & Verification
 * Handles access tokens and refresh tokens
 */

import jwt from 'jsonwebtoken';
import { getEnvVar } from '@/lib/env';

// ============================================================================
// TOKEN TYPES & INTERFACES
// ============================================================================

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface DecodedToken {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// ============================================================================
// TOKEN CONFIGURATION
// ============================================================================

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

/**
 * Get JWT secret from environment
 */
function getJwtSecret(): string {
  try {
    const secret = getEnvVar('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return secret;
  } catch (error) {
    // In test environment, use a default secret
    if (process.env.NODE_ENV === 'test') {
      return process.env.JWT_SECRET || 'test-jwt-secret-min-32-characters-long-for-testing';
    }
    throw error;
  }
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate access token
 * Requirement: Access token with 15 minutes expiry
 */
export function generateAccessToken(userId: string, email: string): string {
  const payload: TokenPayload = {
    userId,
    email,
    type: 'access',
  };

  try {
    const token = jwt.sign(payload, getJwtSecret(), {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });
    return token;
  } catch (error) {
    throw new Error(`Failed to generate access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate refresh token
 * Requirement: Refresh token with 7 days expiry
 */
export function generateRefreshToken(userId: string, email: string): string {
  const payload: TokenPayload = {
    userId,
    email,
    type: 'refresh',
  };

  try {
    const token = jwt.sign(payload, getJwtSecret(), {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });
    return token;
  } catch (error) {
    throw new Error(`Failed to generate refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, email: string): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email),
  };
}

// ============================================================================
// TOKEN VERIFICATION & DECODING
// ============================================================================

/**
 * Verify and decode token
 */
export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    });

    if (typeof decoded === 'object' && decoded !== null) {
      return decoded as DecodedToken;
    }

    return null;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Verify access token specifically
 */
export function verifyAccessToken(token: string): DecodedToken | null {
  const decoded = verifyToken(token);

  if (decoded && decoded.type === 'access') {
    return decoded;
  }

  return null;
}

/**
 * Verify refresh token specifically
 */
export function verifyRefreshToken(token: string): DecodedToken | null {
  const decoded = verifyToken(token);

  if (decoded && decoded.type === 'refresh') {
    return decoded;
  }

  return null;
}

/**
 * Decode token without verification (for debugging)
 * WARNING: Only use for debugging, never trust unverified tokens
 */
export function decodeTokenWithoutVerification(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token);

    if (typeof decoded === 'object' && decoded !== null) {
      return decoded as DecodedToken;
    }

    return null;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// TOKEN EXPIRY HELPERS
// ============================================================================

/**
 * Get token expiry time in seconds from now
 */
export function getTokenExpirySeconds(token: string): number | null {
  const decoded = decodeTokenWithoutVerification(token);

  if (!decoded || !decoded.exp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const expirySeconds = decoded.exp - now;

  return expirySeconds > 0 ? expirySeconds : 0;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expirySeconds = getTokenExpirySeconds(token);
  return expirySeconds === null || expirySeconds <= 0;
}

/**
 * Get token expiry date
 */
export function getTokenExpiryDate(token: string): Date | null {
  const decoded = decodeTokenWithoutVerification(token);

  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
}
