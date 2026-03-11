#!/usr/bin/env node

/**
 * Database Setup CLI Script
 * Provides commands for database initialization and management
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

import {
  initializeDatabase,
  verifyDatabaseConnection,
  checkTablesExist,
  getDatabaseStats,
} from '../lib/db/setup';

/**
 * Print colored output
 */
function log(message: string, color: 'green' | 'red' | 'yellow' | 'blue' = 'blue') {
  const colors: Record<string, string> = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
  };

  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Main CLI handler
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'init':
        await handleInit();
        break;

      case 'verify':
        await handleVerify();
        break;

      case 'check':
        await handleCheck();
        break;

      case 'stats':
        await handleStats();
        break;

      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;

      default:
        log('Unknown command. Use "npm run db:help" for available commands.', 'red');
        process.exit(1);
    }
  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : String(error)}`, 'red');
    process.exit(1);
  }
}

/**
 * Initialize database
 */
async function handleInit() {
  log('Initializing database...', 'blue');

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  // Verify connection first
  log('Verifying database connection...', 'blue');
  const connected = await verifyDatabaseConnection();

  if (!connected) {
    throw new Error('Failed to connect to database');
  }

  log('✓ Database connection verified', 'green');

  // Initialize schema
  log('Creating database schema...', 'blue');
  await initializeDatabase();

  log('✓ Database initialized successfully', 'green');

  // Check tables
  const tables = await checkTablesExist();
  log('\nTable Status:', 'blue');
  log(`  users: ${tables.users ? '✓' : '✗'}`, tables.users ? 'green' : 'red');
  log(`  files: ${tables.files ? '✓' : '✗'}`, tables.files ? 'green' : 'red');
  log(`  downloads: ${tables.downloads ? '✓' : '✗'}`, tables.downloads ? 'green' : 'red');
  log(`  analytics: ${tables.analytics ? '✓' : '✗'}`, tables.analytics ? 'green' : 'red');

  const allTablesExist = Object.values(tables).every((v) => v);
  if (!allTablesExist) {
    throw new Error('Some tables were not created successfully');
  }

  log('\n✓ All tables created successfully', 'green');
}

/**
 * Verify database connection
 */
async function handleVerify() {
  log('Verifying database connection...', 'blue');

  const connected = await verifyDatabaseConnection();

  if (connected) {
    log('✓ Database connection verified', 'green');
  } else {
    throw new Error('Database connection failed');
  }
}

/**
 * Check table existence
 */
async function handleCheck() {
  log('Checking database tables...', 'blue');

  const tables = await checkTablesExist();

  log('\nTable Status:', 'blue');
  log(`  users: ${tables.users ? '✓' : '✗'}`, tables.users ? 'green' : 'red');
  log(`  files: ${tables.files ? '✓' : '✗'}`, tables.files ? 'green' : 'red');
  log(`  downloads: ${tables.downloads ? '✓' : '✗'}`, tables.downloads ? 'green' : 'red');
  log(`  analytics: ${tables.analytics ? '✓' : '✗'}`, tables.analytics ? 'green' : 'red');

  const allTablesExist = Object.values(tables).every((v) => v);

  if (allTablesExist) {
    log('\n✓ All tables exist', 'green');
  } else {
    log('\n✗ Some tables are missing', 'red');
    log('Run "npm run db:init" to create missing tables', 'yellow');
  }
}

/**
 * Get database statistics
 */
async function handleStats() {
  log('Fetching database statistics...', 'blue');

  const stats = await getDatabaseStats();

  log('\nDatabase Statistics:', 'blue');
  log(`  Users: ${stats.userCount}`, 'blue');
  log(`  Files: ${stats.fileCount}`, 'blue');
  log(`  Downloads: ${stats.downloadCount}`, 'blue');
  log(`  Analytics Events: ${stats.analyticsCount}`, 'blue');

  const totalRecords =
    stats.userCount + stats.fileCount + stats.downloadCount + stats.analyticsCount;
  log(`\n  Total Records: ${totalRecords}`, 'blue');
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Database Management CLI

Usage:
  npm run db:init      Initialize database schema and tables
  npm run db:verify    Verify database connection
  npm run db:check     Check if all tables exist
  npm run db:stats     Get database statistics
  npm run db:help      Show this help message

Environment Variables Required:
  NEXT_PUBLIC_SUPABASE_URL       Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY  Supabase anonymous key
  SUPABASE_SERVICE_ROLE_KEY      Supabase service role key
  DATABASE_URL                   PostgreSQL connection string (optional)

Examples:
  npm run db:init                # Initialize database
  npm run db:verify              # Check connection
  npm run db:check               # Check tables
  npm run db:stats               # Get statistics

For more information, see DATABASE_SETUP.md
  `);
}

// Run CLI
main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
