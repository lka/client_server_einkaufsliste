/**
 * Authentication utilities for JWT token management.
 */

const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRES_KEY = 'token_expires_in';

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_approved: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

/**
 * Get stored JWT token from localStorage.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store JWT token in localStorage.
 */
export function setToken(token: string, expiresIn?: number): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (expiresIn !== undefined) {
    localStorage.setItem(TOKEN_EXPIRES_KEY, expiresIn.toString());
  }
}

/**
 * Remove JWT token from localStorage.
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_KEY);
}

/**
 * Get token expiration time in seconds.
 */
export function getTokenExpiresIn(): number | null {
  const expiresIn = localStorage.getItem(TOKEN_EXPIRES_KEY);
  return expiresIn ? parseInt(expiresIn, 10) : null;
}

/**
 * Check if user is authenticated by verifying token exists and is valid.
 * This is a synchronous check - it only verifies the token exists.
 * For actual validation, the API calls will check token validity.
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) {
    return false;
  }

  // Basic JWT structure validation (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    clearToken();
    return false;
  }

  try {
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp) {
      // Check if token is expired (exp is in seconds, Date.now() is in ms)
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        clearToken();
        return false;
      }
    }
    return true;
  } catch (error) {
    // Invalid token format
    console.error('Invalid token format:', error);
    clearToken();
    return false;
  }
}

/**
 * Register a new user.
 */
export async function register(data: RegisterData): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Registration failed:', error.detail);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error during registration:', error);
    return null;
  }
}

/**
 * Login user and store JWT token.
 * Returns the token expiration time in seconds, or null on failure.
 */
export async function login(credentials: LoginCredentials): Promise<number | null> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Login failed:', error.detail);
      return null;
    }
    const data = await res.json();
    setToken(data.access_token, data.expires_in);
    return data.expires_in;
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
}

/**
 * Logout user by clearing token and browser history.
 */
export function logout(): void {
  clearToken();

  // Clear session storage
  sessionStorage.clear();

  // Clear browser history by replacing state
  try {
    const historyLength = window.history.length;
    if (historyLength > 1) {
      window.history.go(-(historyLength - 1));
    }
    window.history.replaceState(null, '', '/');
  } catch (error) {
    console.error('Error clearing browser history:', error);
  }
}

/**
 * Get current user information.
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) {
        clearToken();
      }
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Result of a token refresh attempt.
 * - 'success': Token was refreshed successfully
 * - 'expired': Token is expired (401), user must re-authenticate
 * - 'error': Temporary error (network, server), existing token may still be valid
 */
export type RefreshResult = 'success' | 'expired' | 'error';

// Token refresh optimization: ensure only one refresh happens at a time
let refreshPromise: Promise<RefreshResult> | null = null;
let lastRefreshTime: number = 0;
const REFRESH_COOLDOWN_MS = 5000; // Don't refresh more than once per 5 seconds
const MAX_REFRESH_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * Refresh the JWT token.
 * This function ensures only one refresh happens at a time, even if called
 * multiple times concurrently. It also implements a cooldown period to prevent
 * excessive refresh requests.
 *
 * On temporary errors (network, 500), retries up to 3 times with exponential backoff.
 * On 401 (token expired), fails immediately without retry.
 */
export async function refreshToken(): Promise<RefreshResult> {
  const now = Date.now();

  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // If we refreshed recently, skip (within cooldown period)
  if (now - lastRefreshTime < REFRESH_COOLDOWN_MS) {
    return 'success';
  }

  const token = getToken();
  if (!token) {
    return 'expired';
  }

  // Create and store the refresh promise
  refreshPromise = (async () => {
    try {
      return await attemptRefreshWithRetry(token);
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Attempt a single refresh request.
 * Returns 'success' or 'expired', throws on temporary errors for retry handling.
 */
async function attemptRefresh(token: string): Promise<RefreshResult> {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (res.ok) {
    const data = await res.json();
    setToken(data.access_token);
    lastRefreshTime = Date.now();
    return 'success';
  }

  if (res.status === 401) {
    clearToken();
    return 'expired';
  }

  // Other HTTP errors (500, 503, etc.) are temporary - throw for retry
  throw new Error(`Refresh failed with status ${res.status}`);
}

/**
 * Refresh with retry logic: up to MAX_REFRESH_RETRIES attempts with exponential backoff.
 * Retries only on temporary errors (network, server). On 401 fails immediately.
 */
async function attemptRefreshWithRetry(token: string): Promise<RefreshResult> {
  for (let attempt = 0; attempt <= MAX_REFRESH_RETRIES; attempt++) {
    try {
      return await attemptRefresh(token);
    } catch (error) {
      if (attempt < MAX_REFRESH_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Token refresh attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`Token refresh failed after ${MAX_REFRESH_RETRIES + 1} attempts:`, error);
        return 'error';
      }
    }
  }
  return 'error';
}

/**
 * Reset the token refresh state (mainly for testing purposes).
 * @internal
 */
export function resetRefreshState(): void {
  refreshPromise = null;
  lastRefreshTime = 0;
}

/**
 * Delete the current user account.
 */
export async function deleteUser(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    return false;
  }

  try {
    const res = await fetch('/api/auth/me', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      clearToken();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}
