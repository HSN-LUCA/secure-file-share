#!/usr/bin/env node

/**
 * Environment variable validation script (Node.js version)
 * Validates that all required environment variables are set and valid
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function print(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Required environment variables
const requiredVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OBJECT_STORAGE_BUCKET',
  'OBJECT_STORAGE_REGION',
  'OBJECT_STORAGE_ACCESS_KEY_ID',
  'OBJECT_STORAGE_SECRET_ACCESS_KEY',
  'ENCRYPTION_KEY',
  'VIRUS_SCANNER_API_KEY',
  'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
  'RECAPTCHA_SECRET_KEY',
  'JWT_SECRET',
];

// Optional environment variables
const optionalVars = [
  'DATABASE_URL',
  'OBJECT_STORAGE_ENDPOINT',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'REDIS_URL',
];

// Validation rules
const validationRules = {
  NODE_ENV: (value) => ['development', 'staging', 'production'].includes(value),
  NEXT_PUBLIC_APP_URL: (value) => /^https?:\/\/.+/.test(value),
  NEXT_PUBLIC_SUPABASE_URL: (value) => /^https?:\/\/.+/.test(value),
  ENCRYPTION_KEY: (value) => /^[a-f0-9]{64}$/.test(value),
  JWT_SECRET: (value) => value.length >= 32,
};

function validateEnvironment() {
  print('cyan', '\n================================');
  print('cyan', 'Environment Variables Validation');
  print('cyan', '================================\n');

  const errors = [];
  const warnings = [];

  // Check required variables
  print('blue', 'Checking required variables...');
  for (const varName of requiredVars) {
    const value = process.env[varName];

    if (!value) {
      errors.push(`${varName} is required but not set`);
    } else if (validationRules[varName]) {
      if (!validationRules[varName](value)) {
        errors.push(`${varName} has invalid format: ${value}`);
      }
    }
  }

  if (errors.length === 0) {
    print('green', '✓ All required variables are set\n');
  } else {
    print('red', '✗ Required variables validation failed:\n');
    errors.forEach((error) => {
      print('red', `  - ${error}`);
    });
    print('red', '');
  }

  // Check optional variables
  print('blue', 'Checking optional variables...');
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (!value) {
      warnings.push(`${varName} is not set (optional)`);
    }
  }

  if (warnings.length === 0) {
    print('green', '✓ All optional variables are set\n');
  } else {
    print('yellow', '⚠ Optional variables not set:\n');
    warnings.forEach((warning) => {
      print('yellow', `  - ${warning}`);
    });
    print('yellow', '');
  }

  // Display masked environment variables
  print('blue', 'Current environment variables (masked):');
  const sensitiveKeys = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'OBJECT_STORAGE_ACCESS_KEY_ID',
    'OBJECT_STORAGE_SECRET_ACCESS_KEY',
    'ENCRYPTION_KEY',
    'VIRUS_SCANNER_API_KEY',
    'RECAPTCHA_SECRET_KEY',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'REDIS_URL',
    'DATABASE_URL',
  ];

  const allVars = [...requiredVars, ...optionalVars];
  for (const varName of allVars) {
    const value = process.env[varName];
    if (value) {
      if (sensitiveKeys.includes(varName)) {
        print('cyan', `  ${varName}=***${value.slice(-4)}`);
      } else {
        print('cyan', `  ${varName}=${value}`);
      }
    }
  }

  print('cyan', '');

  if (errors.length > 0) {
    print('red', `\n✗ Validation failed with ${errors.length} error(s)\n`);
    process.exit(1);
  } else {
    print('green', '\n✓ All validations passed!\n');
    print('green', 'Your environment is properly configured.\n');
  }
}

// Run validation
validateEnvironment();
