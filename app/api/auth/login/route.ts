/**
 * POST /api/auth/login
 * User login endpoint
 * Authenticates user with email and password, returns JWT tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateEmail, sanitizeEmail } from '@/lib/validation/input-validation';
import { comparePassword } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { getUserByEmail } from '@/lib/db/queries';
import { storeRefreshToken } from '@/lib/auth/refresh-tokens';
import { createAnalytics } from '@/lib/db/queries';
import crypto from 'crypto';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    userId: string;
    email: string;
    plan: string;
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
// LOGIN ENDPOINT
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
  try {
    // Parse request body
    let body: LoginRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // ========================================================================
    // VALIDATION
    // ========================================================================

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error },
        { status: 400 }
      );
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Validate password is provided
    if (typeof password !== 'string' || password.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // ========================================================================
    // GET USER
    // ========================================================================

    const userResult = await getUserByEmail(sanitizedEmail);

    if (!userResult.data) {
      // Log failed login attempt
      await createAnalytics({
        event_type: 'security',
        ip_address: getClientIp(request),
        metadata: {
          event: 'login_failed',
          reason: 'user_not_found',
          email: sanitizedEmail,
        },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (userResult.error) {
      console.error('Database error getting user:', userResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to authenticate' },
        { status: 500 }
      );
    }

    const user = userResult.data;

    // Check if user is active
    if (!user.is_active) {
      await createAnalytics({
        event_type: 'security',
        user_id: user.id,
        ip_address: getClientIp(request),
        metadata: {
          event: 'login_failed',
          reason: 'user_inactive',
        },
      });

      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 401 }
      );
    }

    // ========================================================================
    // VERIFY PASSWORD
    // ========================================================================

    let passwordMatch: boolean;
    try {
      passwordMatch = await comparePassword(password, user.password_hash);
    } catch (error) {
      console.error('Password comparison error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to authenticate' },
        { status: 500 }
      );
    }

    if (!passwordMatch) {
      // Log failed login attempt
      await createAnalytics({
        event_type: 'security',
        user_id: user.id,
        ip_address: getClientIp(request),
        metadata: {
          event: 'login_failed',
          reason: 'invalid_password',
        },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ========================================================================
    // GENERATE TOKENS
    // ========================================================================

    const { accessToken, refreshToken } = generateTokenPair(user.id, user.email);

    // ========================================================================
    // STORE REFRESH TOKEN
    // ========================================================================

    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const storeTokenResult = await storeRefreshToken({
      user_id: user.id,
      token_hash: refreshTokenHash,
      expires_at: expiresAt.toISOString(),
    });

    if (storeTokenResult.error) {
      console.error('Failed to store refresh token:', storeTokenResult.error);
      // Continue anyway - user can still use access token
    }

    // ========================================================================
    // LOG ANALYTICS
    // ========================================================================

    await createAnalytics({
      event_type: 'security',
      user_id: user.id,
      ip_address: getClientIp(request),
      metadata: {
        event: 'user_login',
      },
    });

    // ========================================================================
    // RETURN SUCCESS RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          plan: user.plan,
          accessToken,
          refreshToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
