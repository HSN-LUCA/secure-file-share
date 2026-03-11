/**
 * Authentication Middleware
 * Verifies JWT tokens and extracts user information
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken as verifyAccessTokenJwt, DecodedToken } from '@/lib/auth/jwt';

// ============================================================================
// MIDDLEWARE TYPES
// ============================================================================

export interface AuthenticatedRequest extends NextRequest {
  user?: DecodedToken;
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Extract and verify JWT token from request
 * Looks for token in Authorization header: "Bearer <token>"
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Verify JWT token and extract user information
 */
export function verifyAccessToken(token: string): DecodedToken | null {
  return verifyAccessTokenJwt(token);
}

/**
 * Middleware to verify authentication
 * Returns 401 if token is missing or invalid
 */
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract token from request
      const token = extractTokenFromRequest(request);

      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Missing authentication token' },
          { status: 401 }
        );
      }

      // Verify token
      const user = verifyAccessToken(token);

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Attach user to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;

      // Call handler with authenticated request
      return await handler(authenticatedRequest);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

/**
 * Extract user from request (returns null if not authenticated)
 */
export function getUserFromRequest(request: NextRequest): DecodedToken | null {
  const token = extractTokenFromRequest(request);

  if (!token) {
    return null;
  }

  return verifyAccessToken(token);
}

/**
 * Check if request is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
  const user = getUserFromRequest(request);
  return user !== null;
}
