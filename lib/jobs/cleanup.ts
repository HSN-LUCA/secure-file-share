/**
 * File Expiration Cleanup Job
 * Handles automatic deletion of expired files from S3 and database
 */

import { getExpiredFiles, deleteFile as deleteFileRecord } from '../db/queries';
import { deleteFile as deleteFileFromS3 } from '../storage/utils';
import { supabaseServer } from '../db/config';

export interface CleanupJobData {
  timestamp?: number;
}

export interface CleanupJobResult {
  filesDeleted: number;
  errors: Array<{
    fileId: string;
    error: string;
  }>;
  duration: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Process cleanup job
 * Deletes expired files from S3 and database
 */
export async function processCleanupJob(job: any): Promise<CleanupJobResult> {
  const startTime = new Date();
  const startTimestamp = Date.now();

  console.log('[Cleanup Job] Starting file expiration cleanup...');

  let filesDeleted = 0;
  const errors: Array<{ fileId: string; error: string }> = [];

  try {
    // Get all expired files from database
    const { data: expiredFiles, error: queryError } = await getExpiredFiles();

    if (queryError) {
      throw new Error(`Failed to query expired files: ${queryError.message}`);
    }

    if (!expiredFiles || expiredFiles.length === 0) {
      console.log('[Cleanup Job] No expired files found');
      return {
        filesDeleted: 0,
        errors: [],
        duration: Date.now() - startTimestamp,
        startTime,
        endTime: new Date(),
      };
    }

    console.log(`[Cleanup Job] Found ${expiredFiles.length} expired files to delete`);

    // Process each expired file
    for (const file of expiredFiles) {
      try {
        // Delete from S3 (non-blocking - continue even if S3 delete fails)
        try {
          await deleteFileFromS3(file.s3_key);
          console.log(`[Cleanup Job] Deleted from S3: ${file.s3_key}`);
        } catch (s3Error) {
          const errorMsg = s3Error instanceof Error ? s3Error.message : 'Unknown error';
          console.warn(`[Cleanup Job] Failed to delete from S3 (${file.s3_key}): ${errorMsg}`);
          // Continue with database deletion even if S3 fails
        }

        // Delete download records associated with this file
        try {
          if (supabaseServer) {
            const { error: downloadError } = await supabaseServer
              .from('downloads')
              .delete()
              .eq('file_id', file.id);

            if (downloadError) {
              throw downloadError;
            }
            console.log(`[Cleanup Job] Deleted download records for file: ${file.id}`);
          }
        } catch (downloadError) {
          const errorMsg = downloadError instanceof Error ? downloadError.message : 'Unknown error';
          console.warn(`[Cleanup Job] Failed to delete download records (${file.id}): ${errorMsg}`);
          // Continue with file deletion even if download deletion fails
        }

        // Delete file record from database
        const { error: fileDeleteError } = await deleteFileRecord(file.id);

        if (fileDeleteError) {
          throw fileDeleteError;
        }

        console.log(`[Cleanup Job] Deleted file record: ${file.id} (${file.share_code})`);
        filesDeleted++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Cleanup Job] Error processing file ${file.id}: ${errorMsg}`);
        errors.push({
          fileId: file.id,
          error: errorMsg,
        });
      }
    }

    const endTime = new Date();
    const duration = Date.now() - startTimestamp;

    // Log cleanup summary
    const summary = `Cleanup completed: ${filesDeleted} files deleted, ${errors.length} errors, ${duration}ms`;
    console.log(`[Cleanup Job] ${summary}`);

    // Log cleanup statistics to analytics
    try {
      if (supabaseServer) {
        await supabaseServer.from('analytics').insert([
          {
            event_type: 'cleanup_completed',
            metadata: {
              files_deleted: filesDeleted,
              errors_count: errors.length,
              duration_ms: duration,
              error_details: errors,
            },
          },
        ]);
      }
    } catch (analyticsError) {
      console.warn('[Cleanup Job] Failed to log cleanup statistics:', analyticsError);
    }

    return {
      filesDeleted,
      errors,
      duration,
      startTime,
      endTime,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cleanup Job] Fatal error during cleanup:', errorMsg);

    // Log fatal error to analytics
    try {
      if (supabaseServer) {
        await supabaseServer.from('analytics').insert([
          {
            event_type: 'cleanup_failed',
            metadata: {
              error: errorMsg,
              timestamp: new Date().toISOString(),
            },
          },
        ]);
      }
    } catch (analyticsError) {
      console.warn('[Cleanup Job] Failed to log cleanup error:', analyticsError);
    }

    throw error;
  }
}

/**
 * Create cleanup job queue
 * Stub implementation - Bull queues require Redis and are not suitable for Vercel's serverless environment
 * For production, use a dedicated job queue service or implement cleanup via scheduled functions
 */
export function createCleanupQueue(redisUrl: string): any {
  // Stub implementation - returns a mock queue object
  return {
    process: () => {},
    on: () => {},
    add: async () => ({ id: 'stub' }),
    close: async () => {},
  };
}
