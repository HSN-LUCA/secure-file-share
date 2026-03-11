#!/usr/bin/env ts-node

/**
 * Storage Setup CLI Tool
 * Manages object storage configuration and initialization
 */

import { initializeStorage, verifyStorage, getStorageStatus } from '../lib/storage/setup';
import { generateEncryptionKey, validateEncryptionKey } from '../lib/storage/encryption';
import { getStorageConfig } from '../lib/storage/config';

const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case 'init':
        await handleInit();
        break;

      case 'verify':
        await handleVerify();
        break;

      case 'status':
        await handleStatus();
        break;

      case 'generate-key':
        handleGenerateKey();
        break;

      case 'validate-key':
        handleValidateKey();
        break;

      case 'help':
        showHelp();
        break;

      default:
        console.log('Unknown command. Use "help" for available commands.');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function handleInit() {
  console.log('\n📦 Initializing Object Storage\n');
  const result = await initializeStorage();

  if (result.success) {
    console.log('\n✅ Storage initialized successfully!\n');
    if (result.details) {
      console.log('Details:');
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
  } else {
    console.log(`\n❌ ${result.message}\n`);
    process.exit(1);
  }
}

async function handleVerify() {
  console.log('\n🔍 Verifying Object Storage\n');
  const result = await verifyStorage();

  if (result.success) {
    console.log('\n✅ Storage verification successful!\n');
    if (result.details) {
      console.log('Details:');
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
  } else {
    console.log(`\n❌ ${result.message}\n`);
    process.exit(1);
  }
}

async function handleStatus() {
  console.log('\n📊 Storage Status\n');
  const status = await getStorageStatus();

  console.log('Configuration:');
  console.log(`  Provider: ${status.provider}`);
  console.log(`  Bucket: ${status.bucket}`);
  console.log(`  Region: ${status.region}`);
  console.log(`  Configured: ${status.configured ? '✅' : '❌'}`);
  console.log(`  Connected: ${status.connected ? '✅' : '❌'}`);
  console.log(`  Policies: ${status.policiesConfigured ? '✅' : '❌'}`);
  console.log();
}

function handleGenerateKey() {
  console.log('\n🔐 Generating Encryption Key\n');
  const key = generateEncryptionKey();

  console.log('New encryption key (256-bit AES):');
  console.log(`\n${key}\n`);
  console.log('Add this to your .env.local file:');
  console.log(`ENCRYPTION_KEY=${key}\n`);
}

function handleValidateKey() {
  const keyString = process.argv[3];

  if (!keyString) {
    console.log('\n❌ Please provide a key to validate\n');
    console.log('Usage: npm run storage:validate-key <key>\n');
    process.exit(1);
  }

  console.log('\n🔐 Validating Encryption Key\n');
  const isValid = validateEncryptionKey(keyString);

  if (isValid) {
    console.log('✅ Key is valid (256-bit AES)\n');
  } else {
    console.log('❌ Key is invalid. Must be 64 hex characters (32 bytes)\n');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
📦 Storage Setup CLI Tool

Usage: npm run storage:<command>

Commands:
  init              Initialize object storage and set up policies
  verify            Verify object storage configuration and connection
  status            Show current storage status
  generate-key      Generate a new encryption key
  validate-key      Validate an encryption key
  help              Show this help message

Environment Variables Required:
  OBJECT_STORAGE_PROVIDER         aws-s3 or cloudflare-r2 (default: aws-s3)
  OBJECT_STORAGE_BUCKET           S3 bucket name
  OBJECT_STORAGE_REGION           AWS region (default: us-east-1)
  OBJECT_STORAGE_ACCESS_KEY_ID    AWS access key
  OBJECT_STORAGE_SECRET_ACCESS_KEY AWS secret key
  OBJECT_STORAGE_ENDPOINT         Custom endpoint (optional, required for R2)
  ENCRYPTION_KEY                  256-bit encryption key (hex format)

Examples:
  npm run storage:init
  npm run storage:verify
  npm run storage:status
  npm run storage:generate-key
  npm run storage:validate-key abc123...

For AWS S3:
  OBJECT_STORAGE_PROVIDER=aws-s3
  OBJECT_STORAGE_BUCKET=my-bucket
  OBJECT_STORAGE_REGION=us-east-1
  OBJECT_STORAGE_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
  OBJECT_STORAGE_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

For Cloudflare R2:
  OBJECT_STORAGE_PROVIDER=cloudflare-r2
  OBJECT_STORAGE_BUCKET=my-bucket
  OBJECT_STORAGE_REGION=auto
  OBJECT_STORAGE_ENDPOINT=https://abc123.r2.cloudflarestorage.com
  OBJECT_STORAGE_ACCESS_KEY_ID=your_access_key
  OBJECT_STORAGE_SECRET_ACCESS_KEY=your_secret_key
`);
}

main();
