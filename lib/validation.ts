import { PATTERNS, ALL_ALLOWED_EXTENSIONS, MIME_TYPES, FILE_CONSTRAINTS } from './constants';

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  return PATTERNS.EMAIL.test(email);
}

/**
 * Validates password strength
 * Requirements: at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
export function validatePassword(password: string): boolean {
  return PATTERNS.PASSWORD.test(password);
}

/**
 * Validates share code format
 */
export function validateShareCode(code: string): boolean {
  return PATTERNS.SHARE_CODE.test(code);
}

/**
 * Validates file extension
 */
export function validateFileExtension(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? ALL_ALLOWED_EXTENSIONS.includes(extension) : false;
}

/**
 * Validates file MIME type
 */
export function validateMimeType(filename: string, mimeType: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return false;

  const allowedMimeTypes = MIME_TYPES[extension];
  if (!allowedMimeTypes) return false;

  return allowedMimeTypes.includes(mimeType);
}

/**
 * Validates file size based on plan
 */
export function validateFileSize(
  fileSize: number,
  plan: 'free' | 'paid' | 'enterprise' = 'free',
  isVideo: boolean = false
): boolean {
  const planKey = `${plan.toUpperCase()}_PLAN` as keyof typeof FILE_CONSTRAINTS;
  const constraints = FILE_CONSTRAINTS[planKey];
  
  if (!constraints || typeof constraints === 'number') return false;

  // Check video-specific size limit
  if (isVideo && fileSize > FILE_CONSTRAINTS.VIDEO_MAX_SIZE) {
    return false;
  }

  return fileSize <= (constraints as any).MAX_FILE_SIZE;
}

/**
 * Sanitizes filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '') // Remove ..
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*]/g, '') // Remove invalid characters
    .trim();
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validates URL format
 */
export function validateUrl(url: string): boolean {
  return PATTERNS.URL.test(url);
}

/**
 * Validates input length
 */
export function validateLength(input: string, min: number, max: number): boolean {
  return input.length >= min && input.length <= max;
}

/**
 * Checks if file is a video
 */
export function isVideoFile(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? ['mp4', 'webm'].includes(extension) : false;
}

/**
 * Gets file extension
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
