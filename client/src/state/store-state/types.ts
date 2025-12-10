/**
 * Type definitions for store state management.
 */

import type { Store, Department, Product } from '../../data/api.js';

export type StoreStateListener = () => void;

export interface StoreState {
  stores: Store[];
  selectedStore: Store | null;
  departments: Department[];
  selectedDepartment: Department | null;
  products: Product[];
  isLoading: boolean;
  error: string | null;
}
