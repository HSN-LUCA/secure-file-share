import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/api-auth';
import { uploadLogo, deleteLogo } from '@/lib/branding/branding-service';

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/branding/logo
 * Upload custom logo
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_LOGO_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_LOGO_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and SVG are allowed.' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const result = await uploadLogo(auth.userId, Buffer.from(buffer), file.name, file.type);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/branding/logo
 * Delete custom logo
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const s3Key = searchParams.get('s3_key');

    if (!s3Key) {
      return NextResponse.json({ error: 'Missing s3_key parameter' }, { status: 400 });
    }

    await deleteLogo(auth.userId, s3Key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
