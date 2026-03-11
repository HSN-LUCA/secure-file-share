/**
 * File Validation Utilities
 * Validates file size, type, and MIME type
 */

import { ALL_ALLOWED_EXTENSIONS, MIME_TYPES, FILE_CONSTRAINTS } from '@/lib/constants';
import { UserPlan, PLAN_LIMITS } from '@/types';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  plan?: UserPlan;
  fileSize: number;
  fileName: string;
  mimeType: string;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Validate file extension against whitelist
 */
export function validateFileExtension(fileName: string): FileValidationResult {
  const extension = getFileExtension(fileName);

  if (!extension) {
    return {
      valid: false,
      error: 'File must have an extension',
    };
  }

  if (!ALL_ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File type .${extension} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Validate MIME type matches file extension
 */
export function validateMimeType(
  fileName: string,
  mimeType: string
): FileValidationResult {
  const extension = getFileExtension(fileName);

  if (!extension) {
    return {
      valid: false,
      error: 'File must have an extension',
    };
  }

  const allowedMimeTypes = MIME_TYPES[extension];

  if (!allowedMimeTypes) {
    return {
      valid: false,
      error: `No MIME types configured for .${extension} files`,
    };
  }

  if (!allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `MIME type ${mimeType} does not match file extension .${extension}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size based on plan
 */
export function validateFileSize(
  fileSize: number,
  plan: UserPlan = 'free'
): FileValidationResult {
  const limits = PLAN_LIMITS[plan];
  const maxSize = limits.maxFileSize;

  if (fileSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB for ${plan} plan`,
    };
  }

  // Check video file size limit (50MB for videos)
  const extension = getFileExtension(''); // Will be checked separately
  if (['mp4', 'webm'].includes(extension)) {
    if (fileSize > FILE_CONSTRAINTS.VIDEO_MAX_SIZE) {
      const maxSizeMB = Math.round(FILE_CONSTRAINTS.VIDEO_MAX_SIZE / (1024 * 1024));
      return {
        valid: false,
        error: `Video files must be smaller than ${maxSizeMB}MB`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate video file size specifically
 */
export function validateVideoFileSize(fileSize: number): FileValidationResult {
  if (fileSize > FILE_CONSTRAINTS.VIDEO_MAX_SIZE) {
    const maxSizeMB = Math.round(FILE_CONSTRAINTS.VIDEO_MAX_SIZE / (1024 * 1024));
    return {
      valid: false,
      error: `Video files must be smaller than ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive file validation
 */
export function validateFile(options: FileValidationOptions): FileValidationResult {
  const { fileSize, fileName, mimeType, plan = 'free' } = options;

  // Validate extension
  const extensionResult = validateFileExtension(fileName);
  if (!extensionResult.valid) {
    return extensionResult;
  }

  // Validate MIME type
  const mimeResult = validateMimeType(fileName, mimeType);
  if (!mimeResult.valid) {
    return mimeResult;
  }

  // Validate file size
  const sizeResult = validateFileSize(fileSize, plan);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  // Validate video file size
  const extension = getFileExtension(fileName);
  if (['mp4', 'webm'].includes(extension)) {
    const videoSizeResult = validateVideoFileSize(fileSize);
    if (!videoSizeResult.valid) {
      return videoSizeResult;
    }
  }

  return { valid: true };
}

/**
 * Sanitize file name to prevent path traversal attacks
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and null bytes
  let sanitized = fileName
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '_');

  // Remove leading/trailing spaces and dots
  sanitized = sanitized.trim().replace(/^\.+/, '').replace(/\.+$/, '');

  // Limit length to 255 characters
  if (sanitized.length > 255) {
    const extension = getFileExtension(sanitized);
    const maxNameLength = 255 - extension.length - 1;
    sanitized = sanitized.substring(0, maxNameLength) + '.' + extension;
  }

  return sanitized;
}

/**
 * Validate share code format
 */
export function validateShareCode(code: string): FileValidationResult {
  if (!code || typeof code !== 'string') {
    return {
      valid: false,
      error: 'Share code must be a string',
    };
  }

  if (!/^\d{6}$/.test(code)) {
    return {
      valid: false,
      error: 'Share code must be exactly 6 digits',
    };
  }

  return { valid: true };
}
