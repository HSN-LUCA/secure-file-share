/**
 * Mock Virus Scanner
 * For testing and development purposes
 */

import { IVirusScanner, VirusScanResult, MockScannerConfig } from './types';

/**
 * Mock Scanner Implementation
 * 
 * Used for testing and development
 * Can be configured to simulate infected files
 */
export class MockScanner implements IVirusScanner {
  private config: MockScannerConfig;
  private lastHealthCheck: Date | null = null;
  private healthy: boolean = true;

  constructor(config: MockScannerConfig) {
    this.config = config;
  }

  /**
   * Scan file for viruses (mock implementation)
   */
  async scan(fileData: Buffer, fileName: string): Promise<VirusScanResult> {
    const startTime = Date.now();

    // Check file size limit first
    if (fileData.length > this.config.maxFileSize) {
      return {
        isClean: false,
        threat: `File exceeds maximum size of ${this.config.maxFileSize} bytes`,
        engine: 'mock',
        scanTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Determine if file should be marked as infected based on infectRate
    const isInfected = Math.random() < this.config.infectRate;

    return {
      isClean: !isInfected,
      threat: isInfected ? 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE!' : undefined,
      engine: 'mock',
      scanTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Check if scanner is healthy
   */
  async isHealthy(): Promise<boolean> {
    this.lastHealthCheck = new Date();
    return this.healthy;
  }

  /**
   * Get scanner configuration
   */
  getConfig(): MockScannerConfig {
    return this.config;
  }

  /**
   * Set infection rate for testing
   */
  setInfectionRate(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('Infection rate must be between 0 and 1');
    }
    this.config.infectRate = rate;
  }

  /**
   * Set health status for testing
   */
  setHealthStatus(healthy: boolean): void {
    this.healthy = healthy;
  }
}

/**
 * Create mock scanner from environment variables
 */
export function createMockScanner(): MockScanner {
  const infectRate = parseFloat(process.env.MOCK_SCANNER_INFECT_RATE || '0');
  const timeout = parseInt(process.env.MOCK_SCANNER_TIMEOUT || '1000', 10);
  const maxFileSize = parseInt(process.env.MOCK_SCANNER_MAX_FILE_SIZE || '104857600', 10); // 100MB

  const config: MockScannerConfig = {
    provider: 'mock',
    enabled: true,
    infectRate,
    timeout,
    maxFileSize,
  };

  return new MockScanner(config);
}
