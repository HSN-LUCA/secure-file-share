/**
 * Database Query Functions
 * Utility functions for common database operations
 */

import { supabaseServer, supabaseClient } from './config';
import {
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
  EnterprisePlan,
  EnterpriseSupportTicket,
  EnterprisePlanInsert,
  EnterprisePlanUpdate,
  EnterpriseSupportTicketInsert,
  EnterpriseSupportTicketUpdate,
  ApiKey,
  ApiKeyRateLimit,
  ApiUsage,
  ApiWebhook,
  WebhookEvent,
  ApiKeyInsert,
  ApiKeyUpdate,
  ApiKeyRateLimitInsert,
  ApiUsageInsert,
  ApiWebhookInsert,
  ApiWebhookUpdate,
  WebhookEventInsert,
  WebhookEventUpdate,
  QueryResult,
  QueryResultList,
} from './types';

/**
 * Get the appropriate Supabase client
 * Uses service role key on server, anon key on client
 */
function getClient() {
  // On server-side, use service role key if available
  if (typeof window === 'undefined' && supabaseServer) {
    return supabaseServer;
  }
  return supabaseClient;
}

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<QueryResult<User>> {
  try {
    const { data, error } = await getClient()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<QueryResult<User>> {
  try {
    const { data, error } = await getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new user
 */
export async function createUser(user: UserInsert): Promise<QueryResult<User>> {
  try {
    const { data, error } = await getClient()
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  updates: UserUpdate
): Promise<QueryResult<User>> {
  try {
    const { data, error } = await getClient()
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// FILE QUERIES
// ============================================================================

/**
 * Get file by share code
 */
export async function getFileByShareCode(
  shareCode: string
): Promise<QueryResult<File>> {
  try {
    const { data, error } = await getClient()
      .from('files')
      .select('*')
      .eq('share_code', shareCode)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get file by ID
 */
export async function getFileById(fileId: string): Promise<QueryResult<File>> {
  try {
    const { data, error } = await getClient()
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get all files for a user
 */
export async function getUserFiles(userId: string): Promise<QueryResultList<File>> {
  try {
    const { data, error } = await getClient()
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Create a new file record
 */
export async function createFile(file: FileInsert): Promise<QueryResult<File>> {
  try {
    const { data, error } = await getClient()
      .from('files')
      .insert([file])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update file
 */
export async function updateFile(
  fileId: string,
  updates: FileUpdate
): Promise<QueryResult<File>> {
  try {
    const { data, error } = await getClient()
      .from('files')
      .update(updates)
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete file by ID
 */
export async function deleteFile(fileId: string): Promise<QueryResult<void>> {
  try {
    const { error } = await getClient()
      .from('files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (error) {
    return { data: undefined, error: error as Error };
  }
}

/**
 * Get expired files (for cleanup)
 */
export async function getExpiredFiles(): Promise<QueryResultList<File>> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await getClient()
      .from('files')
      .select('*')
      .lt('expires_at', now);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// ============================================================================
// DOWNLOAD QUERIES
// ============================================================================

/**
 * Create a download record
 */
export async function createDownload(
  download: DownloadInsert
): Promise<QueryResult<Download>> {
  try {
    const { data, error } = await getClient()
      .from('downloads')
      .insert([download])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get downloads for a file
 */
export async function getFileDownloads(fileId: string): Promise<QueryResultList<Download>> {
  try {
    const { data, error } = await getClient()
      .from('downloads')
      .select('*')
      .eq('file_id', fileId)
      .order('downloaded_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Get download count for a file
 */
export async function getDownloadCount(fileId: string): Promise<QueryResult<number>> {
  try {
    const { count, error } = await getClient()
      .from('downloads')
      .select('*', { count: 'exact', head: true })
      .eq('file_id', fileId);

    if (error) throw error;
    return { data: count || 0, error: null };
  } catch (error) {
    return { data: 0, error: error as Error };
  }
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Create an analytics record
 */
export async function createAnalytics(
  analytics: AnalyticsInsert
): Promise<QueryResult<Analytics>> {
  try {
    const { data, error } = await getClient()
      .from('analytics')
      .insert([analytics])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get analytics by event type
 */
export async function getAnalyticsByEventType(
  eventType: string,
  limit: number = 100
): Promise<QueryResultList<Analytics>> {
  try {
    const { data, error } = await getClient()
      .from('analytics')
      .select('*')
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Get analytics for a file
 */
export async function getFileAnalytics(fileId: string): Promise<QueryResultList<Analytics>> {
  try {
    const { data, error } = await getClient()
      .from('analytics')
      .select('*')
      .eq('file_id', fileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Get analytics for a user
 */
export async function getUserAnalytics(userId: string): Promise<QueryResultList<Analytics>> {
  try {
    const { data, error } = await getClient()
      .from('analytics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Get analytics count by event type
 */
export async function getAnalyticsCount(eventType: string): Promise<QueryResult<number>> {
  try {
    const { count, error } = await getClient()
      .from('analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', eventType);

    if (error) throw error;
    return { data: count || 0, error: null };
  } catch (error) {
    return { data: 0, error: error as Error };
  }
}

// ============================================================================
// DASHBOARD QUERIES
// ============================================================================

/**
 * Get download statistics for a file
 */
export async function getFileDownloadStats(
  fileId: string
): Promise<QueryResult<{ count: number; lastDownloadedAt: string | null }>> {
  try {
    const { data, error } = await getClient()
      .from('downloads')
      .select('downloaded_at')
      .eq('file_id', fileId)
      .order('downloaded_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    const count = data?.length || 0;
    const lastDownloadedAt = data?.[0]?.downloaded_at || null;

    return {
      data: { count, lastDownloadedAt },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get total storage usage for a user (in bytes)
 */
export async function getUserStorageUsage(userId: string): Promise<QueryResult<number>> {
  try {
    const { data, error } = await getClient()
      .from('files')
      .select('file_size')
      .eq('user_id', userId);

    if (error) throw error;

    const totalBytes = (data || []).reduce((sum, file) => sum + (file.file_size || 0), 0);

    return { data: totalBytes, error: null };
  } catch (error) {
    return { data: 0, error: error as Error };
  }
}


// ============================================================================
// ANALYTICS AGGREGATION QUERIES
// ============================================================================

/**
 * Get download statistics within a date range
 */
export async function getDownloadStats(
  fromDate?: string,
  toDate?: string
): Promise<QueryResult<{
  totalDownloads: number;
  downloadsPerDay: Array<{ date: string; count: number }>;
  mostDownloadedFiles: Array<{ fileId: string; fileName: string; count: number }>;
}>> {
  try {
    let query = getClient()
      .from('downloads')
      .select('file_id, downloaded_at, files(file_name)');

    if (fromDate) {
      query = query.gte('downloaded_at', fromDate);
    }
    if (toDate) {
      query = query.lte('downloaded_at', toDate);
    }

    const { data, error } = await query.order('downloaded_at', { ascending: false });

    if (error) throw error;

    const downloads = data || [];
    const totalDownloads = downloads.length;

    // Group by day
    const downloadsPerDay: Record<string, number> = {};
    downloads.forEach((d: any) => {
      const date = new Date(d.downloaded_at).toISOString().split('T')[0];
      downloadsPerDay[date] = (downloadsPerDay[date] || 0) + 1;
    });

    // Group by file
    const fileDownloads: Record<string, { name: string; count: number }> = {};
    downloads.forEach((d: any) => {
      const fileId = d.file_id;
      const fileName = d.files?.file_name || 'Unknown';
      if (!fileDownloads[fileId]) {
        fileDownloads[fileId] = { name: fileName, count: 0 };
      }
      fileDownloads[fileId].count += 1;
    });

    const mostDownloadedFiles = Object.entries(fileDownloads)
      .map(([fileId, data]) => ({
        fileId,
        fileName: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      data: {
        totalDownloads,
        downloadsPerDay: Object.entries(downloadsPerDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        mostDownloadedFiles,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get file type statistics
 */
export async function getFileTypeStats(
  fromDate?: string,
  toDate?: string
): Promise<QueryResult<{
  totalUploads: number;
  fileTypeDistribution: Array<{ fileType: string; count: number; totalSize: number }>;
}>> {
  try {
    let query = getClient()
      .from('files')
      .select('file_type, file_size, created_at');

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const files = data || [];
    const totalUploads = files.length;

    // Group by file type
    const fileTypes: Record<string, { count: number; totalSize: number }> = {};
    files.forEach((f: any) => {
      const type = f.file_type || 'unknown';
      if (!fileTypes[type]) {
        fileTypes[type] = { count: 0, totalSize: 0 };
      }
      fileTypes[type].count += 1;
      fileTypes[type].totalSize += f.file_size || 0;
    });

    const fileTypeDistribution = Object.entries(fileTypes)
      .map(([fileType, data]) => ({
        fileType,
        count: data.count,
        totalSize: data.totalSize,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      data: {
        totalUploads,
        fileTypeDistribution,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get geographic statistics from downloads
 */
export async function getGeographicStats(
  fromDate?: string,
  toDate?: string
): Promise<QueryResult<{
  topCountries: Array<{ country: string; count: number }>;
  totalCountries: number;
}>> {
  try {
    let query = getClient()
      .from('downloads')
      .select('country');

    if (fromDate) {
      query = query.gte('downloaded_at', fromDate);
    }
    if (toDate) {
      query = query.lte('downloaded_at', toDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const downloads = data || [];

    // Group by country
    const countries: Record<string, number> = {};
    downloads.forEach((d: any) => {
      const country = d.country || 'Unknown';
      countries[country] = (countries[country] || 0) + 1;
    });

    const topCountries = Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      data: {
        topCountries,
        totalCountries: Object.keys(countries).length,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get bot detection metrics
 */
export async function getBotDetectionMetrics(
  fromDate?: string,
  toDate?: string
): Promise<QueryResult<{
  captchaAttempts: number;
  captchaSuccesses: number;
  captchaFailures: number;
  successRate: number;
  blockedIps: number;
  botDetectedEvents: number;
}>> {
  try {
    let query = getClient()
      .from('analytics')
      .select('event_type, metadata');

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const events = data || [];

    let captchaAttempts = 0;
    let captchaSuccesses = 0;
    let captchaFailures = 0;
    let blockedIps = new Set<string>();
    let botDetectedEvents = 0;

    events.forEach((e: any) => {
      if (e.event_type === 'bot_detected') {
        botDetectedEvents += 1;
        if (e.metadata?.ip_address) {
          blockedIps.add(e.metadata.ip_address);
        }
      }
      if (e.metadata?.captcha_attempt) {
        captchaAttempts += 1;
        if (e.metadata?.captcha_success) {
          captchaSuccesses += 1;
        } else {
          captchaFailures += 1;
        }
      }
    });

    const successRate = captchaAttempts > 0 ? (captchaSuccesses / captchaAttempts) * 100 : 0;

    return {
      data: {
        captchaAttempts,
        captchaSuccesses,
        captchaFailures,
        successRate: Math.round(successRate * 100) / 100,
        blockedIps: blockedIps.size,
        botDetectedEvents,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(
  fromDate?: string,
  toDate?: string
): Promise<QueryResult<{
  totalUploads: number;
  totalDownloads: number;
  totalUsers: number;
  totalEvents: number;
}>> {
  try {
    let uploadQuery = getClient()
      .from('files')
      .select('*', { count: 'exact', head: true });

    if (fromDate) {
      uploadQuery = uploadQuery.gte('created_at', fromDate);
    }
    if (toDate) {
      uploadQuery = uploadQuery.lte('created_at', toDate);
    }

    const { count: uploadCount, error: uploadError } = await uploadQuery;

    if (uploadError) throw uploadError;

    let downloadQuery = getClient()
      .from('downloads')
      .select('*', { count: 'exact', head: true });

    if (fromDate) {
      downloadQuery = downloadQuery.gte('downloaded_at', fromDate);
    }
    if (toDate) {
      downloadQuery = downloadQuery.lte('downloaded_at', toDate);
    }

    const { count: downloadCount, error: downloadError } = await downloadQuery;

    if (downloadError) throw downloadError;

    let userQuery = getClient()
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (fromDate) {
      userQuery = userQuery.gte('created_at', fromDate);
    }
    if (toDate) {
      userQuery = userQuery.lte('created_at', toDate);
    }

    const { count: userCount, error: userError } = await userQuery;

    if (userError) throw userError;

    let eventQuery = getClient()
      .from('analytics')
      .select('*', { count: 'exact', head: true });

    if (fromDate) {
      eventQuery = eventQuery.gte('created_at', fromDate);
    }
    if (toDate) {
      eventQuery = eventQuery.lte('created_at', toDate);
    }

    const { count: eventCount, error: eventError } = await eventQuery;

    if (eventError) throw eventError;

    return {
      data: {
        totalUploads: uploadCount || 0,
        totalDownloads: downloadCount || 0,
        totalUsers: userCount || 0,
        totalEvents: eventCount || 0,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get blocked IPs with details
 */
export async function getBlockedIps(
  fromDate?: string,
  toDate?: string
): Promise<QueryResultList<{
  ip: string;
  blockCount: number;
  lastBlockedAt: string;
  reason: string;
}>> {
  try {
    let query = getClient()
      .from('analytics')
      .select('ip_address, metadata, created_at')
      .eq('event_type', 'bot_detected');

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const events = data || [];
    const blockedIpsMap = new Map<string, { count: number; lastTime: string; reason: string }>();

    events.forEach((e: any) => {
      const ip = e.ip_address;
      if (ip) {
        const existing = blockedIpsMap.get(ip) || { count: 0, lastTime: '', reason: '' };
        blockedIpsMap.set(ip, {
          count: existing.count + 1,
          lastTime: e.created_at,
          reason: e.metadata?.reason || 'Multiple failed CAPTCHA attempts',
        });
      }
    });

    const result = Array.from(blockedIpsMap.entries()).map(([ip, data]) => ({
      ip,
      blockCount: data.count,
      lastBlockedAt: data.lastTime,
      reason: data.reason,
    }));

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get suspicious patterns
 */
export async function getSuspiciousPatterns(
  fromDate?: string,
  toDate?: string
): Promise<QueryResultList<{
  pattern: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}>> {
  try {
    let query = getClient()
      .from('analytics')
      .select('event_type, metadata, ip_address')
      .in('event_type', ['bot_detected', 'security']);

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const events = data || [];
    const patterns: Map<string, { count: number; severity: 'low' | 'medium' | 'high' }> = new Map();

    events.forEach((e: any) => {
      if (e.event_type === 'bot_detected') {
        const pattern = 'high_failed_captcha_rate';
        patterns.set(pattern, {
          count: (patterns.get(pattern)?.count || 0) + 1,
          severity: 'high',
        });
      }
      if (e.metadata?.suspicious_user_agent) {
        const pattern = 'suspicious_user_agent';
        patterns.set(pattern, {
          count: (patterns.get(pattern)?.count || 0) + 1,
          severity: 'medium',
        });
      }
      if (e.metadata?.rapid_requests) {
        const pattern = 'rapid_requests_from_ip';
        patterns.set(pattern, {
          count: (patterns.get(pattern)?.count || 0) + 1,
          severity: 'high',
        });
      }
    });

    const result = Array.from(patterns.entries()).map(([pattern, data]) => ({
      pattern,
      count: data.count,
      severity: data.severity,
      description: getPatternDescription(pattern),
    }));

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get API response times
 */
export async function getApiResponseTimes(
  timeRange: string = '1h'
): Promise<QueryResult<{
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  endpointMetrics: Array<{
    endpoint: string;
    method: string;
    avgResponseTime: number;
    requestCount: number;
    errorRate: number;
  }>;
}>> {
  try {
    // For now, return mock data structure
    // In production, this would query actual performance metrics
    return {
      data: {
        averageResponseTime: 145,
        p95ResponseTime: 450,
        p99ResponseTime: 890,
        endpointMetrics: [
          {
            endpoint: '/api/upload',
            method: 'POST',
            avgResponseTime: 250,
            requestCount: 1250,
            errorRate: 0.5,
          },
          {
            endpoint: '/api/download/:code',
            method: 'GET',
            avgResponseTime: 120,
            requestCount: 5420,
            errorRate: 0.2,
          },
          {
            endpoint: '/api/analytics',
            method: 'GET',
            avgResponseTime: 180,
            requestCount: 340,
            errorRate: 0.1,
          },
        ],
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get database performance metrics
 */
export async function getDatabasePerformance(
  timeRange: string = '1h'
): Promise<QueryResult<{
  averageQueryTime: number;
  slowQueryCount: number;
  connectionPoolUsage: number;
  activeConnections: number;
}>> {
  try {
    // For now, return mock data structure
    // In production, this would query actual database metrics
    return {
      data: {
        averageQueryTime: 45,
        slowQueryCount: 12,
        connectionPoolUsage: 65,
        activeConnections: 13,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get storage usage
 */
export async function getStorageUsage(): Promise<QueryResult<{
  totalUsed: number;
  totalAvailable: number;
  percentageUsed: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}>> {
  try {
    // Query total file sizes
    const { data, error } = await getClient()
      .from('files')
      .select('file_size');

    if (error) throw error;

    const files = data || [];
    const totalUsed = files.reduce((sum: number, f: any) => sum + (f.file_size || 0), 0);
    const totalAvailable = 1099511627776; // 1TB in bytes

    return {
      data: {
        totalUsed,
        totalAvailable,
        percentageUsed: Math.round((totalUsed / totalAvailable) * 10000) / 100,
        trend: 'stable',
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get system health
 */
export async function getSystemHealth(): Promise<QueryResult<{
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  errorRate: number;
  lastHealthCheck: string;
}>> {
  try {
    // Query error events
    const { data, error } = await getClient()
      .from('analytics')
      .select('event_type')
      .eq('event_type', 'error')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if (error) throw error;

    const errorEvents = data || [];
    const totalEvents = 1000; // Mock total
    const errorRate = (errorEvents.length / totalEvents) * 100;

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (errorRate > 5) status = 'degraded';
    if (errorRate > 10) status = 'critical';

    return {
      data: {
        status,
        uptime: 99.95,
        errorRate: Math.round(errorRate * 100) / 100,
        lastHealthCheck: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Helper function to get pattern description
 */
function getPatternDescription(pattern: string): string {
  const descriptions: Record<string, string> = {
    high_failed_captcha_rate: 'Multiple failed CAPTCHA attempts from same IP',
    suspicious_user_agent: 'Requests from suspicious or automated user agents',
    rapid_requests_from_ip: 'Rapid requests from single IP address',
    multiple_ips_same_location: 'Multiple IPs from same geographic location',
    unusual_file_types: 'Attempts to upload unusual or blocked file types',
  };
  return descriptions[pattern] || 'Unknown pattern';
}

// ============================================================================
// ENTERPRISE PLAN QUERIES
// ============================================================================

/**
 * Get enterprise plan for a user
 */
export async function getEnterprisePlan(userId: string): Promise<QueryResult<EnterprisePlan>> {
  try {
    const { data, error } = await getClient()
      .from('enterprise_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Create enterprise plan for a user
 */
export async function createEnterprisePlan(
  plan: EnterprisePlanInsert
): Promise<QueryResult<EnterprisePlan>> {
  try {
    const { data, error } = await getClient()
      .from('enterprise_plans')
      .insert([plan])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update enterprise plan
 */
export async function updateEnterprisePlan(
  userId: string,
  updates: EnterprisePlanUpdate
): Promise<QueryResult<EnterprisePlan>> {
  try {
    const { data, error } = await getClient()
      .from('enterprise_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete enterprise plan
 */
export async function deleteEnterprisePlan(userId: string): Promise<QueryResult<void>> {
  try {
    const { error } = await getClient()
      .from('enterprise_plans')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// ENTERPRISE SUPPORT TICKET QUERIES
// ============================================================================

/**
 * Create enterprise support ticket
 */
export async function createSupportTicket(
  ticket: EnterpriseSupportTicketInsert
): Promise<QueryResult<EnterpriseSupportTicket>> {
  try {
    const { data, error } = await getClient()
      .from('enterprise_support_tickets')
      .insert([ticket])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get support ticket by ID
 */
export async function getSupportTicket(ticketId: string): Promise<QueryResult<EnterpriseSupportTicket>> {
  try {
    const { data, error } = await getClient()
      .from('enterprise_support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get support tickets for a user
 */
export async function getUserSupportTickets(userId: string): Promise<QueryResultList<EnterpriseSupportTicket>> {
  try {
    const { data, error } = await getClient()
      .from('enterprise_support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Get all open support tickets (for admin)
 */
export async function getOpenSupportTickets(): Promise<QueryResultList<EnterpriseSupportTicket>> {
  try {
    const { data, error } = await getClient()
      .from('enterprise_support_tickets')
      .select('*')
      .in('status', ['open', 'in_progress'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Update support ticket
 */
export async function updateSupportTicket(
  ticketId: string,
  updates: EnterpriseSupportTicketUpdate
): Promise<QueryResult<EnterpriseSupportTicket>> {
  try {
    const { data, error } = await getClient()
      .from('enterprise_support_tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// API KEY QUERIES
// ============================================================================

/**
 * Create a new API key
 */
export async function createApiKey(
  apiKey: ApiKeyInsert
): Promise<QueryResult<ApiKey>> {
  try {
    const { data, error } = await getClient()
      .from('api_keys')
      .insert([apiKey])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get API key by ID
 */
export async function getApiKey(keyId: string): Promise<QueryResult<ApiKey>> {
  try {
    const { data, error } = await getClient()
      .from('api_keys')
      .select('*')
      .eq('id', keyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get API key by hash
 */
export async function getApiKeyByHash(keyHash: string): Promise<QueryResult<ApiKey>> {
  try {
    const { data, error } = await getClient()
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get all API keys for a user
 */
export async function getUserApiKeys(userId: string): Promise<QueryResultList<ApiKey>> {
  try {
    const { data, error } = await getClient()
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Update API key
 */
export async function updateApiKey(
  keyId: string,
  updates: ApiKeyUpdate
): Promise<QueryResult<ApiKey>> {
  try {
    const { data, error } = await getClient()
      .from('api_keys')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', keyId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete API key
 */
export async function deleteApiKey(keyId: string): Promise<QueryResult<void>> {
  try {
    const { error } = await getClient()
      .from('api_keys')
      .delete()
      .eq('id', keyId);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (error) {
    return { data: undefined, error: error as Error };
  }
}

/**
 * Revoke API key
 */
export async function revokeApiKey(keyId: string): Promise<QueryResult<ApiKey>> {
  try {
    const { data, error } = await getClient()
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// API KEY RATE LIMIT QUERIES
// ============================================================================

/**
 * Create API key rate limit
 */
export async function createApiKeyRateLimit(
  rateLimit: ApiKeyRateLimitInsert
): Promise<QueryResult<ApiKeyRateLimit>> {
  try {
    const { data, error } = await getClient()
      .from('api_key_rate_limits')
      .insert([rateLimit])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get API key rate limit
 */
export async function getApiKeyRateLimit(apiKeyId: string): Promise<QueryResult<ApiKeyRateLimit>> {
  try {
    const { data, error } = await getClient()
      .from('api_key_rate_limits')
      .select('*')
      .eq('api_key_id', apiKeyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update API key rate limit
 */
export async function updateApiKeyRateLimit(
  apiKeyId: string,
  updates: Partial<ApiKeyRateLimit>
): Promise<QueryResult<ApiKeyRateLimit>> {
  try {
    const { data, error } = await getClient()
      .from('api_key_rate_limits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('api_key_id', apiKeyId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// API USAGE QUERIES
// ============================================================================

/**
 * Record API usage
 */
export async function recordApiUsage(
  usage: ApiUsageInsert
): Promise<QueryResult<ApiUsage>> {
  try {
    const { data, error } = await getClient()
      .from('api_usage')
      .insert([usage])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get API usage for a key
 */
export async function getApiKeyUsage(
  apiKeyId: string,
  limit: number = 100
): Promise<QueryResultList<ApiUsage>> {
  try {
    const { data, error } = await getClient()
      .from('api_usage')
      .select('*')
      .eq('api_key_id', apiKeyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Get API usage statistics for a key
 */
export async function getApiKeyUsageStats(
  apiKeyId: string,
  hoursBack: number = 24
): Promise<QueryResultList<any>> {
  try {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    const { data, error } = await getClient()
      .from('api_usage')
      .select('endpoint, method, status_code, COUNT(*) as count, AVG(response_time_ms) as avg_response_time')
      .eq('api_key_id', apiKeyId)
      .gte('created_at', cutoffTime)
      .group_by('endpoint', 'method', 'status_code');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

// ============================================================================
// API WEBHOOK QUERIES
// ============================================================================

/**
 * Create API webhook
 */
export async function createApiWebhook(
  webhook: ApiWebhookInsert
): Promise<QueryResult<ApiWebhook>> {
  try {
    const { data, error } = await getClient()
      .from('api_webhooks')
      .insert([webhook])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get API webhook by ID
 */
export async function getApiWebhook(webhookId: string): Promise<QueryResult<ApiWebhook>> {
  try {
    const { data, error } = await getClient()
      .from('api_webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get all webhooks for an API key
 */
export async function getApiKeyWebhooks(apiKeyId: string): Promise<QueryResultList<ApiWebhook>> {
  try {
    const { data, error } = await getClient()
      .from('api_webhooks')
      .select('*')
      .eq('api_key_id', apiKeyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Update API webhook
 */
export async function updateApiWebhook(
  webhookId: string,
  updates: ApiWebhookUpdate
): Promise<QueryResult<ApiWebhook>> {
  try {
    const { data, error } = await getClient()
      .from('api_webhooks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', webhookId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete API webhook
 */
export async function deleteApiWebhook(webhookId: string): Promise<QueryResult<void>> {
  try {
    const { error } = await getClient()
      .from('api_webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) throw error;
    return { data: undefined, error: null };
  } catch (error) {
    return { data: undefined, error: error as Error };
  }
}

// ============================================================================
// WEBHOOK EVENT QUERIES
// ============================================================================

/**
 * Create webhook event
 */
export async function createWebhookEvent(
  event: WebhookEventInsert
): Promise<QueryResult<WebhookEvent>> {
  try {
    const { data, error } = await getClient()
      .from('webhook_events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get webhook event by ID
 */
export async function getWebhookEvent(eventId: string): Promise<QueryResult<WebhookEvent>> {
  try {
    const { data, error } = await getClient()
      .from('webhook_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get pending webhook events
 */
export async function getPendingWebhookEvents(): Promise<QueryResultList<WebhookEvent>> {
  try {
    const { data, error } = await getClient()
      .from('webhook_events')
      .select('*')
      .eq('status', 'pending')
      .lt('attempt_count', 3)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Update webhook event
 */
export async function updateWebhookEvent(
  eventId: string,
  updates: WebhookEventUpdate
): Promise<QueryResult<WebhookEvent>> {
  try {
    const { data, error } = await getClient()
      .from('webhook_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
