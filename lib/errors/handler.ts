/**
 * Error Handling Utilities
 * Custom error classes and error handling functions
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, 400, code, true);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error - 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', code: string = 'AUTHENTICATION_FAILED') {
    super(message, 401, code, true);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error - 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', code: string = 'AUTHORIZATION_FAILED') {
    super(message, 403, code, true);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error - 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, 404, code, true);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict error - 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', code: string = 'CONFLICT') {
    super(message, 409, code, true);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate limit error - 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Too many requests',
    retryAfter?: number,
    code: string = 'RATE_LIMIT_EXCEEDED'
  ) {
    super(message, 429, code, true);
    Object.setPrototypeOf(this, RateLimitError.prototype);
    this.retryAfter = retryAfter;
  }
}

/**
 * Storage error - 500 Internal Server Error
 */
export class StorageError extends AppError {
  constructor(message: string = 'Storage operation failed', code: string = 'STORAGE_ERROR') {
    super(message, 500, code, true);
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/**
 * Virus scan error - 400 Bad Request
 */
export class VirusScanError extends AppError {
  constructor(message: string = 'File failed virus scan', code: string = 'VIRUS_DETECTED') {
    super(message, 400, code, true);
    Object.setPrototypeOf(this, VirusScanError.prototype);
  }
}

/**
 * Check if an error is an operational error
 */
export function isOperationalError(error: unknown): error is AppError {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Get error response object
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let statusCode = 500;

  if (error instanceof AppError) {
    message = error.message;
    code = error.code;
    statusCode = error.statusCode;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return {
    success: false,
    error: message,
    code,
    statusCode,
    timestamp: new Date().toISOString(),
  };
}
