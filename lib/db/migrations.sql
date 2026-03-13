-- Secure File Share Database Schema
-- PostgreSQL migration script for Supabase

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores authenticated user accounts
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'paid', 'enterprise')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  subscription_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================================================
-- FILES TABLE
-- ============================================================================
-- Stores file metadata and tracking information
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  download_count INT DEFAULT 0,
  is_scanned BOOLEAN DEFAULT FALSE,
  is_safe BOOLEAN DEFAULT NULL,
  storage_duration_minutes INT DEFAULT 20,
  ip_address INET,
  user_agent TEXT,
  encryption_iv VARCHAR(32),
  encryption_auth_tag VARCHAR(32)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_share_code ON files(share_code);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_is_scanned ON files(is_scanned);

-- ============================================================================
-- REFRESH TOKENS TABLE
-- ============================================================================
-- Stores refresh tokens for JWT authentication
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- ============================================================================
-- DOWNLOADS TABLE
-- ============================================================================
-- Tracks file downloads for analytics
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  downloaded_at TIMESTAMP DEFAULT NOW(),
  country VARCHAR(2)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_downloads_file_id ON downloads(file_id);
CREATE INDEX IF NOT EXISTS idx_downloads_downloaded_at ON downloads(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_downloads_ip_address ON downloads(ip_address);

-- ============================================================================
-- ANALYTICS TABLE
-- ============================================================================
-- Tracks system events for monitoring and analysis
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('upload', 'download', 'bot_detected', 'virus_detected', 'security', 'error')),
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_file_id ON analytics(file_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_ip_address ON analytics(ip_address);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to automatically update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for active files (not expired)
CREATE OR REPLACE VIEW active_files AS
SELECT * FROM files
WHERE expires_at > NOW();

-- View for expired files (for cleanup)
CREATE OR REPLACE VIEW expired_files AS
SELECT * FROM files
WHERE expires_at <= NOW();

-- View for download statistics
CREATE OR REPLACE VIEW download_stats AS
SELECT
  f.id,
  f.share_code,
  f.file_name,
  COUNT(d.id) as total_downloads,
  MAX(d.downloaded_at) as last_download,
  f.created_at,
  f.expires_at
FROM files f
LEFT JOIN downloads d ON f.id = d.file_id
GROUP BY f.id, f.share_code, f.file_name, f.created_at, f.expires_at;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Stores authenticated user accounts with subscription information';
COMMENT ON TABLE refresh_tokens IS 'Stores refresh tokens for JWT authentication and session management';
COMMENT ON TABLE files IS 'Stores file metadata, S3 references, and tracking information';
COMMENT ON TABLE downloads IS 'Tracks individual file downloads for analytics';
COMMENT ON TABLE analytics IS 'Tracks system events (uploads, downloads, security events)';

COMMENT ON COLUMN users.plan IS 'User subscription plan: free, paid, or enterprise';
COMMENT ON COLUMN users.subscription_expires_at IS 'When the paid subscription expires (NULL for free users)';

COMMENT ON COLUMN files.share_code IS 'Unique numeric code for sharing the file';
COMMENT ON COLUMN files.s3_key IS 'Path to the file in S3/R2 object storage';
COMMENT ON COLUMN files.expires_at IS 'When the file will be automatically deleted';
COMMENT ON COLUMN files.is_scanned IS 'Whether the file has been scanned for malware';
COMMENT ON COLUMN files.is_safe IS 'Malware scan result (NULL = not scanned, true = safe, false = infected)';

COMMENT ON COLUMN downloads.ip_address IS 'IP address of the downloader';
COMMENT ON COLUMN downloads.country IS 'Country code of the downloader (from GeoIP)';

COMMENT ON COLUMN analytics.event_type IS 'Type of event: upload, download, bot_detected, virus_detected';
COMMENT ON COLUMN analytics.metadata IS 'Additional event data stored as JSON';

-- ============================================================================
-- ENTERPRISE PLANS TABLE
-- ============================================================================
-- Stores custom enterprise plan configurations per user
CREATE TABLE IF NOT EXISTS enterprise_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  max_file_size BIGINT NOT NULL DEFAULT 10737418240, -- 10GB default
  storage_duration_minutes INT NOT NULL DEFAULT 43200, -- 30 days default
  uploads_per_day INT NOT NULL DEFAULT -1, -- -1 means unlimited
  custom_support_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_enterprise_plans_user_id ON enterprise_plans(user_id);

-- ============================================================================
-- ENTERPRISE SUPPORT TICKETS TABLE
-- ============================================================================
-- Stores enterprise support tickets and inquiries
CREATE TABLE IF NOT EXISTS enterprise_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON enterprise_support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON enterprise_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON enterprise_support_tickets(created_at);

-- ============================================================================
-- API KEYS TABLE
-- ============================================================================
-- Stores API keys for programmatic access to the API
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of the actual key
  key_prefix VARCHAR(20) NOT NULL, -- First 20 chars of the key for display
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);

