/**
 * Auth Verification Utility
 * Wrapper around authentication middleware for easier use
 */

import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/middleware';
import { DecodedToken } from '@/lib/auth/jwt';

export interface AuthResult {
  user: DecodedToken | null;
  error: string | null;
}

/**
 * Verify authentication from request
 * Returns user info if authenticated, null otherwise
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return {
        user: null,
        error: 'Unauthorized',
      };
    }

    return {
      user,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      error: 'Authentication failed',
    };
  }
}
