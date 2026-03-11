/**
 * Custom Reports Database Functions
 * Handles creation, retrieval, and management of custom reports
 */

import { getClient } from './pool';
import { QueryResult } from './queries';

// ============================================================================
// TYPES
// ============================================================================

export interface CustomReportConfig {
  name: string;
  description?: string;
  metrics: string[];
  dimensions: string[];
  filters?: Record<string, any>;
  dateRangeType: 'all' | 'last_7_days' | 'last_30_days' | 'custom';
  dateRangeFrom?: string;
  dateRangeTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  isPublic?: boolean;
}

export interface ScheduledReportConfig {
  customReportId?: string;
  name: string;
  description?: string;
  scheduleType: 'daily' | 'weekly' | 'monthly';
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleTime: string;
  recipientEmails: string[];
  includeCharts?: boolean;
  includeSummary?: boolean;
  isActive?: boolean;
}

// ============================================================================
// CUSTOM REPORTS
// ============================================================================

/**
 * Create a custom report
 */
export async function createCustomReport(
  userId: string,
  config: CustomReportConfig
): Promise<QueryResult<{ reportId: string }>> {
  try {
    const { data, error } = await getClient()
      .from('custom_reports')
      .insert({
        user_id: userId,
        name: config.name,
        description: config.description || null,
        metrics: config.metrics,
        dimensions: config.dimensions,
        filters: config.filters || null,
        date_range_type: config.dateRangeType,
        date_range_from: config.dateRangeFrom || null,
        date_range_to: config.dateRangeTo || null,
        sort_by: config.sortBy || null,
        sort_order: config.sortOrder || 'DESC',
        is_public: config.isPublic || false,
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      data: { reportId: data?.id || '' },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get custom report by ID
 */
export async function getCustomReport(
  reportId: string
): Promise<QueryResult<CustomReportConfig & { id: string; userId: string; createdAt: string }>> {
  try {
    const { data, error } = await getClient()
      .from('custom_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) throw error;

    return {
      data: {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        metrics: data.metrics,
        dimensions: data.dimensions,
        filters: data.filters,
        dateRangeType: data.date_range_type,
        dateRangeFrom: data.date_range_from,
        dateRangeTo: data.date_range_to,
        sortBy: data.sort_by,
        sortOrder: data.sort_order,
        isPublic: data.is_public,
        createdAt: data.created_at,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * List custom reports for a user
 */
export async function listCustomReports(
  userId: string
): Promise<
  QueryResult<
    Array<CustomReportConfig & { id: string; createdAt: string; updatedAt: string }>
  >
> {
  try {
    const { data, error } = await getClient()
      .from('custom_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map((report) => ({
        id: report.id,
        name: report.name,
        description: report.description,
        metrics: report.metrics,
        dimensions: report.dimensions,
        filters: report.filters,
        dateRangeType: report.date_range_type,
        dateRangeFrom: report.date_range_from,
        dateRangeTo: report.date_range_to,
        sortBy: report.sort_by,
        sortOrder: report.sort_order,
        isPublic: report.is_public,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      })),
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update custom report
 */
export async function updateCustomReport(
  reportId: string,
  config: Partial<CustomReportConfig>
): Promise<QueryResult<null>> {
  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (config.name) updateData.name = config.name;
    if (config.description !== undefined) updateData.description = config.description;
    if (config.metrics) updateData.metrics = config.metrics;
    if (config.dimensions) updateData.dimensions = config.dimensions;
    if (config.filters !== undefined) updateData.filters = config.filters;
    if (config.dateRangeType) updateData.date_range_type = config.dateRangeType;
    if (config.dateRangeFrom !== undefined) updateData.date_range_from = config.dateRangeFrom;
    if (config.dateRangeTo !== undefined) updateData.date_range_to = config.dateRangeTo;
    if (config.sortBy !== undefined) updateData.sort_by = config.sortBy;
    if (config.sortOrder) updateData.sort_order = config.sortOrder;
    if (config.isPublic !== undefined) updateData.is_public = config.isPublic;

    const { error } = await getClient()
      .from('custom_reports')
      .update(updateData)
      .eq('id', reportId);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete custom report
 */
export async function deleteCustomReport(reportId: string): Promise<QueryResult<null>> {
  try {
    const { error } = await getClient()
      .from('custom_reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// SCHEDULED REPORTS
// ============================================================================

/**
 * Create a scheduled report
 */
export async function createScheduledReport(
  userId: string,
  config: ScheduledReportConfig
): Promise<QueryResult<{ reportId: string }>> {
  try {
    // Calculate next send time
    const nextSendAt = calculateNextSendTime(
      config.scheduleType,
      config.scheduleDayOfWeek,
      config.scheduleDayOfMonth,
      config.scheduleTime
    );

    const { data, error } = await getClient()
      .from('scheduled_reports')
      .insert({
        user_id: userId,
        custom_report_id: config.customReportId || null,
        name: config.name,
        description: config.description || null,
        schedule_type: config.scheduleType,
        schedule_day_of_week: config.scheduleDayOfWeek || null,
        schedule_day_of_month: config.scheduleDayOfMonth || null,
        schedule_time: config.scheduleTime,
        recipient_emails: config.recipientEmails,
        include_charts: config.includeCharts !== false,
        include_summary: config.includeSummary !== false,
        is_active: config.isActive !== false,
        next_send_at: nextSendAt.toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      data: { reportId: data?.id || '' },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get scheduled report by ID
 */
export async function getScheduledReport(
  reportId: string
): Promise<QueryResult<ScheduledReportConfig & { id: string; userId: string }>> {
  try {
    const { data, error } = await getClient()
      .from('scheduled_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) throw error;

    return {
      data: {
        id: data.id,
        userId: data.user_id,
        customReportId: data.custom_report_id,
        name: data.name,
        description: data.description,
        scheduleType: data.schedule_type,
        scheduleDayOfWeek: data.schedule_day_of_week,
        scheduleDayOfMonth: data.schedule_day_of_month,
        scheduleTime: data.schedule_time,
        recipientEmails: data.recipient_emails,
        includeCharts: data.include_charts,
        includeSummary: data.include_summary,
        isActive: data.is_active,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * List scheduled reports for a user
 */
export async function listScheduledReports(
  userId: string
): Promise<QueryResult<Array<ScheduledReportConfig & { id: string }>>> {
  try {
    const { data, error } = await getClient()
      .from('scheduled_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map((report) => ({
        id: report.id,
        customReportId: report.custom_report_id,
        name: report.name,
        description: report.description,
        scheduleType: report.schedule_type,
        scheduleDayOfWeek: report.schedule_day_of_week,
        scheduleDayOfMonth: report.schedule_day_of_month,
        scheduleTime: report.schedule_time,
        recipientEmails: report.recipient_emails,
        includeCharts: report.include_charts,
        includeSummary: report.include_summary,
        isActive: report.is_active,
      })),
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get scheduled reports due for sending
 */
export async function getScheduledReportsDue(): Promise<
  QueryResult<
    Array<{
      id: string;
      userId: string;
      customReportId: string | null;
      name: string;
      recipientEmails: string[];
      includeCharts: boolean;
      includeSummary: boolean;
    }>
  >
> {
  try {
    const now = new Date();

    const { data, error } = await getClient()
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .lte('next_send_at', now.toISOString());

    if (error) throw error;

    return {
      data: (data || []).map((report) => ({
        id: report.id,
        userId: report.user_id,
        customReportId: report.custom_report_id,
        name: report.name,
        recipientEmails: report.recipient_emails,
        includeCharts: report.include_charts,
        includeSummary: report.include_summary,
      })),
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update scheduled report
 */
export async function updateScheduledReport(
  reportId: string,
  config: Partial<ScheduledReportConfig>
): Promise<QueryResult<null>> {
  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (config.name) updateData.name = config.name;
    if (config.description !== undefined) updateData.description = config.description;
    if (config.scheduleType) updateData.schedule_type = config.scheduleType;
    if (config.scheduleDayOfWeek !== undefined)
      updateData.schedule_day_of_week = config.scheduleDayOfWeek;
    if (config.scheduleDayOfMonth !== undefined)
      updateData.schedule_day_of_month = config.scheduleDayOfMonth;
    if (config.scheduleTime) updateData.schedule_time = config.scheduleTime;
    if (config.recipientEmails) updateData.recipient_emails = config.recipientEmails;
    if (config.includeCharts !== undefined) updateData.include_charts = config.includeCharts;
    if (config.includeSummary !== undefined) updateData.include_summary = config.includeSummary;
    if (config.isActive !== undefined) updateData.is_active = config.isActive;

    const { error } = await getClient()
      .from('scheduled_reports')
      .update(updateData)
      .eq('id', reportId);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update scheduled report last sent time and next send time
 */
export async function updateScheduledReportSentTime(reportId: string): Promise<QueryResult<null>> {
  try {
    // Get the report to calculate next send time
    const { data: report, error: fetchError } = await getClient()
      .from('scheduled_reports')
      .select('schedule_type, schedule_day_of_week, schedule_day_of_month, schedule_time')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;

    const nextSendAt = calculateNextSendTime(
      report.schedule_type,
      report.schedule_day_of_week,
      report.schedule_day_of_month,
      report.schedule_time
    );

    const { error } = await getClient()
      .from('scheduled_reports')
      .update({
        last_sent_at: new Date().toISOString(),
        next_send_at: nextSendAt.toISOString(),
      })
      .eq('id', reportId);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Delete scheduled report
 */
export async function deleteScheduledReport(reportId: string): Promise<QueryResult<null>> {
  try {
    const { error } = await getClient()
      .from('scheduled_reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// REPORT EXPORTS
// ============================================================================

/**
 * Create a report export request
 */
export async function createReportExport(
  userId: string,
  customReportId: string | null,
  exportFormat: 'csv' | 'json' | 'pdf',
  fileName: string
): Promise<QueryResult<{ exportId: string }>> {
  try {
    const { data, error } = await getClient()
      .from('report_exports')
      .insert({
        user_id: userId,
        custom_report_id: customReportId,
        export_format: exportFormat,
        file_name: fileName,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
      data: { exportId: data?.id || '' },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update report export status
 */
export async function updateReportExportStatus(
  exportId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  fileSize?: number,
  s3Key?: string,
  errorMessage?: string
): Promise<QueryResult<null>> {
  try {
    const updateData: Record<string, any> = { status };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      if (fileSize) updateData.file_size = fileSize;
      if (s3Key) updateData.s3_key = s3Key;
      updateData.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    }

    if (status === 'failed' && errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await getClient()
      .from('report_exports')
      .update(updateData)
      .eq('id', exportId);

    if (error) throw error;

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get report export by ID
 */
export async function getReportExport(
  exportId: string
): Promise<
  QueryResult<{
    id: string;
    userId: string;
    customReportId: string | null;
    exportFormat: string;
    fileName: string;
    fileSize: number | null;
    s3Key: string | null;
    status: string;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
    expiresAt: string | null;
  }>
> {
  try {
    const { data, error } = await getClient()
      .from('report_exports')
      .select('*')
      .eq('id', exportId)
      .single();

    if (error) throw error;

    return {
      data: {
        id: data.id,
        userId: data.user_id,
        customReportId: data.custom_report_id,
        exportFormat: data.export_format,
        fileName: data.file_name,
        fileSize: data.file_size,
        s3Key: data.s3_key,
        status: data.status,
        errorMessage: data.error_message,
        createdAt: data.created_at,
        completedAt: data.completed_at,
        expiresAt: data.expires_at,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate next send time for scheduled report
 */
function calculateNextSendTime(
  scheduleType: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  scheduleTime?: string
): Date {
  const [hours, minutes] = (scheduleTime || '09:00').split(':').map(Number);
  const now = new Date();
  let nextSend = new Date(now);

  nextSend.setHours(hours, minutes, 0, 0);

  if (scheduleType === 'daily') {
    if (nextSend <= now) {
      nextSend.setDate(nextSend.getDate() + 1);
    }
  } else if (scheduleType === 'weekly') {
    const targetDay = dayOfWeek || 0;
    const currentDay = nextSend.getDay();

    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    nextSend.setDate(nextSend.getDate() + daysToAdd);

    if (nextSend <= now) {
      nextSend.setDate(nextSend.getDate() + 7);
    }
  } else if (scheduleType === 'monthly') {
    const targetDay = dayOfMonth || 1;
    nextSend.setDate(targetDay);

    if (nextSend <= now) {
      nextSend.setMonth(nextSend.getMonth() + 1);
      nextSend.setDate(targetDay);
    }
  }

  return nextSend;
}
