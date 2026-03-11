/**
 * Data Retention Cleanup Job
 * Handles automatic cleanup of data based on retention policies
 */

import { Queue, Job } from 'bull';
import { runAllCleanupTasks, getRetentionStatistics } from '../retention/retention-service';
import { query } from '../db/pool';

export interface RetentionCleanupJobData {
  timestamp?: number;
}

export interface RetentionCleanupJobResult {
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
  duration: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Process retention cleanup job
 * Deletes old data based on retention policies
 */
export async function processRetentionCleanupJob(job: Job<RetentionCleanupJobData>): Promise<RetentionCleanupJobResult> {
  const startTime = new Date();
  const startTimestamp = Date.now();

  console.log('[Retention Cleanup Job] Starting data retention cleanup...');

  try {
    // Get statistics before cleanup
    const statsBefore = await getRetentionStatistics();
    console.log('[Retention Cleanup Job] Statistics before cleanup:', statsBefore);

    // Run all cleanup tasks
    const cleanupResults = await runAllCleanupTasks();

    // Get statistics after cleanup
    const statsAfter = await getRetentionStatistics();
    console.log('[Retention Cleanup Job] Statistics after cleanup:', statsAfter);

    const endTime = new Date();
    const duration = Date.now() - startTimestamp;

    const result: RetentionCleanupJobResult = {
      files: cleanupResults.files,
      analytics: cleanupResults.analytics,
      logs: cleanupResults.logs,
      sessions: cleanupResults.sessions,
      pageViews: cleanupResults.pageViews,
      clickEvents: cleanupResults.clickEvents,
      userFlows: cleanupResults.userFlows,
      exports: cleanupResults.exports,
      ccpaRequests: cleanupResults.ccpaRequests,
      ccpaLogs: cleanupResults.ccpaLogs,
      gdprLogs: cleanupResults.gdprLogs,
      webhookEvents: cleanupResults.webhookEvents,
      apiUsageLogs: cleanupResults.apiUsageLogs,
      duration,
      startTime,
      endTime,
    };

    // Log cleanup summary
    const summary = `Retention cleanup completed: ${cleanupResults.files.deleted} files deleted, ${cleanupResults.analytics} analytics records deleted, ${duration}ms`;
    console.log(`[Retention Cleanup Job] ${summary}`);

    // Log cleanup statistics to analytics
    try {
      await query(
        `INSERT INTO analytics (id, event_type, metadata)
         VALUES ($1, $2, $3)`,
        ['', 'retention_cleanup_completed', JSON.stringify(result)]
      );
    } catch (analyticsError) {
      console.warn('[Retention Cleanup Job] Failed to log cleanup statistics:', analyticsError);
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Retention Cleanup Job] Fatal error during cleanup:', errorMsg);

    // Log fatal error to analytics
    try {
      await query(
        `INSERT INTO analytics (id, event_type, metadata)
         VALUES ($1, $2, $3)`,
        ['', 'retention_cleanup_failed', JSON.stringify({ error: errorMsg, timestamp: new Date().toISOString() })]
      );
    } catch (analyticsError) {
      console.warn('[Retention Cleanup Job] Failed to log cleanup error:', analyticsError);
    }

    throw error;
  }
}

/**
 * Create retention cleanup job queue
 */
export function createRetentionCleanupQueue(redisUrl: string): Queue<RetentionCleanupJobData> {
  const queue = new Queue<RetentionCleanupJobData>('retention-cleanup', redisUrl, {
    settings: {
      // Retry failed jobs up to 3 times
      retryProcessDelay: 5000,
      maxStalledCount: 2,
      lockDuration: 60000,
      lockRenewTime: 30000,
    },
  });

  // Process retention cleanup jobs
  queue.process(async (job) => {
    return processRetentionCleanupJob(job);
  });

  // Handle job completion
  queue.on('completed', (job, result) => {
    console.log(`[Retention Cleanup Queue] Job ${job.id} completed:`, result);
  });

  // Handle job failure
  queue.on('failed', (job, error) => {
    console.error(`[Retention Cleanup Queue] Job ${job.id} failed:`, error.message);
  });

  // Handle job error
  queue.on('error', (error) => {
    console.error('[Retention Cleanup Queue] Queue error:', error);
  });

  return queue;
}

/**
 * Schedule retention cleanup job
 * Runs daily at 2 AM UTC
 */
export async function scheduleRetentionCleanup(queue: Queue<RetentionCleanupJobData>): Promise<void> {
  // Remove existing recurring job
  const jobs = await queue.getRepeatableJobs();
  for (const job of jobs) {
    if (job.name === 'retention-cleanup-daily') {
      await queue.removeRepeatableByKey(job.key);
    }
  }

  // Schedule new recurring job (daily at 2 AM UTC)
  await queue.add(
    { timestamp: Date.now() },
    {
      repeat: {
        cron: '0 2 * * *', // 2 AM UTC every day
      },
      jobId: 'retention-cleanup-daily',
    }
  );

  console.log('[Retention Cleanup] Scheduled daily retention cleanup at 2 AM UTC');
}