-- ============================================================================
-- API KEY RATE LIMITS TABLE
-- ============================================================================
-- Stores rate limit configuration per API key
CREATE TABLE IF NOT EXISTS api_key_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL UNIQUE REFERENCES api_keys(id) ON DELETE CASCADE,
  requests_per_minute INT NOT NULL DEFAULT 60,
  requests_per_hour INT NOT NULL DEFAULT 3600,
  requests_per_day INT NOT NULL DEFAULT 86400,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_key_rate_limits_api_key_id ON api_key_rate_limits(api_key_id);

-- ============================================================================
-- API USAGE TABLE
-- ============================================================================
-- Tracks API usage per key for analytics and rate limiting
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT NOT NULL,
  response_time_ms INT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key_id ON api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);

-- ============================================================================
-- API WEBHOOKS TABLE
-- ============================================================================
-- Stores webhook configurations for API key owners
CREATE TABLE IF NOT EXISTS api_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'file_uploaded', 'file_downloaded', 'file_expired'
  url VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  secret VARCHAR(64), -- Secret for HMAC signature verification
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_webhooks_api_key_id ON api_webhooks(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_webhooks_event_type ON api_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_api_webhooks_is_active ON api_webhooks(is_active);

-- ============================================================================
-- WEBHOOK EVENTS TABLE
-- ============================================================================
-- Tracks webhook delivery attempts
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES api_webhooks(id) ON DELETE CASCADE,
  event_data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  attempt_count INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- ============================================================================
-- BRANDING CONFIGURATION TABLE
-- ============================================================================
-- Stores custom branding settings for enterprise users
CREATE TABLE IF NOT EXISTS branding_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  logo_url VARCHAR(500),
  logo_s3_key VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color code
  secondary_color VARCHAR(7) DEFAULT '#1e40af',
  accent_color VARCHAR(7) DEFAULT '#0ea5e9',
  custom_domain VARCHAR(255),
  domain_verified BOOLEAN DEFAULT FALSE,
  white_label_enabled BOOLEAN DEFAULT FALSE,
  company_name VARCHAR(255),
  company_description TEXT,
  support_email VARCHAR(255),
  support_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_branding_configs_user_id ON branding_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_branding_configs_custom_domain ON branding_configs(custom_domain);
CREATE INDEX IF NOT EXISTS idx_branding_configs_white_label_enabled ON branding_configs(white_label_enabled);

-- ============================================================================
-- CUSTOM DOMAIN VERIFICATION TABLE
-- ============================================================================
-- Tracks DNS verification status for custom domains
CREATE TABLE IF NOT EXISTS domain_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_config_id UUID NOT NULL REFERENCES branding_configs(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  verification_token VARCHAR(64) NOT NULL,
  verification_method VARCHAR(50) DEFAULT 'dns' CHECK (verification_method IN ('dns', 'cname')),
  dns_record_name VARCHAR(255),
  dns_record_value VARCHAR(255),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_domain_verifications_branding_config_id ON domain_verifications(branding_config_id);
CREATE INDEX IF NOT EXISTS idx_domain_verifications_domain ON domain_verifications(domain);
CREATE INDEX IF NOT EXISTS idx_domain_verifications_verification_token ON domain_verifications(verification_token);

-- ============================================================================
-- LOGO UPLOADS TABLE
-- ============================================================================
-- Tracks logo uploads and versions
CREATE TABLE IF NOT EXISTS logo_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_config_id UUID NOT NULL REFERENCES branding_configs(id) ON DELETE CASCADE,
  s3_key VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  width INT,
  height INT,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_logo_uploads_branding_config_id ON logo_uploads(branding_config_id);
CREATE INDEX IF NOT EXISTS idx_logo_uploads_is_active ON logo_uploads(is_active);
CREATE INDEX IF NOT EXISTS idx_logo_uploads_created_at ON logo_uploads(created_at);

-- ============================================================================
-- BRANDING AUDIT LOG TABLE
-- ============================================================================
-- Tracks changes to branding configurations
CREATE TABLE IF NOT EXISTS branding_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_config_id UUID NOT NULL REFERENCES branding_configs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'logo_upload', 'color_change', 'domain_update', 'white_label_toggle'
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_branding_audit_logs_branding_config_id ON branding_audit_logs(branding_config_id);
CREATE INDEX IF NOT EXISTS idx_branding_audit_logs_user_id ON branding_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_branding_audit_logs_action ON branding_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_branding_audit_logs_created_at ON branding_audit_logs(created_at);

-- ============================================================================
-- COMMENTS FOR BRANDING TABLES
-- ============================================================================

COMMENT ON TABLE branding_configs IS 'Stores custom branding settings for enterprise users including logo, colors, and domain';
COMMENT ON TABLE domain_verifications IS 'Tracks DNS verification status for custom domains';
COMMENT ON TABLE logo_uploads IS 'Tracks logo uploads and versions for branding';
COMMENT ON TABLE branding_audit_logs IS 'Audit trail for branding configuration changes';

COMMENT ON COLUMN branding_configs.logo_url IS 'Public URL to the uploaded logo';
COMMENT ON COLUMN branding_configs.primary_color IS 'Primary brand color in hex format';
COMMENT ON COLUMN branding_configs.secondary_color IS 'Secondary brand color in hex format';
COMMENT ON COLUMN branding_configs.accent_color IS 'Accent brand color in hex format';
COMMENT ON COLUMN branding_configs.custom_domain IS 'Custom domain for white-label deployment';
COMMENT ON COLUMN branding_configs.domain_verified IS 'Whether the custom domain has been verified';
COMMENT ON COLUMN branding_configs.white_label_enabled IS 'Whether white-label mode is active';

COMMENT ON COLUMN domain_verifications.verification_token IS 'Token used for domain verification';
COMMENT ON COLUMN domain_verifications.dns_record_name IS 'DNS record name to add for verification';
COMMENT ON COLUMN domain_verifications.dns_record_value IS 'DNS record value to add for verification';


-- ============================================================================
-- USER BEHAVIOR TRACKING TABLES (Task 32)
-- ============================================================================

-- User sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  country VARCHAR(2),
  started_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Page views table for tracking user navigation
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  page_path VARCHAR(500) NOT NULL,
  page_title VARCHAR(255),
  referrer VARCHAR(500),
  time_on_page_seconds INT,
  viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);

-- Click events table for tracking user interactions
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  element_id VARCHAR(255),
  element_class VARCHAR(255),
  element_text VARCHAR(500),
  page_path VARCHAR(500),
  clicked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_click_events_user_id ON click_events(user_id);
CREATE INDEX IF NOT EXISTS idx_click_events_session_id ON click_events(session_id);
CREATE INDEX IF NOT EXISTS idx_click_events_page_path ON click_events(page_path);
CREATE INDEX IF NOT EXISTS idx_click_events_clicked_at ON click_events(clicked_at);

-- User flows table for tracking user journeys
CREATE TABLE IF NOT EXISTS user_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  flow_name VARCHAR(255) NOT NULL, -- e.g., 'upload_flow', 'download_flow'
  flow_step INT NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_data JSONB,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_flows_user_id ON user_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flows_session_id ON user_flows(session_id);
CREATE INDEX IF NOT EXISTS idx_user_flows_flow_name ON user_flows(flow_name);
CREATE INDEX IF NOT EXISTS idx_user_flows_started_at ON user_flows(started_at);

-- ============================================================================
-- CUSTOM REPORTS TABLE (Task 32.4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metrics JSONB NOT NULL, -- Array of metric names to include
  dimensions JSONB NOT NULL, -- Array of dimension names to include
  filters JSONB, -- Filter conditions
  date_range_type VARCHAR(50) DEFAULT 'all', -- 'all', 'last_7_days', 'last_30_days', 'custom'
  date_range_from TIMESTAMP,
  date_range_to TIMESTAMP,
  sort_by VARCHAR(255),
  sort_order VARCHAR(10) DEFAULT 'DESC',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_user_id ON custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_created_at ON custom_reports(created_at);

-- ============================================================================
-- SCHEDULED REPORTS TABLE (Task 32.5)
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  custom_report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly')),
  schedule_day_of_week INT, -- 0-6 for weekly (0=Sunday)
  schedule_day_of_month INT, -- 1-31 for monthly
  schedule_time TIME NOT NULL DEFAULT '09:00:00',
  recipient_emails JSONB NOT NULL, -- Array of email addresses
  include_charts BOOLEAN DEFAULT TRUE,
  include_summary BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMP,
  next_send_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user_id ON scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_is_active ON scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_send_at ON scheduled_reports(next_send_at);

-- ============================================================================
-- REPORT EXPORTS TABLE (Task 32.3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  custom_report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  export_format VARCHAR(50) NOT NULL CHECK (export_format IN ('csv', 'json', 'pdf')),
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  s3_key VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_exports_user_id ON report_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_status ON report_exports(status);
CREATE INDEX IF NOT EXISTS idx_report_exports_created_at ON report_exports(created_at);

-- ============================================================================
-- COMMENTS FOR BEHAVIOR TRACKING TABLES
-- ============================================================================

COMMENT ON TABLE user_sessions IS 'Tracks user sessions for behavior analysis';
COMMENT ON TABLE page_views IS 'Tracks page views and navigation patterns';
COMMENT ON TABLE click_events IS 'Tracks user clicks and interactions';
COMMENT ON TABLE user_flows IS 'Tracks user journeys through application flows';
COMMENT ON TABLE custom_reports IS 'Stores custom report configurations';
COMMENT ON TABLE scheduled_reports IS 'Stores scheduled report configurations';
COMMENT ON TABLE report_exports IS 'Tracks report export requests and status';

COMMENT ON COLUMN user_sessions.session_token IS 'Unique token for session identification';
COMMENT ON COLUMN user_sessions.duration_seconds IS 'Total session duration in seconds';
COMMENT ON COLUMN page_views.time_on_page_seconds IS 'Time spent on page in seconds';
COMMENT ON COLUMN user_flows.flow_name IS 'Name of the user flow (e.g., upload_flow)';
COMMENT ON COLUMN user_flows.step_data IS 'Additional data for the flow step';
COMMENT ON COLUMN custom_reports.metrics IS 'JSON array of metrics to include in report';
COMMENT ON COLUMN custom_reports.dimensions IS 'JSON array of dimensions to group by';
COMMENT ON COLUMN scheduled_reports.schedule_type IS 'Frequency of report delivery';
COMMENT ON COLUMN scheduled_reports.recipient_emails IS 'JSON array of recipient email addresses';


-- ============================================================================
-- GDPR COMPLIANCE TABLES (Task 34.2)
-- ============================================================================

-- User consent tracking table
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('analytics', 'marketing', 'profiling', 'third_party')),
  given BOOLEAN NOT NULL,
  given_at TIMESTAMP,
  withdrawn_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_given ON user_consents(given);
CREATE INDEX IF NOT EXISTS idx_user_consents_created_at ON user_consents(created_at);

-- Data export requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  export_format VARCHAR(50) NOT NULL CHECK (export_format IN ('json', 'csv')),
  file_name VARCHAR(255),
  file_size BIGINT,
  s3_key VARCHAR(500),
  download_token VARCHAR(64),
  download_token_expires_at TIMESTAMP,
  error_message TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_requested_at ON data_export_requests(requested_at);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_download_token ON data_export_requests(download_token);

-- Data deletion requests table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  deletion_type VARCHAR(50) NOT NULL CHECK (deletion_type IN ('account', 'files', 'analytics')),
  reason TEXT,
  error_message TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  scheduled_for TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_deletion_type ON data_deletion_requests(deletion_type);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_requested_at ON data_deletion_requests(requested_at);

-- GDPR audit log table
CREATE TABLE IF NOT EXISTS gdpr_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('consent_given', 'consent_withdrawn', 'data_export_requested', 'data_deletion_requested', 'data_deleted', 'account_deleted')),
  action_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_audit_logs_user_id ON gdpr_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_logs_action ON gdpr_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_gdpr_audit_logs_created_at ON gdpr_audit_logs(created_at);

-- Data processing agreement table
CREATE TABLE IF NOT EXISTS data_processing_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  dpa_version VARCHAR(20) NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_processing_agreements_user_id ON data_processing_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_data_processing_agreements_accepted ON data_processing_agreements(accepted);

-- Data retention policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('files', 'analytics', 'logs', 'sessions')),
  retention_days INT NOT NULL,
  auto_delete BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_retention_policies_user_id ON data_retention_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_data_retention_policies_data_type ON data_retention_policies(data_type);

