/**
 * GET /api/reports/scheduled
 * POST /api/reports/scheduled
 * Endpoints for managing scheduled reports
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import {
  listScheduledReports,
  createScheduledReport,
  ScheduledReportConfig,
} from '@/lib/db/custom-reports';

// ============================================================================
// GET - LIST SCHEDULED REPORTS
// ============================================================================

async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const result = await listScheduledReports(user.id);

    if (result.error) {
      console.error('List scheduled reports error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to list scheduled reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (error) {
    console.error('Get scheduled reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - CREATE SCHEDULED REPORT
// ============================================================================

async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.scheduleType || !body.scheduleTime || !body.recipientEmails) {
      return NextResponse.json(
        {
          success: false,
          error: 'name, scheduleType, scheduleTime, and recipientEmails are required',
        },
        { status: 400 }
      );
    }

    // Validate schedule type
    if (!['daily', 'weekly', 'monthly'].includes(body.scheduleType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid scheduleType' },
        { status: 400 }
      );
    }

    // Validate recipient emails
    if (!Array.isArray(body.recipientEmails) || body.recipientEmails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'recipientEmails must be a non-empty array' },
        { status: 400 }
      );
    }

    const config: ScheduledReportConfig = {
      customReportId: body.customReportId,
      name: body.name,
      description: body.description,
      scheduleType: body.scheduleType,
      scheduleDayOfWeek: body.scheduleDayOfWeek,
      scheduleDayOfMonth: body.scheduleDayOfMonth,
      scheduleTime: body.scheduleTime,
      recipientEmails: body.recipientEmails,
      includeCharts: body.includeCharts !== false,
      includeSummary: body.includeSummary !== false,
      isActive: body.isActive !== false,
    };

    const result = await createScheduledReport(user.id, config);

    if (result.error) {
      console.error('Create scheduled report error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to create scheduled report' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { reportId: result.data?.reportId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post scheduled reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
