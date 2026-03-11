/**
 * POST /api/auth/register
 * User registration endpoint
 * Creates a new user account with email and password
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateEmail, sanitizeEmail } from '@/lib/validation/input-validation';
import { validatePasswordStrength, hashPassword } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { createUser, getUserByEmail } from '@/lib/db/queries';
import { storeRefreshToken } from '@/lib/auth/refresh-tokens';
import { createAnalytics } from '@/lib/db/queries';
import crypto from 'crypto';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface RegisterRequest {
  email: string;
  password: string;
}

interface RegisterResponse {
  success: boolean;
  data?: {
    userId: string;
    email: string;
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
// REGISTER ENDPOINT
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<RegisterResponse>> {
  try {
    // Parse request body
    let body: RegisterRequest;
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

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    // ========================================================================
    // CHECK FOR EXISTING USER
    // ========================================================================

    const existingUserResult = await getUserByEmail(sanitizedEmail);
    if (existingUserResult.data) {
      // Log security event
      await createAnalytics({
        event_type: 'security',
        ip_address: getClientIp(request),
        metadata: {
          event: 'duplicate_registration_attempt',
          email: sanitizedEmail,
        },
      });

      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    if (existingUserResult.error) {
      console.error('Database error checking existing user:', existingUserResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing user' },
        { status: 500 }
      );
    }

    // ========================================================================
    // HASH PASSWORD
    // ========================================================================

    let passwordHash: string;
    try {
      passwordHash = await hashPassword(password);
    } catch (error) {
      console.error('Password hashing error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to process password' },
        { status: 500 }
      );
    }

    // ========================================================================
    // CREATE USER
    // ========================================================================

    const createUserResult = await createUser({
      email: sanitizedEmail,
      password_hash: passwordHash,
      plan: 'free',
      is_active: true,
    });

    if (!createUserResult.data) {
      console.error('User creation error:', createUserResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    const user = createUserResult.data;

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
      // Continue anyway - user is created and can still use access token
    }

    // ========================================================================
    // LOG ANALYTICS
    // ========================================================================

    await createAnalytics({
      event_type: 'security',
      user_id: user.id,
      ip_address: getClientIp(request),
      metadata: {
        event: 'user_registration',
        email: sanitizedEmail,
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
          accessToken,
          refreshToken,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
