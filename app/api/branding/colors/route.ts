import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/api-auth';
import { updateColorScheme, validateColor } from '@/lib/branding/branding-service';

/**
 * POST /api/branding/colors
 * Update custom color scheme
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.context) {
      return auth.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { primary_color, secondary_color, accent_color } = body;

    // Validate required fields
    if (!primary_color || !secondary_color || !accent_color) {
      return NextResponse.json(
        { error: 'Missing required fields: primary_color, secondary_color, accent_color' },
        { status: 400 }
      );
    }

    // Validate color formats
    const primaryValidation = validateColor(primary_color);
    const secondaryValidation = validateColor(secondary_color);
    const accentValidation = validateColor(accent_color);

    if (!primaryValidation.valid) {
      return NextResponse.json({ error: `Invalid primary_color: ${primaryValidation.error}` }, { status: 400 });
    }

    if (!secondaryValidation.valid) {
      return NextResponse.json({ error: `Invalid secondary_color: ${secondaryValidation.error}` }, { status: 400 });
    }

    if (!accentValidation.valid) {
      return NextResponse.json({ error: `Invalid accent_color: ${accentValidation.error}` }, { status: 400 });
    }

    const config = await updateColorScheme(auth.context.userId, primary_color, secondary_color, accent_color);

    return NextResponse.json({
      config,
      accessibility: {
        primary: primaryValidation,
        secondary: secondaryValidation,
        accent: accentValidation,
      },
    });
  } catch (error) {
    console.error('Error updating color scheme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/branding/colors/validate
 * Validate color accessibility
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const color = searchParams.get('color');

    if (!color) {
      return NextResponse.json({ error: 'Missing color parameter' }, { status: 400 });
    }

    const validation = validateColor(color);

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Error validating color:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
