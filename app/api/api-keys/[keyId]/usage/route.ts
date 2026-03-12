/**
 * API Key Usage Dashboard Endpoint
 * GET /api/api-keys/[keyId]/usage - Get usage statistics and history
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { getApiKey, getApiKeyUsage } from '@/lib/db/queries';

/**
 * GET /api/api-keys/[keyId]/usage
 * Get usage statistics and history for an API key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { keyId } = await params;

    // Get API key
    const { data: apiKey, error: getError } = await getApiKey(keyId);
    if (getError || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (apiKey.user_id !== authResult.user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000);
    const period = url.searchParams.get('period') || '24h'; // 24h, 7d, 30d

    // Get usage data
    const { data: usageData, error: usageError } = await getApiKeyUsage(keyId, limit);
    if (usageError) {
      throw usageError;
    }

    // Calculate statistics
    const stats = {
      total_requests: usageData.length,
      successful_requests: usageData.filter((u) => u.status_code >= 200 && u.status_code < 300).length,
      failed_requests: usageData.filter((u) => u.status_code >= 400).length,
      error_requests: usageData.filter((u) => u.status_code >= 500).length,
      avg_response_time_ms:
        usageData.length > 0
          ? Math.round(
              usageData.reduce((sum, u) => sum + (u.response_time_ms || 0), 0) / usageData.length
            )
          : 0,
      endpoints: {} as Record<string, any>,
      status_codes: {} as Record<number, number>,
      methods: {} as Record<string, number>,
    };

    // Group by endpoint
    usageData.forEach((usage) => {
      const key = `${usage.method} ${usage.endpoint}`;
      if (!stats.endpoints[key]) {
        stats.endpoints[key] = {
          method: usage.method,
          endpoint: usage.endpoint,
          count: 0,
          avg_response_time_ms: 0,
          status_codes: {} as Record<number, number>,
        };
      }
      stats.endpoints[key].count++;
      stats.endpoints[key].avg_response_time_ms = Math.round(
        (stats.endpoints[key].avg_response_time_ms * (stats.endpoints[key].count - 1) +
          (usage.response_time_ms || 0)) /
          stats.endpoints[key].count
      );

      if (!stats.endpoints[key].status_codes[usage.status_code]) {
        stats.endpoints[key].status_codes[usage.status_code] = 0;
      }
      stats.endpoints[key].status_codes[usage.status_code]++;
    });

    // Group by status code
    usageData.forEach((usage) => {
      stats.status_codes[usage.status_code] = (stats.status_codes[usage.status_code] || 0) + 1;
    });

    // Group by method
    usageData.forEach((usage) => {
      stats.methods[usage.method] = (stats.methods[usage.method] || 0) + 1;
    });

    // Get recent requests
    const recentRequests = usageData.slice(0, 20).map((usage) => ({
      endpoint: usage.endpoint,
      method: usage.method,
      status_code: usage.status_code,
      response_time_ms: usage.response_time_ms,
      ip_address: usage.ip_address,
      created_at: usage.created_at,
    }));

    return NextResponse.json({
      success: true,
      key_info: {
        id: apiKey.id,
        name: apiKey.name,
        last_used_at: apiKey.last_used_at,
      },
      statistics: {
        period,
        total_requests: stats.total_requests,
        successful_requests: stats.successful_requests,
        failed_requests: stats.failed_requests,
        error_requests: stats.error_requests,
        success_rate:
          stats.total_requests > 0
            ? Math.round((stats.successful_requests / stats.total_requests) * 100)
            : 0,
        avg_response_time_ms: stats.avg_response_time_ms,
      },
      by_endpoint: Object.values(stats.endpoints).sort((a, b) => b.count - a.count),
      by_status_code: stats.status_codes,
      by_method: stats.methods,
      recent_requests: recentRequests,
    });
  } catch (error) {
    console.error('Error fetching API usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API usage' },
      { status: 500 }
    );
  }
}
