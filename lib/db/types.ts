/**
 * Database Types
 * TypeScript interfaces for all database tables
 */

/**
 * User record from the users table
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  plan: 'free' | 'paid' | 'enterprise';
  created_at: string;
  updated_at: string;
  subscription_expires_at: string | null;
  is_active: boolean;
}

/**
 * File record from the files table
 */
export interface File {
  id: string;
  share_code: string;
  user_id: string | null;
  file_name: string;
  file_size: number;
  file_type: string;
  s3_key: string;
  expires_at: string;
  created_at: string;
  download_count: number;
  is_scanned: boolean;
  is_safe: boolean | null;
  storage_duration_minutes: number;
  ip_address: string | null;
  user_agent: string | null;
  encryption_iv: string | null;
  encryption_auth_tag: string | null;
}

/**
 * Download record from the downloads table
 */
export interface Download {
  id: string;
  file_id: string;
  ip_address: string;
  user_agent: string | null;
  downloaded_at: string;
  country: string | null;
}

/**
 * Analytics record from the analytics table
 */
export interface Analytics {
  id: string;
  event_type: 'upload' | 'download' | 'bot_detected' | 'virus_detected' | 'error' | 'security';
  file_id: string | null;
  user_id: string | null;
  ip_address: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

/**
 * Database query result wrapper
 */
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Database query result for multiple records
 */
export interface QueryResultList<T> {
  data: T[];
  error: Error | null;
}

/**
 * Insert payload for users table
 */
export interface UserInsert {
  email: string;
  password_hash: string;
  plan?: 'free' | 'paid' | 'enterprise';
  subscription_expires_at?: string | null;
  is_active?: boolean;
}

/**
 * Insert payload for files table
 */
export interface FileInsert {
  id?: string;
  share_code: string;
  user_id?: string | null;
  file_name: string;
  file_size: number;
  file_type: string;
  s3_key: string;
  expires_at: string;
  storage_duration_minutes?: number;
  ip_address?: string | null;
  user_agent?: string | null;
  is_scanned?: boolean;
  is_safe?: boolean | null;
  encryption_iv?: string | null;
  encryption_auth_tag?: string | null;
}

/**
 * Insert payload for downloads table
 */
export interface DownloadInsert {
  file_id: string;
  ip_address: string;
  user_agent?: string | null;
  country?: string | null;
}

/**
 * Insert payload for analytics table
 */
export interface AnalyticsInsert {
  event_type: 'upload' | 'download' | 'bot_detected' | 'virus_detected' | 'error' | 'security';
  file_id?: string | null;
  user_id?: string | null;
  ip_address?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Update payload for users table
 */
export interface UserUpdate {
  email?: string;
  password_hash?: string;
  plan?: 'free' | 'paid' | 'enterprise';
  subscription_expires_at?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

/**
 * Update payload for files table
 */
export interface FileUpdate {
  download_count?: number;
  is_scanned?: boolean;
  is_safe?: boolean | null;
  expires_at?: string;
}

/**
 * Enterprise plan record from the enterprise_plans table
 */
export interface EnterprisePlan {
  id: string;
  user_id: string;
  max_file_size: number;
  storage_duration_minutes: number;
  uploads_per_day: number;
  custom_support_email: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Enterprise support ticket record
 */
export interface EnterpriseSupportTicket {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

/**
 * Insert payload for enterprise_plans table
 */
export interface EnterprisePlanInsert {
  user_id: string;
  max_file_size?: number;
  storage_duration_minutes?: number;
  uploads_per_day?: number;
  custom_support_email?: string | null;
}

/**
 * Update payload for enterprise_plans table
 */
export interface EnterprisePlanUpdate {
  max_file_size?: number;
  storage_duration_minutes?: number;
  uploads_per_day?: number;
  custom_support_email?: string | null;
  updated_at?: string;
}

/**
 * Insert payload for enterprise_support_tickets table
 */
export interface EnterpriseSupportTicketInsert {
  user_id?: string | null;
  email: string;
  subject: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

/**
 * Update payload for enterprise_support_tickets table
 */
export interface EnterpriseSupportTicketUpdate {
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  resolved_at?: string | null;
  updated_at?: string;
}

/**
 * API key record from the api_keys table
 */
export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
}

/**
 * API key rate limit record
 */
export interface ApiKeyRateLimit {
  id: string;
  api_key_id: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  created_at: string;
  updated_at: string;
}

/**
 * API usage record
 */
export interface ApiUsage {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * API webhook record
 */
export interface ApiWebhook {
  id: string;
  api_key_id: string;
  event_type: 'file_uploaded' | 'file_downloaded' | 'file_expired';
  url: string;
  is_active: boolean;
  secret: string | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

/**
 * Webhook event record
 */
export interface WebhookEvent {
  id: string;
  webhook_id: string;
  event_data: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed';
  attempt_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Insert payload for api_keys table
 */
export interface ApiKeyInsert {
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  is_active?: boolean;
}

/**
 * Update payload for api_keys table
 */
export interface ApiKeyUpdate {
  name?: string;
  is_active?: boolean;
  last_used_at?: string;
  revoked_at?: string | null;
  updated_at?: string;
}

/**
 * Insert payload for api_key_rate_limits table
 */
export interface ApiKeyRateLimitInsert {
  api_key_id: string;
  requests_per_minute?: number;
  requests_per_hour?: number;
  requests_per_day?: number;
}

/**
 * Insert payload for api_usage table
 */
export interface ApiUsageInsert {
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Insert payload for api_webhooks table
 */
export interface ApiWebhookInsert {
  api_key_id: string;
  event_type: 'file_uploaded' | 'file_downloaded' | 'file_expired';
  url: string;
  is_active?: boolean;
  secret?: string | null;
  max_retries?: number;
}

/**
 * Update payload for api_webhooks table
 */
export interface ApiWebhookUpdate {
  event_type?: 'file_uploaded' | 'file_downloaded' | 'file_expired';
  url?: string;
  is_active?: boolean;
  secret?: string | null;
  max_retries?: number;
  updated_at?: string;
}

/**
 * Insert payload for webhook_events table
 */
export interface WebhookEventInsert {
  webhook_id: string;
  event_data: Record<string, any>;
  status?: 'pending' | 'delivered' | 'failed';
}

/**
 * Update payload for webhook_events table
 */
export interface WebhookEventUpdate {
  status?: 'pending' | 'delivered' | 'failed';
  attempt_count?: number;
  last_error?: string | null;
  updated_at?: string;
}
