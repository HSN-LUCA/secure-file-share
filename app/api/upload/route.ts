/**
 * File Upload API Endpoint
 * POST /api/upload
 * 
 * Handles file uploads with validation, encryption, storage, rate limiting, and bot detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { validateFile, sanitizeFileName } from '@/lib/validation/file-validation';
import {
  validateCaptchaToken,
  sanitizeCaptchaToken,
} from '@/lib/validation/input-validation';
import { generateShareCode } from '@/lib/share-code';
import { uploadFile } from '@/lib/storage/utils';
import { createFile, getUserById, getEnterprisePlan } from '@/lib/db/queries';
import { createAnalytics } from '@/lib/db/queries';
import { getEnv } from '@/lib/env';
import { PLAN_LIMITS, UserPlan } from '@/types';
import { verifyCaptchaToken, getCaptchaErrorMessage } from '@/lib/captcha/verifier';
import { createRateLimitingMiddleware, getClientIp, createRateLimitErrorResponse } from '@/lib/middleware/rate-limiting';
import { createBotDetectionMiddleware, logBotDetectionEvent } from '@/lib/middleware/bot-detection';
import { getUserFromRequest } from '@/lib/auth/middleware';

// Create middleware instances
const rateLimitMiddleware = createRateLimitingMiddleware({
  uploadsPerMinute: 5,
  uploadsPerDay: 5,
  enableLogging: true,
});

const botDetectionMiddleware = createBotDetectionMiddleware({
  enableUserAgentCheck: true,
  enableRateLimitCheck: true,
  enableHeaderCheck: true,
  botScoreThreshold: 0.7,
  blockDurationMs: 15 * 60 * 1000, // 15 minutes
});

/**
 * POST /api/upload
 * 
 * Request body (multipart/form-data):
 * - file: File (binary)
 * - storage_duration: number (optional, minutes)
 * - share_number: string (optional, 4-8 digits for grouping uploads)
 * - captcha_token: string (reCAPTCHA v3 token)
 * 
 * Response:
 * {
 *   "success": true,
 *   "shareCode": "123456",
 *   "expiresAt": "2024-01-30T12:20:00Z",
 *   "fileName": "document.pdf",
 *   "fileSize": 1024000
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[UPLOAD] Request received');
    
    // Get client IP for analytics
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    console.log('[UPLOAD] Client IP:', clientIp);

    // Check bot detection first
    const botCheckResult = await botDetectionMiddleware.check(request);
    if (!botCheckResult.allowed) {
      await logBotDetectionEvent(clientIp, userAgent, {
        isBot: true,
        score: 0.8,
        reasons: [botCheckResult.reason || 'Suspicious activity detected'],
        shouldBlock: true,
        blockDurationMs: botCheckResult.blockDurationMs,
      });

      return NextResponse.json(
        { 
          success: false, 
          error: botCheckResult.reason || 'Suspicious activity detected. Please try again later.' 
        },
        { status: 403 }
      );
    }

    // Check rate limits
    const rateLimitResult = await rateLimitMiddleware.checkUploadLimit(request);
    if (!rateLimitResult.allowed) {
      return createRateLimitErrorResponse(rateLimitResult);
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const storageDurationStr = formData.get('storage_duration') as string | null;
    const shareNumberStr = formData.get('share_number') as string | null;
    const captchaToken = formData.get('captcha_token') as string | null;

    console.log('[UPLOAD] Form data parsed:', { 
      hasFile: !!file, 
      fileName: file?.name,
      fileSize: file?.size,
      storageDuration: storageDurationStr,
      shareNumber: shareNumberStr,
      hasCaptchaToken: !!captchaToken 
    });

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      );
    }

    if (!captchaToken) {
      return NextResponse.json(
        { success: false, error: 'CAPTCHA token is required' },
        { status: 400 }
      );
    }

    // Validate and sanitize CAPTCHA token
    const captchaValidation = validateCaptchaToken(captchaToken);
    if (!captchaValidation.valid) {
      return NextResponse.json(
        { success: false, error: captchaValidation.error },
        { status: 400 }
      );
    }

    // Validate share number if provided
    let shareCode: string;
    if (shareNumberStr) {
      const parsed = parseInt(shareNumberStr, 10);
      if (isNaN(parsed) || parsed < 1) {
        return NextResponse.json(
          { success: false, error: 'Share number must be a positive number' },
          { status: 400 }
        );
      }
      shareCode = parsed.toString();
    } else {
      // Generate random share code if not provided
      shareCode = generateShareCode();
    }

    // Verify CAPTCHA token
    const captchaResult = await verifyCaptchaToken(captchaToken, 'upload', 0.5);
    if (!captchaResult.success) {
      const errorMessage = getCaptchaErrorMessage(captchaResult.errorCodes);
      
      console.log('[UPLOAD] CAPTCHA verification failed:', { errorCodes: captchaResult.errorCodes, score: captchaResult.score });
      
      // Log CAPTCHA failure
      await createAnalytics({
        event_type: 'bot_detected',
        ip_address: clientIp,
        metadata: {
          reason: 'CAPTCHA verification failed',
          errorCodes: captchaResult.errorCodes,
          score: captchaResult.score,
        },
      }).catch(err => console.error('Failed to log analytics:', err));

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 403 }
      );
    }
    
    console.log('[UPLOAD] CAPTCHA verified successfully');

    // Get file data
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = sanitizeFileName(file.name);
    const fileSize = fileBuffer.length;
    const mimeType = file.type;

    // Determine user plan (default to free)
    let userPlan: UserPlan = 'free';
    let userId: string | undefined;
    let planLimits = PLAN_LIMITS['free'];
    
    const user = getUserFromRequest(request);
    if (user) {
      userId = user.userId;
      // Fetch user from database to get their plan
      const userResult = await getUserById(user.userId);
      if (!userResult.error && userResult.data) {
        userPlan = userResult.data.plan;
        
        // Check if subscription has expired
        if (userResult.data.subscription_expires_at && new Date(userResult.data.subscription_expires_at) < new Date()) {
          userPlan = 'free';
        }
      }
    }

    // Get plan limits (use default or custom for enterprise)
    planLimits = PLAN_LIMITS[userPlan];
    
    // For enterprise users, check for custom limits
    if (userPlan === 'enterprise' && userId) {
      const enterprisePlanResult = await getEnterprisePlan(userId);
      if (!enterprisePlanResult.error && enterprisePlanResult.data) {
        const customPlan = enterprisePlanResult.data;
        planLimits = {
          maxFileSize: customPlan.max_file_size,
          storageDurationMinutes: customPlan.storage_duration_minutes,
          uploadsPerDay: customPlan.uploads_per_day === -1 ? Infinity : customPlan.uploads_per_day,
          unlimited: true,
        };
      }
    }

    // Validate file
    const validationResult = validateFile({
      fileSize,
      fileName,
      mimeType,
      plan: userPlan,
    });

    if (!validationResult.valid) {
      // Log validation failure
      await createAnalytics({
        event_type: 'upload',
        file_id: undefined,
        user_id: userId,
        ip_address: clientIp,
        metadata: {
          error: validationResult.error,
          fileName,
          fileSize,
          plan: userPlan,
        },
      }).catch(err => console.error('Failed to log analytics:', err));

      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    // Check file size limit based on plan
    if (fileSize > planLimits.maxFileSize) {
      const maxSizeMB = Math.round(planLimits.maxFileSize / (1024 * 1024));
      
      // Log plan limit violation
      await createAnalytics({
        event_type: 'upload',
        file_id: undefined,
        user_id: userId,
        ip_address: clientIp,
        metadata: {
          error: 'File size exceeds plan limit',
          fileName,
          fileSize,
          maxFileSize: planLimits.maxFileSize,
          plan: userPlan,
        },
      }).catch(err => console.error('Failed to log analytics:', err));

      return NextResponse.json(
        { 
          success: false, 
          error: `File size exceeds maximum allowed size of ${maxSizeMB}MB for your plan` 
        },
        { status: 413 }
      );
    }

    // Determine storage duration based on plan
    let storageDurationMinutes = planLimits.storageDurationMinutes;
    
    // Allow override if provided and user is authenticated
    if (storageDurationStr && user) {
      const parsed = parseInt(storageDurationStr, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= planLimits.storageDurationMinutes) {
        storageDurationMinutes = parsed;
      }
    }

    // Generate unique file ID
    const fileId = uuidv4();

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + storageDurationMinutes * 60 * 1000);

    try {
      // Upload file to storage with encryption
      const { key: s3Key, encryptionData } = await uploadFile(
        fileId,
        fileBuffer,
        {
          contentType: mimeType,
          expirationMinutes: storageDurationMinutes,
          metadata: {
            'share-code': shareCode,
            'file-name': fileName,
          },
        }
      );

      // Store file metadata in database
      const fileRecord = await createFile({
        id: fileId,
        share_code: shareCode,
        user_id: userId,
        file_name: fileName,
        file_size: fileSize,
        file_type: mimeType,
        s3_key: s3Key,
        expires_at: expiresAt.toISOString(),
        storage_duration_minutes: storageDurationMinutes,
        ip_address: clientIp,
        user_agent: userAgent,
        is_scanned: false,
        is_safe: null,
        encryption_iv: encryptionData.iv,
        encryption_auth_tag: encryptionData.authTag,
      });

      if (fileRecord.error) {
        console.error('Failed to create file record:', fileRecord.error);
        return NextResponse.json(
          { success: false, error: 'Failed to store file metadata' },
          { status: 500 }
        );
      }

      // Log successful upload
      await createAnalytics({
        event_type: 'upload',
        file_id: fileId,
        user_id: userId,
        ip_address: clientIp,
        metadata: {
          fileName,
          fileSize,
          shareCode,
          plan: userPlan,
        },
      }).catch(err => console.error('Failed to log analytics:', err));

      // Return success response
      return NextResponse.json(
        {
          success: true,
          shareCode,
          expiresAt: expiresAt.toISOString(),
          fileName,
          fileSize,
          plan: userPlan,
        },
        { status: 200 }
      );
    } catch (storageError) {
      console.error('[UPLOAD] Storage error:', storageError);

      // Log storage error
      await createAnalytics({
        event_type: 'upload',
        file_id: undefined,
        user_id: userId,
        ip_address: clientIp,
        metadata: {
          error: 'Storage error',
          fileName,
          fileSize,
        },
      }).catch(err => console.error('Failed to log analytics:', err));

      return NextResponse.json(
        { success: false, error: 'Failed to upload file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[UPLOAD] Endpoint error:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/upload
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
