/**
 * Tests for API client functions.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  fetchItems,
  addItem,
  deleteItem,
  fetchStores,
  fetchDepartments,
  fetchStoreProducts,
  fetchDepartmentProducts,
  createStore,
  updateStore,
  deleteStore,
  createDepartment,
  deleteDepartment,
  updateDepartment,
  createProduct,
  updateProduct,
  deleteProduct,
  API_BASE,
  API_STORES,
  Item,
  Store,
  Department,
  Product,
} from './api';
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

  describe('addItem with store_id', () => {
    it('should add item with store_id successfully', async () => {
      const newItem: Item = { id: '123', name: 'Möhren', menge: '500 g', store_id: 1 };

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

      const result = await addItem('Möhren', '500 g', 1);

      expect(global.fetch).toHaveBeenCalledWith(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Möhren', menge: '500 g', store_id: 1 }),
      });
      expect(result).toEqual(newItem);
    });
  });

  describe('fetchStores', () => {
    it('should fetch and return stores successfully', async () => {
      const mockStores: Store[] = [
        { id: 1, name: 'Rewe', location: 'Berlin' },
        { id: 2, name: 'Edeka', location: 'Hamburg' },
      ];

      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchStores response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStores,
        } as Response);

      const result = await fetchStores();

      expect(global.fetch).toHaveBeenCalledWith(API_STORES, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
      });
      expect(result).toEqual(mockStores);
    });

    it('should return empty array when fetch fails', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchStores response (failure)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Internal Server Error',
        } as Response);

      const result = await fetchStores();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to fetch stores:', 'Internal Server Error');
    });

    it('should return empty array when network error occurs', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchStores response (network error)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchStores();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching stores:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchStores response with 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await fetchStores();

      expect(result).toEqual([]);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return empty array when no token exists', async () => {
      localStorage.clear();
      const result = await fetchStores();
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('fetchDepartments', () => {
    it('should fetch and return departments successfully', async () => {
      const mockDepartments: Department[] = [
        { id: 1, name: 'Obst & Gemüse', store_id: 1, sort_order: 0 },
        { id: 2, name: 'Milchprodukte', store_id: 1, sort_order: 1 },
      ];

      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchDepartments response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDepartments,
        } as Response);

      const result = await fetchDepartments(1);

      expect(global.fetch).toHaveBeenCalledWith(`${API_STORES}/1/departments`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
      });
      expect(result).toEqual(mockDepartments);
    });

    it('should return empty array when fetch fails', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchDepartments response (failure)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response);

      const result = await fetchDepartments(999);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to fetch departments:', 'Not Found');
    });

    it('should return empty array when network error occurs', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchDepartments response (network error)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchDepartments(1);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching departments:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchDepartments response with 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await fetchDepartments(1);

      expect(result).toEqual([]);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return empty array when no token exists', async () => {
      localStorage.clear();
      const result = await fetchDepartments(1);
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('fetchStoreProducts', () => {
    it('should fetch and return store products successfully', async () => {
      const mockProducts: Product[] = [
        { id: 1, name: 'Möhren', store_id: 1, department_id: 1, fresh: true },
        { id: 2, name: 'Milch', store_id: 1, department_id: 2, fresh: true },
      ];

      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchStoreProducts response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProducts,
        } as Response);

      const result = await fetchStoreProducts(1);

      expect(global.fetch).toHaveBeenCalledWith(`${API_STORES}/1/products`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
      });
      expect(result).toEqual(mockProducts);
    });

    it('should return empty array when fetch fails', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchStoreProducts response (failure)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response);

      const result = await fetchStoreProducts(999);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to fetch store products:', 'Not Found');
    });

    it('should return empty array when network error occurs', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchStoreProducts response (network error)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchStoreProducts(1);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching store products:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchStoreProducts response with 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await fetchStoreProducts(1);

      expect(result).toEqual([]);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return empty array when no token exists', async () => {
      localStorage.clear();
      const result = await fetchStoreProducts(1);
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('fetchDepartmentProducts', () => {
    it('should fetch and return department products successfully', async () => {
      const mockProducts: Product[] = [
        { id: 1, name: 'Möhren', store_id: 1, department_id: 1, fresh: true },
        { id: 3, name: 'Tomaten', store_id: 1, department_id: 1, fresh: true },
      ];

      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchDepartmentProducts response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProducts,
        } as Response);

      const result = await fetchDepartmentProducts(1);

      expect(global.fetch).toHaveBeenCalledWith('/api/departments/1/products', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
      });
      expect(result).toEqual(mockProducts);
    });

    it('should return empty array when fetch fails', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchDepartmentProducts response (failure)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response);

      const result = await fetchDepartmentProducts(999);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to fetch department products:', 'Not Found');
    });

    it('should return empty array when network error occurs', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchDepartmentProducts response (network error)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchDepartmentProducts(1);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching department products:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      // Mock token refresh response
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        // Mock fetchDepartmentProducts response with 401
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await fetchDepartmentProducts(1);

      expect(result).toEqual([]);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return empty array when no token exists', async () => {
      localStorage.clear();
      const result = await fetchDepartmentProducts(1);
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('createStore', () => {
    it('should create store successfully', async () => {
      const newStore: Store = { id: 1, name: 'Rewe', location: 'Berlin' };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newStore,
        } as Response);

      const result = await createStore('Rewe', 'Berlin');

      expect(global.fetch).toHaveBeenCalledWith('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Rewe', location: 'Berlin' }),
      });
      expect(result).toEqual(newStore);
    });

    it('should create store with default empty location', async () => {
      const newStore: Store = { id: 1, name: 'Edeka', location: '' };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newStore,
        } as Response);

      const result = await createStore('Edeka');

      expect(global.fetch).toHaveBeenCalledWith('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Edeka', location: '' }),
      });
      expect(result).toEqual(newStore);
    });

    it('should return null when create fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
        } as Response);

      const result = await createStore('');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to create store:', 'Bad Request');
    });

    it('should return null when network error occurs', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await createStore('Rewe');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error creating store:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await createStore('Rewe');

      expect(result).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return null when no token exists', async () => {
      localStorage.clear();
      const result = await createStore('Rewe');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('updateStore', () => {
    it('should update store successfully', async () => {
      const updatedStore: Store = { id: 1, name: 'Updated Store', location: 'New Location', sort_order: 5 };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedStore,
        } as Response);

      const result = await updateStore(1, 'Updated Store', 'New Location', 5);

      expect(global.fetch).toHaveBeenCalledWith('/api/stores/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({
          name: 'Updated Store',
          location: 'New Location',
          sort_order: 5,
        }),
      });
      expect(result).toEqual(updatedStore);
    });

    it('should update only sort_order', async () => {
      const updatedStore: Store = { id: 1, name: 'Test Store', location: 'Location', sort_order: 10 };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedStore,
        } as Response);

      const result = await updateStore(1, undefined, undefined, 10);

      expect(global.fetch).toHaveBeenCalledWith('/api/stores/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({
          sort_order: 10,
        }),
      });
      expect(result).toEqual(updatedStore);
    });

    it('should return null when update fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
        } as Response);

      const result = await updateStore(999, 'NonExistent');

      expect(result).toBeNull();
    });

    it('should return null when network error occurs', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await updateStore(1, 'Test');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error updating store:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await updateStore(1, 'Test');

      expect(result).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return null when no token exists', async () => {
      localStorage.clear();
      const result = await updateStore(1, 'Test');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('deleteStore', () => {
    it('should delete store successfully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
        } as Response);

      const result = await deleteStore(1);

      expect(global.fetch).toHaveBeenCalledWith('/api/stores/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when delete fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
        } as Response);

      const result = await deleteStore(999);

      expect(result).toBe(false);
    });

    it('should return false when network error occurs', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await deleteStore(1);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error deleting store:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await deleteStore(1);

      expect(result).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return false when no token exists', async () => {
      localStorage.clear();
      const result = await deleteStore(1);
      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('createDepartment', () => {
    it('should create department successfully', async () => {
      const newDept: Department = { id: 1, name: 'Obst & Gemüse', store_id: 1, sort_order: 0 };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newDept,
        } as Response);

      const result = await createDepartment(1, 'Obst & Gemüse', 0);

      expect(global.fetch).toHaveBeenCalledWith('/api/stores/1/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Obst & Gemüse', sort_order: 0 }),
      });
      expect(result).toEqual(newDept);
    });

    it('should create department with default sort_order', async () => {
      const newDept: Department = { id: 1, name: 'Milchprodukte', store_id: 1, sort_order: 0 };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newDept,
        } as Response);

      const result = await createDepartment(1, 'Milchprodukte');

      expect(global.fetch).toHaveBeenCalledWith('/api/stores/1/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Milchprodukte', sort_order: 0 }),
      });
      expect(result).toEqual(newDept);
    });

    it('should return null when create fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
        } as Response);

      const result = await createDepartment(1, '');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to create department:', 'Bad Request');
    });

    it('should return null when network error occurs', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await createDepartment(1, 'Obst');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error creating department:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await createDepartment(1, 'Obst');

      expect(result).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return null when no token exists', async () => {
      localStorage.clear();
      const result = await createDepartment(1, 'Obst');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('deleteDepartment', () => {
    it('should delete department successfully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
        } as Response);

      const result = await deleteDepartment(1);

      expect(global.fetch).toHaveBeenCalledWith('/api/departments/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when delete fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
        } as Response);

      const result = await deleteDepartment(999);

      expect(result).toBe(false);
    });

    it('should return false when network error occurs', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await deleteDepartment(1);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error deleting department:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await deleteDepartment(1);

      expect(result).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return false when no token exists', async () => {
      localStorage.clear();
      const result = await deleteDepartment(1);
      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('updateDepartment', () => {
    it('should update department name successfully', async () => {
      const updatedDept: Department = { id: 1, name: 'Fruits & Vegetables', store_id: 1, sort_order: 0 };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedDept,
        } as Response);

      const result = await updateDepartment(1, 'Fruits & Vegetables', undefined);

      expect(global.fetch).toHaveBeenCalledWith('/api/departments/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Fruits & Vegetables' }),
      });
      expect(result).toEqual(updatedDept);
    });

    it('should update department sort_order successfully', async () => {
      const updatedDept: Department = { id: 1, name: 'Obst & Gemüse', store_id: 1, sort_order: 5 };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedDept,
        } as Response);

      const result = await updateDepartment(1, undefined, 5);

      expect(global.fetch).toHaveBeenCalledWith('/api/departments/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ sort_order: 5 }),
      });
      expect(result).toEqual(updatedDept);
    });

    it('should update both name and sort_order successfully', async () => {
      const updatedDept: Department = { id: 1, name: 'Fruits', store_id: 1, sort_order: 3 };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedDept,
        } as Response);

      const result = await updateDepartment(1, 'Fruits', 3);

      expect(global.fetch).toHaveBeenCalledWith('/api/departments/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Fruits', sort_order: 3 }),
      });
      expect(result).toEqual(updatedDept);
    });

    it('should return null when update fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response);

      const result = await updateDepartment(999, 'Test');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to update department:', 'Not Found');
    });

    it('should return null when network error occurs', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await updateDepartment(1, 'Test');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error updating department:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await updateDepartment(1, 'Test');

      expect(result).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return null when no token exists', async () => {
      localStorage.clear();
      const result = await updateDepartment(1, 'Test');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const newProduct: Product = { id: 1, name: 'Möhren', store_id: 1, department_id: 1, fresh: true };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newProduct,
        } as Response);

      const result = await createProduct('Möhren', 1, 1, true);

      expect(global.fetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Möhren', store_id: 1, department_id: 1, fresh: true }),
      });
      expect(result).toEqual(newProduct);
    });

    it('should create product with default fresh=false', async () => {
      const newProduct: Product = { id: 1, name: 'Reis', store_id: 1, department_id: 2, fresh: false };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newProduct,
        } as Response);

      const result = await createProduct('Reis', 1, 2);

      expect(global.fetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Reis', store_id: 1, department_id: 2, fresh: false }),
      });
      expect(result).toEqual(newProduct);
    });

    it('should return null when create fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
        } as Response);

      const result = await createProduct('', 1, 1);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to create product:', 'Bad Request');
    });

    it('should return null when network error occurs', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await createProduct('Möhren', 1, 1);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error creating product:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await createProduct('Möhren', 1, 1);

      expect(result).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return null when no token exists', async () => {
      localStorage.clear();
      const result = await createProduct('Möhren', 1, 1);
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('should update product name successfully', async () => {
      const updatedProduct: Product = { id: 1, name: 'Karotten', store_id: 1, department_id: 1, fresh: true };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedProduct,
        } as Response);

      const result = await updateProduct(1, { name: 'Karotten' });

      expect(global.fetch).toHaveBeenCalledWith('/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Karotten' }),
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should update product department successfully', async () => {
      const updatedProduct: Product = { id: 1, name: 'Möhren', store_id: 1, department_id: 2, fresh: true };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedProduct,
        } as Response);

      const result = await updateProduct(1, { departmentId: 2 });

      expect(global.fetch).toHaveBeenCalledWith('/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ department_id: 2 }),
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should update product fresh status successfully', async () => {
      const updatedProduct: Product = { id: 1, name: 'Möhren', store_id: 1, department_id: 1, fresh: false };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedProduct,
        } as Response);

      const result = await updateProduct(1, { fresh: false });

      expect(global.fetch).toHaveBeenCalledWith('/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ fresh: false }),
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should update multiple product fields successfully', async () => {
      const updatedProduct: Product = { id: 1, name: 'Karotten', store_id: 2, department_id: 3, fresh: false };

      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedProduct,
        } as Response);

      const result = await updateProduct(1, { name: 'Karotten', storeId: 2, departmentId: 3, fresh: false });

      expect(global.fetch).toHaveBeenCalledWith('/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
        body: JSON.stringify({ name: 'Karotten', store_id: 2, department_id: 3, fresh: false }),
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should return null when update fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response);

      const result = await updateProduct(999, { name: 'Test' });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Failed to update product:', 'Not Found');
    });

    it('should return null when network error occurs', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await updateProduct(1, { name: 'Test' });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error updating product:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await updateProduct(1, { name: 'Test' });

      expect(result).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return null when no token exists', async () => {
      localStorage.clear();
      const result = await updateProduct(1, { name: 'Test' });
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
        } as Response);

      const result = await deleteProduct(1);

      expect(global.fetch).toHaveBeenCalledWith('/api/products/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refreshed-token-456',
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when delete fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
        } as Response);

      const result = await deleteProduct(999);

      expect(result).toBe(false);
    });

    it('should return false when network error occurs', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await deleteProduct(1);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error deleting product:', expect.any(Error));
    });

    it('should handle 401 response by redirecting to login', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'refreshed-token-456', token_type: 'bearer' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response);

      const result = await deleteProduct(1);

      expect(result).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    it('should return false when no token exists', async () => {
      localStorage.clear();
      const result = await deleteProduct(1);
      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