-- COMMENTS FOR GDPR TABLES
COMMENT ON TABLE user_consents IS 'Tracks user consent for various data processing activities';
COMMENT ON TABLE data_export_requests IS 'Tracks user requests to export their personal data';
COMMENT ON TABLE data_deletion_requests IS 'Tracks user requests to delete their personal data';
COMMENT ON TABLE gdpr_audit_logs IS 'Audit trail for GDPR-related actions';
COMMENT ON TABLE data_processing_agreements IS 'Tracks acceptance of Data Processing Agreements';
COMMENT ON TABLE data_retention_policies IS 'Defines data retention policies per user';

COMMENT ON COLUMN user_consents.consent_type IS 'Type of consent: analytics, marketing, profiling, third_party';
COMMENT ON COLUMN user_consents.given IS 'Whether consent was given (true) or withdrawn (false)';
COMMENT ON COLUMN data_export_requests.download_token IS 'Secure token for downloading exported data';
COMMENT ON COLUMN data_deletion_requests.deletion_type IS 'Type of deletion: account, files, or analytics';
COMMENT ON COLUMN data_deletion_requests.scheduled_for IS 'When the deletion is scheduled to occur (30-day grace period)';
COMMENT ON COLUMN data_retention_policies.retention_days IS 'Number of days to retain data before automatic deletion';


