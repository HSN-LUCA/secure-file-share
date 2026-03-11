/**
 * Enterprise Plan Configuration API
 * Handles custom enterprise plan limits and configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/jwt';
import { getUserById, getEnterprisePlan, createEnterprisePlan, updateEnterprisePlan } from '@/lib/db/queries';
import { validateInput } from '@/lib/validation/input-validation';

/**
 * GET /api/enterprise/plan
 * Get current enterprise plan configuration for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is enterprise plan
    const userResult = await getUserById(user.userId);
    if (userResult.error || !userResult.data) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (userResult.data.plan !== 'enterprise') {
      return NextResponse.json(
        { success: false, error: 'User is not on enterprise plan' },
        { status: 403 }
      );
    }

    // Get enterprise plan configuration
    const planResult = await getEnterprisePlan(user.userId);
    if (planResult.error) {
      console.error('Failed to fetch enterprise plan:', planResult.error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch plan configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        plan: planResult.data || {
          maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB default
          storageDurationMinutes: 30 * 24 * 60, // 30 days default
          uploadsPerDay: -1, // unlimited
          customSupportEmail: null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Enterprise plan GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/enterprise/plan
 * Create or update enterprise plan configuration (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, maxFileSize, storageDurationMinutes, uploadsPerDay, customSupportEmail } = body;

    // Validate inputs
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const validation = validateInput(userId, 'uuid');
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid userId format' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (maxFileSize !== undefined) {
      if (typeof maxFileSize !== 'number' || maxFileSize <= 0 || maxFileSize > 100 * 1024 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'maxFileSize must be between 1 byte and 100GB' },
          { status: 400 }
        );
      }
    }

    if (storageDurationMinutes !== undefined) {
      if (typeof storageDurationMinutes !== 'number' || storageDurationMinutes <= 0 || storageDurationMinutes > 365 * 24 * 60) {
        return NextResponse.json(
          { success: false, error: 'storageDurationMinutes must be between 1 minute and 365 days' },
          { status: 400 }
        );
      }
    }

    if (uploadsPerDay !== undefined) {
      if (typeof uploadsPerDay !== 'number' || (uploadsPerDay !== -1 && uploadsPerDay <= 0)) {
        return NextResponse.json(
          { success: false, error: 'uploadsPerDay must be -1 (unlimited) or a positive number' },
          { status: 400 }
        );
      }
    }

    if (customSupportEmail !== undefined && customSupportEmail !== null) {
      const emailValidation = validateInput(customSupportEmail, 'email');
      if (!emailValidation.valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Check if target user exists and is enterprise
    const targetUserResult = await getUserById(userId);
    if (targetUserResult.error || !targetUserResult.data) {
      return NextResponse.json(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      );
    }

    if (targetUserResult.data.plan !== 'enterprise') {
      return NextResponse.json(
        { success: false, error: 'Target user is not on enterprise plan' },
        { status: 403 }
      );
    }

    // Check if enterprise plan exists
    const existingPlan = await getEnterprisePlan(userId);
    
    let result;
    if (existingPlan.data) {
      // Update existing plan
      result = await updateEnterprisePlan(userId, {
        max_file_size: maxFileSize,
        storage_duration_minutes: storageDurationMinutes,
        uploads_per_day: uploadsPerDay,
        custom_support_email: customSupportEmail,
      });
    } else {
      // Create new plan
      result = await createEnterprisePlan({
        user_id: userId,
        max_file_size: maxFileSize,
        storage_duration_minutes: storageDurationMinutes,
        uploads_per_day: uploadsPerDay,
        custom_support_email: customSupportEmail,
      });
    }

    if (result.error) {
      console.error('Failed to save enterprise plan:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to save plan configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        plan: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Enterprise plan POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
