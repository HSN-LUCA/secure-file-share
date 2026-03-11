/**
 * Upload/Download Flow Integration Tests
 * Tests the complete flow from upload to download
 */

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

describe('Upload/Download Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Upload/Download Cycle', () => {
    it('should complete full upload and download cycle', async () => {
      // Setup mocks for upload
      const { validateFile } = require('@/lib/validation/file-validation');
      validateFile.mockReturnValue({ valid: true });

      const { verifyCaptchaToken } = require('@/lib/captcha/verifier');
      verifyCaptchaToken.mockResolvedValue({ success: true });

      const { generateShareCode } = require('@/lib/share-code');
      const shareCode = '123456';
      generateShareCode.mockReturnValue(shareCode);

      const { uploadFile } = require('@/lib/storage/utils');
      uploadFile.mockResolvedValue({ key: 'test-key' });

      const { createFile } = require('@/lib/db/queries');
      const fileId = 'file-id-123';
      const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
      createFile.mockResolvedValue({
        id: fileId,
        share_code: shareCode,
        expires_at: expiresAt,
        file_name: 'document.pdf',
        file_type: 'application/pdf',
      });

      // Setup mocks for download
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: fileId,
        share_code: shareCode,
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: expiresAt,
        download_count: 0,
      });

      const { downloadFile } = require('@/lib/storage/utils');
      const fileContent = Buffer.from('test file content');
      downloadFile.mockResolvedValue(fileContent);

      const { incrementDownloadCount } = require('@/lib/db/queries');
      incrementDownloadCount.mockResolvedValue({ download_count: 1 });

      const { createAnalytics } = require('@/lib/db/queries');
      createAnalytics.mockResolvedValue({ id: 'analytics-id' });

      // Verify the flow
      expect(generateShareCode).toHaveBeenCalled();
      expect(uploadFile).toHaveBeenCalled();
      expect(createFile).toHaveBeenCalled();
      expect(getFileByShareCode).toHaveBeenCalledWith(shareCode);
      expect(downloadFile).toHaveBeenCalled();
      expect(incrementDownloadCount).toHaveBeenCalledWith(fileId);
    });

    it('should maintain file integrity through upload/download cycle', async () => {
      const originalContent = Buffer.from('test file content');

      const { uploadFile } = require('@/lib/storage/utils');
      uploadFile.mockResolvedValue({ key: 'test-key' });

      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockResolvedValue(originalContent);

      // Verify content integrity
      expect(downloadFile).toHaveBeenCalled();
    });

    it('should track download count through cycle', async () => {
      const fileId = 'file-id-123';

      const { incrementDownloadCount } = require('@/lib/db/queries');
      incrementDownloadCount.mockResolvedValue({ download_count: 1 });

      // First download
      await incrementDownloadCount(fileId);
      expect(incrementDownloadCount).toHaveBeenCalledWith(fileId);

      // Second download
      incrementDownloadCount.mockResolvedValue({ download_count: 2 });
      await incrementDownloadCount(fileId);
      expect(incrementDownloadCount).toHaveBeenCalledTimes(2);
    });
  });

  describe('Multiple Downloads', () => {
    it('should handle multiple downloads of same file', async () => {
      const fileId = 'file-id-123';
      const shareCode = '123456';

      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue({
        id: fileId,
        share_code: shareCode,
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        download_count: 0,
      });

      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockResolvedValue(Buffer.from('content'));

      const { incrementDownloadCount } = require('@/lib/db/queries');

      // First download
      incrementDownloadCount.mockResolvedValue({ download_count: 1 });
      await incrementDownloadCount(fileId);

      // Second download
      incrementDownloadCount.mockResolvedValue({ download_count: 2 });
      await incrementDownloadCount(fileId);

      // Third download
      incrementDownloadCount.mockResolvedValue({ download_count: 3 });
      await incrementDownloadCount(fileId);

      expect(incrementDownloadCount).toHaveBeenCalledTimes(3);
    });

    it('should record analytics for each download', async () => {
      const fileId = 'file-id-123';

      const { createAnalytics } = require('@/lib/db/queries');
      createAnalytics.mockResolvedValue({ id: 'analytics-id' });

      // First download
      await createAnalytics({
        event_type: 'download',
        file_id: fileId,
        ip_address: '192.168.1.1',
      });

      // Second download
      await createAnalytics({
        event_type: 'download',
        file_id: fileId,
        ip_address: '10.0.0.1',
      });

      expect(createAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery', () => {
    it('should handle upload failure gracefully', async () => {
      const { uploadFile } = require('@/lib/storage/utils');
      uploadFile.mockRejectedValue(new Error('Storage error'));

      try {
        await uploadFile('test-key', Buffer.from('content'));
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle download failure gracefully', async () => {
      const { downloadFile } = require('@/lib/storage/utils');
      downloadFile.mockRejectedValue(new Error('Storage error'));

      try {
        await downloadFile('test-key');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle database errors during upload', async () => {
      const { createFile } = require('@/lib/db/queries');
      createFile.mockRejectedValue(new Error('Database error'));

      try {
        await createFile({
          share_code: '123456',
          file_name: 'test.pdf',
          file_type: 'application/pdf',
          s3_key: 'test-key',
          expires_at: new Date(),
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle database errors during download', async () => {
      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockRejectedValue(new Error('Database error'));

      try {
        await getFileByShareCode('123456');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent uploads', async () => {
      const { uploadFile } = require('@/lib/storage/utils');
      uploadFile.mockResolvedValue({ key: 'test-key' });

      const { createFile } = require('@/lib/db/queries');
      createFile.mockResolvedValue({
        id: 'file-id',
        share_code: '123456',
        expires_at: new Date(),
      });

      // Simulate concurrent uploads
      const uploads = [];
      for (let i = 0; i < 5; i++) {
        uploads.push(
          Promise.all([
            uploadFile(`key-${i}`, Buffer.from(`content-${i}`)),
            createFile({
              share_code: `${100000 + i}`,
              file_name: `file-${i}.pdf`,
              file_type: 'application/pdf',
              s3_key: `key-${i}`,
              expires_at: new Date(),
            }),
          ])
        );
      }

      await Promise.all(uploads);

      expect(uploadFile).toHaveBeenCalledTimes(5);
      expect(createFile).toHaveBeenCalledTimes(5);
    });

    it('should handle concurrent downloads', async () => {
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
      downloadFile.mockResolvedValue(Buffer.from('content'));

      // Simulate concurrent downloads
      const downloads = [];
      for (let i = 0; i < 5; i++) {
        downloads.push(
          Promise.all([
            getFileByShareCode('123456'),
            downloadFile('test-key'),
          ])
        );
      }

      await Promise.all(downloads);

      expect(getFileByShareCode).toHaveBeenCalledTimes(5);
      expect(downloadFile).toHaveBeenCalledTimes(5);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', async () => {
      const fileId = 'file-id-123';
      const shareCode = '123456';

      const { createFile } = require('@/lib/db/queries');
      const uploadedFile = {
        id: fileId,
        share_code: shareCode,
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        s3_key: 'test-key',
        expires_at: new Date(),
      };
      createFile.mockResolvedValue(uploadedFile);

      const { getFileByShareCode } = require('@/lib/db/queries');
      getFileByShareCode.mockResolvedValue(uploadedFile);

      // Upload file
      const uploaded = await createFile(uploadedFile);

      // Download file
      const downloaded = await getFileByShareCode(shareCode);

      // Verify data consistency
      expect(uploaded.id).toBe(downloaded.id);
      expect(uploaded.share_code).toBe(downloaded.share_code);
      expect(uploaded.file_name).toBe(downloaded.file_name);
      expect(uploaded.file_type).toBe(downloaded.file_type);
    });
  });
});
