import { query } from '@/lib/db/pool';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * GDPR Compliance Service
 * Handles user data rights including export, deletion, and consent management
 */

export interface UserConsent {
  id: string;
  userId: string;
  consentType: 'analytics' | 'marketing' | 'profiling' | 'third_party';
  given: boolean;
  givenAt?: Date;
  withdrawnAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  exportFormat: 'json' | 'csv';
  fileName?: string;
  fileSize?: number;
  s3Key?: string;
  downloadToken?: string;
  downloadTokenExpiresAt?: Date;
  errorMessage?: string;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  deletionType: 'account' | 'files' | 'analytics';
  reason?: string;
  errorMessage?: string;
  requestedAt: Date;
  completedAt?: Date;
  scheduledFor?: Date;
}

/**
 * Record user consent
 */
export async function recordUserConsent(
  userId: string,
  consentType: 'analytics' | 'marketing' | 'profiling' | 'third_party',
  given: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<UserConsent> {
  const result = await query(
    `INSERT INTO user_consents (id, user_id, consent_type, given, given_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id as "userId", consent_type as "consentType", given, given_at as "givenAt", 
               withdrawn_at as "withdrawnAt", created_at as "createdAt", updated_at as "updatedAt"`,
    [uuidv4(), userId, consentType, given, given ? new Date() : null, ipAddress, userAgent]
  );

  return result.rows[0];
}

/**
 * Get user consents
 */
export async function getUserConsents(userId: string): Promise<UserConsent[]> {
  const result = await query(
    `SELECT id, user_id as "userId", consent_type as "consentType", given, given_at as "givenAt",
            withdrawn_at as "withdrawnAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM user_consents
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Withdraw user consent
 */
export async function withdrawUserConsent(
  userId: string,
  consentType: 'analytics' | 'marketing' | 'profiling' | 'third_party'
): Promise<UserConsent> {
  const result = await query(
    `UPDATE user_consents
     SET given = false, withdrawn_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND consent_type = $2
     RETURNING id, user_id as "userId", consent_type as "consentType", given, given_at as "givenAt",
               withdrawn_at as "withdrawnAt", created_at as "createdAt", updated_at as "updatedAt"`,
    [userId, consentType]
  );

  if (result.rows.length === 0) {
    throw new Error('Consent not found');
  }

  return result.rows[0];
}

/**
 * Request data export
 */
export async function requestDataExport(
  userId: string,
  exportFormat: 'json' | 'csv' = 'json'
): Promise<DataExportRequest> {
  const result = await query(
    `INSERT INTO data_export_requests (id, user_id, status, export_format)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id as "userId", status, export_format as "exportFormat", file_name as "fileName",
               file_size as "fileSize", s3_key as "s3Key", download_token as "downloadToken",
               download_token_expires_at as "downloadTokenExpiresAt", error_message as "errorMessage",
               requested_at as "requestedAt", completed_at as "completedAt", expires_at as "expiresAt"`,
    [uuidv4(), userId, 'pending', exportFormat]
  );

  // Log GDPR action
  await logGdprAction(userId, 'data_export_requested', { exportFormat });

  return result.rows[0];
}

/**
 * Get data export requests for user
 */
export async function getUserDataExports(userId: string): Promise<DataExportRequest[]> {
  const result = await query(
    `SELECT id, user_id as "userId", status, export_format as "exportFormat", file_name as "fileName",
            file_size as "fileSize", s3_key as "s3Key", download_token as "downloadToken",
            download_token_expires_at as "downloadTokenExpiresAt", error_message as "errorMessage",
            requested_at as "requestedAt", completed_at as "completedAt", expires_at as "expiresAt"
     FROM data_export_requests
     WHERE user_id = $1
     ORDER BY requested_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Update data export status
 */
export async function updateDataExportStatus(
  exportId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  options?: {
    fileName?: string;
    fileSize?: number;
    s3Key?: string;
    downloadToken?: string;
    errorMessage?: string;
  }
): Promise<DataExportRequest> {
  const downloadTokenExpiresAt = options?.downloadToken ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;

  const result = await query(
    `UPDATE data_export_requests
     SET status = $1, file_name = COALESCE($2, file_name), file_size = COALESCE($3, file_size),
         s3_key = COALESCE($4, s3_key), download_token = COALESCE($5, download_token),
         download_token_expires_at = COALESCE($6, download_token_expires_at),
         error_message = COALESCE($7, error_message), completed_at = CASE WHEN $1 IN ('completed', 'failed') THEN NOW() ELSE completed_at END
     WHERE id = $1
     RETURNING id, user_id as "userId", status, export_format as "exportFormat", file_name as "fileName",
               file_size as "fileSize", s3_key as "s3Key", download_token as "downloadToken",
               download_token_expires_at as "downloadTokenExpiresAt", error_message as "errorMessage",
               requested_at as "requestedAt", completed_at as "completedAt", expires_at as "expiresAt"`,
    [exportId, options?.fileName, options?.fileSize, options?.s3Key, options?.downloadToken, downloadTokenExpiresAt, options?.errorMessage]
  );

  if (result.rows.length === 0) {
    throw new Error('Data export request not found');
  }

  return result.rows[0];
}

/**
 * Request data deletion
 */
export async function requestDataDeletion(
  userId: string,
  deletionType: 'account' | 'files' | 'analytics' = 'account',
  reason?: string
): Promise<DataDeletionRequest> {
  const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30-day grace period

  const result = await query(
    `INSERT INTO data_deletion_requests (id, user_id, status, deletion_type, reason, scheduled_for)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id as "userId", status, deletion_type as "deletionType", reason,
               error_message as "errorMessage", requested_at as "requestedAt", completed_at as "completedAt",
               scheduled_for as "scheduledFor"`,
    [uuidv4(), userId, 'pending', deletionType, reason, scheduledFor]
  );

  // Log GDPR action
  await logGdprAction(userId, 'data_deletion_requested', { deletionType, reason });

  return result.rows[0];
}

/**
 * Get data deletion requests for user
 */
export async function getUserDataDeletions(userId: string): Promise<DataDeletionRequest[]> {
  const result = await query(
    `SELECT id, user_id as "userId", status, deletion_type as "deletionType", reason,
            error_message as "errorMessage", requested_at as "requestedAt", completed_at as "completedAt",
            scheduled_for as "scheduledFor"
     FROM data_deletion_requests
     WHERE user_id = $1
     ORDER BY requested_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Update data deletion status
 */
export async function updateDataDeletionStatus(
  deletionId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<DataDeletionRequest> {
  const result = await query(
    `UPDATE data_deletion_requests
     SET status = $1, error_message = COALESCE($2, error_message),
         completed_at = CASE WHEN $1 IN ('completed', 'failed') THEN NOW() ELSE completed_at END
     WHERE id = $1
     RETURNING id, user_id as "userId", status, deletion_type as "deletionType", reason,
               error_message as "errorMessage", requested_at as "requestedAt", completed_at as "completedAt",
               scheduled_for as "scheduledFor"`,
    [deletionId, errorMessage]
  );

  if (result.rows.length === 0) {
    throw new Error('Data deletion request not found');
  }

  return result.rows[0];
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const client = await query('SELECT 1'); // Get a connection

  try {
    // Start transaction
    await query('BEGIN');

    // Delete user files from S3
    const filesResult = await query('SELECT s3_key FROM files WHERE user_id = $1', [userId]);
    for (const file of filesResult.rows) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET || '',
            Key: file.s3_key,
          })
        );
      } catch (error) {
        console.error(`Failed to delete S3 object: ${file.s3_key}`, error);
      }
    }

    // Delete all user data
    await query('DELETE FROM user_consents WHERE user_id = $1', [userId]);
    await query('DELETE FROM data_export_requests WHERE user_id = $1', [userId]);
    await query('DELETE FROM data_deletion_requests WHERE user_id = $1', [userId]);
    await query('DELETE FROM gdpr_audit_logs WHERE user_id = $1', [userId]);
    await query('DELETE FROM files WHERE user_id = $1', [userId]);
    await query('DELETE FROM downloads WHERE file_id IN (SELECT id FROM files WHERE user_id = $1)', [userId]);
    await query('DELETE FROM analytics WHERE user_id = $1', [userId]);
    await query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
    await query('DELETE FROM page_views WHERE user_id = $1', [userId]);
    await query('DELETE FROM click_events WHERE user_id = $1', [userId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);

    // Log deletion
    await logGdprAction(userId, 'account_deleted', {});

    // Commit transaction
    await query('COMMIT');
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * Delete user files
 */
export async function deleteUserFiles(userId: string): Promise<void> {
  const filesResult = await query('SELECT id, s3_key FROM files WHERE user_id = $1', [userId]);

  for (const file of filesResult.rows) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET || '',
          Key: file.s3_key,
        })
      );
    } catch (error) {
      console.error(`Failed to delete S3 object: ${file.s3_key}`, error);
    }
  }

  await query('DELETE FROM files WHERE user_id = $1', [userId]);
  await logGdprAction(userId, 'data_deleted', { type: 'files' });
}

/**
 * Delete user analytics data
 */
export async function deleteUserAnalytics(userId: string): Promise<void> {
  await query('DELETE FROM analytics WHERE user_id = $1', [userId]);
  await query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
  await query('DELETE FROM page_views WHERE user_id = $1', [userId]);
  await query('DELETE FROM click_events WHERE user_id = $1', [userId]);
  await logGdprAction(userId, 'data_deleted', { type: 'analytics' });
}

/**
 * Log GDPR action
 */
export async function logGdprAction(
  userId: string | null,
  action: string,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await query(
    `INSERT INTO gdpr_audit_logs (id, user_id, action, action_details, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuidv4(), userId, action, JSON.stringify(details), ipAddress, userAgent]
  );
}

/**
 * Get GDPR audit logs
 */
export async function getGdprAuditLogs(userId?: string, limit: number = 100): Promise<any[]> {
  let sql = 'SELECT * FROM gdpr_audit_logs';
  const params: any[] = [];

  if (userId) {
    sql += ' WHERE user_id = $1';
    params.push(userId);
  }

  sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
  params.push(limit);

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Accept Data Processing Agreement
 */
export async function acceptDataProcessingAgreement(
  userId: string,
  dpaVersion: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await query(
    `INSERT INTO data_processing_agreements (id, user_id, dpa_version, accepted, accepted_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET
       dpa_version = $3, accepted = $4, accepted_at = $5, ip_address = $6, user_agent = $7`,
    [uuidv4(), userId, dpaVersion, true, new Date(), ipAddress, userAgent]
  );

  await logGdprAction(userId, 'dpa_accepted', { dpaVersion }, ipAddress, userAgent);
}

/**
 * Get user's DPA acceptance status
 */
export async function getUserDpaStatus(userId: string): Promise<any> {
  const result = await query(
    `SELECT id, user_id as "userId", dpa_version as "dpaVersion", accepted, accepted_at as "acceptedAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM data_processing_agreements
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Set data retention policy
 */
export async function setDataRetentionPolicy(
  userId: string,
  dataType: 'files' | 'analytics' | 'logs' | 'sessions',
  retentionDays: number,
  autoDelete: boolean = true
): Promise<void> {
  await query(
    `INSERT INTO data_retention_policies (id, user_id, data_type, retention_days, auto_delete)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, data_type) DO UPDATE SET
       retention_days = $4, auto_delete = $5, updated_at = NOW()`,
    [uuidv4(), userId, dataType, retentionDays, autoDelete]
  );
}

/**
 * Get data retention policies
 */
export async function getDataRetentionPolicies(userId: string): Promise<any[]> {
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
 * Clean up expired data based on retention policies
 */
export async function cleanupExpiredData(): Promise<void> {
  // Delete old analytics data
  await query(
    `DELETE FROM analytics
     WHERE created_at < NOW() - INTERVAL '90 days'`
  );

  // Delete old sessions
  await query(
    `DELETE FROM user_sessions
     WHERE ended_at < NOW() - INTERVAL '30 days'`
  );

  // Delete old page views
  await query(
    `DELETE FROM page_views
     WHERE viewed_at < NOW() - INTERVAL '90 days'`
  );

  // Delete old click events
  await query(
    `DELETE FROM click_events
     WHERE clicked_at < NOW() - INTERVAL '90 days'`
  );

  // Delete expired data export requests
  await query(
    `DELETE FROM data_export_requests
     WHERE expires_at < NOW()`
  );

  // Delete old GDPR audit logs (keep for 1 year)
  await query(
    `DELETE FROM gdpr_audit_logs
     WHERE created_at < NOW() - INTERVAL '1 year'`
  );
}
