/**
 * GET /api/auth/me
 * Get current user endpoint
 * Returns the authenticated user's information
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromRequest, verifyAccessToken } from '@/lib/auth/middleware';
import { getUserById } from '@/lib/db/queries';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface MeResponse {
  success: boolean;
  data?: {
    userId: string;
    email: string;
    plan: string;
    isActive: boolean;
    createdAt: string;
    subscriptionExpiresAt: string | null;
  };
  error?: string;
}

// ============================================================================
// GET CURRENT USER ENDPOINT
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<MeResponse>> {
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
    // GET USER FROM DATABASE
    // ========================================================================

    const userResult = await getUserById(user.userId);

    if (!userResult.data) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (userResult.error) {
      console.error('Database error getting user:', userResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to get user' },
        { status: 500 }
      );
    }

    const dbUser = userResult.data;

    // ========================================================================
    // RETURN USER DATA
    // ========================================================================

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: dbUser.id,
          email: dbUser.email,
          plan: dbUser.plan,
          isActive: dbUser.is_active,
          createdAt: dbUser.created_at,
          subscriptionExpiresAt: dbUser.subscription_expires_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
