import { query } from '@/lib/db/pool';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * CCPA Compliance Service
 * Handles California Consumer Privacy Act requirements including opt-out, disclosure, and deletion
 */

export interface UserOptOut {
  id: string;
  userId: string;
  optOutType: 'sale' | 'sharing' | 'targeted_advertising' | 'profiling';
  optedOut: boolean;
  optedOutAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CcpaDisclosureRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'deletion' | 'opt_out';
  status: 'pending' | 'processing' | 'completed' | 'denied';
  verificationMethod: 'email' | 'phone' | 'in_person';
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  verifiedAt?: Date;
  denialReason?: string;
  requestedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

/**
 * Record user opt-out
 */
export async function recordUserOptOut(
  userId: string,
  optOutType: 'sale' | 'sharing' | 'targeted_advertising' | 'profiling',
  ipAddress?: string,
  userAgent?: string
): Promise<UserOptOut> {
  const result = await query(
    `INSERT INTO user_opt_outs (id, user_id, opt_out_type, opted_out, opted_out_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id as "userId", opt_out_type as "optOutType", opted_out as "optedOut",
               opted_out_at as "optedOutAt", created_at as "createdAt", updated_at as "updatedAt"`,
    [uuidv4(), userId, optOutType, true, new Date(), ipAddress, userAgent]
  );

  // Log CCPA action
  await logCcpaAction(userId, 'opt_out_requested', { optOutType }, ipAddress, userAgent);

  return result.rows[0];
}

/**
 * Get user opt-outs
 */
export async function getUserOptOuts(userId: string): Promise<UserOptOut[]> {
  const result = await query(
    `SELECT id, user_id as "userId", opt_out_type as "optOutType", opted_out as "optedOut",
            opted_out_at as "optedOutAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM user_opt_outs
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Check if user has opted out of specific category
 */
export async function hasUserOptedOut(
  userId: string,
  optOutType: 'sale' | 'sharing' | 'targeted_advertising' | 'profiling'
): Promise<boolean> {
  const result = await query(
    `SELECT opted_out FROM user_opt_outs
     WHERE user_id = $1 AND opt_out_type = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, optOutType]
  );

  return result.rows.length > 0 ? result.rows[0].opted_out : false;
}

/**
 * Opt in user (withdraw opt-out)
 */
export async function optInUser(
  userId: string,
  optOutType: 'sale' | 'sharing' | 'targeted_advertising' | 'profiling'
): Promise<UserOptOut> {
  const result = await query(
    `INSERT INTO user_opt_outs (id, user_id, opt_out_type, opted_out, opted_out_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id as "userId", opt_out_type as "optOutType", opted_out as "optedOut",
               opted_out_at as "optedOutAt", created_at as "createdAt", updated_at as "updatedAt"`,
    [uuidv4(), userId, optOutType, false, null]
  );

  await logCcpaAction(userId, 'opt_out_withdrawn', { optOutType });

  return result.rows[0];
}

/**
 * Request CCPA disclosure
 */
export async function requestCcpaDisclosure(
  userId: string,
  requestType: 'access' | 'deletion' | 'opt_out',
  verificationMethod: 'email' | 'phone' | 'in_person' = 'email'
): Promise<CcpaDisclosureRequest> {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const result = await query(
    `INSERT INTO ccpa_disclosure_requests (id, user_id, request_type, status, verification_method, verification_token, verification_token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id as "userId", request_type as "requestType", status,
               verification_method as "verificationMethod", verification_token as "verificationToken",
               verification_token_expires_at as "verificationTokenExpiresAt", verified_at as "verifiedAt",
               denial_reason as "denialReason", requested_at as "requestedAt", completed_at as "completedAt",
               expires_at as "expiresAt"`,
    [uuidv4(), userId, requestType, 'pending', verificationMethod, verificationToken, verificationTokenExpiresAt]
  );

  // Log CCPA action
  await logCcpaAction(userId, 'disclosure_requested', { requestType, verificationMethod });

  return result.rows[0];
}

/**
 * Get CCPA disclosure requests for user
 */
