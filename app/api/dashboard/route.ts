/**
 * GET /api/dashboard
 * User dashboard endpoint
 * Returns user's uploaded files, download statistics, and storage usage
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getUserFiles, getFileDownloadStats, getUserStorageUsage, getEnterprisePlan } from '@/lib/db/queries';
import { getUserById } from '@/lib/db/queries';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface DashboardFile {
  id: string;
  shareCode: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  expiresAt: string;
  downloadCount: number;
  lastDownloadedAt: string | null;
}

interface DashboardStats {
  totalUploads: number;
  totalDownloads: number;
  storageUsed: number;
  storageUsedFormatted: string;
}

interface DashboardResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      plan: string;
      enterprisePlan?: {
        maxFileSize: number;
        storageDurationMinutes: number;
        uploadsPerDay: number;
        customSupportEmail: string | null;
      };
    };
    files: DashboardFile[];
    stats: DashboardStats;
  };
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// DASHBOARD ENDPOINT
// ============================================================================

async function handler(request: AuthenticatedRequest): Promise<NextResponse<DashboardResponse>> {
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
    // GET USER'S FILES
    // ========================================================================

    const filesResult = await getUserFiles(user.userId);

    if (filesResult.error) {
      console.error('Error fetching user files:', filesResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch files' },
        { status: 500 }
      );
    }

    // ========================================================================
    // ENRICH FILES WITH DOWNLOAD STATS
    // ========================================================================

    const enrichedFiles: DashboardFile[] = [];
    let totalDownloads = 0;

    for (const file of filesResult.data) {
      const statsResult = await getFileDownloadStats(file.id);

      const downloadCount = statsResult.data?.count || 0;
      totalDownloads += downloadCount;

      enrichedFiles.push({
        id: file.id,
        shareCode: file.share_code,
        fileName: file.file_name,
        fileSize: file.file_size,
        createdAt: file.created_at,
        expiresAt: file.expires_at,
        downloadCount,
        lastDownloadedAt: statsResult.data?.lastDownloadedAt || null,
      });
    }

    // ========================================================================
    // GET STORAGE USAGE
    // ========================================================================

    const storageResult = await getUserStorageUsage(user.userId);

    if (storageResult.error) {
      console.error('Error calculating storage usage:', storageResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to calculate storage usage' },
        { status: 500 }
      );
    }

    const storageUsed = storageResult.data || 0;

    // ========================================================================
    // BUILD RESPONSE
    // ========================================================================

    // Get enterprise plan info if user is on enterprise plan
    let enterprisePlanInfo;
    if (userData.plan === 'enterprise') {
      const enterprisePlanResult = await getEnterprisePlan(user.userId);
      if (!enterprisePlanResult.error && enterprisePlanResult.data) {
        enterprisePlanInfo = {
          maxFileSize: enterprisePlanResult.data.max_file_size,
          storageDurationMinutes: enterprisePlanResult.data.storage_duration_minutes,
          uploadsPerDay: enterprisePlanResult.data.uploads_per_day,
          customSupportEmail: enterprisePlanResult.data.custom_support_email,
        };
      }
    }

    const stats: DashboardStats = {
      totalUploads: filesResult.data.length,
      totalDownloads,
      storageUsed,
      storageUsedFormatted: formatBytes(storageUsed),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: userData.id,
            email: userData.email,
            plan: userData.plan,
            ...(enterprisePlanInfo && { enterprisePlan: enterprisePlanInfo }),
          },
          files: enrichedFiles,
          stats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
