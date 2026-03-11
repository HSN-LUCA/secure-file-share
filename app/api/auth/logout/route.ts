/**
 * POST /api/auth/logout
 * User logout endpoint
 * Revokes refresh tokens and invalidates session
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromRequest, verifyAccessToken } from '@/lib/auth/middleware';
import { revokeAllUserRefreshTokens } from '@/lib/auth/refresh-tokens';
import { createAnalytics } from '@/lib/db/queries';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface LogoutResponse {
  success: boolean;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

// ============================================================================
// LOGOUT ENDPOINT
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<LogoutResponse>> {
  try {
    // ========================================================================
    // EXTRACT AND VERIFY TOKEN
    // ========================================================================

    const token = extractTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    const user = verifyAccessToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // ========================================================================
    // REVOKE ALL REFRESH TOKENS
    // ========================================================================

    const revokeResult = await revokeAllUserRefreshTokens(user.userId);

    if (revokeResult.error) {
      console.error('Failed to revoke refresh tokens:', revokeResult.error);
      // Continue anyway - logout is still successful
    }

    // ========================================================================
    // LOG ANALYTICS
    // ========================================================================

    await createAnalytics({
      event_type: 'security',
      user_id: user.userId,
      ip_address: getClientIp(request),
      metadata: {
        event: 'user_logout',
      },
    });

    // ========================================================================
    // RETURN SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
