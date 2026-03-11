/**
 * Tests for Error Handler
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  StorageError,
  VirusScanError,
  isOperationalError,
  formatErrorResponse,
} from '../handler';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should create an AppError with custom values', () => {
      const error = new AppError('Custom error', 400, 'CUSTOM_CODE', false);
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.isOperational).toBe(false);
    });

    it('should be instanceof AppError', () => {
      const error = new AppError('Test');
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error instanceof ValidationError).toBe(true);
    });

    it('should accept custom code', () => {
      const error = new ValidationError('Invalid file', 'INVALID_FILE');
      expect(error.code).toBe('INVALID_FILE');
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError with 401 status', () => {
      const error = new AuthenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('AuthorizationError', () => {
    it('should create an AuthorizationError with 403 status', () => {
      const error = new AuthorizationError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('AUTHORIZATION_FAILED');
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with 404 status', () => {
      const error = new NotFoundError('File not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError with 409 status', () => {
      const error = new ConflictError('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('RateLimitError', () => {
    it('should create a RateLimitError with 429 status', () => {
      const error = new RateLimitError();
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should store retryAfter value', () => {
      const error = new RateLimitError('Too many requests', 60);
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('StorageError', () => {
    it('should create a StorageError with 500 status', () => {
      const error = new StorageError('Upload failed');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('STORAGE_ERROR');
    });
  });

  describe('VirusScanError', () => {
    it('should create a VirusScanError with 400 status', () => {
      const error = new VirusScanError('Malware detected');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VIRUS_DETECTED');
    });
  });
});

describe('Error Utilities', () => {
  describe('isOperationalError', () => {
    it('should return true for operational AppError', () => {
      const error = new AppError('Test', 500, 'TEST', true);
      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for non-operational AppError', () => {
      const error = new AppError('Test', 500, 'TEST', false);
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for non-AppError', () => {
      const error = new Error('Test');
      expect(isOperationalError(error)).toBe(false);
    });
  });

  describe('formatErrorResponse', () => {
    it('should format AppError correctly', () => {
      const error = new ValidationError('Invalid input', 'INVALID_INPUT');
      const response = formatErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid input');
      expect(response.code).toBe('INVALID_INPUT');
      expect(response.statusCode).toBe(400);
      expect(response.timestamp).toBeDefined();
    });

    it('should format regular Error correctly', () => {
      const error = new Error('Something went wrong');
      const response = formatErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
      expect(response.statusCode).toBe(500);
    });

    it('should format unknown error correctly', () => {
      const response = formatErrorResponse('unknown error');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(500);
      expect(response.timestamp).toBeDefined();
    });

    it('should include ISO timestamp', () => {
      const error = new AppError('Test');
      const response = formatErrorResponse(error);

      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
