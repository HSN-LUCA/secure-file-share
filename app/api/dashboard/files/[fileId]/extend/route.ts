/**
 * PATCH /api/dashboard/files/[fileId]/extend
 * Extend file expiration endpoint
 * Requires JWT authentication and file ownership
 * Extends expiration by the original storage duration
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getFileById, updateFile } from '@/lib/db/queries';
import { createAnalytics } from '@/lib/db/queries';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface ExtendExpirationResponse {
  success: boolean;
  data?: {
    expiresAt: string;
  };
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
// EXTEND EXPIRATION ENDPOINT
// ============================================================================

async function extendHandler(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
): Promise<NextResponse<ExtendExpirationResponse>> {
  try {
    const user = (request as AuthenticatedRequest).user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { fileId } = await params;

    // ========================================================================
    // VALIDATE FILE ID
    // ========================================================================

    if (!fileId || typeof fileId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    // ========================================================================
    // GET FILE
    // ========================================================================

    const fileResult = await getFileById(fileId);

    if (!fileResult.data) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    const file = fileResult.data;

    // ========================================================================
    // CHECK OWNERSHIP
    // ========================================================================

    if (file.user_id !== user.userId) {
      // Log unauthorized access attempt
      await createAnalytics({
        event_type: 'security',
        user_id: user.userId,
        file_id: fileId,
        ip_address: getClientIp(request),
        metadata: {
          event: 'unauthorized_extend_attempt',
        },
      });

      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ========================================================================
    // CHECK IF FILE IS ALREADY EXPIRED
    // ========================================================================

    const now = new Date();
    const expiresAt = new Date(file.expires_at);

    if (expiresAt < now) {
      return NextResponse.json(
        { success: false, error: 'File has already expired' },
        { status: 400 }
      );
    }

    // ========================================================================
    // CALCULATE NEW EXPIRATION
    // ========================================================================

    const storageDurationMinutes = file.storage_duration_minutes || 20;
    const newExpiresAt = new Date(expiresAt.getTime() + storageDurationMinutes * 60 * 1000);

    // ========================================================================
    // UPDATE FILE
    // ========================================================================

    const updateResult = await updateFile(fileId, {
      expires_at: newExpiresAt.toISOString(),
    });

    if (updateResult.error) {
      console.error('Error updating file expiration:', updateResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to extend expiration' },
        { status: 500 }
      );
    }

    // ========================================================================
    // LOG ANALYTICS
    // ========================================================================

    await createAnalytics({
      event_type: 'upload',
      user_id: user.userId,
      file_id: fileId,
      ip_address: getClientIp(request),
      metadata: {
        event: 'file_expiration_extended',
        file_name: file.file_name,
        old_expires_at: file.expires_at,
        new_expires_at: newExpiresAt.toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          expiresAt: newExpiresAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Extend expiration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(extendHandler);
