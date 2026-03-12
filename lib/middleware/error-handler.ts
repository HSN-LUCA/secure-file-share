/**
 * Error Handler Middleware
 * Centralized error handling for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppError, formatErrorResponse, ErrorResponse } from '@/lib/errors/handler';
import { errorLogger } from '@/lib/logging/logger';

/**
 * Error handler for API routes
 * Wraps async route handlers and catches errors
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Handle error and return appropriate response
 */
export function handleError(error: unknown): NextResponse<ErrorResponse> {
  let statusCode = 500;
  let errorResponse: ErrorResponse;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorResponse = formatErrorResponse(error);

    // Log operational errors
    if (error.isOperational) {
      errorLogger.warn(`Operational error: ${error.code}`, {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      });
    } else {
      errorLogger.error(`Non-operational error: ${error.code}`, {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
      });
    }
  } else if (error instanceof Error) {
    errorResponse = formatErrorResponse(error);
    errorLogger.error('Unexpected error', {
      message: error.message,
      stack: error.stack,
    });
  } else {
    errorResponse = formatErrorResponse(new Error('Unknown error'));
    errorLogger.error('Unknown error type', {
      error: String(error),
    });
  }

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Get error status code
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    // Retryable errors: rate limit, storage errors, and 5xx errors
    return (
      error.statusCode === 429 ||
      error.statusCode >= 500 ||
      error.code === 'STORAGE_ERROR'
    );
  }
  return false;
}

/**
 * Get retry delay in milliseconds
 */
export function getRetryDelay(error: unknown, attempt: number = 1): number {
  if (error instanceof AppError && 'retryAfter' in error) {
    const retryAfter = (error as any).retryAfter;
    if (typeof retryAfter === 'number') {
      return retryAfter * 1000;
    }
  }

  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
}
