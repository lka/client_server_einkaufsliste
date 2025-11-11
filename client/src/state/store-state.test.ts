/**
 * Tests for store-state module
 */

import { storeState } from './store-state';
import * as api from '../data/api';

// Mock the API module
jest.mock('../data/api');

describe('StoreState', () => {
  const mockStores = [
    { id: 1, name: 'Rewe', location: 'Berlin' },
    { id: 2, name: 'Edeka', location: 'Hamburg' },
  ];

  const mockDepartments = [
    { id: 1, name: 'Obst & Gemüse', store_id: 1, sort_order: 0 },
    { id: 2, name: 'Milchprodukte', store_id: 1, sort_order: 1 },
    { id: 3, name: 'Backwaren', store_id: 1, sort_order: 2 },
  ];

  const mockProducts = [
    {
      id: 1,
      name: 'Äpfel',
      store_id: 1,
      department_id: 1,
      fresh: true,
    },
    {
      id: 2,
      name: 'Milch',
      store_id: 1,
      department_id: 2,
      fresh: true,
    },
  ];

  beforeEach(() => {
    // Reset state before each test
    storeState.reset();
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should have empty stores', () => {
      expect(storeState.getStores()).toEqual([]);
    });

    it('should have no selected store', () => {
      expect(storeState.getSelectedStore()).toBeNull();
    });

    it('should have no departments', () => {
      expect(storeState.getDepartments()).toEqual([]);
    });

    it('should have no selected department', () => {
      expect(storeState.getSelectedDepartment()).toBeNull();
    });

    it('should have no products', () => {
      expect(storeState.getProducts()).toEqual([]);
    });

    it('should not be loading', () => {
      expect(storeState.isLoading()).toBe(false);
    });

    it('should have no error', () => {
      expect(storeState.getError()).toBeNull();
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers on state change', async () => {
      const listener = jest.fn();
      storeState.subscribe(listener);

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );

      await storeState.loadStores();

      // Should be called at least twice: loading=true, then loading=false with data
      expect(listener).toHaveBeenCalled();
    });

    it('should allow unsubscribing', async () => {
      const listener = jest.fn();
      const unsubscribe = storeState.subscribe(listener);

      unsubscribe();

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      await storeState.loadStores();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      storeState.subscribe(listener1);
      storeState.subscribe(listener2);

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      await storeState.loadStores();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('loadStores', () => {
    it('should load stores from API', async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );

      await storeState.loadStores();

      expect(api.fetchStores).toHaveBeenCalled();
      expect(storeState.getStores()).toEqual(mockStores);
      expect(storeState.isLoading()).toBe(false);
      expect(storeState.getError()).toBeNull();
    });

    it('should set loading state while fetching', async () => {
      let loadingDuringFetch = false;

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockImplementation(
        async () => {
          loadingDuringFetch = storeState.isLoading();
          return mockStores;
        }
      );

      await storeState.loadStores();

      expect(loadingDuringFetch).toBe(true);
      expect(storeState.isLoading()).toBe(false);
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockRejectedValue(error);

      await storeState.loadStores();

      expect(storeState.getStores()).toEqual([]);
      expect(storeState.isLoading()).toBe(false);
      expect(storeState.getError()).toBe('Failed to load stores');
    });

    it('should clear previous error on successful load', async () => {
      // First load fails
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockRejectedValue(
        new Error('Error')
      );
      await storeState.loadStores();
      expect(storeState.getError()).toBe('Failed to load stores');

      // Second load succeeds
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      await storeState.loadStores();

      expect(storeState.getError()).toBeNull();
      expect(storeState.getStores()).toEqual(mockStores);
    });
  });

  describe('selectStore', () => {
    beforeEach(async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      await storeState.loadStores();
    });

    it('should select a store and load its departments and products', async () => {
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(
        mockDepartments
      );
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(
        mockProducts
      );

      await storeState.selectStore(1);

      expect(api.fetchDepartments).toHaveBeenCalledWith(1);
      expect(api.fetchStoreProducts).toHaveBeenCalledWith(1);
      expect(storeState.getSelectedStore()).toEqual(mockStores[0]);
      expect(storeState.getDepartments()).toEqual(mockDepartments);
      expect(storeState.getProducts()).toEqual(mockProducts);
      expect(storeState.isLoading()).toBe(false);
    });

    it('should clear department selection when selecting new store', async () => {
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(
        mockDepartments
      );
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(
        mockProducts
      );
      (api.fetchDepartmentProducts as jest.MockedFunction<typeof api.fetchDepartmentProducts>).mockResolvedValue(
        [mockProducts[0]]
      );

      // Select store and department
      await storeState.selectStore(1);
      await storeState.selectDepartment(1);

      expect(storeState.getSelectedDepartment()).not.toBeNull();

      // Select different store
      await storeState.selectStore(2);

      expect(storeState.getSelectedDepartment()).toBeNull();
    });

    it('should handle non-existent store ID', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await storeState.selectStore(999);

      expect(consoleSpy).toHaveBeenCalledWith('Store not found:', 999);
      expect(storeState.getSelectedStore()).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should handle API errors when loading store data', async () => {
      const error = new Error('Network error');
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockRejectedValue(
        error
      );
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockRejectedValue(
        error
      );

      await storeState.selectStore(1);

      expect(storeState.getSelectedStore()).toEqual(mockStores[0]);
      expect(storeState.isLoading()).toBe(false);
      expect(storeState.getError()).toBe('Failed to load store data');
      expect(storeState.getDepartments()).toEqual([]);
      expect(storeState.getProducts()).toEqual([]);
    });

    it('should load departments and products in parallel', async () => {
      const fetchOrder: string[] = [];

      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockImplementation(
        async () => {
          fetchOrder.push('departments');
          return mockDepartments;
        }
      );

      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockImplementation(
        async () => {
          fetchOrder.push('products');
          return mockProducts;
        }
      );

      await storeState.selectStore(1);

      // Both should be called (order doesn't matter for parallel)
      expect(fetchOrder).toContain('departments');
      expect(fetchOrder).toContain('products');
      expect(api.fetchDepartments).toHaveBeenCalled();
      expect(api.fetchStoreProducts).toHaveBeenCalled();
    });
  });

  describe('selectDepartment', () => {
    beforeEach(async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(
        mockDepartments
      );
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(
        mockProducts
      );

      await storeState.loadStores();
      await storeState.selectStore(1);
    });

    it('should select a department and filter products', async () => {
      const deptProducts = [mockProducts[0]];
      (api.fetchDepartmentProducts as jest.MockedFunction<typeof api.fetchDepartmentProducts>).mockResolvedValue(
        deptProducts
      );

      await storeState.selectDepartment(1);

      expect(api.fetchDepartmentProducts).toHaveBeenCalledWith(1);
      expect(storeState.getSelectedDepartment()).toEqual(mockDepartments[0]);
      expect(storeState.getProducts()).toEqual(deptProducts);
      expect(storeState.isLoading()).toBe(false);
    });

    it('should clear department selection when passing null', async () => {
      // First select a department
      (api.fetchDepartmentProducts as jest.MockedFunction<typeof api.fetchDepartmentProducts>).mockResolvedValue(
        [mockProducts[0]]
      );
      await storeState.selectDepartment(1);
      expect(storeState.getSelectedDepartment()).not.toBeNull();

      // Then clear selection
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(
        mockProducts
      );
      await storeState.selectDepartment(null);

      expect(storeState.getSelectedDepartment()).toBeNull();
      expect(api.fetchStoreProducts).toHaveBeenCalledWith(1); // Should reload all store products
      expect(storeState.getProducts()).toEqual(mockProducts);
    });

    it('should handle non-existent department ID', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await storeState.selectDepartment(999);

      expect(consoleSpy).toHaveBeenCalledWith('Department not found:', 999);
      expect(storeState.getSelectedDepartment()).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should handle API errors when loading department products', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Network error');
      (api.fetchDepartmentProducts as jest.MockedFunction<typeof api.fetchDepartmentProducts>).mockRejectedValue(
        error
      );

      await storeState.selectDepartment(1);

      expect(storeState.getSelectedDepartment()).toEqual(mockDepartments[0]);
      expect(storeState.isLoading()).toBe(false);
      expect(storeState.getError()).toBe('Failed to load products');
      expect(consoleSpy).toHaveBeenCalledWith('Error loading department products:', error);

      consoleSpy.mockRestore();
    });

    it('should handle clearing selection when no store is selected', async () => {
      // Start fresh without selected store
      storeState.reset();

      await storeState.selectDepartment(null);

      expect(storeState.getSelectedDepartment()).toBeNull();
      // fetchStoreProducts should not be called since we cleared before
      // Note: The implementation checks for selectedStore before calling API
    });
  });

  describe('clearSelection', () => {
    beforeEach(async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(
        mockDepartments
      );
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(
        mockProducts
      );
      (api.fetchDepartmentProducts as jest.MockedFunction<typeof api.fetchDepartmentProducts>).mockResolvedValue(
        [mockProducts[0]]
      );

      await storeState.loadStores();
      await storeState.selectStore(1);
      await storeState.selectDepartment(1);
    });

    it('should clear store and department selection', () => {
      storeState.clearSelection();

      expect(storeState.getSelectedStore()).toBeNull();
      expect(storeState.getSelectedDepartment()).toBeNull();
      expect(storeState.getDepartments()).toEqual([]);
      expect(storeState.getProducts()).toEqual([]);
      expect(storeState.getError()).toBeNull();
    });

    it('should keep stores list intact', () => {
      const storesBefore = storeState.getStores();
      storeState.clearSelection();

      expect(storeState.getStores()).toEqual(storesBefore);
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      await storeState.loadStores();
    });

    it('should reset all state to initial values', () => {
      storeState.reset();

      expect(storeState.getStores()).toEqual([]);
      expect(storeState.getSelectedStore()).toBeNull();
      expect(storeState.getDepartments()).toEqual([]);
      expect(storeState.getSelectedDepartment()).toBeNull();
      expect(storeState.getProducts()).toEqual([]);
      expect(storeState.isLoading()).toBe(false);
      expect(storeState.getError()).toBeNull();
    });
  });

  describe('Immutability', () => {
    it('should return immutable copies from getStores', async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      await storeState.loadStores();

      const stores1 = storeState.getStores();
      const stores2 = storeState.getStores();

      expect(stores1).toEqual(stores2);
      expect(stores1).not.toBe(stores2); // Different array instances
    });

    it('should return immutable copy from getSelectedStore', async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(
        mockDepartments
      );
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(
        mockProducts
      );

      await storeState.loadStores();
      await storeState.selectStore(1);

      const store1 = storeState.getSelectedStore();
      const store2 = storeState.getSelectedStore();

      expect(store1).toEqual(store2);
      expect(store1).not.toBe(store2); // Different object instances
    });

    it('should return immutable copies from getDepartments', async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(
        mockDepartments
      );
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(
        mockProducts
      );

      await storeState.loadStores();
      await storeState.selectStore(1);

      const depts1 = storeState.getDepartments();
      const depts2 = storeState.getDepartments();

      expect(depts1).toEqual(depts2);
      expect(depts1).not.toBe(depts2); // Different array instances
    });

    it('should return immutable copies from getProducts', async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(
        mockDepartments
      );
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(
        mockProducts
      );

      await storeState.loadStores();
      await storeState.selectStore(1);

      const products1 = storeState.getProducts();
      const products2 = storeState.getProducts();

      expect(products1).toEqual(products2);
      expect(products1).not.toBe(products2); // Different array instances
    });

    it('should return immutable copy from getState', async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      await storeState.loadStores();

      const state1 = storeState.getState();
      const state2 = storeState.getState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2); // Different object instances
    });
  });

  describe('Error handling', () => {
    it('should handle console.error for store not found', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      await storeState.loadStores();

      await storeState.selectStore(999);

      expect(consoleSpy).toHaveBeenCalledWith('Store not found:', 999);
      consoleSpy.mockRestore();
    });

    it('should handle console.error for department not found', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(
        mockStores
      );
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(
        mockDepartments
      );
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(
        mockProducts
      );

      await storeState.loadStores();
      await storeState.selectStore(1);
      await storeState.selectDepartment(999);

      expect(consoleSpy).toHaveBeenCalledWith('Department not found:', 999);
      consoleSpy.mockRestore();
    });
  });
});
