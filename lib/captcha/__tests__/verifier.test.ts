/**
 * CAPTCHA Verification Tests
 * Tests for reCAPTCHA v3 token verification
 */

import { verifyCaptchaToken, getCaptchaErrorMessage } from '../verifier';

// Mock fetch
global.fetch = jest.fn();

describe('verifyCaptchaToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key';
    process.env.NODE_ENV = 'production';
  });

  describe('successful verification', () => {
    it('should verify valid token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.9,
          action: 'upload',
          challenge_ts: '2024-01-30T12:00:00Z',
          hostname: 'example.com',
        }),
      });

      const result = await verifyCaptchaToken('valid-token', 'upload', 0.5);

      expect(result.success).toBe(true);
      expect(result.score).toBe(0.9);
      expect(result.action).toBe('upload');
    });

    it('should accept token with score above threshold', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.7,
          action: 'upload',
        }),
      });

      const result = await verifyCaptchaToken('valid-token', 'upload', 0.5);

      expect(result.success).toBe(true);
      expect(result.score).toBe(0.7);
    });
  });

  describe('failed verification', () => {
    it('should reject token with low score', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.3,
          action: 'upload',
        }),
      });

      const result = await verifyCaptchaToken('low-score-token', 'upload', 0.5);

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('SCORE_TOO_LOW');
    });

    it('should reject token with mismatched action', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.9,
          action: 'download',
        }),
      });

      const result = await verifyCaptchaToken('mismatched-token', 'upload', 0.5);

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('ACTION_MISMATCH');
    });

    it('should reject API error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response'],
        }),
      });

      const result = await verifyCaptchaToken('invalid-token', 'upload', 0.5);

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('invalid-input-response');
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await verifyCaptchaToken('token', 'upload', 0.5);

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('VERIFICATION_ERROR');
    });

    it('should handle HTTP error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const result = await verifyCaptchaToken('token', 'upload', 0.5);

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('API_ERROR');
    });
  });

  describe('missing configuration', () => {
    it('should reject when secret key is missing', async () => {
      const originalKey = process.env.RECAPTCHA_SECRET_KEY;
      delete process.env.RECAPTCHA_SECRET_KEY;

      try {
        const result = await verifyCaptchaToken('token', 'upload', 0.5);
        expect(result.success).toBe(false);
        expect(result.errorCodes).toContain('MISSING_SECRET_KEY');
      } finally {
        process.env.RECAPTCHA_SECRET_KEY = originalKey;
      }
    });

    it('should allow in development when secret key is missing', async () => {
      const originalKey = process.env.RECAPTCHA_SECRET_KEY;
      const originalEnv = process.env.NODE_ENV;
      delete process.env.RECAPTCHA_SECRET_KEY;
      process.env.NODE_ENV = 'development';

      try {
        const result = await verifyCaptchaToken('token', 'upload', 0.5);
        expect(result.success).toBe(true);
        expect(result.score).toBe(0.9);
      } finally {
        process.env.RECAPTCHA_SECRET_KEY = originalKey;
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('missing token', () => {
    it('should reject empty token', async () => {
      const result = await verifyCaptchaToken('', 'upload', 0.5);

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('MISSING_TOKEN');
    });
  });

  describe('custom score threshold', () => {
    it('should use custom score threshold', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          score: 0.6,
          action: 'upload',
        }),
      });

      const result = await verifyCaptchaToken('token', 'upload', 0.7);

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain('SCORE_TOO_LOW');
    });
  });
});

describe('getCaptchaErrorMessage', () => {
  it('should return message for missing token', () => {
    const message = getCaptchaErrorMessage(['MISSING_TOKEN']);
    expect(message).toBe('CAPTCHA token is missing');
  });

  it('should return message for missing secret key', () => {
    const message = getCaptchaErrorMessage(['MISSING_SECRET_KEY']);
    expect(message).toBe('CAPTCHA is not configured');
  });

  it('should return message for API error', () => {
    const message = getCaptchaErrorMessage(['API_ERROR']);
    expect(message).toBe('CAPTCHA service error');
  });

  it('should return message for verification failed', () => {
    const message = getCaptchaErrorMessage(['VERIFICATION_FAILED']);
    expect(message).toBe('CAPTCHA verification failed');
  });

  it('should return message for action mismatch', () => {
    const message = getCaptchaErrorMessage(['ACTION_MISMATCH']);
    expect(message).toBe('CAPTCHA action mismatch');
  });

  it('should return message for score too low', () => {
    const message = getCaptchaErrorMessage(['SCORE_TOO_LOW']);
    expect(message).toBe('Suspicious activity detected. Please try again.');
  });

  it('should return message for verification error', () => {
    const message = getCaptchaErrorMessage(['VERIFICATION_ERROR']);
    expect(message).toBe('CAPTCHA verification error');
  });

  it('should return default message for unknown error', () => {
    const message = getCaptchaErrorMessage(['UNKNOWN_ERROR']);
    expect(message).toBe('CAPTCHA verification failed');
  });

  it('should return default message for empty error codes', () => {
    const message = getCaptchaErrorMessage([]);
    expect(message).toBe('CAPTCHA verification failed');
  });

  it('should return default message for undefined error codes', () => {
    const message = getCaptchaErrorMessage(undefined);
    expect(message).toBe('CAPTCHA verification failed');
  });
});
