/**
 * Storage Utility Functions
 * Handles file upload, download, and management in object storage
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { createS3Client, getStorageConfig } from './config';
import { encryptFile, decryptFile, EncryptionResult } from './encryption';
import { Readable } from 'stream';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  expirationMinutes?: number;
}

export interface DownloadResult {
  data: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface FileMetadata {
  size: number;
  contentType?: string;
  uploadedAt: Date;
  expiresAt: Date;
  encrypted: boolean;
}

/**
 * Generate S3 key for file storage
 * Format: uploads/{year}/{month}/{day}/{uuid}
 */
export function generateS3Key(fileId: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `uploads/${year}/${month}/${day}/${fileId}`;
}

/**
 * Upload file to object storage with encryption
 */
export async function uploadFile(
  fileId: string,
  fileData: Buffer,
  options: UploadOptions = {}
): Promise<{ key: string; encryptionData: EncryptionResult }> {
  const client = createS3Client();
  const config = getStorageConfig();
  const key = generateS3Key(fileId);

  // Encrypt file before upload
  const encryptionData = encryptFile(fileData);

  // Prepare metadata
  const metadata: Record<string, string> = {
    'original-size': fileData.length.toString(),
    'encrypted': 'true',
    'upload-time': new Date().toISOString(),
    ...options.metadata,
  };

  // Calculate expiration time
  const expirationMinutes = options.expirationMinutes || 20;
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

  try {
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: encryptionData.encrypted,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: metadata,
      // S3 Lifecycle policy will handle deletion, but we can also set expiration
      Expires: expiresAt,
    });

    await client.send(command);

    return {
      key,
      encryptionData,
    };
  } catch (error) {
    console.error('File upload failed:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download file from object storage and decrypt
 */
export async function downloadFile(
  key: string,
  encryptionData: { iv: string; authTag: string }
): Promise<DownloadResult> {
  const client = createS3Client();
  const config = getStorageConfig();

  try {
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    const response = await client.send(command);

    // Read the stream into a buffer
    const chunks: Buffer[] = [];
    if (response.Body instanceof Readable) {
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
    }

    const encryptedData = Buffer.concat(chunks);

    // Decrypt file
    const decryptedData = decryptFile({
      encrypted: encryptedData,
      iv: encryptionData.iv,
      authTag: encryptionData.authTag,
    });

    return {
      data: decryptedData,
      contentType: response.ContentType,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('File download failed:', error);
    throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete file from object storage
 */
export async function deleteFile(key: string): Promise<void> {
  const client = createS3Client();
  const config = getStorageConfig();

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    console.error('File deletion failed:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if file exists in object storage
 */
export async function fileExists(key: string): Promise<boolean> {
  const client = createS3Client();
  const config = getStorageConfig();

  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error('File existence check failed:', error);
    throw new Error(`Failed to check file existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get file metadata from object storage
 */
export async function getFileMetadata(key: string): Promise<FileMetadata> {
  const client = createS3Client();
  const config = getStorageConfig();

  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key,
    });

    const response = await client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType,
      uploadedAt: response.LastModified || new Date(),
      expiresAt: response.Expires || new Date(),
      encrypted: response.Metadata?.['encrypted'] === 'true',
    };
  } catch (error) {
    console.error('Failed to get file metadata:', error);
    throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List files in storage (for cleanup operations)
 */
export async function listExpiredFiles(prefix: string = 'uploads/'): Promise<string[]> {
  const client = createS3Client();
  const config = getStorageConfig();
  const expiredKeys: string[] = [];

  try {
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.LastModified) {
            // Check if file has expired (older than 24 hours for safety)
            const fileAge = Date.now() - object.LastModified.getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (fileAge > maxAge) {
              expiredKeys.push(object.Key);
            }
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return expiredKeys;
  } catch (error) {
    console.error('Failed to list expired files:', error);
    throw new Error(`Failed to list expired files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSize: number;
}> {
  const client = createS3Client();
  const config = getStorageConfig();

  try {
    let totalFiles = 0;
    let totalSize = 0;
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: 'uploads/',
        ContinuationToken: continuationToken,
      });

      const response = await client.send(command);

      if (response.Contents) {
        totalFiles += response.Contents.length;
        totalSize += response.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return {
      totalFiles,
      totalSize,
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
