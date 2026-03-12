/**
 * GET /api/reports/scheduled/[reportId]
 * PUT /api/reports/scheduled/[reportId]
 * DELETE /api/reports/scheduled/[reportId]
 * Endpoints for managing individual scheduled reports
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import {
  getScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  ScheduledReportConfig,
} from '@/lib/db/custom-reports';

// ============================================================================
// GET - RETRIEVE SCHEDULED REPORT
// ============================================================================

async function handleGet(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ reportId: string }> }
): Promise<NextResponse> {
  try {
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { reportId } = await params;

    const result = await getScheduledReport(reportId);

    if (result.error || !result.data) {
      return NextResponse.json(
        { success: false, error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    // Verify user owns the report
    if (result.data.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Get scheduled report error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - UPDATE SCHEDULED REPORT
// ============================================================================

async function handlePut(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ reportId: string }> }
): Promise<NextResponse> {
  try {
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { reportId } = await params;

    // Verify user owns the report
    const reportResult = await getScheduledReport(reportId);

    if (reportResult.error || !reportResult.data) {
      return NextResponse.json(
        { success: false, error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    if (reportResult.data.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updateConfig: Partial<ScheduledReportConfig> = {};

    if (body.name !== undefined) updateConfig.name = body.name;
    if (body.description !== undefined) updateConfig.description = body.description;
    if (body.scheduleType !== undefined) updateConfig.scheduleType = body.scheduleType;
    if (body.scheduleDayOfWeek !== undefined) updateConfig.scheduleDayOfWeek = body.scheduleDayOfWeek;
    if (body.scheduleDayOfMonth !== undefined)
      updateConfig.scheduleDayOfMonth = body.scheduleDayOfMonth;
    if (body.scheduleTime !== undefined) updateConfig.scheduleTime = body.scheduleTime;
    if (body.recipientEmails !== undefined) updateConfig.recipientEmails = body.recipientEmails;
    if (body.includeCharts !== undefined) updateConfig.includeCharts = body.includeCharts;
    if (body.includeSummary !== undefined) updateConfig.includeSummary = body.includeSummary;
    if (body.isActive !== undefined) updateConfig.isActive = body.isActive;

    const result = await updateScheduledReport(reportId, updateConfig);

    if (result.error) {
      console.error('Update scheduled report error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to update scheduled report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled report updated successfully',
    });
  } catch (error) {
    console.error('Put scheduled report error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - DELETE SCHEDULED REPORT
// ============================================================================

async function handleDelete(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ reportId: string }> }
): Promise<NextResponse> {
  try {
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { reportId } = await params;

    // Verify user owns the report
    const reportResult = await getScheduledReport(reportId);

    if (reportResult.error || !reportResult.data) {
      return NextResponse.json(
        { success: false, error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    if (reportResult.data.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const result = await deleteScheduledReport(reportId);

    if (result.error) {
      console.error('Delete scheduled report error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete scheduled report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled report deleted successfully',
    });
  } catch (error) {
    console.error('Delete scheduled report error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
