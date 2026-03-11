/**
 * Bot Detection Middleware
 * Detects and blocks suspicious bot activity
 */

import { NextRequest } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter/limiter';
import { InMemoryRateLimitStore } from '@/lib/rate-limiter/store';
import { createAnalytics } from '@/lib/db/queries';

/**
 * Bot detection result
 */
export interface BotDetectionResult {
  isBot: boolean;
  score: number; // 0.0 - 1.0, higher = more likely bot
  reasons: string[];
  shouldBlock: boolean;
  blockDurationMs?: number;
}

/**
 * Bot detection configuration
 */
export interface BotDetectionConfig {
  enableUserAgentCheck: boolean;
  enableRateLimitCheck: boolean;
  enableHeaderCheck: boolean;
  botScoreThreshold: number; // 0.0 - 1.0
  blockDurationMs: number; // How long to block suspicious IPs
}

/**
 * Default bot detection configuration
 */
const DEFAULT_CONFIG: BotDetectionConfig = {
  enableUserAgentCheck: true,
  enableRateLimitCheck: true,
  enableHeaderCheck: true,
  botScoreThreshold: 0.7,
  blockDurationMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Common bot user agents
 */
const BOT_USER_AGENTS = [
  'bot',
  'crawler',
  'spider',
  'scraper',
  'curl',
  'wget',
  'python',
  'java',
  'perl',
  'ruby',
  'php',
  'node',
  'go-http-client',
  'axios',
  'postman',
  'insomnia',
  'thunderclient',
];

/**
 * Detect bot activity
 */
export function detectBot(
  request: NextRequest,
  config: Partial<BotDetectionConfig> = {}
): BotDetectionResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let score = 0;
  const reasons: string[] = [];

  // Check user agent
  if (finalConfig.enableUserAgentCheck) {
    const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
    
    if (!userAgent) {
      score += 0.3;
      reasons.push('Missing user agent');
    } else if (BOT_USER_AGENTS.some(bot => userAgent.includes(bot))) {
      score += 0.5;
      reasons.push('Suspicious user agent');
    }
  }

  // Check headers
  if (finalConfig.enableHeaderCheck) {
    const headers = request.headers;
    
    // Missing common browser headers
    if (!headers.get('accept-language')) {
      score += 0.2;
      reasons.push('Missing accept-language header');
    }
    
    if (!headers.get('accept-encoding')) {
      score += 0.1;
      reasons.push('Missing accept-encoding header');
    }

    // Suspicious headers
    if (headers.get('x-requested-with') === 'XMLHttpRequest' && !headers.get('referer')) {
      score += 0.15;
      reasons.push('Suspicious header combination');
    }
  }

  // Normalize score to 0.0 - 1.0
  score = Math.min(1.0, score);

  const isBot = score >= finalConfig.botScoreThreshold;
  const shouldBlock = isBot;

  return {
    isBot,
    score,
    reasons,
    shouldBlock,
    blockDurationMs: shouldBlock ? finalConfig.blockDurationMs : undefined,
  };
}

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Log bot detection event
 */
export async function logBotDetectionEvent(
  ip: string,
  userAgent: string,
  detection: BotDetectionResult,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await createAnalytics({
      event_type: 'bot_detected',
      ip_address: ip,
      metadata: {
        score: detection.score,
        reasons: detection.reasons,
        shouldBlock: detection.shouldBlock,
        ...metadata,
      },
    });
  } catch (error) {
    console.error('Failed to log bot detection event:', error);
  }
}

/**
 * Create bot detection middleware
 */
export function createBotDetectionMiddleware(
  config: Partial<BotDetectionConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const blockedIPs = new Map<string, Date>();

  return {
    /**
     * Check if request should be blocked
     */
    async check(request: NextRequest): Promise<{
      allowed: boolean;
      reason?: string;
      blockDurationMs?: number;
    }> {
      const ip = getClientIp(request);

      // Check if IP is blocked
      const blockedUntil = blockedIPs.get(ip);
      if (blockedUntil && new Date() < blockedUntil) {
        const blockDurationMs = blockedUntil.getTime() - Date.now();
        return {
          allowed: false,
          reason: 'IP is temporarily blocked due to suspicious activity',
          blockDurationMs,
        };
      }

      // Remove expired block
      if (blockedUntil) {
        blockedIPs.delete(ip);
      }

      // Detect bot
      const detection = detectBot(request, finalConfig);

      if (detection.shouldBlock) {
        // Block IP
        const blockedUntil = new Date(Date.now() + finalConfig.blockDurationMs);
        blockedIPs.set(ip, blockedUntil);

        // Log event
        const userAgent = request.headers.get('user-agent') || 'unknown';
        await logBotDetectionEvent(ip, userAgent, detection, {
          action: 'blocked',
        });

        return {
          allowed: false,
          reason: 'Suspicious activity detected',
          blockDurationMs: finalConfig.blockDurationMs,
        };
      }

      return { allowed: true };
    },

    /**
     * Block IP manually
     */
    blockIP(ip: string, durationMs: number = finalConfig.blockDurationMs): void {
      const blockedUntil = new Date(Date.now() + durationMs);
      blockedIPs.set(ip, blockedUntil);
    },

    /**
     * Unblock IP manually
     */
    unblockIP(ip: string): void {
      blockedIPs.delete(ip);
    },

    /**
     * Get blocked IPs
     */
    getBlockedIPs(): Array<{ ip: string; blockedUntil: Date }> {
      const now = new Date();
      const blocked: Array<{ ip: string; blockedUntil: Date }> = [];

      for (const [ip, blockedUntil] of blockedIPs.entries()) {
        if (now < blockedUntil) {
          blocked.push({ ip, blockedUntil });
        } else {
          blockedIPs.delete(ip);
        }
      }

      return blocked;
    },

    /**
     * Clear all blocks
     */
    clearBlocks(): void {
      blockedIPs.clear();
    },
  };
}
