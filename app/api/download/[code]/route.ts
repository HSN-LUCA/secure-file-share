/**
 * File Download API Endpoint
 * GET /api/download/:code
 * 
 * Handles file downloads using share code with validation, decryption, and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFilesByShareCode, updateFile, createDownload, createAnalytics } from '@/lib/db/queries';
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

    // Sanitize share code (trim whitespace, take first 10 chars max)
    const sanitizedShareCode = sanitizeShareCode(shareCode);

    // Get all files with this share code (handles both single and group uploads)
    const filesResult = await getFilesByShareCode(sanitizedShareCode);

    if (filesResult.error || !filesResult.data.length) {
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

    const normalizeExpiry = (raw: any): string =>
      typeof raw === 'string'
        ? (raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z')
        : new Date(raw).toISOString();

    const now = new Date();

    // If info-only request, return file metadata (supports group codes)
    if (infoOnly) {
      const activFiles = filesResult.data.filter(f => now <= new Date(normalizeExpiry(f.expires_at)));

      if (!activFiles.length) {
        return NextResponse.json(
          { success: false, error: 'File has expired and is no longer available' },
          { status: 410 }
        );
      }

      if (activFiles.length > 1) {
        return NextResponse.json({
          success: true,
          isGroup: true,
          files: activFiles.map(f => ({
            id: f.id,
            fileName: f.file_name,
            fileSize: f.file_size,
            expiresAt: f.expires_at,
          })),
        });
      }

      // Single file
      const f = activFiles[0];
      return NextResponse.json({
        success: true,
        isGroup: false,
        fileName: f.file_name,
        fileSize: f.file_size,
        expiresAt: f.expires_at,
      });
    }

    // For actual download, pick the right file
    // If a specific fileId is requested (group download), find that file
    const requestedFileId = url.searchParams.get('fileId');
    const file = requestedFileId
      ? filesResult.data.find(f => f.id === requestedFileId && now <= new Date(normalizeExpiry(f.expires_at)))
      : filesResult.data.find(f => now <= new Date(normalizeExpiry(f.expires_at)));

    if (!file) {
      await createAnalytics({
        event_type: 'download',
        ip_address: clientIp,
        metadata: { error: 'File expired', shareCode: sanitizedShareCode },
      }).catch(() => {});

      return NextResponse.json(
        { success: false, error: 'File has expired and is no longer available' },
        { status: 410 }
      );
    }

    try {
      // Download and decrypt file from storage
      const { data: fileData, contentType } = await downloadFile(file.s3_key, {
        iv: file.encryption_iv || '',
        authTag: file.encryption_auth_tag || '',
      });

      // Fire analytics + counter updates in background — don't block the download
      const newDownloadCount = (file.download_count || 0) + 1;
      Promise.all([
        updateFile(file.id, { download_count: newDownloadCount })
          .catch(err => console.error('Failed to update download counter:', err)),
        createDownload({ file_id: file.id, ip_address: clientIp, user_agent: userAgent, country: null })
          .catch(err => console.error('Failed to record download:', err)),
        createAnalytics({
          event_type: 'download',
          file_id: file.id,
          ip_address: clientIp,
          metadata: { fileName: file.file_name, fileSize: file.file_size, shareCode: sanitizedShareCode, downloadCount: newDownloadCount },
        }).catch(err => console.error('Failed to log analytics:', err)),
      ]);

      // Stream decrypted buffer directly to client — avoids holding full file in memory
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(fileData);
          controller.close();
        },
      });

      return new NextResponse(stream, {
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

      createAnalytics({
        event_type: 'download',
        file_id: file.id,
        ip_address: clientIp,
        metadata: { error: 'Storage error', shareCode: sanitizedShareCode },
      }).catch(() => {});

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
