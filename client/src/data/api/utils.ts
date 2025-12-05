/**
 * Shared utility functions for API operations.
 */

import { getToken, clearToken, refreshToken } from '../auth.js';

/**
 * Get authorization headers with JWT token.
 */
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Handle 401 responses by clearing token and redirecting to login.
 */
export function handleUnauthorized(): void {
  clearToken();
  window.location.href = '/';
}

/**
 * Refresh token before making API calls.
 * This extends the token validity with each API interaction.
 */
export async function ensureFreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    return false;
  }

  // Refresh token to extend its validity
  const refreshed = await refreshToken();
  if (!refreshed) {
    handleUnauthorized();
    return false;
  }

  return true;
}
