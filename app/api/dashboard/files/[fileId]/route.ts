/**
 * DELETE /api/dashboard/files/[fileId]
 * Delete a file endpoint
 * Requires JWT authentication and file ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getFileById, deleteFile as deleteFileFromDb } from '@/lib/db/queries';
import { deleteFile as deleteFileFromStorage } from '@/lib/storage/utils';
import { createAnalytics } from '@/lib/db/queries';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface DeleteFileResponse {
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
// DELETE FILE ENDPOINT
// ============================================================================

async function deleteHandler(
  request: NextRequest,
  { params }: { params: { fileId: string } }
): Promise<NextResponse<DeleteFileResponse>> {
  try {
    const user = (request as AuthenticatedRequest).user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { fileId } = params;

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
          event: 'unauthorized_file_delete_attempt',
        },
      });

      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ========================================================================
    // DELETE FROM S3
    // ========================================================================

    try {
      await deleteFileFromStorage(file.s3_key);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      // Continue anyway - delete database record
    }

    // ========================================================================
    // DELETE FROM DATABASE
    // ========================================================================

    const deleteResult = await deleteFileFromDb(fileId);

    if (deleteResult.error) {
      console.error('Error deleting file from database:', deleteResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete file' },
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
        event: 'file_deleted',
        file_name: file.file_name,
        file_size: file.file_size,
      },
    });

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(deleteHandler);
