/**
 * Storage Setup and Initialization
 * Initializes object storage configuration and policies
 */

import { createS3Client, getStorageConfig, validateStorageConfig } from './config';
import { setupExpirationPolicies, getExpirationPolicies, verifyExpirationPolicies } from './expiration';
import { HeadBucketCommand } from '@aws-sdk/client-s3';

/**
 * Initialize storage system
 */
export async function initializeStorage(): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, any>;
}> {
  try {
    console.log('Initializing object storage...');

    // 1. Validate configuration
    console.log('  ✓ Validating configuration...');
    const config = getStorageConfig();
    console.log(`    Provider: ${config.provider}`);
    console.log(`    Bucket: ${config.bucket}`);
    console.log(`    Region: ${config.region}`);

    // 2. Test connection
    console.log('  ✓ Testing connection...');
    const client = createS3Client();
    const headCommand = new HeadBucketCommand({ Bucket: config.bucket });
    await client.send(headCommand);
    console.log('    Connection successful');

    // 3. Set up expiration policies
    console.log('  ✓ Setting up expiration policies...');
    await setupExpirationPolicies();
    console.log('    Policies configured');

    // 4. Verify policies
    console.log('  ✓ Verifying policies...');
    const policies = await getExpirationPolicies();
    console.log(`    ${policies.length} policies active`);

    return {
      success: true,
      message: 'Object storage initialized successfully',
      details: {
        provider: config.provider,
        bucket: config.bucket,
        region: config.region,
        policiesCount: policies.length,
      },
    };
  } catch (error) {
    console.error('Storage initialization failed:', error);
    return {
      success: false,
      message: `Storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify storage system
 */
export async function verifyStorage(): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, any>;
}> {
  try {
    console.log('Verifying object storage...');

    // 1. Check configuration
    console.log('  ✓ Checking configuration...');
    const config = getStorageConfig();

    // 2. Test connection
    console.log('  ✓ Testing connection...');
    const client = createS3Client();
    const headCommand = new HeadBucketCommand({ Bucket: config.bucket });
    await client.send(headCommand);

    // 3. Check policies
    console.log('  ✓ Checking expiration policies...');
    const policiesConfigured = await verifyExpirationPolicies();

    return {
      success: true,
      message: 'Object storage verification successful',
      details: {
        provider: config.provider,
        bucket: config.bucket,
        region: config.region,
        policiesConfigured,
      },
    };
  } catch (error) {
    console.error('Storage verification failed:', error);
    return {
      success: false,
      message: `Storage verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get storage system status
 */
export async function getStorageStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  policiesConfigured: boolean;
  provider: string;
  bucket: string;
  region: string;
}> {
  try {
    const config = getStorageConfig();
    const client = createS3Client();

    // Test connection
    const headCommand = new HeadBucketCommand({ Bucket: config.bucket });
    await client.send(headCommand);

    // Check policies
    const policiesConfigured = await verifyExpirationPolicies();

    return {
      configured: true,
      connected: true,
      policiesConfigured,
      provider: config.provider,
      bucket: config.bucket,
      region: config.region,
    };
  } catch (error) {
    return {
      configured: false,
      connected: false,
      policiesConfigured: false,
      provider: 'unknown',
      bucket: 'unknown',
      region: 'unknown',
    };
  }
}
