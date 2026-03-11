/**
 * Storage Module Exports
 */

// Configuration
export { getStorageConfig, createS3Client, getStorageProviderName, validateStorageConfig } from './config';
export type { StorageConfig, StorageProvider } from './config';

// Encryption
export { encryptFile, decryptFile, generateEncryptionKey, validateEncryptionKey } from './encryption';
export type { EncryptionResult, DecryptionInput } from './encryption';

// Utilities
export {
  generateS3Key,
  uploadFile,
  downloadFile,
  deleteFile,
  fileExists,
  getFileMetadata,
  listExpiredFiles,
  getStorageStats,
} from './utils';
export type { UploadOptions, DownloadResult, FileMetadata } from './utils';

// Expiration
export {
  setupExpirationPolicies,
  getExpirationPolicies,
  verifyExpirationPolicies,
  getExpirationTime,
  getExpirationMinutes,
  isFileExpired,
  getTimeUntilExpiration,
  formatExpirationTime,
  DEFAULT_POLICIES,
} from './expiration';
export type { ExpirationPolicy } from './expiration';

// Setup
export { initializeStorage, verifyStorage, getStorageStatus } from './setup';
