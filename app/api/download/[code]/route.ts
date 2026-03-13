/**
 * File Download API Endpoint
 * GET /api/download/:code
 * 
 * Handles file downloads using share code with validation, decryption, and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFileByShareCode, updateFile, createDownload, createAnalytics } from '@/lib/db/queries';
import { downloadFile } from '@/lib/storage/utils';
import { validateShareCode, sanitizeShareCode } from '@/lib/validation/input-validation';

/**
 * GET /api/download/:code
 * 
 * URL parameters:
 * - code: Share code (numeric string)
 * 
 * Response:
 * - File binary data with appropriate headers
 * - Content-Disposition: attachment; filename="..."
 * - Content-Type: application/octet-stream or file MIME type
 * - Content-Length: file size
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Get client IP for analytics
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { code: shareCode } = await params;
    const url = new URL(request.url);
    const infoOnly = url.searchParams.get('info') === 'true';

    // Validate and sanitize share code
    const shareCodeValidation = validateShareCode(shareCode);
    if (!shareCodeValidation.valid) {
      return NextResponse.json(
        { success: false, error: shareCodeValidation.error },
        { status: 400 }
      );
    }
    const sanitizedShareCode = sanitizeShareCode(shareCode);

    // Get file from database by share code
    const fileResult = await getFileByShareCode(sanitizedShareCode);

    if (fileResult.error || !fileResult.data) {
      // Log failed download attempt
      await createAnalytics({
        event_type: 'download',
        ip_address: clientIp,
        metadata: {
          error: 'File not found',
          shareCode: sanitizedShareCode,
        },
      }).catch(err => console.error('Failed to log analytics:', err));

      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    const file = fileResult.data;

    // Check if file has expired
    // The expires_at column is TIMESTAMP (no timezone). Supabase returns it as a string
    // without timezone info (e.g. "2026-03-13T10:20:00"). We treat it as UTC by appending 'Z'.
    const rawExpiresAt = file.expires_at;
    const expiresAtStr = typeof rawExpiresAt === 'string'
      ? (rawExpiresAt.endsWith('Z') || rawExpiresAt.includes('+') ? rawExpiresAt : rawExpiresAt + 'Z')
      : new Date(rawExpiresAt).toISOString();
    const expiresAt = new Date(expiresAtStr);
    const now = new Date();

    console.log('[DOWNLOAD] raw expires_at from DB:', rawExpiresAt, '| type:', typeof rawExpiresAt);
    console.log('[DOWNLOAD] expiresAtStr:', expiresAtStr);
    console.log('[DOWNLOAD] parsed expiresAt (UTC):', expiresAt.toISOString());
    console.log('[DOWNLOAD] now (UTC):', now.toISOString());
    console.log('[DOWNLOAD] diff ms:', expiresAt.getTime() - now.getTime());
    console.log('[DOWNLOAD] is expired:', now > expiresAt);

    if (now > expiresAt) {
      // Log expired file download attempt
      await createAnalytics({
        event_type: 'download',
        file_id: file.id,
        ip_address: clientIp,
        metadata: {
          error: 'File expired',
          shareCode: sanitizedShareCode,
          expiresAt: file.expires_at,
        },
      }).catch(err => console.error('Failed to log analytics:', err));

      return NextResponse.json(
        { success: false, error: 'File has expired and is no longer available' },
        { status: 410 }
      );
    }

    // If info-only request, return file metadata
    if (infoOnly) {
      return NextResponse.json({
        success: true,
        fileName: file.file_name,
        fileSize: file.file_size,
        expiresAt: file.expires_at,
      });
    }

    try {
      // Download and decrypt file from storage
      const { data: fileData, contentType } = await downloadFile(file.s3_key, {
        iv: file.encryption_iv || '',
        authTag: file.encryption_auth_tag || '',
      });

      // Increment download counter
      const newDownloadCount = (file.download_count || 0) + 1;
      const updateResult = await updateFile(file.id, {
        download_count: newDownloadCount,
      });

      if (updateResult.error) {
        console.error('Failed to update download counter:', updateResult.error);
        // Continue anyway - don't fail the download
      }

      // Record download in downloads table
      const downloadRecord = await createDownload({
        file_id: file.id,
        ip_address: clientIp,
        user_agent: userAgent,
        country: null, // Could be populated with GeoIP lookup
      });

      if (downloadRecord.error) {
        console.error('Failed to record download:', downloadRecord.error);
        // Continue anyway - don't fail the download
      }

      // Log successful download
      await createAnalytics({
        event_type: 'download',
        file_id: file.id,
        ip_address: clientIp,
        metadata: {
          fileName: file.file_name,
          fileSize: file.file_size,
          shareCode: sanitizedShareCode,
          downloadCount: newDownloadCount,
        },
      }).catch(err => console.error('Failed to log analytics:', err));

      // Return file with appropriate headers
      return new NextResponse(Buffer.from(fileData), {
        status: 200,
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          'Content-Length': fileData.length.toString(),
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.file_name)}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (storageError) {
      console.error('Storage error during download:', storageError);

      // Log storage error
      await createAnalytics({
        event_type: 'download',
        file_id: file.id,
        ip_address: clientIp,
        metadata: {
          error: 'Storage error',
          shareCode: sanitizedShareCode,
        },
      }).catch(err => console.error('Failed to log analytics:', err));

      return NextResponse.json(
        { success: false, error: 'Failed to download file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Download endpoint error:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/download/:code
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