-- ============================================================================
-- CCPA COMPLIANCE TABLES (Task 34.3)
-- ============================================================================

-- User opt-out preferences table
CREATE TABLE IF NOT EXISTS user_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opt_out_type VARCHAR(50) NOT NULL CHECK (opt_out_type IN ('sale', 'sharing', 'targeted_advertising', 'profiling')),
  opted_out BOOLEAN DEFAULT TRUE,
  opted_out_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_opt_outs_user_id ON user_opt_outs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_opt_outs_opt_out_type ON user_opt_outs(opt_out_type);
CREATE INDEX IF NOT EXISTS idx_user_opt_outs_opted_out ON user_opt_outs(opted_out);

-- CCPA disclosure requests table
CREATE TABLE IF NOT EXISTS ccpa_disclosure_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('access', 'deletion', 'opt_out')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'denied')),
  verification_method VARCHAR(50) DEFAULT 'email' CHECK (verification_method IN ('email', 'phone', 'in_person')),
  verification_token VARCHAR(64),
  verification_token_expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  denial_reason TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '45 days')
);

CREATE INDEX IF NOT EXISTS idx_ccpa_disclosure_requests_user_id ON ccpa_disclosure_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_disclosure_requests_request_type ON ccpa_disclosure_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_ccpa_disclosure_requests_status ON ccpa_disclosure_requests(status);
CREATE INDEX IF NOT EXISTS idx_ccpa_disclosure_requests_verification_token ON ccpa_disclosure_requests(verification_token);

