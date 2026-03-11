/**
 * API Documentation Endpoint
 * GET /api/docs - Returns OpenAPI/Swagger specification
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Secure File Share API',
      description: 'API for programmatic access to Secure File Share',
      version: '1.0.0',
      contact: {
        name: 'Support',
        email: 'support@securefile.share',
      },
    },
    servers: [
      {
        url: 'https://securefile.share/api',
        description: 'Production API',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description: 'API key in format: sk_live_...',
        },
      },
      schemas: {
        ApiKey: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            key_prefix: { type: 'string', description: 'First 20 characters of the key' },
            is_active: { type: 'boolean' },
            last_used_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            revoked_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        File: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            share_code: { type: 'string' },
            file_name: { type: 'string' },
            file_size: { type: 'integer' },
            file_type: { type: 'string' },
            expires_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            download_count: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string', nullable: true },
          },
        },
      },
    },
    paths: {
      '/api-keys': {
        get: {
          summary: 'List API Keys',
          description: 'Get all API keys for the authenticated user',
          security: [{ ApiKeyAuth: [] }],
          tags: ['API Keys'],
          responses: {
            '200': {
              description: 'List of API keys',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      keys: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ApiKey' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create API Key',
          description: 'Create a new API key for the authenticated user',
          security: [{ ApiKeyAuth: [] }],
          tags: ['API Keys'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Name for the API key' },
                  },
                  required: ['name'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'API key created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      key: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          key: { type: 'string', description: 'Full API key (shown only once)' },
                          key_prefix: { type: 'string' },
                          created_at: { type: 'string' },
                        },
                      },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api-keys/{keyId}': {
        get: {
          summary: 'Get API Key Details',
          description: 'Get details for a specific API key',
          security: [{ ApiKeyAuth: [] }],
          tags: ['API Keys'],
          parameters: [
            {
              name: 'keyId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'API key details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      key: { $ref: '#/components/schemas/ApiKey' },
                      rate_limits: {
                        type: 'object',
                        properties: {
                          requests_per_minute: { type: 'integer' },
                          requests_per_hour: { type: 'integer' },
                          requests_per_day: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'API key not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        patch: {
          summary: 'Update API Key',
          description: 'Update API key name',
          security: [{ ApiKeyAuth: [] }],
          tags: ['API Keys'],
          parameters: [
            {
              name: 'keyId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'API key updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      key: { $ref: '#/components/schemas/ApiKey' },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          summary: 'Delete API Key',
          description: 'Delete an API key',
          security: [{ ApiKeyAuth: [] }],
          tags: ['API Keys'],
          parameters: [
            {
              name: 'keyId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'API key deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api-keys/{keyId}/revoke': {
        post: {
          summary: 'Revoke API Key',
          description: 'Revoke an API key (disable without deleting)',
          security: [{ ApiKeyAuth: [] }],
          tags: ['API Keys'],
          parameters: [
            {
              name: 'keyId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'API key revoked',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      key: { $ref: '#/components/schemas/ApiKey' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api-keys/{keyId}/regenerate': {
        post: {
          summary: 'Regenerate API Key',
          description: 'Generate a new key value for an existing API key',
          security: [{ ApiKeyAuth: [] }],
          tags: ['API Keys'],
          parameters: [
            {
              name: 'keyId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'API key regenerated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      key: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          key: { type: 'string', description: 'New API key (shown only once)' },
                          key_prefix: { type: 'string' },
                          created_at: { type: 'string' },
                        },
                      },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
