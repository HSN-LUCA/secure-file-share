/**
 * GET /api/analytics
 * Analytics dashboard endpoint
 * Returns aggregated analytics data with optional date range filtering
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import {
  getDownloadStats,
  getFileTypeStats,
  getGeographicStats,
  getBotDetectionMetrics,
  getAnalyticsSummary,
} from '@/lib/db/queries';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface AnalyticsResponse {
  success: boolean;
  data?: {
    summary: {
      totalUploads: number;
      totalDownloads: number;
      totalUsers: number;
      totalEvents: number;
    };
    downloads: {
      totalDownloads: number;
      downloadsPerDay: Array<{ date: string; count: number }>;
      mostDownloadedFiles: Array<{ fileId: string; fileName: string; count: number }>;
    };
    fileTypes: {
      totalUploads: number;
      fileTypeDistribution: Array<{ fileType: string; count: number; totalSize: number }>;
    };
    geographic: {
      topCountries: Array<{ country: string; count: number }>;
      totalCountries: number;
    };
    botDetection: {
      captchaAttempts: number;
      captchaSuccesses: number;
      captchaFailures: number;
      successRate: number;
      blockedIps: number;
      botDetectedEvents: number;
    };
  };
  error?: string;
}

// ============================================================================
// ANALYTICS ENDPOINT
// ============================================================================

async function handler(request: AuthenticatedRequest): Promise<NextResponse<AnalyticsResponse>> {
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
    // PARSE QUERY PARAMETERS
    // ========================================================================

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    // Validate date format if provided
    if (fromDate && isNaN(Date.parse(fromDate))) {
      return NextResponse.json(
        { success: false, error: 'Invalid from_date format' },
        { status: 400 }
      );
    }

    if (toDate && isNaN(Date.parse(toDate))) {
      return NextResponse.json(
        { success: false, error: 'Invalid to_date format' },
        { status: 400 }
      );
    }

    // ========================================================================
    // FETCH ANALYTICS DATA
    // ========================================================================

    const [summaryResult, downloadsResult, fileTypesResult, geographicResult, botDetectionResult] =
      await Promise.all([
        getAnalyticsSummary(fromDate || undefined, toDate || undefined),
        getDownloadStats(fromDate || undefined, toDate || undefined),
        getFileTypeStats(fromDate || undefined, toDate || undefined),
        getGeographicStats(fromDate || undefined, toDate || undefined),
        getBotDetectionMetrics(fromDate || undefined, toDate || undefined),
      ]);

    // Check for errors
    if (
      summaryResult.error ||
      downloadsResult.error ||
      fileTypesResult.error ||
      geographicResult.error ||
      botDetectionResult.error
    ) {
      console.error('Analytics query errors:', {
        summary: summaryResult.error,
        downloads: downloadsResult.error,
        fileTypes: fileTypesResult.error,
        geographic: geographicResult.error,
        botDetection: botDetectionResult.error,
      });

      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // ========================================================================
    // BUILD RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: summaryResult.data || {
            totalUploads: 0,
            totalDownloads: 0,
            totalUsers: 0,
            totalEvents: 0,
          },
          downloads: downloadsResult.data || {
            totalDownloads: 0,
            downloadsPerDay: [],
            mostDownloadedFiles: [],
          },
          fileTypes: fileTypesResult.data || {
            totalUploads: 0,
            fileTypeDistribution: [],
          },
          geographic: geographicResult.data || {
            topCountries: [],
            totalCountries: 0,
          },
          botDetection: botDetectionResult.data || {
            captchaAttempts: 0,
            captchaSuccesses: 0,
            captchaFailures: 0,
            successRate: 0,
            blockedIps: 0,
            botDetectedEvents: 0,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
