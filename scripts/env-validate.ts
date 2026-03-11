#!/usr/bin/env ts-node

/**
 * Environment variable validation script
 * Validates that all required environment variables are set and valid
 */

import { validateEnvironment, getMaskedEnv } from '../lib/env';
import { validateSecrets, getMaskedSecrets } from '../lib/secrets';

/**
 * Colors for console output
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Prints colored output
 */
function print(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Main validation function
 */
async function main() {
  print('cyan', '\n================================');
  print('cyan', 'Environment Variables Validation');
  print('cyan', '================================\n');

  // Validate environment variables
  print('blue', 'Validating environment variables...');
  const envValidation = validateEnvironment();

  if (envValidation.valid) {
    print('green', '✓ All environment variables are valid\n');
  } else {
    print('red', '✗ Environment variable validation failed:\n');
    envValidation.errors.forEach((error) => {
      print('red', `  - ${error}`);
    });
    print('red', '\nPlease fix the errors above and try again.\n');
    process.exit(1);
  }

  // Validate secrets
  print('blue', 'Validating secrets...');
  const secretsValidation = validateSecrets();

  if (secretsValidation.valid) {
    print('green', '✓ All secrets are available\n');
  } else {
    print('red', '✗ Secret validation failed:\n');
    secretsValidation.errors.forEach((error) => {
      print('red', `  - ${error}`);
    });
    print('red', '\nPlease fix the errors above and try again.\n');
    process.exit(1);
  }

  // Display masked environment variables
  print('blue', 'Current environment variables (masked):');
  const maskedEnv = getMaskedEnv();
  Object.entries(maskedEnv).forEach(([key, value]) => {
    if (value) {
      print('cyan', `  ${key}=${value}`);
    }
  });

  print('blue', '\nCurrent secrets (masked):');
  const maskedSecrets = getMaskedSecrets();
  Object.entries(maskedSecrets).forEach(([key, value]) => {
    if (value) {
      print('cyan', `  ${key}=${value}`);
    }
  });

  print('green', '\n✓ All validations passed!\n');
  print('green', 'Your environment is properly configured.\n');
}

// Run the validation
main().catch((error) => {
  print('red', `\n✗ Validation error: ${error.message}\n`);
  process.exit(1);
});
