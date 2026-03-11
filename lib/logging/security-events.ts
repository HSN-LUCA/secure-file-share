/**
 * Security Event Logging
 * Log all security-related events to database and logger
 */

import { createAnalytics } from '@/lib/db/queries';
import { securityLogger } from '@/lib/logging/logger';

export type SecurityEventType =
  | 'CAPTCHA_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VIRUS_DETECTED'
  | 'INVALID_UPLOAD'
  | 'EXPIRED_FILE_ACCESS'
  | 'INVALID_SHARE_CODE'
  | 'STORAGE_ERROR'
  | 'AUTHENTICATION_FAILED'
  | 'AUTHORIZATION_FAILED';

export interface SecurityEventData {
  eventType: SecurityEventType;
  ipAddress?: string;
  fileId?: string;
  userId?: string;
  details?: Record<string, any>;
}

/**
 * Log a security event
 */
export async function logSecurityEvent(data: SecurityEventData): Promise<void> {
  const { eventType, ipAddress, fileId, userId, details } = data;

  // Log to console
  securityLogger.warn(`Security event: ${eventType}`, {
    ipAddress,
    fileId,
    userId,
    ...details,
  });

  // Log to database
  try {
    await createAnalytics({
      event_type: mapSecurityEventToAnalyticsType(eventType),
      file_id: fileId || null,
      user_id: userId || null,
      ip_address: ipAddress || null,
      metadata: {
        securityEventType: eventType,
        ...details,
      },
    });
  } catch (error) {
    securityLogger.error(`Failed to log security event to database: ${eventType}`, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Map security event type to analytics event type
 */
function mapSecurityEventToAnalyticsType(
  eventType: SecurityEventType
): 'upload' | 'download' | 'bot_detected' | 'virus_detected' {
  switch (eventType) {
    case 'CAPTCHA_FAILED':
    case 'RATE_LIMIT_EXCEEDED':
      return 'bot_detected';
    case 'VIRUS_DETECTED':
      return 'virus_detected';
    case 'INVALID_UPLOAD':
    case 'INVALID_SHARE_CODE':
    case 'STORAGE_ERROR':
    case 'AUTHENTICATION_FAILED':
    case 'AUTHORIZATION_FAILED':
    case 'EXPIRED_FILE_ACCESS':
      return 'upload';
    default:
      return 'upload';
  }
}

/**
 * Log CAPTCHA failure
 */
export async function logCaptchaFailure(
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'CAPTCHA_FAILED',
    ipAddress,
    details,
  });
}

/**
 * Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'RATE_LIMIT_EXCEEDED',
    ipAddress,
    details,
  });
}

/**
 * Log virus detection
 */
export async function logVirusDetected(
  fileId: string,
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'VIRUS_DETECTED',
    fileId,
    ipAddress,
    details,
  });
}

/**
 * Log invalid upload
 */
export async function logInvalidUpload(
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'INVALID_UPLOAD',
    ipAddress,
    details,
  });
}

/**
 * Log expired file access attempt
 */
export async function logExpiredFileAccess(
  fileId: string,
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'EXPIRED_FILE_ACCESS',
    fileId,
    ipAddress,
    details,
  });
}

/**
 * Log invalid share code
 */
export async function logInvalidShareCode(
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'INVALID_SHARE_CODE',
    ipAddress,
    details,
  });
}

/**
 * Log storage error
 */
export async function logStorageError(
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'STORAGE_ERROR',
    ipAddress,
    details,
  });
}

/**
 * Log authentication failure
 */
export async function logAuthenticationFailure(
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'AUTHENTICATION_FAILED',
    ipAddress,
    details,
  });
}

/**
 * Log authorization failure
 */
export async function logAuthorizationFailure(
  userId: string,
  ipAddress: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'AUTHORIZATION_FAILED',
    userId,
    ipAddress,
    details,
  });
}
