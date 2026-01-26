/**
 * Tests for authentication utilities.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getToken,
  setToken,
  clearToken,
  isAuthenticated,
  login,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  deleteUser,
  resetRefreshState,
} from './auth.js';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    resetRefreshState(); // Reset token refresh state between tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Token Management', () => {
    it('should store and retrieve token', () => {
      const token = 'test-token-123';
      setToken(token);
      expect(getToken()).toBe(token);
    });

    it('should clear token', () => {
      setToken('test-token');
      clearToken();
      expect(getToken()).toBeNull();
    });

    it('should return null when no token exists', () => {
      expect(getToken()).toBeNull();
    });

    it('should check if authenticated', () => {
      expect(isAuthenticated()).toBe(false);

      // Create a valid JWT token (not expired)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        sub: 'testuser',
        exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
      }));
      const signature = 'fake-signature';
      const validToken = `${header}.${payload}.${signature}`;

      setToken(validToken);
      expect(isAuthenticated()).toBe(true);
      clearToken();
      expect(isAuthenticated()).toBe(false);
    });

    it('should reject expired tokens', () => {
      // Create an expired JWT token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        sub: 'testuser',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      }));
      const signature = 'fake-signature';
      const expiredToken = `${header}.${payload}.${signature}`;

      setToken(expiredToken);
      expect(isAuthenticated()).toBe(false);
      expect(getToken()).toBeNull(); // Token should be cleared
    });

    it('should reject invalid token format', () => {
      setToken('invalid-token');
      expect(isAuthenticated()).toBe(false);
      expect(getToken()).toBeNull(); // Token should be cleared
    });
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockToken = 'mock-jwt-token';
      const mockExpiresIn = 1800; // 30 minutes in seconds
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: mockToken, token_type: 'bearer', expires_in: mockExpiresIn }),
      } as Response);

      const result = await login({ username: 'testuser', password: 'password123' });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'password123' }),
      });
      expect(result).toBe(mockExpiresIn);
      expect(getToken()).toBe(mockToken);
    });

    it('should return null when login fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid credentials' }),
      } as Response);

      const result = await login({ username: 'testuser', password: 'wrong' });

      expect(result).toBeNull();
      expect(getToken()).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Login failed:', 'Invalid credentials');
    });

    it('should handle network errors during login', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await login({ username: 'testuser', password: 'password' });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error during login:', expect.any(Error));
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'newuser@example.com',
        is_active: true,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await register({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
        }),
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when registration fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Username already exists' }),
      } as Response);

      const result = await register({
        username: 'existing',
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Registration failed:',
        'Username already exists'
      );
    });

    it('should handle network errors during registration', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await register({
        username: 'newuser',
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error during registration:',
        expect.any(Error)
      );
    });
  });

  describe('logout', () => {
    it('should clear token on logout', () => {
      // Create a valid JWT token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        sub: 'testuser',
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      const validToken = `${header}.${payload}.fake-signature`;

      setToken(validToken);
      expect(isAuthenticated()).toBe(true);

      logout();

      expect(isAuthenticated()).toBe(false);
      expect(getToken()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no token exists', async () => {
      const result = await getCurrentUser();
      expect(result).toBeNull();
    });

    it('should fetch current user successfully', async () => {
      setToken('valid-token');
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await getCurrentUser();

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should clear token and return null on 401', async () => {
      setToken('invalid-token');

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(getToken()).toBeNull();
    });

    it('should return null on other errors', async () => {
      setToken('valid-token');

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(getToken()).toBe('valid-token'); // Token not cleared for non-401
    });

    it('should handle network errors', async () => {
      setToken('valid-token');

      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching current user:',
        expect.any(Error)
      );
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('should return expired when no token exists', async () => {
      const result = await refreshToken();
      expect(result).toBe('expired');
    });

    it('should refresh token successfully', async () => {
      setToken('old-token');
      const newToken = 'new-refreshed-token';

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: newToken, token_type: 'bearer' }),
      } as Response);

      const result = await refreshToken();

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: { Authorization: 'Bearer old-token' },
      });
      expect(result).toBe('success');
      expect(getToken()).toBe(newToken);
    });

    it('should clear token and return expired on 401', async () => {
      setToken('expired-token');

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const result = await refreshToken();

      expect(result).toBe('expired');
      expect(getToken()).toBeNull();
    });

    it('should retry on server errors and return error after all retries fail', async () => {
      jest.useFakeTimers();
      setToken('valid-token');

      // Mock 4 failed responses (1 initial + 3 retries)
      for (let i = 0; i < 4; i++) {
        (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);
      }

      const promise = refreshToken();

      // Advance through all retry delays (1000, 2000, 4000 ms)
      for (let i = 0; i < 3; i++) {
        await jest.advanceTimersByTimeAsync(5000);
      }

      const result = await promise;

      expect(result).toBe('error');
      expect(getToken()).toBe('valid-token'); // Token not cleared
      expect(global.fetch).toHaveBeenCalledTimes(4);

      jest.useRealTimers();
    });

    it('should retry on network errors and return error after all retries fail', async () => {
      jest.useFakeTimers();
      setToken('valid-token');

      // Mock 4 network errors (1 initial + 3 retries)
      for (let i = 0; i < 4; i++) {
        (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
          new Error('Network error')
        );
      }

      const promise = refreshToken();

      // Advance through all retry delays
      for (let i = 0; i < 3; i++) {
        await jest.advanceTimersByTimeAsync(5000);
      }

      const result = await promise;

      expect(result).toBe('error');
      expect(console.error).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should succeed on retry after initial failure', async () => {
      jest.useFakeTimers();
      setToken('valid-token');
      const newToken = 'retried-token';

      // First attempt fails with 500
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      // Second attempt succeeds
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: newToken, token_type: 'bearer' }),
      } as Response);

      const promise = refreshToken();

      // Advance past first retry delay (1000ms)
      await jest.advanceTimersByTimeAsync(1500);

      const result = await promise;

      expect(result).toBe('success');
      expect(getToken()).toBe(newToken);
      expect(global.fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should not retry on 401 (token expired)', async () => {
      setToken('expired-token');

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const result = await refreshToken();

      expect(result).toBe('expired');
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('should only refresh once when called multiple times concurrently', async () => {
      setToken('old-token');
      const newToken = 'new-token';

      // Mock a slow refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ access_token: newToken, token_type: 'bearer' }),
                } as Response),
              50
            )
          )
      );

      // Call refreshToken multiple times concurrently
      const [result1, result2, result3] = await Promise.all([
        refreshToken(),
        refreshToken(),
        refreshToken(),
      ]);

      // All should succeed
      expect(result1).toBe('success');
      expect(result2).toBe('success');
      expect(result3).toBe('success');

      // But fetch should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(getToken()).toBe(newToken);
    });

    it('should respect cooldown period and skip refresh', async () => {
      setToken('current-token');
      const newToken = 'refreshed-token';

      // First refresh
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: newToken, token_type: 'bearer' }),
      } as Response);

      const result1 = await refreshToken();
      expect(result1).toBe('success');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(getToken()).toBe(newToken);

      // Second refresh immediately (within cooldown)
      const result2 = await refreshToken();
      expect(result2).toBe('success');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should allow refresh after cooldown period', async () => {
      jest.useFakeTimers();
      setToken('current-token');

      // First refresh
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token1', token_type: 'bearer' }),
      } as Response);

      await refreshToken();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Advance time by 6 seconds (beyond cooldown)
      jest.advanceTimersByTime(6000);

      // Second refresh after cooldown
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token2', token_type: 'bearer' }),
      } as Response);

      await refreshToken();
      expect(global.fetch).toHaveBeenCalledTimes(2); // Now 2 calls

      jest.useRealTimers();
    });
  });

  describe('deleteUser', () => {
    it('should return false when no token exists', async () => {
      const result = await deleteUser();
      expect(result).toBe(false);
    });

    it('should delete user successfully', async () => {
      setToken('user-token');

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await deleteUser();

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer user-token' },
      });
      expect(result).toBe(true);
      expect(getToken()).toBeNull(); // Token cleared after successful deletion
    });

    it('should return false when deletion fails', async () => {
      setToken('user-token');

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
      } as Response);

      const result = await deleteUser();

      expect(result).toBe(false);
      expect(getToken()).toBe('user-token'); // Token not cleared on failure
    });

    it('should handle network errors', async () => {
      setToken('user-token');

      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await deleteUser();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error deleting user:', expect.any(Error));
    });
  });
});
