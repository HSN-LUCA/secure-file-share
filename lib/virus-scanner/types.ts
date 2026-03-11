/**
 * Virus Scanner Types
 * Type definitions for virus scanning functionality
 */

/**
 * Virus scan result
 */
export interface VirusScanResult {
  isClean: boolean;
  threat?: string;
  engine?: string;
  scanTime: number;
  timestamp: Date;
}

/**
 * Virus scanner configuration
 */
export interface VirusScannerConfig {
  provider: 'clamav' | 'virustotal' | 'mock';
  enabled: boolean;
  timeout: number; // milliseconds
  maxFileSize: number; // bytes
}

/**
 * ClamAV configuration
 */
export interface ClamAVConfig extends VirusScannerConfig {
  provider: 'clamav';
  host: string;
  port: number;
}

/**
 * VirusTotal configuration
 */
export interface VirusTotalConfig extends VirusScannerConfig {
  provider: 'virustotal';
  apiKey: string;
  apiUrl: string;
}

/**
 * Mock scanner configuration (for testing)
 */
export interface MockScannerConfig extends VirusScannerConfig {
  provider: 'mock';
  infectRate: number; // 0-1, probability of marking file as infected
}

/**
 * Virus scanner interface
 */
export interface IVirusScanner {
  scan(fileData: Buffer, fileName: string): Promise<VirusScanResult>;
  isHealthy(): Promise<boolean>;
  getConfig(): VirusScannerConfig;
}

/**
 * VirusTotal API response
 */
export interface VirusTotalResponse {
  data: {
    attributes: {
      last_analysis_stats: {
        malicious: number;
        suspicious: number;
        undetected: number;
      };
      last_analysis_results?: Record<string, {
        category: string;
        engine_name: string;
        result: string;
      }>;
    };
  };
}

/**
 * ClamAV scan response
 */
export interface ClamAVResponse {
  ok: boolean;
  filename: string;
  isInfected: boolean;
  viruses: string[];
}
