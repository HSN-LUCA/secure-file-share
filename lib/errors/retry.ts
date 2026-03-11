/**
 * Retry Logic for Error Recovery
 * Implements exponential backoff and retry strategies
 */

import { errorLogger } from '@/lib/logging/logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number
): number {
  const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelayMs);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (!opts.shouldRetry(error, attempt)) {
        throw error;
      }

      // Don't delay after last attempt
      if (attempt < opts.maxAttempts) {
        const delay = calculateDelay(
          attempt,
          opts.initialDelayMs,
          opts.maxDelayMs,
          opts.backoffMultiplier
        );

        errorLogger.debug(`Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms`, {
          error: error instanceof Error ? error.message : String(error),
        });

        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Retry with fallback strategy
 */
export async function retryWithFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await retry(primaryFn, options);
  } catch (error) {
    errorLogger.warn('Primary operation failed, attempting fallback', {
      error: error instanceof Error ? error.message : String(error),
    });

    try {
      return await fallbackFn();
    } catch (fallbackError) {
      errorLogger.error('Fallback operation also failed', {
        primaryError: error instanceof Error ? error.message : String(error),
        fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      });
      throw fallbackError;
    }
  }
}

/**
 * Graceful degradation - try multiple strategies in order
 */
export async function gracefulDegrade<T>(
  strategies: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < strategies.length; i++) {
    try {
      return await retry(strategies[i], options);
    } catch (error) {
      lastError = error;
      errorLogger.warn(`Strategy ${i + 1}/${strategies.length} failed, trying next`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  errorLogger.error('All degradation strategies failed');
  throw lastError;
}

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold: number = 5,
    private successThreshold: number = 2,
    private resetTimeoutMs: number = 60000
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime || 0);
      if (timeSinceLastFailure > this.resetTimeoutMs) {
        this.state = 'half-open';
        this.successCount = 0;
        errorLogger.info('Circuit breaker entering half-open state');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      // Record success
      this.recordSuccess();
      return result;
    } catch (error) {
      // Record failure
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record successful execution
   */
  private recordSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'closed';
        errorLogger.info('Circuit breaker closed');
      }
    }
  }

  /**
   * Record failed execution
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      errorLogger.warn('Circuit breaker opened', {
        failureCount: this.failureCount,
      });
    }
  }

  /**
   * Get circuit breaker state
   */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.state = 'closed';
  }
}
