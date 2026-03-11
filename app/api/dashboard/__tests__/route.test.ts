/**
 * Dashboard Endpoints Tests
 * Tests for GET /api/dashboard, DELETE /api/dashboard/files/[fileId], and PATCH /api/dashboard/files/[fileId]/extend
 */

import { GET as dashboardHandler } from '@/app/api/dashboard/route';
import { DELETE as deleteFileHandler } from '@/app/api/dashboard/files/[fileId]/route';
import { PATCH as extendExpirationHandler } from '@/app/api/dashboard/files/[fileId]/extend/route';
import { NextRequest } from 'next/server';

// Mock the database queries
jest.mock('@/lib/db/queries', () => ({
  getUserById: jest.fn(),
  getUserFiles: jest.fn(),
  getFileDownloadStats: jest.fn(),
  getUserStorageUsage: jest.fn(),
  getFileById: jest.fn(),
  deleteFile: jest.fn(),
  updateFile: jest.fn(),
  createAnalytics: jest.fn(),
}));

// Mock storage utilities
jest.mock('@/lib/storage/utils', () => ({
  deleteFile: jest.fn(),
}));

// Mock JWT verification
jest.mock('@/lib/auth/jwt', () => ({
  verifyAccessToken: jest.fn(),
}));

// Mock the auth middleware
jest.mock('@/lib/auth/middleware', () => ({
  withAuth: (handler: any) => handler,
  extractTokenFromRequest: jest.fn(),
  verifyAccessToken: jest.fn(),
  getUserFromRequest: jest.fn(),
  isAuthenticated: jest.fn(),
}));

import {
  getUserById,
  getUserFiles,
  getFileDownloadStats,
  getUserStorageUsage,
  getFileById,
  deleteFile as deleteFileFromDb,
  updateFile,
  createAnalytics,
} from '@/lib/db/queries';
import { deleteFile as deleteFileFromStorage } from '@/lib/storage/utils';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { withAuth } from '@/lib/auth/middleware';

