/**
 * GET /api/reports/custom
 * POST /api/reports/custom
 * Endpoints for managing custom reports
 * Requires JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import {
  listCustomReports,
  createCustomReport,
  CustomReportConfig,
} from '@/lib/db/custom-reports';

// ============================================================================
// GET - LIST CUSTOM REPORTS
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

    const result = await listCustomReports(user.userId);

    if (result.error) {
      console.error('List custom reports error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to list custom reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data || [],
    });
  } catch (error) {
    console.error('Get custom reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - CREATE CUSTOM REPORT
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
    if (!body.name || !body.metrics || !body.dimensions) {
      return NextResponse.json(
        { success: false, error: 'name, metrics, and dimensions are required' },
        { status: 400 }
      );
    }

    const config: CustomReportConfig = {
      name: body.name,
      description: body.description,
      metrics: body.metrics,
      dimensions: body.dimensions,
      filters: body.filters,
      dateRangeType: body.dateRangeType || 'all',
      dateRangeFrom: body.dateRangeFrom,
      dateRangeTo: body.dateRangeTo,
      sortBy: body.sortBy,
      sortOrder: body.sortOrder || 'DESC',
      isPublic: body.isPublic || false,
    };

    const result = await createCustomReport(user.userId, config);

    if (result.error) {
      console.error('Create custom report error:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to create custom report' },
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
    console.error('Post custom reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
