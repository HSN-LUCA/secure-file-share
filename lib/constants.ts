/**
 * Application-wide constants
 */

// File upload constraints
export const FILE_CONSTRAINTS = {
  FREE_PLAN: {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    STORAGE_DURATION_MINUTES: 20,
    UPLOADS_PER_DAY: 5,
  },
  PAID_PLAN: {
    MAX_FILE_SIZE: 1024 * 1024 * 1024, // 1GB
    STORAGE_DURATION_MINUTES: 24 * 60, // 24 hours
    UPLOADS_PER_DAY: Infinity,
  },
  ENTERPRISE_PLAN: {
    MAX_FILE_SIZE: 10 * 1024 * 1024 * 1024, // 10GB
    STORAGE_DURATION_MINUTES: 30 * 24 * 60, // 30 days
    UPLOADS_PER_DAY: Infinity,
  },
  VIDEO_MAX_SIZE: 50 * 1024 * 1024, // 50MB for video files
};

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  DOCUMENTS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt'],
  IMAGES: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'],
  ARCHIVES: ['zip', 'rar', '7z', 'tar', 'gz'],
  MEDIA: ['mp4', 'webm', 'mp3', 'wav', 'ogg', 'm4a'],
};

export const ALL_ALLOWED_EXTENSIONS = [
  ...ALLOWED_FILE_TYPES.DOCUMENTS,
  ...ALLOWED_FILE_TYPES.IMAGES,
  ...ALLOWED_FILE_TYPES.ARCHIVES,
  ...ALLOWED_FILE_TYPES.MEDIA,
];

// MIME types mapping
export const MIME_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  txt: ['text/plain'],
  rtf: ['application/rtf'],
  odt: ['application/vnd.oasis.opendocument.text'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  gif: ['image/gif'],
  webp: ['image/webp'],
  svg: ['image/svg+xml'],
  bmp: ['image/bmp'],
  zip: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
  rar: ['application/x-rar-compressed', 'application/vnd.rar', 'application/x-compressed', 'application/octet-stream'],
  '7z': ['application/x-7z-compressed'],
  tar: ['application/x-tar'],
  gz: ['application/gzip'],
  mp4: ['video/mp4'],
  webm: ['video/webm'],
  mp3: ['audio/mpeg'],
  wav: ['audio/wav'],
  ogg: ['audio/ogg'],
  m4a: ['audio/mp4'],
};

// Share code configuration
export const SHARE_CODE = {
  LENGTH: 6,
  PATTERN: /^\d{6}$/,
};

// Rate limiting
export const RATE_LIMITS = {
  UPLOADS_PER_MINUTE: 5,
  REQUESTS_PER_MINUTE: 100,
};

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size',
  INVALID_FILE_TYPE: 'File type is not allowed',
  MIME_TYPE_MISMATCH: 'File MIME type does not match the extension',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  DOWNLOAD_FAILED: 'Failed to download file. Please try again.',
  FILE_NOT_FOUND: 'File not found or has expired',
  INVALID_SHARE_CODE: 'Invalid share code format',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  VIRUS_DETECTED: 'File contains malware and was rejected',
  CAPTCHA_FAILED: 'CAPTCHA verification failed',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DOWNLOADED: 'File downloaded successfully',
  SHARE_CODE_COPIED: 'Share code copied to clipboard',
};

// API endpoints
export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  DOWNLOAD: '/api/download',
  VERIFY_CAPTCHA: '/api/verify-captcha',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  DASHBOARD: '/api/dashboard',
};

// Regex patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  SHARE_CODE: /^\d{6}$/,
  URL: /^https?:\/\/.+/,
};

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 10000,
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  RECENT_UPLOADS: 'recent_uploads',
  THEME: 'theme',
};
