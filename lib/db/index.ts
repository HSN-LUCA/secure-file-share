/**
 * Database Module
 * Central export point for all database utilities
 */

// Configuration
export { supabaseClient, supabaseServer, dbConfig } from './config';

// Types
export type {
  User,
  File,
  Download,
  Analytics,
  UserInsert,
  UserUpdate,
  FileInsert,
  FileUpdate,
  DownloadInsert,
  AnalyticsInsert,
  QueryResult,
  QueryResultList,
} from './types';

// Query functions
export {
  // User queries
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  // File queries
  getFileByShareCode,
  getFileById,
  getUserFiles,
  createFile,
  updateFile,
  deleteFile,
  getExpiredFiles,
  // Download queries
  createDownload,
  getFileDownloads,
  getDownloadCount,
  // Analytics queries
  createAnalytics,
  getAnalyticsByEventType,
  getFileAnalytics,
  getUserAnalytics,
  getAnalyticsCount,
} from './queries';

// Setup and initialization
export {
  initializeDatabase,
  verifyDatabaseConnection,
  checkTablesExist,
  getDatabaseStats,
} from './setup';

// Connection pooling
export {
  getPool,
  getClient,
  query,
  queryOne,
  getPoolStats,
  closePool,
  healthCheck,
  drainPool,
  resetPool,
  startPoolMonitoring,
  stopPoolMonitoring,
} from './pool';
