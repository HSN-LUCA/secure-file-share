/**
 * Tests for File Expiration Cleanup Job
 */

import { processCleanupJob, createCleanupQueue } from '../cleanup';
import * as dbQueries from '../../db/queries';
import * as storageUtils from '../../storage/utils';

// Mock dependencies
jest.mock('../../db/queries');
jest.mock('../../storage/utils');
jest.mock('../../db/config', () => ({
  supabaseServer: {
    from: jest.fn().mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

// Mock Bull Queue
jest.mock('bull', () => {
  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 1 }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    name: 'file-cleanup',
    getJobCounts: jest.fn().mockResolvedValue({
      active: 0,
      waiting: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    }),
  };

  return {
    Queue: jest.fn().mockImplementation(() => mockQueue),
  };
});

describe('Cleanup Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processCleanupJob', () => {
    it('should delete expired files successfully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          share_code: '123456',
          s3_key: 'uploads/2024/01/30/file-1',
          expires_at: new Date(Date.now() - 1000),
        },
        {
          id: 'file-2',
          share_code: '789012',
          s3_key: 'uploads/2024/01/30/file-2',
          expires_at: new Date(Date.now() - 2000),
        },
      ];

      (dbQueries.getExpiredFiles as jest.Mock).mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      (storageUtils.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (dbQueries.deleteFile as jest.Mock).mockResolvedValue({
        data: undefined,
        error: null,
      });

      const mockJob = {
        id: 1,
        data: {},
      } as any;

      const result = await processCleanupJob(mockJob);

      expect(result.filesDeleted).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(storageUtils.deleteFile).toHaveBeenCalledTimes(2);
      expect(dbQueries.deleteFile).toHaveBeenCalledTimes(2);
    });

    it('should handle S3 deletion failures gracefully', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          share_code: '123456',
          s3_key: 'uploads/2024/01/30/file-1',
          expires_at: new Date(Date.now() - 1000),
        },
      ];

      (dbQueries.getExpiredFiles as jest.Mock).mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      (storageUtils.deleteFile as jest.Mock).mockRejectedValue(
        new Error('S3 deletion failed')
      );

      (dbQueries.deleteFile as jest.Mock).mockResolvedValue({
        data: undefined,
        error: null,
      });

      const mockJob = {
        id: 1,
        data: {},
      } as any;

      const result = await processCleanupJob(mockJob);

      // Should still delete from database even if S3 fails
      expect(result.filesDeleted).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(dbQueries.deleteFile).toHaveBeenCalledTimes(1);
    });

    it('should handle database deletion failures', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          share_code: '123456',
          s3_key: 'uploads/2024/01/30/file-1',
          expires_at: new Date(Date.now() - 1000),
        },
      ];

      (dbQueries.getExpiredFiles as jest.Mock).mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      (storageUtils.deleteFile as jest.Mock).mockResolvedValue(undefined);

      (dbQueries.deleteFile as jest.Mock).mockResolvedValue({
        data: undefined,
        error: new Error('Database deletion failed'),
      });

      const mockJob = {
        id: 1,
        data: {},
      } as any;

      const result = await processCleanupJob(mockJob);

      expect(result.filesDeleted).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].fileId).toBe('file-1');
    });

    it('should handle no expired files', async () => {
      (dbQueries.getExpiredFiles as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      const mockJob = {
        id: 1,
        data: {},
      } as any;

      const result = await processCleanupJob(mockJob);

      expect(result.filesDeleted).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(storageUtils.deleteFile).not.toHaveBeenCalled();
    });

    it('should handle database query errors', async () => {
      (dbQueries.getExpiredFiles as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      });

      const mockJob = {
        id: 1,
        data: {},
      } as any;

      await expect(processCleanupJob(mockJob)).rejects.toThrow(
        'Failed to query expired files'
      );
    });

    it('should return correct timing information', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          share_code: '123456',
          s3_key: 'uploads/2024/01/30/file-1',
          expires_at: new Date(Date.now() - 1000),
        },
      ];

      (dbQueries.getExpiredFiles as jest.Mock).mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      (storageUtils.deleteFile as jest.Mock).mockResolvedValue(undefined);
      (dbQueries.deleteFile as jest.Mock).mockResolvedValue({
        data: undefined,
        error: null,
      });

      const mockJob = {
        id: 1,
        data: {},
      } as any;

      const result = await processCleanupJob(mockJob);

      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.endTime.getTime()).toBeGreaterThanOrEqual(
        result.startTime.getTime()
      );
    });

    it('should handle multiple errors across different files', async () => {
      const mockFiles = [
        {
          id: 'file-1',
          share_code: '123456',
          s3_key: 'uploads/2024/01/30/file-1',
          expires_at: new Date(Date.now() - 1000),
        },
        {
          id: 'file-2',
          share_code: '789012',
          s3_key: 'uploads/2024/01/30/file-2',
          expires_at: new Date(Date.now() - 2000),
        },
        {
          id: 'file-3',
          share_code: '345678',
          s3_key: 'uploads/2024/01/30/file-3',
          expires_at: new Date(Date.now() - 3000),
        },
      ];

      (dbQueries.getExpiredFiles as jest.Mock).mockResolvedValue({
        data: mockFiles,
        error: null,
      });

      (storageUtils.deleteFile as jest.Mock).mockResolvedValue(undefined);

      // First file succeeds, second fails, third succeeds
      (dbQueries.deleteFile as jest.Mock)
        .mockResolvedValueOnce({ data: undefined, error: null })
        .mockResolvedValueOnce({
          data: undefined,
          error: new Error('Database error'),
        })
        .mockResolvedValueOnce({ data: undefined, error: null });

      const mockJob = {
        id: 1,
        data: {},
      } as any;

      const result = await processCleanupJob(mockJob);

      expect(result.filesDeleted).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].fileId).toBe('file-2');
    });
  });

  describe('createCleanupQueue', () => {
    it('should create a queue with correct configuration', () => {
      const redisUrl = 'redis://localhost:6379';
      const queue = createCleanupQueue(redisUrl);

      expect(queue).toBeDefined();
      expect(queue.name).toBe('file-cleanup');
    });

    it('should handle queue events', async () => {
      const redisUrl = 'redis://localhost:6379';
      const queue = createCleanupQueue(redisUrl);

      const completedHandler = jest.fn();
      const failedHandler = jest.fn();

      queue.on('completed', completedHandler);
      queue.on('failed', failedHandler);

      // Verify event listeners are registered
      expect(queue.on).toHaveBeenCalledWith('completed', completedHandler);
      expect(queue.on).toHaveBeenCalledWith('failed', failedHandler);

      await queue.close();
    });
  });
});
