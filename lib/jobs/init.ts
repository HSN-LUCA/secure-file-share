/**
 * Background Jobs Initialization
 * Sets up Bull Queue and schedules recurring jobs
 * Stub implementation - Bull queues require Redis and are not suitable for Vercel's serverless environment
 */

import { createCleanupQueue, CleanupJobData } from './cleanup';
import { getEnv } from '../env';

let cleanupQueue: any = null;

/**
 * Initialize background jobs
 * Should be called once on application startup
 */
export async function initializeJobs(): Promise<void> {
  try {
    const env = getEnv();

    // Check if Redis URL is configured
    if (!env.REDIS_URL) {
      console.warn('[Jobs] Redis URL not configured, background jobs disabled');
      return;
    }

    console.log('[Jobs] Initializing background jobs...');

    // Create cleanup queue
    cleanupQueue = createCleanupQueue(env.REDIS_URL);

    // Schedule cleanup job to run every minute
    // Cron pattern: '* * * * *' means every minute
    // Stub implementation - no-op for Vercel
    if (cleanupQueue) {
      console.log('[Jobs] Cleanup job scheduled to run every minute (stub)');
    }

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Jobs] Received SIGTERM, closing job queues...');
      await closeJobs();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('[Jobs] Received SIGINT, closing job queues...');
      await closeJobs();
      process.exit(0);
    });

    console.log('[Jobs] Background jobs initialized successfully');
  } catch (error) {
    console.error('[Jobs] Failed to initialize background jobs:', error);
    throw error;
  }
}

/**
 * Get cleanup queue instance
 */
export function getCleanupQueue(): any {
  return cleanupQueue;
}

/**
 * Close all job queues
 */
export async function closeJobs(): Promise<void> {
  try {
    if (cleanupQueue) {
      console.log('[Jobs] Closing cleanup queue...');
      await cleanupQueue.close();
      cleanupQueue = null;
      console.log('[Jobs] Cleanup queue closed');
    }
  } catch (error) {
    console.error('[Jobs] Error closing job queues:', error);
  }
}

/**
 * Get job queue statistics
 */
export async function getJobStats(): Promise<{
  cleanup: {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
  } | null;
}> {
  try {
    const stats = {
      cleanup: null as any,
    };

    if (cleanupQueue) {
      const counts = await cleanupQueue.getJobCounts();
      stats.cleanup = {
        active: counts.active,
        waiting: counts.waiting,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
      };
    }

    return stats;
  } catch (error) {
    console.error('[Jobs] Error getting job stats:', error);
    return {
      cleanup: null,
    };
  }
}

/**
 * Manually trigger cleanup job (for testing/admin purposes)
 */
export async function triggerCleanupJob(): Promise<string | null> {
  try {
    if (!cleanupQueue) {
      console.warn('[Jobs] Cleanup queue not initialized');
      return null;
    }

    // Stub implementation - no-op for Vercel
    console.log('[Jobs] Manually triggered cleanup job (stub)');
    return 'stub-job-id';
  } catch (error) {
    console.error('[Jobs] Error triggering cleanup job:', error);
    return null;
  }
}
