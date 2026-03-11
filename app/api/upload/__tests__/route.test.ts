/**
 * Upload API Tests
 * Unit tests for POST /api/upload endpoint
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('@/lib/validation/file-validation');
jest.mock('@/lib/validation/input-validation');
jest.mock('@/lib/share-code');
jest.mock('@/lib/storage/utils');
jest.mock('@/lib/db/queries');
jest.mock('@/lib/captcha/verifier');
jest.mock('@/lib/middleware/rate-limiting');
jest.mock('@/lib/middleware/bot-detection');
jest.mock('@/lib/env');

describe('Upload API - POST /api/upload', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: new Map([
        ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'],
        ['x-forwarded-for', '192.168.1.1'],
      ]),
      formData: jest.fn(),
    };
  });

  describe('Successful Upload', () => {
    it('should successfully upload a valid file', async () => {
      const mockFile = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('captcha_token', 'valid_token');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      // Mock successful validations
      const { validateFile } = require('@/lib/validation/file-validation');
      validateFile.mockReturnValue({ valid: true });

      const { verifyCaptchaToken } = require('@/lib/captcha/verifier');
      verifyCaptchaToken.mockResolvedValue({ success: true });

      const { generateShareCode } = require('@/lib/share-code');
      generateShareCode.mockReturnValue('123456');

      const { uploadFile } = require('@/lib/storage/utils');
      uploadFile.mockResolvedValue({ key: 'test-key' });

      const { createFile } = require('@/lib/db/queries');
      createFile.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        expires_at: new Date(),
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.shareCode).toBe('123456');
      expect(data.fileName).toBe('document.pdf');
    });

    it('should handle custom storage duration', async () => {
      const mockFile = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('captcha_token', 'valid_token');
      formData.append('storage_duration', '60');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      // Mock successful validations
      const { validateFile } = require('@/lib/validation/file-validation');
      validateFile.mockReturnValue({ valid: true });

      const { verifyCaptchaToken } = require('@/lib/captcha/verifier');
      verifyCaptchaToken.mockResolvedValue({ success: true });

      const { generateShareCode } = require('@/lib/share-code');
      generateShareCode.mockReturnValue('654321');

      const { uploadFile } = require('@/lib/storage/utils');
      uploadFile.mockResolvedValue({ key: 'test-key' });

      const { createFile } = require('@/lib/db/queries');
      createFile.mockResolvedValue({
        id: 'file-id',
        share_code: '654321',
        expires_at: new Date(),
        storage_duration_minutes: 60,
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing file', async () => {
      const formData = new FormData();
      formData.append('captcha_token', 'valid_token');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('file');
    });

    it('should reject missing CAPTCHA token', async () => {
      const mockFile = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('CAPTCHA');
    });

    it('should reject invalid file type', async () => {
      const mockFile = new File(['test content'], 'script.exe', {
        type: 'application/x-msdownload',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('captcha_token', 'valid_token');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      const { validateFile } = require('@/lib/validation/file-validation');
      validateFile.mockReturnValue({
        valid: false,
        error: 'File type not allowed',
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not allowed');
    });

    it('should reject oversized file', async () => {
      const mockFile = new File(['x'.repeat(150 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('captcha_token', 'valid_token');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      const { validateFile } = require('@/lib/validation/file-validation');
      validateFile.mockReturnValue({
        valid: false,
        error: 'File size exceeds limit',
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('exceeds');
    });

    it('should reject invalid CAPTCHA token', async () => {
      const mockFile = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('captcha_token', 'invalid_token');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      const { validateFile } = require('@/lib/validation/file-validation');
      validateFile.mockReturnValue({ valid: true });

      const { verifyCaptchaToken } = require('@/lib/captcha/verifier');
      verifyCaptchaToken.mockResolvedValue({
        success: false,
        error: 'Invalid token',
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should reject request when rate limit exceeded', async () => {
      const mockFile = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('captcha_token', 'valid_token');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      const { createRateLimitingMiddleware } = require('@/lib/middleware/rate-limiting');
      const mockMiddleware = {
        checkUploadLimit: jest.fn().mockResolvedValue({
          allowed: false,
          reason: 'Rate limit exceeded',
        }),
      };
      createRateLimitingMiddleware.mockReturnValue(mockMiddleware);

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
    });
  });

  describe('Bot Detection', () => {
    it('should reject request from detected bot', async () => {
      const mockFile = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('captcha_token', 'valid_token');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      const { createBotDetectionMiddleware } = require('@/lib/middleware/bot-detection');
      const mockMiddleware = {
        check: jest.fn().mockResolvedValue({
          allowed: false,
          reason: 'Suspicious activity detected',
        }),
      };
      createBotDetectionMiddleware.mockReturnValue(mockMiddleware);

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage upload failure', async () => {
      const mockFile = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('captcha_token', 'valid_token');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      const { validateFile } = require('@/lib/validation/file-validation');
      validateFile.mockReturnValue({ valid: true });

      const { verifyCaptchaToken } = require('@/lib/captcha/verifier');
      verifyCaptchaToken.mockResolvedValue({ success: true });

      const { uploadFile } = require('@/lib/storage/utils');
      uploadFile.mockRejectedValue(new Error('Storage error'));

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('error');
    });

    it('should handle database error', async () => {
      const mockFile = new File(['test content'], 'document.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('captcha_token', 'valid_token');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      const { validateFile } = require('@/lib/validation/file-validation');
      validateFile.mockReturnValue({ valid: true });

      const { verifyCaptchaToken } = require('@/lib/captcha/verifier');
      verifyCaptchaToken.mockResolvedValue({ success: true });

      const { generateShareCode } = require('@/lib/share-code');
      generateShareCode.mockReturnValue('123456');

      const { uploadFile } = require('@/lib/storage/utils');
      uploadFile.mockResolvedValue({ key: 'test-key' });

      const { createFile } = require('@/lib/db/queries');
      createFile.mockRejectedValue(new Error('Database error'));

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('File Name Sanitization', () => {
    it('should sanitize file names with path traversal attempts', async () => {
      const mockFile = new File(['test content'], '../../../etc/passwd', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('captcha_token', 'valid_token');

      mockRequest.formData = jest.fn().mockResolvedValue(formData);

      const { validateFile } = require('@/lib/validation/file-validation');
      validateFile.mockReturnValue({ valid: true });

      const { verifyCaptchaToken } = require('@/lib/captcha/verifier');
      verifyCaptchaToken.mockResolvedValue({ success: true });

      const { generateShareCode } = require('@/lib/share-code');
      generateShareCode.mockReturnValue('123456');

      const { uploadFile } = require('@/lib/storage/utils');
      uploadFile.mockResolvedValue({ key: 'test-key' });

      const { createFile } = require('@/lib/db/queries');
      createFile.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        expires_at: new Date(),
      });

      const response = await POST(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Verify that the file name was sanitized
      expect(data.fileName).not.toContain('..');
    });
  });
});
