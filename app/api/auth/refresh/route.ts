/**
 * POST /api/auth/refresh
 * Token refresh endpoint
 * Exchanges a valid refresh token for a new access token
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken } from '@/lib/auth/jwt';
import { generateTokenPair } from '@/lib/auth/jwt';
import { getRefreshTokenByHash, revokeRefreshToken, storeRefreshToken } from '@/lib/auth/refresh-tokens';
import { createAnalytics } from '@/lib/db/queries';
import crypto from 'crypto';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Hash token for storage in database
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

// ============================================================================
// REFRESH ENDPOINT
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<RefreshResponse>> {
  try {
    // Parse request body
    let body: RefreshRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { refreshToken } = body;

    // ========================================================================
    // VALIDATION
    // ========================================================================

    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // ========================================================================
    // VERIFY REFRESH TOKEN
    // ========================================================================

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      // Log failed refresh attempt
      await createAnalytics({
        event_type: 'security',
        ip_address: getClientIp(request),
        metadata: {
          event: 'token_refresh_failed',
          reason: 'invalid_token',
        },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // ========================================================================
    // CHECK REFRESH TOKEN IN DATABASE
    // ========================================================================

    const tokenHash = hashToken(refreshToken);
    const storedTokenResult = await getRefreshTokenByHash(tokenHash);

    if (!storedTokenResult.data) {
      // Log failed refresh attempt
      await createAnalytics({
        event_type: 'security',
        user_id: decoded.userId,
        ip_address: getClientIp(request),
        metadata: {
          event: 'token_refresh_failed',
          reason: 'token_not_found_or_revoked',
        },
      });

      return NextResponse.json(
        { success: false, error: 'Refresh token has been revoked' },
        { status: 401 }
      );
    }

    if (storedTokenResult.error) {
      console.error('Database error checking refresh token:', storedTokenResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to refresh token' },
        { status: 500 }
      );
    }

    // ========================================================================
    // GENERATE NEW TOKEN PAIR
    // ========================================================================

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(
      decoded.userId,
      decoded.email
    );

    // ========================================================================
    // ROTATE REFRESH TOKEN
    // ========================================================================

    // Revoke old refresh token
    const revokeResult = await revokeRefreshToken(tokenHash);
    if (revokeResult.error) {
      console.error('Failed to revoke old refresh token:', revokeResult.error);
      // Continue anyway - new token is generated
    }

    // Store new refresh token
    const newTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const storeTokenResult = await storeRefreshToken({
      user_id: decoded.userId,
      token_hash: newTokenHash,
      expires_at: expiresAt.toISOString(),
    });

    if (storeTokenResult.error) {
      console.error('Failed to store new refresh token:', storeTokenResult.error);
      // Continue anyway - access token is still valid
    }

    // ========================================================================
    // LOG ANALYTICS
    // ========================================================================

    await createAnalytics({
      event_type: 'security',
      user_id: decoded.userId,
      ip_address: getClientIp(request),
      metadata: {
        event: 'token_refreshed',
      },
    });

    // ========================================================================
    // RETURN SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