-- CCPA audit log table
CREATE TABLE IF NOT EXISTS ccpa_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('opt_out_requested', 'opt_out_confirmed', 'disclosure_requested', 'disclosure_completed', 'deletion_requested', 'deletion_completed')),
  action_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccpa_audit_logs_user_id ON ccpa_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_audit_logs_action ON ccpa_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_ccpa_audit_logs_created_at ON ccpa_audit_logs(created_at);

-- CCPA privacy notice acknowledgment table
CREATE TABLE IF NOT EXISTS ccpa_privacy_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  notice_version VARCHAR(20) NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccpa_privacy_notices_user_id ON ccpa_privacy_notices(user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_privacy_notices_acknowledged ON ccpa_privacy_notices(acknowledged);

-- CCPA data categories table (for disclosure)
CREATE TABLE IF NOT EXISTS ccpa_data_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_name VARCHAR(255) NOT NULL, -- e.g., 'Personal Information', 'Commercial Information', 'Internet Activity'
  data_collected JSONB NOT NULL, -- Array of specific data points
  collection_purpose VARCHAR(255),
  third_parties_shared JSONB, -- Array of third parties data is shared with
  retention_period VARCHAR(100),
  collected_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccpa_data_categories_user_id ON ccpa_data_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_ccpa_data_categories_category_name ON ccpa_data_categories(category_name);

-- COMMENTS FOR CCPA TABLES
COMMENT ON TABLE user_opt_outs IS 'Tracks user opt-out preferences for CCPA compliance';
COMMENT ON TABLE ccpa_disclosure_requests IS 'Tracks CCPA disclosure requests (access, deletion, opt-out)';
COMMENT ON TABLE ccpa_audit_logs IS 'Audit trail for CCPA-related actions';
COMMENT ON TABLE ccpa_privacy_notices IS 'Tracks acknowledgment of CCPA privacy notices';
COMMENT ON TABLE ccpa_data_categories IS 'Tracks data categories collected per user for CCPA disclosure';

COMMENT ON COLUMN user_opt_outs.opt_out_type IS 'Type of opt-out: sale, sharing, targeted_advertising, profiling';
COMMENT ON COLUMN user_opt_outs.opted_out IS 'Whether user has opted out (true) or opted in (false)';
COMMENT ON COLUMN ccpa_disclosure_requests.request_type IS 'Type of request: access, deletion, or opt_out';
COMMENT ON COLUMN ccpa_disclosure_requests.verification_method IS 'Method used to verify user identity';
COMMENT ON COLUMN ccpa_disclosure_requests.verification_token IS 'Token for email/phone verification';
COMMENT ON COLUMN ccpa_data_categories.data_collected IS 'JSON array of specific data points in this category';
COMMENT ON COLUMN ccpa_data_categories.third_parties_shared IS 'JSON array of third parties this data is shared with';


-- ============================================================================
-- ADD SHARE NUMBER COLUMN TO FILES TABLE
-- ============================================================================
-- Allows grouping files uploaded by multiple users with the same share number

ALTER TABLE IF EXISTS files ADD COLUMN IF NOT EXISTS share_number INT;

-- Index for share_number lookups
CREATE INDEX IF NOT EXISTS idx_files_share_number ON files(share_number);

COMMENT ON COLUMN files.share_number IS 'Optional 4-8 digit number for grouping files uploaded by multiple users';
