/**
 * Authentication utilities for JWT token management.
 */

const TOKEN_KEY = 'auth_token';

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
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove JWT token from localStorage.
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
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
 */
export async function login(credentials: LoginCredentials): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Login failed:', error.detail);
      return false;
    }
    const data = await res.json();
    setToken(data.access_token);
    return true;
  } catch (error) {
    console.error('Error during login:', error);
    return false;
  }
}

/**
 * Logout user by clearing token.
 */
export function logout(): void {
  clearToken();
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

// Token refresh optimization: ensure only one refresh happens at a time
let refreshPromise: Promise<boolean> | null = null;
let lastRefreshTime: number = 0;
const REFRESH_COOLDOWN_MS = 5000; // Don't refresh more than once per 5 seconds

/**
 * Refresh the JWT token.
 * This function ensures only one refresh happens at a time, even if called
 * multiple times concurrently. It also implements a cooldown period to prevent
 * excessive refresh requests.
 */
export async function refreshToken(): Promise<boolean> {
  const now = Date.now();

  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // If we refreshed recently, skip (within cooldown period)
  if (now - lastRefreshTime < REFRESH_COOLDOWN_MS) {
    return true;
  }

  const token = getToken();
  if (!token) {
    return false;
  }

  // Create and store the refresh promise
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          clearToken();
        }
        return false;
      }
      const data = await res.json();
      setToken(data.access_token);
      lastRefreshTime = Date.now();
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    } finally {
      // Clear the promise after completion
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
