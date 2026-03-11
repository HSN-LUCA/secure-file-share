/**
 * User-Friendly Error Messages
 * Maps error codes to user-friendly messages
 */

export const ERROR_MESSAGES: Record<string, string> = {
  // Validation errors
  VALIDATION_ERROR: 'Invalid input. Please check your data and try again.',
  INVALID_FILE: 'The file you uploaded is not valid. Please check the file format.',
  INVALID_FILE_SIZE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'File type is not supported. Please upload a different file.',
  INVALID_SHARE_CODE: 'The share code you entered is invalid. Please check and try again.',
  INVALID_INPUT: 'Invalid input provided. Please check your data.',

  // Authentication & Authorization
  AUTHENTICATION_FAILED: 'Authentication failed. Please try again.',
  AUTHORIZATION_FAILED: 'You do not have permission to access this resource.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',

  // File errors
  FILE_NOT_FOUND: 'The file you are looking for does not exist.',
  FILE_EXPIRED: 'The file has expired and is no longer available.',
  FILE_ALREADY_EXISTS: 'A file with this name already exists.',

  // Bot detection & Rate limiting
  CAPTCHA_FAILED: 'CAPTCHA verification failed. Please try again.',
  RATE_LIMIT_EXCEEDED: 'You have made too many requests. Please try again later.',
  SUSPICIOUS_ACTIVITY: 'Suspicious activity detected. Please try again later.',
  IP_BLOCKED: 'Your IP address has been temporarily blocked. Please try again later.',

  // Virus scanning
  VIRUS_DETECTED: 'The file you uploaded contains malware and has been rejected.',
  SCAN_FAILED: 'File scanning failed. Please try again.',

  // Storage errors
  STORAGE_ERROR: 'Failed to store the file. Please try again.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  DOWNLOAD_FAILED: 'File download failed. Please try again.',

  // Server errors
  INTERNAL_ERROR: 'An internal server error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again later.',
  DATABASE_ERROR: 'A database error occurred. Please try again later.',

  // Plan & Subscription
  PLAN_LIMIT_EXCEEDED: 'You have reached your plan limit. Please upgrade to continue.',
  SUBSCRIPTION_EXPIRED: 'Your subscription has expired. Please renew to continue.',
  INSUFFICIENT_STORAGE: 'You have insufficient storage. Please upgrade your plan.',

  // Conflict errors
  CONFLICT: 'A conflict occurred. Please try again.',
  DUPLICATE_ENTRY: 'This entry already exists.',

  // Missing configuration
  MISSING_SECRET_KEY: 'Server configuration error. Please contact support.',
  MISSING_TOKEN: 'Authentication token is missing.',
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(code: string, defaultMessage?: string): string {
  return ERROR_MESSAGES[code] || defaultMessage || ERROR_MESSAGES.INTERNAL_ERROR;
}

/**
 * Get error message with context
 */
export function getContextualErrorMessage(code: string, context?: Record<string, any>): string {
  let message = getUserFriendlyMessage(code);

  // Add context-specific information
  if (context) {
    if (context.retryAfter) {
      message += ` Please try again in ${context.retryAfter} seconds.`;
    }
    if (context.maxSize) {
      message += ` Maximum file size is ${context.maxSize}.`;
    }
    if (context.allowedTypes) {
      message += ` Allowed file types: ${context.allowedTypes.join(', ')}.`;
    }
  }

  return message;
}

/**
 * Map HTTP status code to user-friendly message
 */
export function getMessageByStatusCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred. Please try again.';
    case 413:
      return 'The file is too large. Please upload a smaller file.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'An internal server error occurred. Please try again later.';
    case 503:
      return 'The service is temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}
