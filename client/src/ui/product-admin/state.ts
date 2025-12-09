/**
 * Product admin state management
 */

import type { Store, Department, Product } from '../../data/api.js';
import {
  fetchStores,
  fetchDepartments,
  fetchStoreProducts,
} from '../../data/api.js';

export interface ProductAdminState {
  stores: Store[];
  selectedStoreId: number | null;
  departments: Department[];
  products: Product[];
  filteredProducts: Product[];
  editingProductId: number | null;
  filterQuery: string;
  filterTimeout: number | null;
}

export const state: ProductAdminState = {
  stores: [],
  selectedStoreId: null,
  departments: [],
  products: [],
  filteredProducts: [],
  editingProductId: null,
  filterQuery: '',
  filterTimeout: null,
};

/**
 * Load all stores
 */
export async function loadStores(): Promise<void> {
  state.stores = await fetchStores();
}

/**
 * Load departments for a specific store
 */
export async function loadDepartments(storeId: number): Promise<void> {
  state.departments = await fetchDepartments(storeId);
}

/**
 * Load products for a specific store
 */
export async function loadProducts(storeId: number): Promise<void> {
  state.products = await fetchStoreProducts(storeId);
  applyFilter();
}

/**
 * Apply filter to products list
 */
export function applyFilter(): void {
  if (!state.filterQuery.trim()) {
    state.filteredProducts = [...state.products];
    return;
  }

  const query = state.filterQuery.toLowerCase();
  state.filteredProducts = state.products.filter(product => {
    // Search in product name
    if (product.name.toLowerCase().includes(query)) {
      return true;
    }

    // Search in department name
    const dept = state.departments.find(d => d.id === product.department_id);
    if (dept && dept.name.toLowerCase().includes(query)) {
      return true;
    }

    // Search for "frisch" keyword
    if (product.fresh && 'frisch'.includes(query)) {
      return true;
    }

    return false;
  });
}

/**
 * Get product by ID
 */
export function getProductById(productId: number): Product | undefined {
  return state.products.find(p => p.id === productId);
}

/**
 * Reset state when changing stores
 */
export function resetStateForStoreChange(): void {
  state.selectedStoreId = null;
  state.departments = [];
  state.products = [];
  state.filteredProducts = [];
  state.editingProductId = null;
  state.filterQuery = '';
}
