/**
 * GET /api/reports/advanced
 * Advanced reporting endpoint with filters, date ranges, and aggregations
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import {
  getDownloadStats,
  getFileTypeStats,
  getGeographicStats,
  getBotDetectionMetrics,
} from '@/lib/db/queries';
import { getUserBehaviorSummary, getFlowCompletionRates } from '@/lib/db/behavior-tracking';

// ============================================================================
// TYPES
// ============================================================================

interface AdvancedReportRequest {
  metrics: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
  dateRangeFrom?: string;
  dateRangeTo?: string;
  aggregation?: 'daily' | 'weekly' | 'monthly';
  limit?: number;
  offset?: number;
}

interface AdvancedReportResponse {
  success: boolean;
  data?: {
    summary: Record<string, any>;
    metrics: Record<string, any>;
    dimensions: Record<string, any>;
    aggregations: Record<string, any>;
    generatedAt: string;
    cacheKey?: string;
  };
  error?: string;
}

// ============================================================================
// CACHE (Simple in-memory cache for demo, use Redis in production)
// ============================================================================

const reportCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(userId: string, request: AdvancedReportRequest): string {
  return `report:${userId}:${JSON.stringify(request)}`;
}

function getCachedReport(key: string): any | null {
  const cached = reportCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  reportCache.delete(key);
  return null;
}

function setCachedReport(key: string, data: any): void {
  reportCache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// HANDLER
// ============================================================================

async function handleGet(request: AuthenticatedRequest): Promise<NextResponse<AdvancedReportResponse>> {
  try {
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
    const metricsParam = searchParams.get('metrics');
    const dimensionsParam = searchParams.get('dimensions');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const aggregation = searchParams.get('aggregation') || 'daily';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!metricsParam) {
      return NextResponse.json(
        { success: false, error: 'metrics parameter is required' },
        { status: 400 }
      );
    }

    const metrics = metricsParam.split(',').map((m) => m.trim());
    const dimensions = dimensionsParam ? dimensionsParam.split(',').map((d) => d.trim()) : [];

    const reportRequest: AdvancedReportRequest = {
      metrics,
      dimensions,
      dateRangeFrom: fromDate || undefined,
      dateRangeTo: toDate || undefined,
      aggregation: (aggregation as any) || 'daily',
      limit,
      offset,
    };

    // ========================================================================
    // CHECK CACHE
    // ========================================================================

    const cacheKey = getCacheKey(user.userId, reportRequest);
    const cachedReport = getCachedReport(cacheKey);

    if (cachedReport) {
      return NextResponse.json({
        success: true,
        data: {
          summary: cachedReport.summary,
          metrics: cachedReport.metrics,
          dimensions: cachedReport.dimensions,
          aggregations: cachedReport.aggregations,
          generatedAt: cachedReport.generatedAt,
          cacheKey,
        },
      });
    }

    // ========================================================================
    // FETCH REPORT DATA
    // ========================================================================

    const reportData: Record<string, any> = {
      summary: {},
      metrics: {},
      dimensions: {},
      aggregations: {},
      generatedAt: new Date().toISOString(),
    };

    // Fetch user behavior summary
    const behaviorResult = await getUserBehaviorSummary(user.userId, fromDate || undefined, toDate || undefined);
    if (behaviorResult.data) {
      reportData.summary.behavior = behaviorResult.data;
    }

    // Fetch metrics
    for (const metric of metrics) {
      if (metric === 'downloads') {
        const result = await getDownloadStats(fromDate || undefined, toDate || undefined);
        if (result.data) {
          reportData.metrics.downloads = result.data;
        }
      } else if (metric === 'fileTypes') {
        const result = await getFileTypeStats(fromDate || undefined, toDate || undefined);
        if (result.data) {
          reportData.metrics.fileTypes = result.data;
        }
      } else if (metric === 'geographic') {
        const result = await getGeographicStats(fromDate || undefined, toDate || undefined);
        if (result.data) {
          reportData.metrics.geographic = result.data;
        }
      } else if (metric === 'botDetection') {
        const result = await getBotDetectionMetrics(fromDate || undefined, toDate || undefined);
        if (result.data) {
          reportData.metrics.botDetection = result.data;
        }
      } else if (metric === 'flows') {
        const result = await getFlowCompletionRates(fromDate || undefined, toDate || undefined);
        if (result.data) {
          reportData.metrics.flows = result.data;
        }
      }
    }

    // Apply dimensions (grouping)
    if (dimensions.length > 0) {
      reportData.dimensions = applyDimensions(reportData.metrics, dimensions);
    }

    // Apply aggregations
    if (aggregation) {
      reportData.aggregations = applyAggregations(reportData.metrics, aggregation);
    }

    // ========================================================================
    // CACHE AND RETURN
    // ========================================================================

    setCachedReport(cacheKey, reportData);

    return NextResponse.json({
      success: true,
      data: {
        summary: reportData.summary,
        metrics: reportData.metrics,
        dimensions: reportData.dimensions,
        aggregations: reportData.aggregations,
        generatedAt: reportData.generatedAt,
        cacheKey,
      },
    });
  } catch (error) {
    console.error('Advanced reporting error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Apply dimensions (grouping) to metrics
 */
function applyDimensions(metrics: Record<string, any>, dimensions: string[]): Record<string, any> {
  const result: Record<string, any> = {};

  for (const dimension of dimensions) {
    if (dimension === 'date' && metrics.downloads?.downloadsPerDay) {
      result.byDate = metrics.downloads.downloadsPerDay;
    } else if (dimension === 'fileType' && metrics.fileTypes?.fileTypeDistribution) {
      result.byFileType = metrics.fileTypes.fileTypeDistribution;
    } else if (dimension === 'country' && metrics.geographic?.topCountries) {
      result.byCountry = metrics.geographic.topCountries;
    }
  }

  return result;
}

/**
 * Apply aggregations to metrics
 */
function applyAggregations(
  metrics: Record<string, any>,
  aggregation: string
): Record<string, any> {
  const result: Record<string, any> = {
    aggregationType: aggregation,
    aggregatedMetrics: {},
  };

  // Aggregate downloads
  if (metrics.downloads) {
    result.aggregatedMetrics.totalDownloads = metrics.downloads.totalDownloads;
    result.aggregatedMetrics.averageDownloadsPerDay =
      metrics.downloads.downloadsPerDay.length > 0
        ? Math.round(
            metrics.downloads.totalDownloads / metrics.downloads.downloadsPerDay.length
          )
        : 0;
  }

  // Aggregate file types
  if (metrics.fileTypes) {
    result.aggregatedMetrics.totalUploads = metrics.fileTypes.totalUploads;
    result.aggregatedMetrics.uniqueFileTypes =
      metrics.fileTypes.fileTypeDistribution.length;
  }

  // Aggregate geographic
  if (metrics.geographic) {
    result.aggregatedMetrics.totalCountries = metrics.geographic.totalCountries;
  }

  // Aggregate bot detection
  if (metrics.botDetection) {
    result.aggregatedMetrics.botDetectionRate =
      metrics.botDetection.captchaAttempts > 0
        ? (
            (metrics.botDetection.captchaFailures /
              metrics.botDetection.captchaAttempts) *
            100
          ).toFixed(2) + '%'
        : '0%';
  }

  return result;
}

export const GET = withAuth(handleGet);
