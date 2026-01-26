/**
 * Shared utility functions for API operations.
 */

import { getToken, clearToken, refreshToken } from '../auth.js';
import type { RefreshResult } from '../auth.js';
import { resetInactivityTimer } from '../inactivity-tracker.js';
import { showError } from '../../ui/components/index.js';


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
  showError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');
  window.location.href = '/';
}

/**
 * Refresh token before making API calls.
 * This extends the token validity with each API interaction.
 * Also resets the inactivity timer to prevent logout during active API usage.
 *
 * Only redirects to login on confirmed token expiry (401).
 * On temporary errors, proceeds with the existing token.
 */
export async function ensureFreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    return false;
  }

  // Refresh token to extend its validity
  const result: RefreshResult = await refreshToken();

  if (result === 'expired') {
    handleUnauthorized();
    return false;
  }

  // On 'error' (temporary failure), proceed with existing token.
  // The actual API call will handle 401 if the token is truly invalid.

  // Reset inactivity timer on API interaction
  resetInactivityTimer();

  return true;
}
