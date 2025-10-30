/**
 * Tests for API client functions.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { fetchItems, addItem, deleteItem, API_BASE, Item } from './api';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('API Client', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('fetchItems', () => {
    it('should fetch and return items successfully', async () => {
      const mockItems: Item[] = [
        { id: '1', name: 'Milk' },
        { id: '2', name: 'Bread' },
      ];

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockItems,
      } as Response);

      const result = await fetchItems();

      expect(global.fetch).toHaveBeenCalledWith(API_BASE);
      expect(result).toEqual(mockItems);
    });

    it('should return empty array when fetch fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
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
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
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

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => newItem,
      } as Response);

      const result = await addItem('Eggs');

      expect(global.fetch).toHaveBeenCalledWith(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Eggs' }),
      });
      expect(result).toEqual(newItem);
    });

    it('should return null when add fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
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
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
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
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await deleteItem('123');

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/123`, {
        method: 'DELETE',
      });
      expect(result).toBe(true);
    });

    it('should return false when delete fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
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
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
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
});
