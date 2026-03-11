/**
 * Tests for Background Jobs Initialization
 */

// Mock database config first
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

// Mock cleanup module
jest.mock('../cleanup');

// Mock storage utils
jest.mock('../../storage/utils');

// Mock database queries
jest.mock('../../db/queries');

// Mock environment
jest.mock('../../env', () => ({
  getEnv: jest.fn().mockReturnValue({
    REDIS_URL: 'redis://localhost:6379',
  }),
}));

import {
  initializeJobs,
  getCleanupQueue,
  closeJobs,
  getJobStats,
  triggerCleanupJob,
} from '../init';

describe('Jobs Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  describe('initializeJobs', () => {
    it('should initialize jobs successfully', async () => {
      const cleanupModule = require('../cleanup');
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 1 }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      cleanupModule.createCleanupQueue.mockReturnValue(mockQueue);

      await initializeJobs();

      expect(cleanupModule.createCleanupQueue).toHaveBeenCalledWith(
        'redis://localhost:6379'
      );
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should schedule cleanup job with correct cron pattern', async () => {
      const cleanupModule = require('../cleanup');
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 1 }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      cleanupModule.createCleanupQueue.mockReturnValue(mockQueue);

      await initializeJobs();

      const addCall = mockQueue.add.mock.calls[0];
      expect(addCall[1].repeat.cron).toBe('* * * * *'); // Every minute
    });

    it('should handle missing Redis URL', async () => {
      const { getEnv } = require('../../env');
      getEnv.mockReturnValue({
        REDIS_URL: undefined,
      });

      const cleanupModule = require('../cleanup');

      await initializeJobs();

      expect(cleanupModule.createCleanupQueue).not.toHaveBeenCalled();
    });
  });

  describe('getCleanupQueue', () => {
    it('should return a queue instance after initialization', async () => {
      const cleanupModule = require('../cleanup');
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 1 }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      cleanupModule.createCleanupQueue.mockReturnValue(mockQueue);

      await initializeJobs();
      const queue = getCleanupQueue();
      expect(queue).toBeDefined();
    });
  });

  describe('getJobStats', () => {
    it('should return null stats when queue is not initialized', async () => {
      const stats = await getJobStats();

      expect(stats.cleanup).toBeNull();
    });

    it('should handle stats retrieval errors gracefully', async () => {
      const cleanupModule = require('../cleanup');
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 1 }),
        close: jest.fn().mockResolvedValue(undefined),
        getJobCounts: jest.fn().mockRejectedValue(new Error('Stats error')),
      };

      cleanupModule.createCleanupQueue.mockReturnValue(mockQueue);

      await initializeJobs();
      const stats = await getJobStats();

      expect(stats.cleanup).toBeNull();
    });
  });

  describe('triggerCleanupJob', () => {
    it('should trigger cleanup job and return job ID', async () => {
      const cleanupModule = require('../cleanup');
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 42 }),
        close: jest.fn().mockResolvedValue(undefined),
      };

      cleanupModule.createCleanupQueue.mockReturnValue(mockQueue);

      await initializeJobs();
      const jobId = await triggerCleanupJob();

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
    });
  });

  describe('closeJobs', () => {
    it('should handle close gracefully when no queue exists', async () => {
      await closeJobs(); // Should not throw

      expect(true).toBe(true);
    });
  });
});
