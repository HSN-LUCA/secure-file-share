/**
 * Auto-Expiration Policy Management
 * Sets up lifecycle policies for automatic file deletion
 */

import {
  PutBucketLifecycleConfigurationCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import { createS3Client, getStorageConfig } from './config';

export interface ExpirationPolicy {
  id: string;
  prefix: string;
  expirationDays: number;
  description: string;
}

/**
 * Default expiration policies
 */
export const DEFAULT_POLICIES: ExpirationPolicy[] = [
  {
    id: 'free-plan-expiration',
    prefix: 'uploads/free/',
    expirationDays: 1, // 20 minutes + buffer, but S3 lifecycle runs daily
    description: 'Free plan files expire after 20 minutes (1 day lifecycle)',
  },
  {
    id: 'paid-plan-expiration',
    prefix: 'uploads/paid/',
    expirationDays: 2, // 24 hours + buffer
    description: 'Paid plan files expire after 24 hours (2 day lifecycle)',
  },
  {
    id: 'temp-files-cleanup',
    prefix: 'temp/',
    expirationDays: 1,
    description: 'Temporary files cleanup after 1 day',
  },
];

/**
 * Set up lifecycle policies for auto-expiration
 */
export async function setupExpirationPolicies(
  policies: ExpirationPolicy[] = DEFAULT_POLICIES
): Promise<void> {
  const client = createS3Client();
  const config = getStorageConfig();

  try {
    const rules = policies.map((policy, index) => ({
      ID: policy.id,
      Filter: {
        Prefix: policy.prefix,
      },
      Status: 'Enabled' as const,
      Expiration: {
        Days: policy.expirationDays,
      },
      NoncurrentVersionExpiration: {
        NoncurrentDays: policy.expirationDays,
      },
    }));

    const command = new PutBucketLifecycleConfigurationCommand({
      Bucket: config.bucket,
      LifecycleConfiguration: {
        Rules: rules,
      },
    });

    await client.send(command);
    console.log(`✓ Lifecycle policies configured for ${config.bucket}`);
  } catch (error) {
    console.error('Failed to set up expiration policies:', error);
    throw new Error(
      `Failed to set up expiration policies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get current lifecycle policies
 */
export async function getExpirationPolicies(): Promise<any> {
  const client = createS3Client();
  const config = getStorageConfig();

  try {
    const command = new GetBucketLifecycleConfigurationCommand({
      Bucket: config.bucket,
    });

    const response = await client.send(command);
    return response.Rules || [];
  } catch (error: any) {
    // NoSuchLifecycleConfiguration is expected if not set
    if (error.name === 'NoSuchLifecycleConfiguration') {
      return [];
    }
    console.error('Failed to get expiration policies:', error);
    throw new Error(
      `Failed to get expiration policies: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify expiration policies are configured
 */
export async function verifyExpirationPolicies(): Promise<boolean> {
  try {
    const policies = await getExpirationPolicies();
    return policies.length > 0;
  } catch (error) {
    console.error('Failed to verify expiration policies:', error);
    return false;
  }
}

/**
 * Get expiration time for a file based on plan
 */
export function getExpirationTime(plan: 'free' | 'paid' | 'enterprise'): Date {
  const now = new Date();

  switch (plan) {
    case 'free':
      // 20 minutes
      return new Date(now.getTime() + 20 * 60 * 1000);
    case 'paid':
      // 24 hours
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'enterprise':
      // 30 days (configurable per customer)
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 20 * 60 * 1000);
  }
}

/**
 * Get expiration duration in minutes for a plan
 */
export function getExpirationMinutes(plan: 'free' | 'paid' | 'enterprise'): number {
  switch (plan) {
    case 'free':
      return 20;
    case 'paid':
      return 24 * 60; // 1440 minutes
    case 'enterprise':
      return 30 * 24 * 60; // 43200 minutes
    default:
      return 20;
  }
}

/**
 * Check if a file has expired
 */
export function isFileExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Get time remaining until expiration
 */
export function getTimeUntilExpiration(expiresAt: Date): number {
  const now = new Date();
  const timeRemaining = expiresAt.getTime() - now.getTime();
  return Math.max(0, timeRemaining);
}

/**
 * Format expiration time for display
 */
export function formatExpirationTime(expiresAt: Date): string {
  const timeRemaining = getTimeUntilExpiration(expiresAt);

  if (timeRemaining === 0) {
    return 'Expired';
  }

  const minutes = Math.floor(timeRemaining / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  }

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  }

  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
}
