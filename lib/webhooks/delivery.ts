/**
 * Webhook Delivery Service
 * Handles sending webhook events to registered endpoints
 */

import crypto from 'crypto';
import { updateWebhookEvent, getPendingWebhookEvents } from '@/lib/db/queries';

export interface WebhookPayload {
  event_type: 'file_uploaded' | 'file_downloaded' | 'file_expired';
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Send webhook event to endpoint
 */
export async function sendWebhookEvent(
  webhookId: string,
  url: string,
  payload: WebhookPayload,
  secret: string,
  maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(payloadString, secret);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event_type,
        'X-Webhook-Timestamp': payload.timestamp,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Mark event as delivered
    await updateWebhookEvent(webhookId, {
      status: 'delivered',
      attempt_count: 0,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to deliver webhook ${webhookId}:`, errorMessage);

    // Update event with error
    await updateWebhookEvent(webhookId, {
      status: 'failed',
      last_error: errorMessage,
      attempt_count: 1,
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Process pending webhook events (for background job)
 */
export async function processPendingWebhooks(): Promise<void> {
  try {
    const { data: pendingEvents, error } = await getPendingWebhookEvents();
    if (error) {
      console.error('Error fetching pending webhooks:', error);
      return;
    }

    for (const event of pendingEvents) {
      try {
        // Retry logic would go here
        // For now, just mark as processed
        await updateWebhookEvent(event.id, {
          status: 'delivered',
        });
      } catch (err) {
        console.error(`Error processing webhook event ${event.id}:`, err);
      }
    }
  } catch (error) {
    console.error('Error processing pending webhooks:', error);
  }
}
