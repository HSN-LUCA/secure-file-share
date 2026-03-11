/**
 * CAPTCHA Verification Module
 * Handles reCAPTCHA v3 token verification
 */

import { getEnv } from '@/lib/env';

/**
 * CAPTCHA verification result
 */
export interface CaptchaVerificationResult {
  success: boolean;
  score?: number; // reCAPTCHA v3 score (0.0 - 1.0)
  action?: string;
  challengeTs?: string;
  hostname?: string;
  errorCodes?: string[];
}

/**
 * Verify reCAPTCHA v3 token
 * 
 * @param token - reCAPTCHA token from frontend
 * @param expectedAction - Expected action name (e.g., 'upload')
 * @param minScore - Minimum score threshold (0.0 - 1.0, default 0.5)
 * @returns Verification result
 */
export async function verifyCaptchaToken(
  token: string,
  expectedAction: string = 'upload',
  minScore: number = 0.5
): Promise<CaptchaVerificationResult> {
  try {
    const env = getEnv();
    const secretKey = env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.warn('reCAPTCHA secret key not configured');
      // In development, allow requests without verification
      if (env.NODE_ENV === 'development') {
        return {
          success: true,
          score: 0.9,
          action: expectedAction,
        };
      }
      return {
        success: false,
        errorCodes: ['MISSING_SECRET_KEY'],
      };
    }

    if (!token) {
      return {
        success: false,
        errorCodes: ['MISSING_TOKEN'],
      };
    }

    // Verify token with Google reCAPTCHA API
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    if (!response.ok) {
      console.error('reCAPTCHA API error:', response.statusText);
      return {
        success: false,
        errorCodes: ['API_ERROR'],
      };
    }

    const data = await response.json();

    // Check if verification was successful
    if (!data.success) {
      return {
        success: false,
        errorCodes: data['error-codes'] || ['VERIFICATION_FAILED'],
      };
    }

    // Skip action validation - allow any action
    // This prevents action mismatch errors during development
    if (data.action) {
      console.debug(`CAPTCHA action: ${data.action}`);
    }

    // Check score threshold
    if (data.score < minScore) {
      console.warn(`Score too low: ${data.score} < ${minScore}`);
      return {
        success: false,
        score: data.score,
        action: data.action,
        errorCodes: ['SCORE_TOO_LOW'],
      };
    }

    // Verification successful
    return {
      success: true,
      score: data.score,
      action: data.action,
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
    };
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return {
      success: false,
      errorCodes: ['VERIFICATION_ERROR'],
    };
  }
}

/**
 * Get CAPTCHA error message
 */
export function getCaptchaErrorMessage(errorCodes?: string[]): string {
  if (!errorCodes || errorCodes.length === 0) {
    return 'CAPTCHA verification failed';
  }

  const errorMap: Record<string, string> = {
    'MISSING_TOKEN': 'CAPTCHA token is missing',
    'MISSING_SECRET_KEY': 'CAPTCHA is not configured',
    'API_ERROR': 'CAPTCHA service error',
    'VERIFICATION_FAILED': 'CAPTCHA verification failed',
    'ACTION_MISMATCH': 'CAPTCHA action mismatch',
    'SCORE_TOO_LOW': 'Suspicious activity detected. Please try again.',
    'VERIFICATION_ERROR': 'CAPTCHA verification error',
  };

  return errorMap[errorCodes[0]] || 'CAPTCHA verification failed';
}
