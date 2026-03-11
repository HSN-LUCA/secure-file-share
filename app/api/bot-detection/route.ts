/**
 * GET /api/bot-detection
 * Bot detection metrics endpoint
 * Returns bot detection analytics and metrics
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import {
  getBotDetectionMetrics,
  getBlockedIps,
  getSuspiciousPatterns,
} from '@/lib/db/queries';

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

interface BotDetectionResponse {
  success: boolean;
  data?: {
    metrics: {
      captchaAttempts: number;
      captchaSuccesses: number;
      captchaFailures: number;
      successRate: number;
      blockedIps: number;
      botDetectedEvents: number;
    };
    blockedIps: Array<{
      ip: string;
      blockCount: number;
      lastBlockedAt: string;
      reason: string;
    }>;
    suspiciousPatterns: Array<{
      pattern: string;
      count: number;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    botVsHumanRatio: {
      humanVerified: number;
      botDetected: number;
      ratio: number;
    };
  };
  error?: string;
}

// ============================================================================
// BOT DETECTION ENDPOINT
// ============================================================================

async function handler(request: AuthenticatedRequest): Promise<NextResponse<BotDetectionResponse>> {
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
    // FETCH BOT DETECTION DATA
    // ========================================================================

    const [metricsResult, blockedIpsResult, suspiciousPatternsResult] = await Promise.all([
      getBotDetectionMetrics(fromDate || undefined, toDate || undefined),
      getBlockedIps(fromDate || undefined, toDate || undefined),
      getSuspiciousPatterns(fromDate || undefined, toDate || undefined),
    ]);

    // Check for errors
    if (metricsResult.error || blockedIpsResult.error || suspiciousPatternsResult.error) {
      console.error('Bot detection query errors:', {
        metrics: metricsResult.error,
        blockedIps: blockedIpsResult.error,
        suspiciousPatterns: suspiciousPatternsResult.error,
      });

      return NextResponse.json(
        { success: false, error: 'Failed to fetch bot detection data' },
        { status: 500 }
      );
    }

    // ========================================================================
    // CALCULATE BOT VS HUMAN RATIO
    // ========================================================================

    const metrics = metricsResult.data || {
      captchaAttempts: 0,
      captchaSuccesses: 0,
      captchaFailures: 0,
      successRate: 0,
      blockedIps: 0,
      botDetectedEvents: 0,
    };

    const humanVerified = metrics.captchaSuccesses;
    const botDetected = metrics.botDetectedEvents;
    const total = humanVerified + botDetected;
    const ratio = total > 0 ? (botDetected / total) * 100 : 0;

    // ========================================================================
    // BUILD RESPONSE
    // ========================================================================

    return NextResponse.json(
      {
        success: true,
        data: {
          metrics,
          blockedIps: blockedIpsResult.data || [],
          suspiciousPatterns: suspiciousPatternsResult.data || [],
          botVsHumanRatio: {
            humanVerified,
            botDetected,
            ratio: Math.round(ratio * 100) / 100,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bot detection error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
