/**
 * File Validation Tests
 * Unit tests for file validation functions
 */

import {
  getFileExtension,
  validateFileExtension,
  validateMimeType,
  validateFileSize,
  validateVideoFileSize,
  validateFile,
  sanitizeFileName,
  validateShareCode,
} from '../file-validation';

describe('File Validation', () => {
  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.PNG')).toBe('png');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('.gitignore')).toBe('gitignore');
    });
  });

  describe('validateFileExtension', () => {
    it('should accept allowed file types', () => {
      const result = validateFileExtension('document.pdf');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject disallowed file types', () => {
      const result = validateFileExtension('script.exe');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject files without extension', () => {
      const result = validateFileExtension('README');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('extension');
    });

    it('should be case-insensitive', () => {
      const result1 = validateFileExtension('document.PDF');
      const result2 = validateFileExtension('document.pdf');
      expect(result1.valid).toBe(result2.valid);
    });
  });

  describe('validateMimeType', () => {
    it('should accept matching MIME types', () => {
      const result = validateMimeType('document.pdf', 'application/pdf');
      expect(result.valid).toBe(true);
    });

    it('should reject mismatched MIME types', () => {
      const result = validateMimeType('document.pdf', 'image/png');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not match');
    });

    it('should handle multiple valid MIME types', () => {
      const result1 = validateMimeType('image.jpg', 'image/jpeg');
      const result2 = validateMimeType('image.jpeg', 'image/jpeg');
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within free plan limit', () => {
      const result = validateFileSize(50 * 1024 * 1024, 'free');
      expect(result.valid).toBe(true);
    });

    it('should reject files exceeding free plan limit', () => {
      const result = validateFileSize(150 * 1024 * 1024, 'free');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should accept larger files for paid plan', () => {
      const result = validateFileSize(500 * 1024 * 1024, 'paid');
      expect(result.valid).toBe(true);
    });

    it('should reject files exceeding paid plan limit', () => {
      const result = validateFileSize(1.5 * 1024 * 1024 * 1024, 'paid');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateVideoFileSize', () => {
    it('should accept videos within 50MB limit', () => {
      const result = validateVideoFileSize(40 * 1024 * 1024);
      expect(result.valid).toBe(true);
    });

    it('should reject videos exceeding 50MB limit', () => {
      const result = validateVideoFileSize(60 * 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('50MB');
    });
  });

  describe('validateFile', () => {
    it('should validate correct file', () => {
      const result = validateFile({
        fileSize: 1024 * 1024,
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        plan: 'free',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject file with invalid extension', () => {
      const result = validateFile({
        fileSize: 1024 * 1024,
        fileName: 'script.exe',
        mimeType: 'application/x-msdownload',
        plan: 'free',
      });
      expect(result.valid).toBe(false);
    });

    it('should reject file with mismatched MIME type', () => {
      const result = validateFile({
        fileSize: 1024 * 1024,
        fileName: 'document.pdf',
        mimeType: 'image/png',
        plan: 'free',
      });
      expect(result.valid).toBe(false);
    });

    it('should reject file exceeding size limit', () => {
      const result = validateFile({
        fileSize: 150 * 1024 * 1024,
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        plan: 'free',
      });
      expect(result.valid).toBe(false);
    });

    it('should validate video files with size limit', () => {
      const result = validateFile({
        fileSize: 40 * 1024 * 1024,
        fileName: 'video.mp4',
        mimeType: 'video/mp4',
        plan: 'free',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject oversized video files', () => {
      const result = validateFile({
        fileSize: 60 * 1024 * 1024,
        fileName: 'video.mp4',
        mimeType: 'video/mp4',
        plan: 'free',
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove path separators', () => {
      expect(sanitizeFileName('../../../etc/passwd')).not.toContain('/');
      expect(sanitizeFileName('..\\..\\windows\\system32')).not.toContain('\\');
    });

    it('should remove null bytes', () => {
      expect(sanitizeFileName('file\0.pdf')).not.toContain('\0');
    });

    it('should remove leading/trailing spaces', () => {
      expect(sanitizeFileName('  document.pdf  ')).toBe('document.pdf');
    });

    it('should limit filename length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      const sanitized = sanitizeFileName(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
    });

    it('should preserve file extension', () => {
      const sanitized = sanitizeFileName('my document.pdf');
      expect(sanitized).toContain('.pdf');
    });

    it('should handle special characters', () => {
      const sanitized = sanitizeFileName('file@#$%.pdf');
      expect(sanitized).toBeTruthy();
    });
  });

  describe('validateShareCode', () => {
    it('should accept valid 6-digit share codes', () => {
      const result = validateShareCode('123456');
      expect(result.valid).toBe(true);
    });

    it('should reject codes with less than 6 digits', () => {
      const result = validateShareCode('12345');
      expect(result.valid).toBe(false);
    });

    it('should reject codes with more than 6 digits', () => {
      const result = validateShareCode('1234567');
      expect(result.valid).toBe(false);
    });

    it('should reject non-numeric codes', () => {
      const result = validateShareCode('12345a');
      expect(result.valid).toBe(false);
    });

    it('should reject empty codes', () => {
      const result = validateShareCode('');
      expect(result.valid).toBe(false);
    });

    it('should reject non-string codes', () => {
      const result = validateShareCode(null as any);
      expect(result.valid).toBe(false);
    });
  });
});
