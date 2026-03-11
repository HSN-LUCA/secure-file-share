/**
 * GET /api/payments/subscription
 * Returns current subscription status for authenticated user
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getUserById } from '@/lib/db/queries';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface SubscriptionResponse {
  success: boolean;
  data?: {
    plan: string;
    subscriptionExpiresAt: string | null;
    isActive: boolean;
    daysRemaining: number | null;
  };
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate days remaining until subscription expires
 */
function calculateDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) {
    return null;
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Check if subscription is active
 */
function isSubscriptionActive(plan: string, expiresAt: string | null): boolean {
  if (plan === 'free') {
    return false;
  }

  if (!expiresAt) {
    return false;
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();

  return expirationDate > now;
}

// ============================================================================
// SUBSCRIPTION ENDPOINT
// ============================================================================

async function handler(request: AuthenticatedRequest): Promise<NextResponse<SubscriptionResponse>> {
  try {
    // Get authenticated user
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // ========================================================================
    // GET USER DETAILS
    // ========================================================================

    const userResult = await getUserById(user.userId);

    if (!userResult.data) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userResult.data;

    // ========================================================================
    // BUILD RESPONSE
    // ========================================================================

    const isActive = isSubscriptionActive(userData.plan, userData.subscription_expires_at);
    const daysRemaining = calculateDaysRemaining(userData.subscription_expires_at);

    return NextResponse.json(
      {
        success: true,
        data: {
          plan: userData.plan,
          subscriptionExpiresAt: userData.subscription_expires_at,
          isActive,
          daysRemaining,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
