/**
 * Store and department selection logic.
 */

import type { StoreState } from './types.js';
import { fetchStores, fetchDepartments, fetchStoreProducts, fetchDepartmentProducts } from '../../data/api.js';

/**
 * Load all stores from API.
 */
export async function loadStores(
  setState: (updates: Partial<StoreState>) => void
): Promise<void> {
  setState({ isLoading: true, error: null });

  try {
    const stores = await fetchStores();
    setState({
      stores,
      isLoading: false,
      error: null,
    });
  } catch (error) {
    console.error('Error loading stores:', error);
    setState({
      isLoading: false,
      error: 'Failed to load stores',
    });
  }
}

/**
 * Select a store and load its departments and products.
 */
export async function selectStore(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  storeId: number
): Promise<void> {
  const store = state.stores.find((s) => s.id === storeId);
  if (!store) {
    console.error('Store not found:', storeId);
    return;
  }

  setState({
    selectedStore: store,
    selectedDepartment: null,
    departments: [],
    products: [],
    isLoading: true,
    error: null,
  });

  try {
    const [departments, products] = await Promise.all([
      fetchDepartments(storeId),
      fetchStoreProducts(storeId),
    ]);

    setState({
      departments,
      products,
      isLoading: false,
      error: null,
    });
  } catch (error) {
    console.error('Error loading store data:', error);
    setState({
      isLoading: false,
      error: 'Failed to load store data',
    });
  }
}

/**
 * Select a department and filter products.
 */
export async function selectDepartment(
  state: StoreState,
  setState: (updates: Partial<StoreState>) => void,
  departmentId: number | null
): Promise<void> {
  if (departmentId === null) {
    setState({
      selectedDepartment: null,
    });

    if (state.selectedStore) {
      setState({ isLoading: true });
      try {
        const products = await fetchStoreProducts(state.selectedStore.id);
        setState({
          products,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error loading store products:', error);
        setState({
          isLoading: false,
          error: 'Failed to load products',
        });
      }
    }
    return;
  }

  const department = state.departments.find((d) => d.id === departmentId);
  if (!department) {
    console.error('Department not found:', departmentId);
    return;
  }

  setState({
    selectedDepartment: department,
    isLoading: true,
    error: null,
  });

  try {
    const products = await fetchDepartmentProducts(departmentId);
    setState({
      products,
      isLoading: false,
      error: null,
    });
  } catch (error) {
    console.error('Error loading department products:', error);
    setState({
      isLoading: false,
      error: 'Failed to load products',
    });
  }
}

/**
 * Clear selection and reset to initial state.
 */
export function clearSelection(
  setState: (updates: Partial<StoreState>) => void
): void {
  setState({
    selectedStore: null,
    selectedDepartment: null,
    departments: [],
    products: [],
    error: null,
  });
}
