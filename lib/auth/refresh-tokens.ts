/**
 * Refresh Token Database Operations
 * Manages refresh tokens stored in the database
 */

import { supabaseServer, supabaseClient } from '@/lib/db/config';

// ============================================================================
// REFRESH TOKEN TYPES
// ============================================================================

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked_at: string | null;
  is_revoked: boolean;
}

export interface RefreshTokenInsert {
  user_id: string;
  token_hash: string;
  expires_at: string;
}

// ============================================================================
// DATABASE HELPERS
// ============================================================================

/**
 * Get the appropriate Supabase client
 */
function getClient() {
  if (typeof window === 'undefined' && supabaseServer) {
    return supabaseServer;
  }
  return supabaseClient;
}

// ============================================================================
// REFRESH TOKEN OPERATIONS
// ============================================================================

/**
 * Store refresh token in database
 */
export async function storeRefreshToken(
  refreshTokenData: RefreshTokenInsert
): Promise<{ data: RefreshToken | null; error: Error | null }> {
  try {
    const { data, error } = await getClient()
      .from('refresh_tokens')
      .insert([refreshTokenData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get refresh token by hash
 */
export async function getRefreshTokenByHash(
  tokenHash: string
): Promise<{ data: RefreshToken | null; error: Error | null }> {
  try {
    const { data, error } = await getClient()
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get all refresh tokens for a user
 */
export async function getUserRefreshTokens(
  userId: string
): Promise<{ data: RefreshToken[]; error: Error | null }> {
  try {
    const { data, error } = await getClient()
      .from('refresh_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error as Error };
  }
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(
  tokenHash: string
): Promise<{ data: RefreshToken | null; error: Error | null }> {
  try {
    const { data, error } = await getClient()
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('token_hash', tokenHash)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Revoke all refresh tokens for a user (logout)
 */
export async function revokeAllUserRefreshTokens(
  userId: string
): Promise<{ count: number; error: Error | null }> {
  try {
    const { count, error } = await getClient()
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_revoked', false);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error) {
    return { count: 0, error: error as Error };
  }
}

/**
 * Delete expired refresh tokens (cleanup)
 */
export async function deleteExpiredRefreshTokens(): Promise<{ count: number; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const { count, error } = await getClient()
      .from('refresh_tokens')
      .delete()
      .lt('expires_at', now);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error) {
    return { count: 0, error: error as Error };
  }
}

/**
 * Delete all refresh tokens for a user
 */
export async function deleteUserRefreshTokens(
  userId: string
): Promise<{ count: number; error: Error | null }> {
  try {
    const { count, error } = await getClient()
      .from('refresh_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error) {
    return { count: 0, error: error as Error };
  }
}
