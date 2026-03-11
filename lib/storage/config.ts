/**
 * Object Storage Configuration
 * Supports both AWS S3 and Cloudflare R2
 */

import { S3Client } from '@aws-sdk/client-s3';

export type StorageProvider = 'aws-s3' | 'cloudflare-r2';

export interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

/**
 * Get storage configuration from environment variables
 */
export function getStorageConfig(): StorageConfig {
  const provider = (process.env.OBJECT_STORAGE_PROVIDER || 'aws-s3') as StorageProvider;
  const bucket = process.env.OBJECT_STORAGE_BUCKET;
  const region = process.env.OBJECT_STORAGE_REGION || 'us-east-1';
  const accessKeyId = process.env.OBJECT_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY;
  const endpoint = process.env.OBJECT_STORAGE_ENDPOINT;

  if (!bucket) {
    throw new Error('OBJECT_STORAGE_BUCKET environment variable is required');
  }

  if (!accessKeyId) {
    throw new Error('OBJECT_STORAGE_ACCESS_KEY_ID environment variable is required');
  }

  if (!secretAccessKey) {
    throw new Error('OBJECT_STORAGE_SECRET_ACCESS_KEY environment variable is required');
  }

  return {
    provider,
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    endpoint,
    forcePathStyle: provider === 'cloudflare-r2',
  };
}

/**
 * Create and configure S3 client
 */
export function createS3Client(): S3Client {
  const config = getStorageConfig();

  const clientConfig: any = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  };

  // For Cloudflare R2, use custom endpoint
  if (config.provider === 'cloudflare-r2') {
    if (!config.endpoint) {
      throw new Error('OBJECT_STORAGE_ENDPOINT is required for Cloudflare R2');
    }
    clientConfig.endpoint = config.endpoint;
    clientConfig.forcePathStyle = true;
  }

  // For AWS S3, optionally use custom endpoint
  if (config.endpoint && config.provider === 'aws-s3') {
    clientConfig.endpoint = config.endpoint;
  }

  return new S3Client(clientConfig);
}

/**
 * Get storage provider name for logging
 */
export function getStorageProviderName(): string {
  const config = getStorageConfig();
  return config.provider === 'aws-s3' ? 'AWS S3' : 'Cloudflare R2';
}

/**
 * Validate storage configuration
 */
export async function validateStorageConfig(): Promise<boolean> {
  try {
    const config = getStorageConfig();
    const client = createS3Client();

    // Test connection by listing objects (with limit 1)
    const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const command = new HeadBucketCommand({
      Bucket: config.bucket,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('Storage configuration validation failed:', error);
    return false;
  }
}
