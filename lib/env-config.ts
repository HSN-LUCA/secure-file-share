/**
 * Environment-specific configuration
 * Provides different settings for development, staging, and production
 */

import { getEnv } from './env';

export type Environment = 'development' | 'staging' | 'production';

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfig {
  // Security
  enableCors: boolean;
  corsOrigins: string[];
  enableRateLimiting: boolean;
  enableCaptcha: boolean;
  enableVirusScanning: boolean;

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableDetailedLogging: boolean;
  enableErrorTracking: boolean;

  // Performance
  enableCaching: boolean;
  cacheTtl: number; // in seconds
  enableCompression: boolean;

  // Database
  enableConnectionPooling: boolean;
  connectionPoolSize: number;
  enableQueryLogging: boolean;

  // File Upload
  maxFileSize: number;
  enableVirusScanningBeforeUpload: boolean;
  enableEncryption: boolean;

  // API
  enableApiDocumentation: boolean;
  enableApiRateLimiting: boolean;
  apiRateLimitPerMinute: number;

  // Monitoring
  enableMonitoring: boolean;
  enableMetrics: boolean;
  enableHealthChecks: boolean;

  // Features
  enablePayments: boolean;
  enableUserAccounts: boolean;
  enableAnalytics: boolean;
}

/**
 * Development environment configuration
 */
const developmentConfig: EnvironmentConfig = {
  enableCors: true,
  corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  enableRateLimiting: false, // Disabled for easier testing
  enableCaptcha: false, // Disabled for easier testing
  enableVirusScanning: false, // Disabled for faster testing

  logLevel: 'debug',
  enableDetailedLogging: true,
  enableErrorTracking: false,

  enableCaching: false, // Disabled for development
  cacheTtl: 0,
  enableCompression: false,

  enableConnectionPooling: true,
  connectionPoolSize: 5,
  enableQueryLogging: true,

  maxFileSize: 100 * 1024 * 1024, // 100MB
  enableVirusScanningBeforeUpload: false,
  enableEncryption: true,

  enableApiDocumentation: true,
  enableApiRateLimiting: false,
  apiRateLimitPerMinute: 1000,

  enableMonitoring: false,
  enableMetrics: false,
  enableHealthChecks: true,

  enablePayments: false, // Optional for MVP
  enableUserAccounts: false, // Optional for MVP
  enableAnalytics: false, // Optional for MVP
};

/**
 * Staging environment configuration
 */
const stagingConfig: EnvironmentConfig = {
  enableCors: true,
  corsOrigins: ['https://staging.example.com'],
  enableRateLimiting: true,
  enableCaptcha: true,
  enableVirusScanning: true,

  logLevel: 'info',
  enableDetailedLogging: true,
  enableErrorTracking: true,

  enableCaching: true,
  cacheTtl: 300, // 5 minutes
  enableCompression: true,

  enableConnectionPooling: true,
  connectionPoolSize: 20,
  enableQueryLogging: false,

  maxFileSize: 1024 * 1024 * 1024, // 1GB
  enableVirusScanningBeforeUpload: true,
  enableEncryption: true,

  enableApiDocumentation: true,
  enableApiRateLimiting: true,
  apiRateLimitPerMinute: 100,

  enableMonitoring: true,
  enableMetrics: true,
  enableHealthChecks: true,

  enablePayments: true,
  enableUserAccounts: true,
  enableAnalytics: true,
};

/**
 * Production environment configuration
 */
const productionConfig: EnvironmentConfig = {
  enableCors: true,
  corsOrigins: ['https://example.com', 'https://www.example.com'],
  enableRateLimiting: true,
  enableCaptcha: true,
  enableVirusScanning: true,

  logLevel: 'warn',
  enableDetailedLogging: false,
  enableErrorTracking: true,

  enableCaching: true,
  cacheTtl: 600, // 10 minutes
  enableCompression: true,

  enableConnectionPooling: true,
  connectionPoolSize: 50,
  enableQueryLogging: false,

  maxFileSize: 1024 * 1024 * 1024, // 1GB
  enableVirusScanningBeforeUpload: true,
  enableEncryption: true,

  enableApiDocumentation: false,
  enableApiRateLimiting: true,
  apiRateLimitPerMinute: 60,

  enableMonitoring: true,
  enableMetrics: true,
  enableHealthChecks: true,

  enablePayments: true,
  enableUserAccounts: true,
  enableAnalytics: true,
};

/**
 * Gets environment-specific configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = getEnv();
  const nodeEnv = env.NODE_ENV;

  switch (nodeEnv) {
    case 'development':
      return developmentConfig;
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      return developmentConfig;
  }
}

/**
 * Gets a specific configuration value
 */
export function getConfig<K extends keyof EnvironmentConfig>(
  key: K
): EnvironmentConfig[K] {
  return getEnvironmentConfig()[key];
}

/**
 * Checks if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof EnvironmentConfig): boolean {
  const config = getEnvironmentConfig();
  const value = config[feature];
  return typeof value === 'boolean' ? value : false;
}

/**
 * Gets all environment-specific configuration
 */
export function getAllConfig() {
  const env = getEnv();
  const config = getEnvironmentConfig();

  return {
    environment: env.NODE_ENV,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    config,
  };
}
