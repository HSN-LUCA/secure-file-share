/**
 * Secure File Share - Type Definitions
 */

export type UserPlan = 'free' | 'paid' | 'enterprise';

export interface User {
  id: string;
  email: string;
  plan: UserPlan;
  createdAt: Date;
  updatedAt: Date;
  subscriptionExpiresAt?: Date;
  isActive: boolean;
}

export interface FileMetadata {
  id: string;
  shareCode: string;
  userId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  s3Key: string;
  expiresAt: Date;
  createdAt: Date;
  downloadCount: number;
  isScanned: boolean;
  isSafe?: boolean;
  storageDurationMinutes: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface DownloadRecord {
  id: string;
  fileId: string;
  ipAddress: string;
  userAgent?: string;
  downloadedAt: Date;
  country?: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: 'upload' | 'download' | 'bot_detected' | 'virus_detected';
  fileId?: string;
  userId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface UploadResponse {
  success: boolean;
  shareCode?: string;
  expiresAt?: Date;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface DownloadResponse {
  success: boolean;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PlanLimits {
  maxFileSize: number; // in bytes
  storageDurationMinutes: number;
  uploadsPerDay: number;
  unlimited: boolean;
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    storageDurationMinutes: 20,
    uploadsPerDay: 5,
    unlimited: false,
  },
  paid: {
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    storageDurationMinutes: 24 * 60, // 24 hours
    uploadsPerDay: Infinity,
    unlimited: false,
  },
  enterprise: {
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    storageDurationMinutes: 30 * 24 * 60, // 30 days
    uploadsPerDay: Infinity,
    unlimited: true,
  },
};

export const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',

  // Images
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',

  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',

  // Media
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',

  // Code/Data
  'application/json',
  'application/xml',
  'text/csv',
  'application/sql',
];

export const ALLOWED_FILE_EXTENSIONS = [
  // Documents
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'txt',
  'rtf',
  'odt',

  // Images
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'bmp',

  // Archives
  'zip',
  'rar',
  '7z',
  'tar',
  'gz',

  // Media
  'mp4',
  'webm',
  'mp3',
  'wav',
  'ogg',
  'm4a',

  // Code/Data
  'json',
  'xml',
  'csv',
  'sql',
];

export const BLOCKED_FILE_EXTENSIONS = [
  // Executables
  'exe',
  'bat',
  'sh',
  'com',
  'dll',
  'msi',
  'app',
  'dmg',

  // Scripts
  'vbs',
  'ps1',
  'py',
  'rb',

  // System
  'sys',
  'drv',
  'inf',
  'reg',
  'scr',
];
