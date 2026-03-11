/**
 * Virus Scanner Factory and Manager
 * Provides unified interface for virus scanning
 */

import { IVirusScanner, VirusScanResult } from './types';
import { ClamAVScanner, createClamAVScanner } from './clamav';
import { VirusTotalScanner, createVirusTotalScanner } from './virustotal';
import { MockScanner, createMockScanner } from './mock';

let scannerInstance: IVirusScanner | null = null;

/**
 * Get or create virus scanner instance
 */
export function getVirusScanner(): IVirusScanner {
  if (scannerInstance) {
    return scannerInstance;
  }

  const provider = process.env.VIRUS_SCANNER_PROVIDER || 'mock';

  switch (provider) {
    case 'clamav':
      scannerInstance = createClamAVScanner();
      break;
    case 'virustotal':
      scannerInstance = createVirusTotalScanner();
      break;
    case 'mock':
    default:
      scannerInstance = createMockScanner();
      break;
  }

  return scannerInstance;
}

/**
 * Scan file for viruses
 */
export async function scanFile(fileData: Buffer, fileName: string): Promise<VirusScanResult> {
  const scanner = getVirusScanner();
  return scanner.scan(fileData, fileName);
}

/**
 * Check if virus scanner is healthy
 */
export async function isVirusScannerHealthy(): Promise<boolean> {
  const scanner = getVirusScanner();
  return scanner.isHealthy();
}

/**
 * Get virus scanner configuration
 */
export function getVirusScannerConfig() {
  const scanner = getVirusScanner();
  return scanner.getConfig();
}

/**
 * Reset scanner instance (for testing)
 */
export function resetScannerInstance(): void {
  scannerInstance = null;
}

// Export types
export type { IVirusScanner, VirusScanResult } from './types';
export { ClamAVScanner, VirusTotalScanner, MockScanner };
