/**
 * Tests for Retry Logic
 */

import { retry, retryWithFallback, gracefulDegrade, CircuitBreaker } from '../retry';

describe('Retry Logic', () => {
  describe('retry function', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retry(fn, { initialDelayMs: 0 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      const result = await retry(fn, { maxAttempts: 3, initialDelayMs: 0 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retry(fn, { maxAttempts: 3, initialDelayMs: 0 })).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use custom shouldRetry function', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Retryable'))
        .mockRejectedValueOnce(new Error('Not retryable'));

      const shouldRetry = (error: unknown) => {
        return error instanceof Error && error.message === 'Retryable';
      };

      await expect(
        retry(fn, { maxAttempts: 3, shouldRetry, initialDelayMs: 0 })
      ).rejects.toThrow('Not retryable');

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryWithFallback function', () => {
    it('should use primary function on success', async () => {
      const primary = jest.fn().mockResolvedValue('primary');
      const fallback = jest.fn().mockResolvedValue('fallback');

      const result = await retryWithFallback(primary, fallback, { initialDelayMs: 0 });

      expect(result).toBe('primary');
      expect(primary).toHaveBeenCalled();
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should use fallback on primary failure', async () => {
      const primary = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const fallback = jest.fn().mockResolvedValue('fallback');

      const result = await retryWithFallback(primary, fallback, { initialDelayMs: 0 });

      expect(result).toBe('fallback');
      expect(primary).toHaveBeenCalled();
      expect(fallback).toHaveBeenCalled();
    });

    it('should throw if both fail', async () => {
      const primary = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const fallback = jest.fn().mockRejectedValue(new Error('Fallback failed'));

      await expect(retryWithFallback(primary, fallback, { initialDelayMs: 0 })).rejects.toThrow('Fallback failed');
    });
  });

  describe('gracefulDegrade function', () => {
    it('should use first successful strategy', async () => {
      const strategy1 = jest.fn().mockRejectedValue(new Error('Fail'));
      const strategy2 = jest.fn().mockResolvedValue('success');
      const strategy3 = jest.fn();

      const result = await gracefulDegrade([strategy1, strategy2, strategy3], { initialDelayMs: 0 });

      expect(result).toBe('success');
      expect(strategy1).toHaveBeenCalled();
      expect(strategy2).toHaveBeenCalled();
      expect(strategy3).not.toHaveBeenCalled();
    });

    it('should try all strategies if all fail', async () => {
      const strategy1 = jest.fn().mockRejectedValue(new Error('Fail 1'));
      const strategy2 = jest.fn().mockRejectedValue(new Error('Fail 2'));
      const strategy3 = jest.fn().mockRejectedValue(new Error('Fail 3'));

      await expect(gracefulDegrade([strategy1, strategy2, strategy3], { initialDelayMs: 0 })).rejects.toThrow('Fail 3');

      expect(strategy1).toHaveBeenCalled();
      expect(strategy2).toHaveBeenCalled();
      expect(strategy3).toHaveBeenCalled();
    });
  });

  describe('CircuitBreaker', () => {
    it('should execute function when closed', async () => {
      const breaker = new CircuitBreaker();
      const fn = jest.fn().mockResolvedValue('success');

      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(breaker.getState()).toBe('closed');
    });

    it('should open after failure threshold', async () => {
      const breaker = new CircuitBreaker(3, 2, 1000);
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(fn);
        } catch (e) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('open');
    });

    it('should reject when open', async () => {
      const breaker = new CircuitBreaker(1, 2, 1000);
      const fn = jest.fn().mockRejectedValue(new Error('Fail'));

      try {
        await breaker.execute(fn);
      } catch (e) {
        // Expected
      }

      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is open');
    });

    it('should reset to closed state', () => {
      const breaker = new CircuitBreaker();
      breaker.reset();

      expect(breaker.getState()).toBe('closed');
    });
  });
});
