/**
 * Store CRUD operations.
 */

import type { Store } from '../../data/api.js';
import type { StoreState } from './types.js';
import { createStore, updateStore, deleteStore } from '../../data/api.js';

/**
 * Create a new store and add it to state.
 */
export async function addStore(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  name: string,
  location: string = ''
): Promise<Store | null> {
  setState({ isLoading: true, error: null });

  try {
    const newStore = await createStore(name, location);
    if (newStore) {
      setState({
        stores: [...state.stores, newStore],
        isLoading: false,
        error: null,
      });
      return newStore;
    }
    setState({ isLoading: false, error: 'Failed to create store' });
    return null;
  } catch (error) {
    console.error('Error creating store:', error);
    setState({
      isLoading: false,
      error: 'Failed to create store',
    });
    return null;
  }
}

/**
 * Update an existing store in state.
 */
export async function modifyStore(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  storeId: number,
  name?: string,
  location?: string,
  sortOrder?: number
): Promise<Store | null> {
  setState({ isLoading: true, error: null });

  try {
    const updatedStore = await updateStore(storeId, name, location, sortOrder);
    if (updatedStore) {
      const updatedStores = state.stores.map((s) =>
        s.id === storeId ? updatedStore : s
      );

      const updatedSelectedStore =
        state.selectedStore?.id === storeId
          ? updatedStore
          : state.selectedStore;

      setState({
        stores: updatedStores,
        selectedStore: updatedSelectedStore,
        isLoading: false,
        error: null,
      });
      return updatedStore;
    }
    setState({ isLoading: false, error: 'Failed to update store' });
    return null;
  } catch (error) {
    console.error('Error updating store:', error);
    setState({
      isLoading: false,
      error: 'Failed to update store',
    });
    return null;
  }
}

/**
 * Delete a store from state.
 */
export async function removeStore(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  storeId: number
): Promise<boolean> {
  setState({ isLoading: true, error: null });

  try {
    const success = await deleteStore(storeId);
    if (success) {
      const filteredStores = state.stores.filter((s) => s.id !== storeId);
      const shouldClearSelection = state.selectedStore?.id === storeId;

      setState({
        stores: filteredStores,
        selectedStore: shouldClearSelection ? null : state.selectedStore,
        departments: shouldClearSelection ? [] : state.departments,
        selectedDepartment: shouldClearSelection ? null : state.selectedDepartment,
        products: shouldClearSelection ? [] : state.products,
        isLoading: false,
        error: null,
      });
      return true;
    }
    setState({ isLoading: false, error: 'Failed to delete store' });
    return false;
  } catch (error) {
    console.error('Error deleting store:', error);
    setState({
      isLoading: false,
      error: 'Failed to delete store',
    });
    return false;
  }
}
