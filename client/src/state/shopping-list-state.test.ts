/**
 * Tests for shopping list state management.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { shoppingListState } from './shopping-list-state';
import { Item } from '../data/api';

// Mock the API module
jest.mock('../data/api', () => ({
  fetchItems: jest.fn(),
  addItem: jest.fn(),
  deleteItem: jest.fn(),
}));

import * as api from '../data/api';

describe('Shopping List State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear state
    shoppingListState.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('should start with empty items', () => {
      expect(shoppingListState.getItems()).toEqual([]);
    });

    it('should not be loading initially', () => {
      expect(shoppingListState.isLoading()).toBe(false);
    });
  });

  describe('getItems', () => {
    it('should return a copy of items (not reference)', async () => {
      const mockItems: Item[] = [{ id: '1', name: 'Milk' }];
      (api.fetchItems as jest.MockedFunction<typeof api.fetchItems>).mockResolvedValue(mockItems);

      await shoppingListState.loadItems();
      const items1 = shoppingListState.getItems();
      const items2 = shoppingListState.getItems();

      expect(items1).toEqual(items2);
      expect(items1).not.toBe(items2); // Different references
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on state change', async () => {
      const listener = jest.fn();
      shoppingListState.subscribe(listener);

      const mockItems: Item[] = [{ id: '1', name: 'Milk' }];
      (api.fetchItems as jest.MockedFunction<typeof api.fetchItems>).mockResolvedValue(mockItems);

      await shoppingListState.loadItems();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(mockItems);
    });

    it('should return unsubscribe function', async () => {
      const listener = jest.fn();
      const unsubscribe = shoppingListState.subscribe(listener);

      const mockItems: Item[] = [{ id: '1', name: 'Milk' }];
      (api.fetchItems as jest.MockedFunction<typeof api.fetchItems>).mockResolvedValue(mockItems);

      await shoppingListState.loadItems();
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      await shoppingListState.loadItems();
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should notify multiple listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      shoppingListState.subscribe(listener1);
      shoppingListState.subscribe(listener2);

      const mockItems: Item[] = [{ id: '1', name: 'Milk' }];
      (api.fetchItems as jest.MockedFunction<typeof api.fetchItems>).mockResolvedValue(mockItems);

      await shoppingListState.loadItems();

      expect(listener1).toHaveBeenCalledWith(mockItems);
      expect(listener2).toHaveBeenCalledWith(mockItems);
    });
  });

  describe('loadItems', () => {
    it('should load items from API and update state', async () => {
      const mockItems: Item[] = [
        { id: '1', name: 'Milk' },
        { id: '2', name: 'Bread' },
      ];
      (api.fetchItems as jest.MockedFunction<typeof api.fetchItems>).mockResolvedValue(mockItems);

      const result = await shoppingListState.loadItems();

      expect(result).toBe(true);
      expect(shoppingListState.getItems()).toEqual(mockItems);
      expect(api.fetchItems).toHaveBeenCalledTimes(1);
    });

    it('should set loading state during operation', async () => {
      let loadingDuringFetch = false;
      (api.fetchItems as jest.Mock).mockImplementation(async () => {
        loadingDuringFetch = shoppingListState.isLoading();
        return [];
      });

      await shoppingListState.loadItems();

      expect(loadingDuringFetch).toBe(true);
      expect(shoppingListState.isLoading()).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      (api.fetchItems as jest.MockedFunction<typeof api.fetchItems>).mockRejectedValue(new Error('Network error'));

      const result = await shoppingListState.loadItems();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading items in state:',
        expect.any(Error)
      );
    });

    it('should reset loading state after error', async () => {
      (api.fetchItems as jest.MockedFunction<typeof api.fetchItems>).mockRejectedValue(new Error('Network error'));

      await shoppingListState.loadItems();

      expect(shoppingListState.isLoading()).toBe(false);
    });
  });

  describe('addItem', () => {
    it('should add item via API and update state', async () => {
      const newItem: Item = { id: '1', name: 'Milk' };
      (api.addItem as jest.MockedFunction<typeof api.addItem>).mockResolvedValue(newItem);

      const listener = jest.fn();
      shoppingListState.subscribe(listener);

      const result = await shoppingListState.addItem('Milk');

      expect(result).toEqual(newItem);
      expect(shoppingListState.getItems()).toContain(newItem);
      expect(listener).toHaveBeenCalledWith([newItem]);
    });

    it('should reject empty item name', async () => {
      const result = await shoppingListState.addItem('   ');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Cannot add empty item');
      expect(api.addItem).not.toHaveBeenCalled();
    });

    it('should handle API failure', async () => {
      (api.addItem as jest.MockedFunction<typeof api.addItem>).mockResolvedValue(null);

      const result = await shoppingListState.addItem('Milk');

      expect(result).toBeNull();
      expect(shoppingListState.getItems()).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.addItem as jest.MockedFunction<typeof api.addItem>).mockRejectedValue(new Error('Network error'));

      const result = await shoppingListState.addItem('Milk');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error adding item in state:',
        expect.any(Error)
      );
    });
  });

  describe('deleteItem', () => {
    beforeEach(async () => {
      const mockItems: Item[] = [
        { id: '1', name: 'Milk' },
        { id: '2', name: 'Bread' },
      ];
      (api.fetchItems as jest.MockedFunction<typeof api.fetchItems>).mockResolvedValue(mockItems);
      await shoppingListState.loadItems();
    });

    it('should delete item via API and update state', async () => {
      (api.deleteItem as jest.MockedFunction<typeof api.deleteItem>).mockResolvedValue(true);

      const listener = jest.fn();
      shoppingListState.subscribe(listener);

      const result = await shoppingListState.deleteItem('1');

      expect(result).toBe(true);
      expect(shoppingListState.getItems()).toEqual([{ id: '2', name: 'Bread' }]);
      expect(listener).toHaveBeenCalledWith([{ id: '2', name: 'Bread' }]);
    });

    it('should handle API failure', async () => {
      (api.deleteItem as jest.MockedFunction<typeof api.deleteItem>).mockResolvedValue(false);

      const result = await shoppingListState.deleteItem('1');

      expect(result).toBe(false);
      // State should not change
      expect(shoppingListState.getItems()).toHaveLength(2);
    });

    it('should handle API errors', async () => {
      (api.deleteItem as jest.MockedFunction<typeof api.deleteItem>).mockRejectedValue(new Error('Network error'));

      const result = await shoppingListState.deleteItem('1');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting item in state:',
        expect.any(Error)
      );
    });
  });

  describe('clear', () => {
    it('should clear all items and notify listeners', async () => {
      const mockItems: Item[] = [{ id: '1', name: 'Milk' }];
      (api.fetchItems as jest.MockedFunction<typeof api.fetchItems>).mockResolvedValue(mockItems);
      await shoppingListState.loadItems();

      const listener = jest.fn();
      shoppingListState.subscribe(listener);

      shoppingListState.clear();

      expect(shoppingListState.getItems()).toEqual([]);
      expect(listener).toHaveBeenCalledWith([]);
    });
  });
});
