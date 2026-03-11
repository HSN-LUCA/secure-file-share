/**
 * GET /api/monitoring
 * Performance monitoring endpoint
 * Returns performance metrics and system health data
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import {
  getApiResponseTimes,
  getDatabasePerformance,
  getStorageUsage,
  getSystemHealth,
} from '@/lib/db/queries';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface MonitoringResponse {
  success: boolean;
  data?: {
    apiPerformance: {
      averageResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      endpointMetrics: Array<{
        endpoint: string;
        method: string;
        avgResponseTime: number;
        requestCount: number;
        errorRate: number;
      }>;
    };
    databasePerformance: {
      averageQueryTime: number;
      slowQueryCount: number;
      connectionPoolUsage: number;
      activeConnections: number;
    };
    storageUsage: {
      totalUsed: number;
      totalAvailable: number;
      percentageUsed: number;
      trend: 'increasing' | 'stable' | 'decreasing';
    };
    systemHealth: {
      status: 'healthy' | 'degraded' | 'critical';
      uptime: number;
      errorRate: number;
      lastHealthCheck: string;
    };
  };
  error?: string;
}

// ============================================================================
// MONITORING ENDPOINT
// ============================================================================

async function handler(request: AuthenticatedRequest): Promise<NextResponse<MonitoringResponse>> {
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
    const timeRange = searchParams.get('time_range') || '1h'; // 1h, 24h, 7d

    // ========================================================================
    // FETCH MONITORING DATA
    // ========================================================================

    const [apiResult, dbResult, storageResult, healthResult] = await Promise.all([
      getApiResponseTimes(timeRange),
      getDatabasePerformance(timeRange),
      getStorageUsage(),
      getSystemHealth(),
    ]);

    // Check for errors
    if (apiResult.error || dbResult.error || storageResult.error || healthResult.error) {
      console.error('Monitoring query errors:', {
        api: apiResult.error,
        database: dbResult.error,
        storage: storageResult.error,
        health: healthResult.error,
      });

      return NextResponse.json(
        { success: false, error: 'Failed to fetch monitoring data' },
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
          apiPerformance: apiResult.data || {
            averageResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            endpointMetrics: [],
          },
          databasePerformance: dbResult.data || {
            averageQueryTime: 0,
            slowQueryCount: 0,
            connectionPoolUsage: 0,
            activeConnections: 0,
          },
          storageUsage: storageResult.data || {
            totalUsed: 0,
            totalAvailable: 0,
            percentageUsed: 0,
            trend: 'stable',
          },
          systemHealth: healthResult.data || {
            status: 'healthy',
            uptime: 0,
            errorRate: 0,
            lastHealthCheck: new Date().toISOString(),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Monitoring error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