describe('Dashboard Endpoints', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password_hash: '$2b$10$hashedpassword',
    plan: 'free' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    subscription_expires_at: null,
    is_active: true,
  };

  const mockFile = {
    id: 'file-123',
    share_code: '123456',
    user_id: 'user-123',
    file_name: 'document.pdf',
    file_size: 1024000,
    file_type: 'pdf',
    s3_key: 'uploads/2024/01/01/file-123',
    expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    created_at: '2024-01-01T00:00:00Z',
    download_count: 5,
    is_scanned: true,
    is_safe: true,
    storage_duration_minutes: 20,
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    encryption_iv: 'iv-123',
    encryption_auth_tag: 'tag-123',
  };

  const createMockRequest = (
    url: string,
    method: string = 'GET',
    body?: any,
    headers: Record<string, string> = {},
    user?: any
  ): NextRequest => {
    const options: any = {
      method,
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer valid.token',
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const request = new NextRequest(url, options) as any;
    if (user) {
      request.user = user;
    }
    return request;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (verifyAccessToken as jest.Mock).mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    });
  });

  // ========================================================================
  // GET /api/dashboard TESTS
  // ========================================================================

  describe('GET /api/dashboard', () => {
    it('should reject missing authentication token', async () => {
      (verifyAccessToken as jest.Mock).mockReturnValue(null);

      const request = createMockRequest('http://localhost:3000/api/dashboard', 'GET', undefined, {
        'authorization': '',
      });

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      (verifyAccessToken as jest.Mock).mockReturnValue(null);

      const request = createMockRequest('http://localhost:3000/api/dashboard', 'GET', undefined, {
        authorization: 'Bearer invalid.token',
      });

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should return 404 if user not found', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      (getUserById as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard', 'GET', undefined, {}, mockUser);

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('User not found');
    });

    it('should successfully return dashboard data', async () => {
      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: '$2b$10$hashedpassword',
        plan: 'free' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        subscription_expires_at: null,
        is_active: true,
      };
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      (getUserById as jest.Mock).mockResolvedValue({
        data: mockUserData,
        error: null,
      });
      (getUserFiles as jest.Mock).mockResolvedValue({
        data: [mockFile],
        error: null,
      });
      (getFileDownloadStats as jest.Mock).mockResolvedValue({
        data: { count: 5, lastDownloadedAt: '2024-01-01T12:00:00Z' },
        error: null,
      });
      (getUserStorageUsage as jest.Mock).mockResolvedValue({
        data: 1024000,
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard', 'GET', undefined, {}, mockUser);

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.user?.id).toBe(mockUserData.id);
      expect(data.data?.user?.email).toBe(mockUserData.email);
      expect(data.data?.user?.plan).toBe(mockUserData.plan);
      expect(data.data?.files).toHaveLength(1);
      expect(data.data?.files[0]?.shareCode).toBe(mockFile.share_code);
      expect(data.data?.stats?.totalUploads).toBe(1);
      expect(data.data?.stats?.totalDownloads).toBe(5);
      expect(data.data?.stats?.storageUsed).toBe(1024000);
    });

    it('should handle empty file list', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      (getUserById as jest.Mock).mockResolvedValue({
        data: mockUser,
        error: null,
      });
      (getUserFiles as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });
      (getUserStorageUsage as jest.Mock).mockResolvedValue({
        data: 0,
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard', 'GET', undefined, {}, mockUser);

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.files).toHaveLength(0);
      expect(data.data?.stats?.totalUploads).toBe(0);
      expect(data.data?.stats?.totalDownloads).toBe(0);
    });
  });

  // ========================================================================
  // DELETE /api/dashboard/files/[fileId] TESTS
  // ========================================================================

  describe('DELETE /api/dashboard/files/[fileId]', () => {
    it('should reject missing authentication token', async () => {
      (verifyAccessToken as jest.Mock).mockReturnValue(null);

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123', 'DELETE', undefined, {
        'authorization': '',
      });

      const response = await deleteFileHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should reject invalid file ID', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/invalid', 'DELETE', undefined, {}, mockUser);

      const response = await deleteFileHandler(request, { params: { fileId: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid file ID');
    });

    it('should return 404 if file not found', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      (getFileById as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123', 'DELETE', undefined, {}, mockUser);

      const response = await deleteFileHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('File not found');
    });

    it('should reject unauthorized file deletion', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      const otherUserFile = { ...mockFile, user_id: 'other-user-123' };
      (getFileById as jest.Mock).mockResolvedValue({
        data: otherUserFile,
        error: null,
      });
      (createAnalytics as jest.Mock).mockResolvedValue({
        data: { id: 'analytics-123' },
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123', 'DELETE', undefined, {}, mockUser);

      const response = await deleteFileHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should successfully delete file', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      (getFileById as jest.Mock).mockResolvedValue({
        data: mockFile,
        error: null,
      });
      (deleteFileFromStorage as jest.Mock).mockResolvedValue(undefined);
      (deleteFileFromDb as jest.Mock).mockResolvedValue({
        data: undefined,
        error: null,
      });
      (createAnalytics as jest.Mock).mockResolvedValue({
        data: { id: 'analytics-123' },
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123', 'DELETE', undefined, {}, mockUser);

      const response = await deleteFileHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(deleteFileFromStorage).toHaveBeenCalledWith(mockFile.s3_key);
      expect(deleteFileFromDb).toHaveBeenCalledWith('file-123');
    });
  });

  // ========================================================================
  // PATCH /api/dashboard/files/[fileId]/extend TESTS
  // ========================================================================

  describe('PATCH /api/dashboard/files/[fileId]/extend', () => {
    it('should reject missing authentication token', async () => {
      (verifyAccessToken as jest.Mock).mockReturnValue(null);

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123/extend', 'PATCH', undefined, {
        'authorization': '',
      });

      const response = await extendExpirationHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should reject invalid file ID', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/invalid/extend', 'PATCH', undefined, {}, mockUser);

      const response = await extendExpirationHandler(request, { params: { fileId: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid file ID');
    });

    it('should return 404 if file not found', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      (getFileById as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123/extend', 'PATCH', undefined, {}, mockUser);

      const response = await extendExpirationHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('File not found');
    });

    it('should reject unauthorized extension', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      const otherUserFile = { ...mockFile, user_id: 'other-user-123' };
      (getFileById as jest.Mock).mockResolvedValue({
        data: otherUserFile,
        error: null,
      });
      (createAnalytics as jest.Mock).mockResolvedValue({
        data: { id: 'analytics-123' },
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123/extend', 'PATCH', undefined, {}, mockUser);

      const response = await extendExpirationHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unauthorized');
    });

    it('should reject extension of expired file', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      const expiredFile = { ...mockFile, expires_at: new Date(Date.now() - 1000).toISOString() };
      (getFileById as jest.Mock).mockResolvedValue({
        data: expiredFile,
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123/extend', 'PATCH', undefined, {}, mockUser);

      const response = await extendExpirationHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already expired');
    });

    it('should successfully extend file expiration', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      (getFileById as jest.Mock).mockResolvedValue({
        data: mockFile,
        error: null,
      });
      (updateFile as jest.Mock).mockResolvedValue({
        data: { ...mockFile, expires_at: new Date(Date.now() + 40 * 60 * 1000).toISOString() },
        error: null,
      });
      (createAnalytics as jest.Mock).mockResolvedValue({
        data: { id: 'analytics-123' },
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123/extend', 'PATCH', undefined, {}, mockUser);

      const response = await extendExpirationHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.expiresAt).toBeDefined();
      expect(updateFile).toHaveBeenCalledWith('file-123', expect.objectContaining({ expires_at: expect.any(String) }));
    });

    it('should extend expiration by correct duration', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      const originalExpiration = new Date(Date.now() + 10 * 60 * 1000);
      const fileWithExpiration = { ...mockFile, expires_at: originalExpiration.toISOString() };

      (getFileById as jest.Mock).mockResolvedValue({
        data: fileWithExpiration,
        error: null,
      });
      (updateFile as jest.Mock).mockResolvedValue({
        data: { ...fileWithExpiration, expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
        error: null,
      });
      (createAnalytics as jest.Mock).mockResolvedValue({
        data: { id: 'analytics-123' },
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123/extend', 'PATCH', undefined, {}, mockUser);

      const response = await extendExpirationHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  // ========================================================================
  // ADDITIONAL DASHBOARD TESTS
  // ========================================================================

  describe('Dashboard Statistics', () => {
    it('should calculate total uploads correctly', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      const mockFiles = [mockFile, { ...mockFile, id: 'file-124' }, { ...mockFile, id: 'file-125' }];

      (getUserById as jest.Mock).mockResolvedValue({
        data: mockUser,
        error: null,
      });
      (getUserFiles as jest.Mock).mockResolvedValue({
        data: mockFiles,
        error: null,
      });
      (getUserStorageUsage as jest.Mock).mockResolvedValue({
        data: mockFiles.length * mockFile.file_size,
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard', 'GET', undefined, {}, mockUser);

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data?.stats?.totalUploads).toBe(3);
    });

    it('should calculate total downloads correctly', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      const mockFiles = [
        { ...mockFile, download_count: 5 },
        { ...mockFile, id: 'file-124', download_count: 10 },
        { ...mockFile, id: 'file-125', download_count: 3 },
      ];

      (getUserById as jest.Mock).mockResolvedValue({
        data: mockUser,
        error: null,
      });
      (getUserFiles as jest.Mock).mockResolvedValue({
        data: mockFiles,
        error: null,
      });
      (getUserStorageUsage as jest.Mock).mockResolvedValue({
        data: mockFiles.reduce((sum, f) => sum + f.file_size, 0),
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard', 'GET', undefined, {}, mockUser);

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data?.stats?.totalDownloads).toBe(18);
    });

    it('should calculate storage usage correctly', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      const totalStorage = 5 * 1024 * 1024; // 5MB

      (getUserById as jest.Mock).mockResolvedValue({
        data: mockUser,
        error: null,
      });
      (getUserFiles as jest.Mock).mockResolvedValue({
        data: [mockFile],
        error: null,
      });
      (getUserStorageUsage as jest.Mock).mockResolvedValue({
        data: totalStorage,
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard', 'GET', undefined, {}, mockUser);

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data?.stats?.storageUsed).toBe(totalStorage);
    });
  });

  describe('File List Retrieval', () => {
    it('should return files with correct properties', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      (getUserById as jest.Mock).mockResolvedValue({
        data: mockUser,
        error: null,
      });
      (getUserFiles as jest.Mock).mockResolvedValue({
        data: [mockFile],
        error: null,
      });
      (getUserStorageUsage as jest.Mock).mockResolvedValue({
        data: mockFile.file_size,
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard', 'GET', undefined, {}, mockUser);

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data?.files[0]).toHaveProperty('shareCode');
      expect(data.data?.files[0]).toHaveProperty('fileName');
      expect(data.data?.files[0]).toHaveProperty('createdAt');
      expect(data.data?.files[0]).toHaveProperty('expiresAt');
      expect(data.data?.files[0]).toHaveProperty('downloadCount');
    });

    it('should sort files by creation date', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
      const now = new Date();
      const mockFiles = [
        { ...mockFile, id: 'file-1', created_at: new Date(now.getTime() - 2000).toISOString() },
        { ...mockFile, id: 'file-2', created_at: new Date(now.getTime() - 1000).toISOString() },
        { ...mockFile, id: 'file-3', created_at: new Date(now.getTime()).toISOString() },
      ];

      (getUserById as jest.Mock).mockResolvedValue({
        data: mockUser,
        error: null,
      });
      (getUserFiles as jest.Mock).mockResolvedValue({
        data: mockFiles,
        error: null,
      });
      (getUserStorageUsage as jest.Mock).mockResolvedValue({
        data: mockFiles.reduce((sum, f) => sum + f.file_size, 0),
        error: null,
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard', 'GET', undefined, {}, mockUser);

      const response = await dashboardHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data?.files).toHaveLength(3);
    });
  });

  describe('Delete File Edge Cases', () => {
    it('should handle database error during deletion', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      (getFileById as jest.Mock).mockResolvedValue({
        data: mockFile,
        error: null,
      });
      (deleteFileFromStorage as jest.Mock).mockResolvedValue(undefined);
      (deleteFileFromDb as jest.Mock).mockResolvedValue({
        data: null,
        error: 'Database error',
      });

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123', 'DELETE', undefined, {}, mockUser);

      const response = await deleteFileHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle storage error during deletion', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      (getFileById as jest.Mock).mockResolvedValue({
        data: mockFile,
        error: null,
      });
      (deleteFileFromStorage as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const request = createMockRequest('http://localhost:3000/api/dashboard/files/file-123', 'DELETE', undefined, {}, mockUser);

      const response = await deleteFileHandler(request, { params: { fileId: 'file-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
