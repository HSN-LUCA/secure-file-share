/**
 * Tests for Logger
 */

import { Logger, createLogger, LogLevel } from '../logger';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Logger creation', () => {
    it('should create a logger with default min level', () => {
      const logger = new Logger('test');
      expect(logger).toBeDefined();
    });

    it('should create a logger with custom min level', () => {
      const logger = new Logger('test', 'debug');
      expect(logger).toBeDefined();
    });

    it('should create logger via factory function', () => {
      const logger = createLogger('test', 'info');
      expect(logger).toBeDefined();
    });
  });

  describe('Log levels', () => {
    it('should log debug messages when min level is debug', () => {
      const logger = new Logger('test', 'debug');
      logger.debug('Debug message');

      expect(console.debug).toHaveBeenCalled();
    });

    it('should not log debug messages when min level is info', () => {
      const logger = new Logger('test', 'info');
      logger.debug('Debug message');

      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const logger = new Logger('test', 'info');
      logger.info('Info message');

      expect(console.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      const logger = new Logger('test', 'info');
      logger.warn('Warning message');

      expect(console.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const logger = new Logger('test', 'info');
      logger.error('Error message');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Log context', () => {
    it('should include context in log entry', () => {
      const logger = new Logger('test', 'info');
      logger.info('Message', { userId: '123', action: 'upload' });

      const call = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(call);

      expect(logEntry.context).toEqual({ userId: '123', action: 'upload' });
    });

    it('should include logger name in output', () => {
      const logger = new Logger('myapp', 'info');
      logger.info('Test message');

      const call = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(call);

      expect(logEntry.logger).toBe('myapp');
    });

    it('should include timestamp in ISO format', () => {
      const logger = new Logger('test', 'info');
      logger.info('Test message');

      const call = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(call);

      expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Log level changes', () => {
    it('should change min level dynamically', () => {
      const logger = new Logger('test', 'warn');
      logger.setMinLevel('debug');

      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('Log output format', () => {
    it('should output JSON formatted logs', () => {
      const logger = new Logger('test', 'info');
      logger.info('Test message', { key: 'value' });

      const call = (console.info as jest.Mock).mock.calls[0][0];
      expect(() => JSON.parse(call)).not.toThrow();
    });

    it('should include all required fields in log entry', () => {
      const logger = new Logger('test', 'info');
      logger.info('Test message', { key: 'value' });

      const call = (console.info as jest.Mock).mock.calls[0][0];
      const logEntry = JSON.parse(call);

      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('level');
      expect(logEntry).toHaveProperty('message');
      expect(logEntry).toHaveProperty('logger');
      expect(logEntry).toHaveProperty('context');
    });
  });

  describe('Log level ordering', () => {
    it('should respect log level hierarchy', () => {
      const logger = new Logger('test', 'warn');

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
