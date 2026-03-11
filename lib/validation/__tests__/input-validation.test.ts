/**
 * Input Validation & Sanitization Tests
 * Unit tests for all validation and sanitization functions
 */

import {
  validateShareCode,
  sanitizeShareCode,
  validateFileName,
  sanitizeFileName,
  validateFileSize,
  validateCaptchaToken,
  sanitizeCaptchaToken,
  validateIPAddress,
  validateEmail,
  sanitizeEmail,
  escapeHtmlEntities,
  sanitizeString,
  sanitizeUserInput,
  validateNonEmptyString,
  validatePositiveInteger,
  validateEnum,
  validateFields,
} from '../input-validation';

describe('Input Validation & Sanitization', () => {
  // ========================================================================
  // SHARE CODE VALIDATION & SANITIZATION
  // ========================================================================

  describe('Share Code Validation', () => {
    describe('validateShareCode', () => {
      it('should accept valid 6-digit share codes', () => {
        const result = validateShareCode('123456');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept share codes with leading zeros', () => {
        const result = validateShareCode('000001');
        expect(result.valid).toBe(true);
      });

      it('should reject codes with less than 6 digits', () => {
        const result = validateShareCode('12345');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('exactly 6 digits');
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
        const result = validateShareCode(123456 as any);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a string');
      });

      it('should reject null or undefined', () => {
        expect(validateShareCode(null as any).valid).toBe(false);
        expect(validateShareCode(undefined as any).valid).toBe(false);
      });
    });

    describe('sanitizeShareCode', () => {
      it('should extract digits from mixed input', () => {
        expect(sanitizeShareCode('12a34b56')).toBe('123456');
      });

      it('should handle codes with spaces', () => {
        expect(sanitizeShareCode('123 456')).toBe('123456');
      });

      it('should limit to 6 digits', () => {
        expect(sanitizeShareCode('12345678').length).toBeLessThanOrEqual(6);
      });

      it('should return empty string for non-numeric input', () => {
        expect(sanitizeShareCode('abcdef')).toBe('');
      });
    });
  });

  // ========================================================================
  // FILE NAME VALIDATION & SANITIZATION
  // ========================================================================

  describe('File Name Validation', () => {
    describe('validateFileName', () => {
      it('should accept valid file names', () => {
        const result = validateFileName('document.pdf');
        expect(result.valid).toBe(true);
      });

      it('should accept file names with spaces', () => {
        const result = validateFileName('my document.pdf');
        expect(result.valid).toBe(true);
      });

      it('should accept file names with special characters', () => {
        const result = validateFileName('file-name_2024.pdf');
        expect(result.valid).toBe(true);
      });

      it('should reject empty file names', () => {
        const result = validateFileName('');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('cannot be empty');
      });

      it('should reject file names exceeding 255 characters', () => {
        const longName = 'a'.repeat(300) + '.pdf';
        const result = validateFileName(longName);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('255 characters');
      });

      it('should reject file names with null bytes', () => {
        const result = validateFileName('file\0.pdf');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });

      it('should reject path traversal attempts with ../', () => {
        const result = validateFileName('../../../etc/passwd');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalid path characters');
      });

      it('should reject path traversal attempts with ..\\', () => {
        const result = validateFileName('..\\..\\windows\\system32');
        expect(result.valid).toBe(false);
      });

      it('should reject file names with forward slashes', () => {
        const result = validateFileName('folder/file.pdf');
        expect(result.valid).toBe(false);
      });

      it('should reject file names with backslashes', () => {
        const result = validateFileName('folder\\file.pdf');
        expect(result.valid).toBe(false);
      });

      it('should reject non-string input', () => {
        const result = validateFileName(123 as any);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a string');
      });
    });

    describe('sanitizeFileName', () => {
      it('should remove path traversal sequences', () => {
        const sanitized = sanitizeFileName('../../../etc/passwd');
        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('/');
      });

      it('should replace path separators with underscores', () => {
        const sanitized = sanitizeFileName('folder/file.pdf');
        expect(sanitized).not.toContain('/');
        expect(sanitized).toContain('_');
      });

      it('should remove null bytes', () => {
        const sanitized = sanitizeFileName('file\0.pdf');
        expect(sanitized).not.toContain('\0');
      });

      it('should trim whitespace', () => {
        expect(sanitizeFileName('  document.pdf  ')).toBe('document.pdf');
      });

      it('should remove leading dots', () => {
        const sanitized = sanitizeFileName('...hidden.pdf');
        expect(sanitized).not.toMatch(/^\.+/);
      });

      it('should limit to 255 characters', () => {
        const longName = 'a'.repeat(300) + '.pdf';
        const sanitized = sanitizeFileName(longName);
        expect(sanitized.length).toBeLessThanOrEqual(255);
      });

      it('should preserve file extension', () => {
        const sanitized = sanitizeFileName('my document.pdf');
        expect(sanitized).toContain('.pdf');
      });

      it('should handle complex path traversal', () => {
        const sanitized = sanitizeFileName('..\\..\\..\\windows\\system32\\cmd.exe');
        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('\\');
        expect(sanitized).not.toContain('/');
      });
    });
  });

  // ========================================================================
  // FILE SIZE VALIDATION
  // ========================================================================

  describe('File Size Validation', () => {
    describe('validateFileSize', () => {
      it('should accept files within limit', () => {
        const result = validateFileSize(50 * 1024 * 1024);
        expect(result.valid).toBe(true);
      });

      it('should accept files at exact limit', () => {
        const result = validateFileSize(100 * 1024 * 1024);
        expect(result.valid).toBe(true);
      });

      it('should reject files exceeding limit', () => {
        const result = validateFileSize(150 * 1024 * 1024);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('100MB');
      });

      it('should reject zero-sized files', () => {
        const result = validateFileSize(0);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('greater than 0');
      });

      it('should reject negative file sizes', () => {
        const result = validateFileSize(-1024);
        expect(result.valid).toBe(false);
      });

      it('should accept custom max size', () => {
        const result = validateFileSize(500 * 1024 * 1024, 1024 * 1024 * 1024);
        expect(result.valid).toBe(true);
      });

      it('should reject non-number input', () => {
        const result = validateFileSize('1024' as any);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a number');
      });
    });
  });

  // ========================================================================
  // CAPTCHA TOKEN VALIDATION & SANITIZATION
  // ========================================================================

  describe('CAPTCHA Token Validation', () => {
    describe('validateCaptchaToken', () => {
      it('should accept valid CAPTCHA tokens', () => {
        const result = validateCaptchaToken('valid-token-string');
        expect(result.valid).toBe(true);
      });

      it('should accept long tokens', () => {
        const longToken = 'a'.repeat(500);
        const result = validateCaptchaToken(longToken);
        expect(result.valid).toBe(true);
      });

      it('should reject empty tokens', () => {
        const result = validateCaptchaToken('');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('cannot be empty');
      });

      it('should reject tokens exceeding 1000 characters', () => {
        const longToken = 'a'.repeat(1001);
        const result = validateCaptchaToken(longToken);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('too long');
      });

      it('should reject non-string input', () => {
        const result = validateCaptchaToken(12345 as any);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a string');
      });
    });

    describe('sanitizeCaptchaToken', () => {
      it('should trim whitespace', () => {
        expect(sanitizeCaptchaToken('  token  ')).toBe('token');
      });

      it('should limit to 1000 characters', () => {
        const longToken = 'a'.repeat(1500);
        const sanitized = sanitizeCaptchaToken(longToken);
        expect(sanitized.length).toBeLessThanOrEqual(1000);
      });
    });
  });

  // ========================================================================
  // IP ADDRESS VALIDATION
  // ========================================================================

  describe('IP Address Validation', () => {
    describe('validateIPAddress', () => {
      it('should accept valid IPv4 addresses', () => {
        expect(validateIPAddress('192.168.1.1').valid).toBe(true);
        expect(validateIPAddress('127.0.0.1').valid).toBe(true);
        expect(validateIPAddress('255.255.255.255').valid).toBe(true);
      });

      it('should reject invalid IPv4 addresses', () => {
        expect(validateIPAddress('256.1.1.1').valid).toBe(false);
        expect(validateIPAddress('192.168.1').valid).toBe(false);
        expect(validateIPAddress('192.168.1.1.1').valid).toBe(false);
      });

      it('should accept valid IPv6 addresses', () => {
        expect(validateIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334').valid).toBe(true);
        expect(validateIPAddress('::1').valid).toBe(true);
      });

      it('should reject empty IP addresses', () => {
        const result = validateIPAddress('');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('cannot be empty');
      });

      it('should reject non-string input', () => {
        const result = validateIPAddress(192 as any);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be a string');
      });
    });
  });

  // ========================================================================
  // EMAIL VALIDATION & SANITIZATION
  // ========================================================================

  describe('Email Validation', () => {
    describe('validateEmail', () => {
      it('should accept valid email addresses', () => {
        expect(validateEmail('user@example.com').valid).toBe(true);
        expect(validateEmail('test.user+tag@example.co.uk').valid).toBe(true);
      });

      it('should reject invalid email addresses', () => {
        expect(validateEmail('invalid-email').valid).toBe(false);
        expect(validateEmail('user@').valid).toBe(false);
        expect(validateEmail('@example.com').valid).toBe(false);
      });

      it('should reject empty emails', () => {
        const result = validateEmail('');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('cannot be empty');
      });

      it('should reject emails exceeding 255 characters', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        const result = validateEmail(longEmail);
        expect(result.valid).toBe(false);
      });

      it('should reject non-string input', () => {
        const result = validateEmail(123 as any);
        expect(result.valid).toBe(false);
      });
    });

    describe('sanitizeEmail', () => {
      it('should trim whitespace', () => {
        expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
      });

      it('should convert to lowercase', () => {
        expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
      });

      it('should limit to 255 characters', () => {
        const longEmail = 'a'.repeat(300) + '@example.com';
        const sanitized = sanitizeEmail(longEmail);
        expect(sanitized.length).toBeLessThanOrEqual(255);
      });
    });
  });

  // ========================================================================
  // STRING SANITIZATION (XSS PREVENTION)
  // ========================================================================

  describe('String Sanitization', () => {
    describe('escapeHtmlEntities', () => {
      it('should escape HTML special characters', () => {
        expect(escapeHtmlEntities('<script>alert("xss")</script>')).toContain('&lt;');
        expect(escapeHtmlEntities('<script>alert("xss")</script>')).toContain('&gt;');
      });

      it('should escape ampersands', () => {
        expect(escapeHtmlEntities('Tom & Jerry')).toBe('Tom &amp; Jerry');
      });

      it('should escape quotes', () => {
        expect(escapeHtmlEntities('He said "hello"')).toContain('&quot;');
      });

      it('should escape single quotes', () => {
        expect(escapeHtmlEntities("It's fine")).toContain('&#39;');
      });

      it('should escape forward slashes', () => {
        expect(escapeHtmlEntities('</script>')).toContain('&#x2F;');
      });

      it('should handle multiple special characters', () => {
        const escaped = escapeHtmlEntities('<div class="test">Content & "quotes"</div>');
        expect(escaped).not.toContain('<div');
        expect(escaped).not.toContain('</div>');
        expect(escaped).toContain('&amp;');
        expect(escaped).toContain('&quot;');
      });
    });

    describe('sanitizeString', () => {
      it('should trim whitespace', () => {
        expect(sanitizeString('  hello  ')).toBe('hello');
      });

      it('should escape HTML entities', () => {
        const sanitized = sanitizeString('<script>alert("xss")</script>');
        expect(sanitized).not.toContain('<script>');
      });

      it('should remove null bytes', () => {
        const sanitized = sanitizeString('hello\0world');
        expect(sanitized).not.toContain('\0');
      });

      it('should limit to max length', () => {
        const longString = 'a'.repeat(2000);
        const sanitized = sanitizeString(longString, 1000);
        expect(sanitized.length).toBeLessThanOrEqual(1000);
      });

      it('should handle XSS attempts', () => {
        const xssAttempt = '<img src=x onerror="alert(\'xss\')">';
        const sanitized = sanitizeString(xssAttempt);
        expect(sanitized).not.toContain('<img');
        expect(sanitized).toContain('&lt;img');
        expect(sanitized).toContain('&quot;');
      });
    });

    describe('sanitizeUserInput', () => {
      it('should trim whitespace', () => {
        expect(sanitizeUserInput('  hello  ')).toBe('hello');
      });

      it('should remove null bytes', () => {
        const sanitized = sanitizeUserInput('hello\0world');
        expect(sanitized).not.toContain('\0');
      });

      it('should remove control characters', () => {
        const input = 'hello\x00\x01\x02world';
        const sanitized = sanitizeUserInput(input);
        expect(sanitized).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
      });

      it('should preserve newlines and tabs', () => {
        const input = 'hello\nworld\ttab';
        const sanitized = sanitizeUserInput(input);
        expect(sanitized).toContain('\n');
        expect(sanitized).toContain('\t');
      });

      it('should limit to max length', () => {
        const longString = 'a'.repeat(2000);
        const sanitized = sanitizeUserInput(longString, 1000);
        expect(sanitized.length).toBeLessThanOrEqual(1000);
      });
    });
  });

  // ========================================================================
  // GENERIC VALIDATION HELPERS
  // ========================================================================

  describe('Generic Validation Helpers', () => {
    describe('validateNonEmptyString', () => {
      it('should accept non-empty strings', () => {
        const result = validateNonEmptyString('hello', 'test');
        expect(result.valid).toBe(true);
      });

      it('should reject empty strings', () => {
        const result = validateNonEmptyString('', 'test');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('cannot be empty');
      });

      it('should reject whitespace-only strings', () => {
        const result = validateNonEmptyString('   ', 'test');
        expect(result.valid).toBe(false);
      });

      it('should reject non-string input', () => {
        const result = validateNonEmptyString(123 as any, 'test');
        expect(result.valid).toBe(false);
      });

      it('should enforce max length', () => {
        const result = validateNonEmptyString('a'.repeat(2000), 'test', 1000);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('1000 characters');
      });
    });

    describe('validatePositiveInteger', () => {
      it('should accept positive integers', () => {
        const result = validatePositiveInteger(42, 'count');
        expect(result.valid).toBe(true);
      });

      it('should reject zero', () => {
        const result = validatePositiveInteger(0, 'count');
        expect(result.valid).toBe(false);
      });

      it('should reject negative integers', () => {
        const result = validatePositiveInteger(-5, 'count');
        expect(result.valid).toBe(false);
      });

      it('should reject non-integers', () => {
        const result = validatePositiveInteger(3.14, 'count');
        expect(result.valid).toBe(false);
      });

      it('should enforce max value', () => {
        const result = validatePositiveInteger(150, 'count', 100);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('100');
      });
    });

    describe('validateEnum', () => {
      it('should accept valid enum values', () => {
        const result = validateEnum('free', ['free', 'paid', 'enterprise'], 'plan');
        expect(result.valid).toBe(true);
      });

      it('should reject invalid enum values', () => {
        const result = validateEnum('invalid', ['free', 'paid', 'enterprise'], 'plan');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('must be one of');
      });

      it('should handle numeric enum values', () => {
        const result = validateEnum(1, ['0', '1', '2'], 'status');
        expect(result.valid).toBe(true);
      });
    });
  });

  // ========================================================================
  // BATCH VALIDATION
  // ========================================================================

  describe('Batch Validation', () => {
    describe('validateFields', () => {
      it('should validate all fields successfully', () => {
        const result = validateFields([
          {
            name: 'email',
            value: 'user@example.com',
            validator: validateEmail,
          },
          {
            name: 'share_code',
            value: '123456',
            validator: validateShareCode,
          },
        ]);
        expect(result.valid).toBe(true);
      });

      it('should fail on first invalid field', () => {
        const result = validateFields([
          {
            name: 'email',
            value: 'invalid-email',
            validator: validateEmail,
          },
          {
            name: 'share_code',
            value: '123456',
            validator: validateShareCode,
          },
        ]);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('email');
      });

      it('should include field name in error message', () => {
        const result = validateFields([
          {
            name: 'file_size',
            value: -100,
            validator: (v) => validateFileSize(v),
          },
        ]);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('file_size');
      });
    });
  });
});