export async function getUserCcpaRequests(userId: string): Promise<CcpaDisclosureRequest[]> {
  const result = await query(
    `SELECT id, user_id as "userId", request_type as "requestType", status,
            verification_method as "verificationMethod", verification_token as "verificationToken",
            verification_token_expires_at as "verificationTokenExpiresAt", verified_at as "verifiedAt",
            denial_reason as "denialReason", requested_at as "requestedAt", completed_at as "completedAt",
            expires_at as "expiresAt"
     FROM ccpa_disclosure_requests
     WHERE user_id = $1
     ORDER BY requested_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Verify CCPA disclosure request
 */
export async function verifyCcpaRequest(
  requestId: string,
  verificationToken: string
): Promise<CcpaDisclosureRequest> {
  const result = await query(
    `UPDATE ccpa_disclosure_requests
     SET status = 'processing', verified_at = NOW()
     WHERE id = $1 AND verification_token = $2 AND verification_token_expires_at > NOW()
     RETURNING id, user_id as "userId", request_type as "requestType", status,
               verification_method as "verificationMethod", verification_token as "verificationToken",
               verification_token_expires_at as "verificationTokenExpiresAt", verified_at as "verifiedAt",
               denial_reason as "denialReason", requested_at as "requestedAt", completed_at as "completedAt",
               expires_at as "expiresAt"`,
    [requestId, verificationToken]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired verification token');
  }

  return result.rows[0];
}

/**
 * Complete CCPA disclosure request
 */
export async function completeCcpaRequest(
  requestId: string,
  status: 'completed' | 'denied' = 'completed',
  denialReason?: string
): Promise<CcpaDisclosureRequest> {
  const result = await query(
    `UPDATE ccpa_disclosure_requests
     SET status = $1, denial_reason = $2, completed_at = NOW()
     WHERE id = $3
     RETURNING id, user_id as "userId", request_type as "requestType", status,
               verification_method as "verificationMethod", verification_token as "verificationToken",
               verification_token_expires_at as "verificationTokenExpiresAt", verified_at as "verifiedAt",
               denial_reason as "denialReason", requested_at as "requestedAt", completed_at as "completedAt",
               expires_at as "expiresAt"`,
    [status, denialReason, requestId]
  );

  if (result.rows.length === 0) {
    throw new Error('CCPA request not found');
  }

  return result.rows[0];
}

/**
 * Log CCPA action
 */
export async function logCcpaAction(
  userId: string | null,
  action: string,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await query(
    `INSERT INTO ccpa_audit_logs (id, user_id, action, action_details, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuidv4(), userId, action, JSON.stringify(details), ipAddress, userAgent]
  );
}

/**
 * Get CCPA audit logs
 */
export async function getCcpaAuditLogs(userId?: string, limit: number = 100): Promise<any[]> {
  let sql = 'SELECT * FROM ccpa_audit_logs';
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
 * Acknowledge CCPA privacy notice
 */
export async function acknowledgeCcpaNotice(
  userId: string,
  noticeVersion: string = '1.0',
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await query(
    `INSERT INTO ccpa_privacy_notices (id, user_id, notice_version, acknowledged, acknowledged_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET
       notice_version = $3, acknowledged = $4, acknowledged_at = $5, ip_address = $6, user_agent = $7`,
    [uuidv4(), userId, noticeVersion, true, new Date(), ipAddress, userAgent]
  );

  await logCcpaAction(userId, 'privacy_notice_acknowledged', { noticeVersion }, ipAddress, userAgent);
}

/**
 * Get user's CCPA privacy notice status
 */
export async function getUserCcpaNoticeStatus(userId: string): Promise<any> {
  const result = await query(
    `SELECT id, user_id as "userId", notice_version as "noticeVersion", acknowledged,
            acknowledged_at as "acknowledgedAt", created_at as "createdAt", updated_at as "updatedAt"
     FROM ccpa_privacy_notices
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Record data category for CCPA disclosure
 */
export async function recordDataCategory(
  userId: string,
  categoryName: string,
  dataCollected: string[],
  collectionPurpose?: string,
  thirdPartiesShared?: string[]
): Promise<void> {
  await query(
    `INSERT INTO ccpa_data_categories (id, user_id, category_name, data_collected, collection_purpose, third_parties_shared)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuidv4(), userId, categoryName, JSON.stringify(dataCollected), collectionPurpose, JSON.stringify(thirdPartiesShared || [])]
  );
}

/**
 * Get data categories for user
 */
export async function getUserDataCategories(userId: string): Promise<any[]> {
  const result = await query(
    `SELECT id, user_id as "userId", category_name as "categoryName", data_collected as "dataCollected",
            collection_purpose as "collectionPurpose", third_parties_shared as "thirdPartiesShared",
            collected_at as "collectedAt"
     FROM ccpa_data_categories
     WHERE user_id = $1
     ORDER BY collected_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Generate CCPA disclosure report
 */
export async function generateCcpaDisclosureReport(userId: string): Promise<any> {
  const userResult = await query('SELECT email, created_at FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];

  const categoriesResult = await query(
    `SELECT category_name, data_collected, collection_purpose, third_parties_shared
     FROM ccpa_data_categories
     WHERE user_id = $1`,
    [userId]
  );

  const optOutsResult = await query(
    `SELECT opt_out_type, opted_out FROM user_opt_outs WHERE user_id = $1`,
    [userId]
  );

  return {
    userId,
    email: user.email,
    accountCreatedAt: user.created_at,
    dataCategories: categoriesResult.rows,
    optOuts: optOutsResult.rows,
    generatedAt: new Date(),
  };
}

/**
 * Clean up expired CCPA requests
 */
export async function cleanupExpiredCcpaRequests(): Promise<void> {
  await query(
    `DELETE FROM ccpa_disclosure_requests
     WHERE expires_at < NOW()`
  );

  // Delete old CCPA audit logs (keep for 3 years per CCPA requirements)
  await query(
    `DELETE FROM ccpa_audit_logs
     WHERE created_at < NOW() - INTERVAL '3 years'`
  );
}
