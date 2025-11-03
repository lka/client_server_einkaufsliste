/**
 * Tests for API client functions.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { fetchItems, addItem, deleteItem, API_BASE, Item } from './api';
import { resetRefreshState } from './auth';

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

describe('API Client', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Clear localStorage
    localStorage.clear();
    // Set a mock token
    localStorage.setItem('auth_token', 'mock-token-123');
    // Reset token refresh state to avoid cooldown interference
    resetRefreshState();
    // Mock window.location.href for redirect tests
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  describe('fetchItems', () => {
    it('should fetch and return items successfully', async () => {
      const mockItems: Item[] = [
        { id: '1', name: 'Milk' },
        { id: '2', name: 'Bread' },
      ];

      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchItems response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockItems,
        } as Response);

      const result = await fetchItems();

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer mock-token-123' },
      });
      expect(global.fetch).toHaveBeenCalledWith(API_BASE, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
      });
      expect(result).toEqual(mockItems);
    });

    it('should return empty array when fetch fails', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchItems response (failure)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response);

      const result = await fetchItems();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch items:',
        'Not Found'
      );
    });

    it('should return empty array when network error occurs', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchItems response (network error)
        .mockRejectedValueOnce(
          new Error('Network error')
        );

      const result = await fetchItems();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching items:',
        expect.any(Error)
      );
    });
  });

  describe('addItem', () => {
    it('should add item successfully', async () => {
      const newItem: Item = { id: '123', name: 'Eggs' };

      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock addItem response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newItem,
        } as Response);

      const result = await addItem('Eggs');

      expect(global.fetch).toHaveBeenCalledWith(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Eggs', menge: undefined }),
      });
      expect(result).toEqual(newItem);
    });

    it('should add item with menge successfully', async () => {
      const newItem: Item = { id: '123', name: 'Möhren', menge: '500 g' };

      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock addItem response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newItem,
        } as Response);

      const result = await addItem('Möhren', '500 g');

      expect(global.fetch).toHaveBeenCalledWith(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Möhren', menge: '500 g' }),
      });
      expect(result).toEqual(newItem);
    });

    it('should return null when add fails', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock addItem response (failure)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
        } as Response);

      const result = await addItem('');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to add item:',
        'Bad Request'
      );
    });

    it('should return null when network error occurs', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock addItem response (network error)
        .mockRejectedValueOnce(
          new Error('Network error')
        );

      const result = await addItem('Eggs');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error adding item:',
        expect.any(Error)
      );
    });
  });

  describe('deleteItem', () => {
    it('should delete item successfully', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock deleteItem response
        .mockResolvedValueOnce({
          ok: true,
        } as Response);

      const result = await deleteItem('123');

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/123`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when delete fails', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock deleteItem response (failure)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response);

      const result = await deleteItem('999');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to delete item:',
        'Not Found'
      );
    });

    it('should return false when network error occurs', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock deleteItem response (network error)
        .mockRejectedValueOnce(
          new Error('Network error')
        );

      const result = await deleteItem('123');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting item:',
        expect.any(Error)
      );
    });
  });

  describe('401 Unauthorized Handling', () => {
    it('should handle 401 response in fetchItems by redirecting to login', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchItems response with 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await fetchItems();

      expect(result).toEqual([]);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should handle 401 response in addItem by redirecting to login', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock addItem response with 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await addItem('Test Item');

      expect(result).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should handle 401 response in deleteItem by redirecting to login', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock deleteItem response with 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await deleteItem('123');

      expect(result).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });
  });

  describe('Token Refresh Failure Handling', () => {
    it('should return empty array in fetchItems when token refresh fails', async () => {
      // Mock token refresh response (failure)
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const result = await fetchItems();

      expect(result).toEqual([]);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
      // Should only call fetch once for the refresh (no API call)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return null in addItem when token refresh fails', async () => {
      // Mock token refresh response (failure)
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const result = await addItem('Test Item');

      expect(result).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
      // Should only call fetch once for the refresh (no API call)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return false in deleteItem when token refresh fails', async () => {
      // Mock token refresh response (failure)
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const result = await deleteItem('123');

      expect(result).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
      // Should only call fetch once for the refresh (no API call)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty array in fetchItems when no token exists', async () => {
      // Clear the token
      localStorage.clear();

      const result = await fetchItems();

      expect(result).toEqual([]);
      // Should not make any fetch calls
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null in addItem when no token exists', async () => {
      // Clear the token
      localStorage.clear();

      const result = await addItem('Test Item');

      expect(result).toBeNull();
      // Should not make any fetch calls
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return false in deleteItem when no token exists', async () => {
      // Clear the token
      localStorage.clear();

      const result = await deleteItem('123');

      expect(result).toBe(false);
      // Should not make any fetch calls
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
