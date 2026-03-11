/**
 * Download API Tests
 * Unit tests for GET /api/download/:code endpoint
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/validation/file-validation');
jest.mock('@/lib/validation/input-validation');
jest.mock('@/lib/storage/utils');
jest.mock('@/lib/db/queries');
jest.mock('@/lib/env');

describe('Download API - GET /api/download/:code', () => {
  let mockRequest: Partial<NextRequest>;
  let mockParams: { code: string };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: new Map([
        ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'],
        ['x-forwarded-for', '192.168.1.1'],
      ]),
    };
    mockParams = { code: '123456' };
  });

  describe('Successful Download', () => {
    it('should successfully download a valid file', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        download_count: 5,
      });

      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockResolvedValue(Buffer.from('file content'));

      const { incrementDownloadCount } = require('@/lib/db/queries');
      incrementDownloadCount.mockResolvedValue({ download_count: 6 });

      const response = await GET(mockRequest as NextRequest, mockParams);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/pdf');
      expect(response.headers.get('content-disposition')).toContain('document.pdf');
    });

    it('should increment download counter', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        download_count: 0,
      });

      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockResolvedValue(Buffer.from('file content'));

      const { incrementDownloadCount } = require('@/lib/db/queries');
      incrementDownloadCount.mockResolvedValue({ download_count: 1 });

      const { createAnalytics } = require('@/lib/db/queries');
      createAnalytics.mockResolvedValue({ id: 'analytics-id' });

      await GET(mockRequest as NextRequest, mockParams);

      expect(incrementDownloadCount).toHaveBeenCalledWith('file-id');
    });

    it('should record download analytics', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        download_count: 0,
      });

      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockResolvedValue(Buffer.from('file content'));

      const { incrementDownloadCount } = require('@/lib/db/queries');
      incrementDownloadCount.mockResolvedValue({ download_count: 1 });

      const { createAnalytics } = require('@/lib/db/queries');
      createAnalytics.mockResolvedValue({ id: 'analytics-id' });

      await GET(mockRequest as NextRequest, mockParams);

      expect(createAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'download',
          file_id: 'file-id',
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid share code format', async () => {
      mockParams.code = 'invalid';

      const response = await GET(mockRequest as NextRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('invalid');
    });

    it('should reject missing share code', async () => {
      mockParams.code = '';

      const response = await GET(mockRequest as NextRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject non-numeric share code', async () => {
      mockParams.code = 'abc123';

      const response = await GET(mockRequest as NextRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('File Not Found', () => {
    it('should return 404 for non-existent share code', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue(null);

      const response = await GET(mockRequest as NextRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('File Expiration', () => {
    it('should reject expired files', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        download_count: 5,
      });

      const response = await GET(mockRequest as NextRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(410);
      expect(data.success).toBe(false);
      expect(data.error).toContain('expired');
    });

    it('should accept files expiring soon', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: new Date(Date.now() + 1000), // 1 second from now
        download_count: 5,
      });

      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockResolvedValue(Buffer.from('file content'));

      const { incrementDownloadCount } = require('@/lib/db/queries');
      incrementDownloadCount.mockResolvedValue({ download_count: 6 });

      const response = await GET(mockRequest as NextRequest, mockParams);

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage download failure', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        download_count: 5,
      });

      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockRejectedValue(new Error('Storage error'));

      const response = await GET(mockRequest as NextRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle database error', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockRejectedValue(new Error('Database error'));

      const response = await GET(mockRequest as NextRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Content Type Handling', () => {
    it('should set correct content type for PDF', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        download_count: 0,
      });

      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockResolvedValue(Buffer.from('file content'));

      const { incrementDownloadCount } = require('@/lib/db/queries');
      incrementDownloadCount.mockResolvedValue({ download_count: 1 });

      const response = await GET(mockRequest as NextRequest, mockParams);

      expect(response.headers.get('content-type')).toBe('application/pdf');
    });

    it('should set correct content type for image', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        file_name: 'image.png',
        file_type: 'image/png',
        s3_key: 'test-key',
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        download_count: 0,
      });

      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockResolvedValue(Buffer.from('file content'));

      const { incrementDownloadCount } = require('@/lib/db/queries');
      incrementDownloadCount.mockResolvedValue({ download_count: 1 });

      const response = await GET(mockRequest as NextRequest, mockParams);

      expect(response.headers.get('content-type')).toBe('image/png');
    });
  });

  describe('File Name in Response', () => {
    it('should include file name in content-disposition header', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        file_name: 'my-document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        download_count: 0,
      });

      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockResolvedValue(Buffer.from('file content'));

      const { incrementDownloadCount } = require('@/lib/db/queries');
      incrementDownloadCount.mockResolvedValue({ download_count: 1 });

      const response = await GET(mockRequest as NextRequest, mockParams);

      expect(response.headers.get('content-disposition')).toContain('my-document.pdf');
    });
  });
});
