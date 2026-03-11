/**
 * GET /api/reports/custom/[reportId]
 * PUT /api/reports/custom/[reportId]
 * DELETE /api/reports/custom/[reportId]
 * Endpoints for managing individual custom reports
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import {
  getCustomReport,
  updateCustomReport,
  deleteCustomReport,
  CustomReportConfig,
} from '@/lib/db/custom-reports';

// ============================================================================
// GET - RETRIEVE CUSTOM REPORT
// ============================================================================

async function handleGet(
  request: AuthenticatedRequest,
  { params }: { params: { reportId: string } }
): Promise<NextResponse> {
  try {
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { reportId } = params;

    const result = await getCustomReport(reportId);

    if (result.error || !result.data) {
      return NextResponse.json(
        { success: false, error: 'Custom report not found' },
        { status: 404 }
      );
    }

    // Verify user owns the report
    if (result.data.userId !== user.id) {
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
    console.error('Get custom report error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - UPDATE CUSTOM REPORT
// ============================================================================

async function handlePut(
  request: AuthenticatedRequest,
  { params }: { params: { reportId: string } }
): Promise<NextResponse> {
  try {
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { reportId } = params;

    // Verify user owns the report
    const reportResult = await getCustomReport(reportId);

    if (reportResult.error || !reportResult.data) {
      return NextResponse.json(
        { success: false, error: 'Custom report not found' },
        { status: 404 }
      );
    }

    if (reportResult.data.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updateConfig: Partial<CustomReportConfig> = {};

    if (body.name !== undefined) updateConfig.name = body.name;
    if (body.description !== undefined) updateConfig.description = body.description;
    if (body.metrics !== undefined) updateConfig.metrics = body.metrics;
    if (body.dimensions !== undefined) updateConfig.dimensions = body.dimensions;
    if (body.filters !== undefined) updateConfig.filters = body.filters;
    if (body.dateRangeType !== undefined) updateConfig.dateRangeType = body.dateRangeType;
    if (body.dateRangeFrom !== undefined) updateConfig.dateRangeFrom = body.dateRangeFrom;
    if (body.dateRangeTo !== undefined) updateConfig.dateRangeTo = body.dateRangeTo;
    if (body.sortBy !== undefined) updateConfig.sortBy = body.sortBy;
    if (body.sortOrder !== undefined) updateConfig.sortOrder = body.sortOrder;
    if (body.isPublic !== undefined) updateConfig.isPublic = body.isPublic;

    const result = await updateCustomReport(reportId, updateConfig);

    if (result.error) {
      console.error('Update custom report error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to update custom report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Custom report updated successfully',
    });
  } catch (error) {
    console.error('Put custom report error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - DELETE CUSTOM REPORT
// ============================================================================

async function handleDelete(
  request: AuthenticatedRequest,
  { params }: { params: { reportId: string } }
): Promise<NextResponse> {
  try {
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { reportId } = params;

    // Verify user owns the report
    const reportResult = await getCustomReport(reportId);

    if (reportResult.error || !reportResult.data) {
      return NextResponse.json(
        { success: false, error: 'Custom report not found' },
        { status: 404 }
      );
    }

    if (reportResult.data.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const result = await deleteCustomReport(reportId);

    if (result.error) {
      console.error('Delete custom report error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete custom report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Custom report deleted successfully',
    });
  } catch (error) {
    console.error('Delete custom report error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const PUT = withAuth(handlePut);
export const DELETE = withAuth(handleDelete);
