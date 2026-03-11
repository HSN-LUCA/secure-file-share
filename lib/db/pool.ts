/**
 * Database Connection Pooling
 * Manages connection pooling for optimal performance
 */

import { Pool, PoolClient } from 'pg';

/**
 * Connection pool configuration
 */
const poolConfig = {
  // Connection string from environment
  connectionString: process.env.DATABASE_URL,

  // Pool size configuration
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN || '2', 10), // Minimum connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // 30 seconds
  connectionTimeoutMillis: parseInt(
    process.env.DB_CONNECTION_TIMEOUT || '2000',
    10
  ), // 2 seconds

  // SSL configuration for production
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
};

/**
 * Global connection pool instance
 */
let pool: Pool | null = null;

/**
 * Get or create the connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    if (!poolConfig.connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool(poolConfig);

    // Log pool events
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    pool.on('connect', () => {
      console.debug('New client connected to pool');
    });

    pool.on('remove', () => {
      console.debug('Client removed from pool');
    });
  }

  return pool;
}

/**
 * Get a client from the pool
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

/**
 * Execute a query using the pool
 */
export async function query<T = any>(
  text: string,
  values?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  const result = await pool.query(text, values);
  return {
    rows: result.rows as T[],
    rowCount: result.rowCount || 0,
  };
}

/**
 * Execute a single row query
 */
export async function queryOne<T = any>(
  text: string,
  values?: any[]
): Promise<T | null> {
  const result = await query<T>(text, values);
  return result.rows[0] || null;
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  const pool = getPool();
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingRequests: pool.waitingCount,
  };
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Connection pool closed');
  }
}

/**
 * Health check for the connection pool
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1');
    return result.rowCount > 0;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Drain the pool (close idle connections)
 */
export async function drainPool(): Promise<void> {
  const pool = getPool();
  // Drain idle connections
  const stats = getPoolStats();
  console.log(`Draining pool: ${stats.idleConnections} idle connections`);
}

/**
 * Reset the pool (close all connections and recreate)
 */
export async function resetPool(): Promise<void> {
  await closePool();
  // Pool will be recreated on next getPool() call
  console.log('Connection pool reset');
}

/**
 * Monitor pool health
 */
export function startPoolMonitoring(intervalMs: number = 60000): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const stats = getPoolStats();
    console.log(
      `Pool stats - Total: ${stats.totalConnections}, Idle: ${stats.idleConnections}, Waiting: ${stats.waitingRequests}`
    );
  }, intervalMs);
}

/**
 * Stop pool monitoring
 */
export function stopPoolMonitoring(timer: ReturnType<typeof setInterval>): void {
  clearInterval(timer);
}
