import { query } from '@/lib/db/pool';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Data Retention Service
 * Manages automatic data cleanup based on retention policies
 */

export interface RetentionPolicy {
  id: string;
  userId?: string;
  dataType: 'files' | 'analytics' | 'logs' | 'sessions';
  retentionDays: number;
  autoDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default retention policies
 */
export const DEFAULT_RETENTION_POLICIES = {
  free: {
    files: 1, // 20 minutes = ~1 day for cleanup
    analytics: 30,
    logs: 7,
    sessions: 30,
  },
  paid: {
    files: 1, // 24 hours = ~1 day for cleanup
    analytics: 90,
    logs: 30,
    sessions: 90,
  },
  enterprise: {
    files: 30, // Custom, default 30 days
    analytics: 365,
    logs: 365,
    sessions: 365,
  },
};

/**
 * Get retention policy for user
 */
export async function getUserRetentionPolicy(
  userId: string,
  dataType: 'files' | 'analytics' | 'logs' | 'sessions'
): Promise<RetentionPolicy | null> {
  const result = await query(
    `SELECT id, user_id as "userId", data_type as "dataType", retention_days as "retentionDays",
            auto_delete as "autoDelete", created_at as "createdAt", updated_at as "updatedAt"
     FROM data_retention_policies
     WHERE user_id = $1 AND data_type = $2`,
    [userId, dataType]
  );

  return result.rows[0] || null;
}

/**
 * Set retention policy for user
 */
export async function setRetentionPolicy(
  userId: string,
  dataType: 'files' | 'analytics' | 'logs' | 'sessions',
  retentionDays: number,
  autoDelete: boolean = true
): Promise<RetentionPolicy> {
  const result = await query(
    `INSERT INTO data_retention_policies (id, user_id, data_type, retention_days, auto_delete)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, data_type) DO UPDATE SET
       retention_days = $4, auto_delete = $5, updated_at = NOW()
     RETURNING id, user_id as "userId", data_type as "dataType", retention_days as "retentionDays",
               auto_delete as "autoDelete", created_at as "createdAt", updated_at as "updatedAt"`,
    [uuidv4(), userId, dataType, retentionDays, autoDelete]
  );

  return result.rows[0];
}

/**
 * Get all retention policies for user
 */
export async function getUserRetentionPolicies(userId: string): Promise<RetentionPolicy[]> {
  const result = await query(
    `SELECT id, user_id as "userId", data_type as "dataType", retention_days as "retentionDays",
            auto_delete as "autoDelete", created_at as "createdAt", updated_at as "updatedAt"
     FROM data_retention_policies
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows;
}

/**
 * Clean up expired files
 */
export async function cleanupExpiredFiles(): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;

  // Get all expired files
  const result = await query(
    `SELECT id, s3_key FROM files WHERE expires_at <= NOW()`
  );

  for (const file of result.rows) {
    try {
      // Delete from S3
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET || '',
          Key: file.s3_key,
        })
      );

      // Delete from database
      await query('DELETE FROM files WHERE id = $1', [file.id]);
      deleted++;
    } catch (error) {
      console.error(`Failed to delete file ${file.id}:`, error);
      failed++;
    }
  }

  return { deleted, failed };
}

/**
 * Clean up old analytics data
 */
export async function cleanupOldAnalytics(): Promise<number> {
  // Delete analytics older than 90 days (default)
  const result = await query(
    `DELETE FROM analytics
     WHERE created_at < NOW() - INTERVAL '90 days'`
  );

  return result.rowCount || 0;
}

/**
 * Clean up old logs
 */
export async function cleanupOldLogs(): Promise<number> {
  // Delete logs older than 30 days (default)
  const result = await query(
    `DELETE FROM gdpr_audit_logs
     WHERE created_at < NOW() - INTERVAL '30 days'`
  );

  return result.rowCount || 0;
}

/**
 * Clean up old sessions
 */
export async function cleanupOldSessions(): Promise<number> {
  // Delete sessions older than 90 days
  const result = await query(
    `DELETE FROM user_sessions
     WHERE ended_at < NOW() - INTERVAL '90 days'`
  );

  return result.rowCount || 0;
}

/**
 * Clean up old page views
 */
export async function cleanupOldPageViews(): Promise<number> {
  // Delete page views older than 90 days
  const result = await query(
    `DELETE FROM page_views
     WHERE viewed_at < NOW() - INTERVAL '90 days'`
  );

  return result.rowCount || 0;
}

/**
 * Clean up old click events
 */
export async function cleanupOldClickEvents(): Promise<number> {
  // Delete click events older than 90 days
  const result = await query(
    `DELETE FROM click_events
     WHERE clicked_at < NOW() - INTERVAL '90 days'`
  );

  return result.rowCount || 0;
}

/**
 * Clean up old user flows
 */
export async function cleanupOldUserFlows(): Promise<number> {
  // Delete user flows older than 90 days
  const result = await query(
    `DELETE FROM user_flows
     WHERE started_at < NOW() - INTERVAL '90 days'`
  );

  return result.rowCount || 0;
}

/**
 * Clean up expired data export requests
 */
export async function cleanupExpiredExports(): Promise<number> {
  const result = await query(
    `DELETE FROM data_export_requests
     WHERE expires_at < NOW()`
  );

  return result.rowCount || 0;
}

/**
 * Clean up expired CCPA requests
 */
export async function cleanupExpiredCcpaRequests(): Promise<number> {
  const result = await query(
    `DELETE FROM ccpa_disclosure_requests
     WHERE expires_at < NOW()`
  );

  return result.rowCount || 0;
}

/**
 * Clean up old CCPA audit logs (keep for 3 years)
 */
export async function cleanupOldCcpaLogs(): Promise<number> {
  const result = await query(
    `DELETE FROM ccpa_audit_logs
     WHERE created_at < NOW() - INTERVAL '3 years'`
  );

  return result.rowCount || 0;
}

/**
 * Clean up old GDPR audit logs (keep for 1 year)
 */
export async function cleanupOldGdprLogs(): Promise<number> {
  const result = await query(
    `DELETE FROM gdpr_audit_logs
     WHERE created_at < NOW() - INTERVAL '1 year'`
  );

  return result.rowCount || 0;
}

/**
 * Clean up old webhook events
 */
export async function cleanupOldWebhookEvents(): Promise<number> {
  // Delete webhook events older than 90 days
  const result = await query(
    `DELETE FROM webhook_events
     WHERE created_at < NOW() - INTERVAL '90 days'`
  );

  return result.rowCount || 0;
}

/**
 * Clean up old API usage logs
 */
export async function cleanupOldApiUsageLogs(): Promise<number> {
  // Delete API usage logs older than 90 days
  const result = await query(
    `DELETE FROM api_usage
     WHERE created_at < NOW() - INTERVAL '90 days'`
  );

  return result.rowCount || 0;
}

/**
 * Run all cleanup tasks
 */
export async function runAllCleanupTasks(): Promise<{
  files: { deleted: number; failed: number };
  analytics: number;
  logs: number;
  sessions: number;
  pageViews: number;
  clickEvents: number;
  userFlows: number;
  exports: number;
  ccpaRequests: number;
  ccpaLogs: number;
  gdprLogs: number;
  webhookEvents: number;
  apiUsageLogs: number;
  timestamp: Date;
}> {
  console.log('Starting data retention cleanup...');

  const startTime = Date.now();

  const results = {
    files: await cleanupExpiredFiles(),
    analytics: await cleanupOldAnalytics(),
    logs: await cleanupOldLogs(),
    sessions: await cleanupOldSessions(),
    pageViews: await cleanupOldPageViews(),
    clickEvents: await cleanupOldClickEvents(),
    userFlows: await cleanupOldUserFlows(),
    exports: await cleanupExpiredExports(),
    ccpaRequests: await cleanupExpiredCcpaRequests(),
    ccpaLogs: await cleanupOldCcpaLogs(),
    gdprLogs: await cleanupOldGdprLogs(),
    webhookEvents: await cleanupOldWebhookEvents(),
    apiUsageLogs: await cleanupOldApiUsageLogs(),
    timestamp: new Date(),
  };

  const duration = Date.now() - startTime;
  console.log(`Data retention cleanup completed in ${duration}ms`, results);

  return results;
}

/**
 * Get retention policy statistics
 */
export async function getRetentionStatistics(): Promise<{
  totalFiles: number;
  expiredFiles: number;
  totalAnalytics: number;
  oldAnalytics: number;
  totalSessions: number;
  oldSessions: number;
  totalPageViews: number;
  oldPageViews: number;
  totalClickEvents: number;
  oldClickEvents: number;
}> {
  const totalFilesResult = await query('SELECT COUNT(*) as count FROM files');
  const expiredFilesResult = await query('SELECT COUNT(*) as count FROM files WHERE expires_at <= NOW()');
  const totalAnalyticsResult = await query('SELECT COUNT(*) as count FROM analytics');
  const oldAnalyticsResult = await query(
    "SELECT COUNT(*) as count FROM analytics WHERE created_at < NOW() - INTERVAL '90 days'"
  );
  const totalSessionsResult = await query('SELECT COUNT(*) as count FROM user_sessions');
  const oldSessionsResult = await query(
    "SELECT COUNT(*) as count FROM user_sessions WHERE ended_at < NOW() - INTERVAL '90 days'"
  );
  const totalPageViewsResult = await query('SELECT COUNT(*) as count FROM page_views');
  const oldPageViewsResult = await query(
    "SELECT COUNT(*) as count FROM page_views WHERE viewed_at < NOW() - INTERVAL '90 days'"
  );
  const totalClickEventsResult = await query('SELECT COUNT(*) as count FROM click_events');
  const oldClickEventsResult = await query(
    "SELECT COUNT(*) as count FROM click_events WHERE clicked_at < NOW() - INTERVAL '90 days'"
  );

  return {
    totalFiles: totalFilesResult.rows[0].count,
    expiredFiles: expiredFilesResult.rows[0].count,
    totalAnalytics: totalAnalyticsResult.rows[0].count,
    oldAnalytics: oldAnalyticsResult.rows[0].count,
    totalSessions: totalSessionsResult.rows[0].count,
    oldSessions: oldSessionsResult.rows[0].count,
    totalPageViews: totalPageViewsResult.rows[0].count,
    oldPageViews: oldPageViewsResult.rows[0].count,
    totalClickEvents: totalClickEventsResult.rows[0].count,
    oldClickEvents: oldClickEventsResult.rows[0].count,
  };
}
