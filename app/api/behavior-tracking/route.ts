/**
 * POST /api/behavior-tracking
 * Endpoint for tracking user behavior (page views, clicks, sessions)
 * Supports both authenticated and anonymous users
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createUserSession,
  updateSessionActivity,
  trackPageView,
  trackClickEvent,
  startUserFlow,
  completeUserFlow,
} from '@/lib/db/behavior-tracking';

// ============================================================================
// REQUEST TYPES
// ============================================================================

interface BehaviorTrackingRequest {
  action: 'session_start' | 'session_end' | 'page_view' | 'click' | 'flow_start' | 'flow_complete';
  sessionToken?: string;
  sessionId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  pagePath?: string;
  pageTitle?: string;
  referrer?: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  flowName?: string;
  flowId?: string;
  stepName?: string;
  stepData?: Record<string, any>;
  timeOnPageSeconds?: number;
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: BehaviorTrackingRequest = await request.json();

    // Get IP address from request
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0';

    const userAgent = request.headers.get('user-agent') || '';

    // ========================================================================
    // SESSION START
    // ========================================================================

    if (body.action === 'session_start') {
      if (!body.sessionToken) {
        return NextResponse.json(
          { success: false, error: 'sessionToken is required' },
          { status: 400 }
        );
      }

      const result = await createUserSession(
        body.userId || null,
        body.sessionToken,
        ipAddress,
        userAgent,
        body.country
      );

      if (result.error) {
        console.error('Session creation error:', result.error);
        return NextResponse.json(
          { success: false, error: 'Failed to create session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { sessionId: result.data?.sessionId },
      });
    }

    // ========================================================================
    // SESSION END
    // ========================================================================

    if (body.action === 'session_end') {
      if (!body.sessionId) {
        return NextResponse.json(
          { success: false, error: 'sessionId is required' },
          { status: 400 }
        );
      }

      const result = await updateSessionActivity(body.sessionId);

      if (result.error) {
        console.error('Session end error:', result.error);
        return NextResponse.json(
          { success: false, error: 'Failed to end session' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // ========================================================================
    // PAGE VIEW
    // ========================================================================

    if (body.action === 'page_view') {
      if (!body.sessionId || !body.pagePath) {
        return NextResponse.json(
          { success: false, error: 'sessionId and pagePath are required' },
          { status: 400 }
        );
      }

      const result = await trackPageView(
        body.userId || null,
        body.sessionId,
        body.pagePath,
        body.pageTitle,
        body.referrer
      );

      if (result.error) {
        console.error('Page view tracking error:', result.error);
        return NextResponse.json(
          { success: false, error: 'Failed to track page view' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { pageViewId: result.data?.pageViewId },
      });
    }

    // ========================================================================
    // CLICK EVENT
    // ========================================================================

    if (body.action === 'click') {
      if (!body.sessionId || !body.pagePath) {
        return NextResponse.json(
          { success: false, error: 'sessionId and pagePath are required' },
          { status: 400 }
        );
      }

      const result = await trackClickEvent(
        body.userId || null,
        body.sessionId,
        body.elementId || null,
        body.elementClass || null,
        body.elementText || null,
        body.pagePath
      );

      if (result.error) {
        console.error('Click event tracking error:', result.error);
        return NextResponse.json(
          { success: false, error: 'Failed to track click' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { clickEventId: result.data?.clickEventId },
      });
    }

    // ========================================================================
    // FLOW START
    // ========================================================================

    if (body.action === 'flow_start') {
      if (!body.sessionId || !body.flowName || !body.stepName) {
        return NextResponse.json(
          { success: false, error: 'sessionId, flowName, and stepName are required' },
          { status: 400 }
        );
      }

      const result = await startUserFlow(
        body.userId || null,
        body.sessionId,
        body.flowName,
        body.stepName,
        body.stepData
      );

      if (result.error) {
        console.error('Flow start error:', result.error);
        return NextResponse.json(
          { success: false, error: 'Failed to start flow' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { flowId: result.data?.flowId },
      });
    }

    // ========================================================================
    // FLOW COMPLETE
    // ========================================================================

    if (body.action === 'flow_complete') {
      if (!body.flowId) {
        return NextResponse.json(
          { success: false, error: 'flowId is required' },
          { status: 400 }
        );
      }

      const result = await completeUserFlow(body.flowId);

      if (result.error) {
        console.error('Flow complete error:', result.error);
        return NextResponse.json(
          { success: false, error: 'Failed to complete flow' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // ========================================================================
    // INVALID ACTION
    // ========================================================================

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Behavior tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
