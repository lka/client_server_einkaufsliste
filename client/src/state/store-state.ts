/**
 * Store state manager with Observer pattern for reactive updates.
 *
 * Manages the state for stores, departments, and products.
 * Provides subscription mechanism for UI components to react to state changes.
 */

import type { Store, Department, Product } from '../data/api.js';
import {
  fetchStores,
  fetchDepartments,
  fetchStoreProducts,
  fetchDepartmentProducts,
} from '../data/api.js';

type StoreStateListener = () => void;

interface StoreState {
  stores: Store[];
  selectedStore: Store | null;
  departments: Department[];
  selectedDepartment: Department | null;
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

class StoreStateManager {
  private state: StoreState = {
    stores: [],
    selectedStore: null,
    departments: [],
    selectedDepartment: null,
    products: [],
    isLoading: false,
    error: null,
  };

  private listeners: Set<StoreStateListener> = new Set();

  /**
   * Subscribe to state changes.
   * Returns unsubscribe function.
   */
  subscribe(listener: StoreStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all subscribers of state change.
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Update state and notify subscribers.
   */
  private setState(updates: Partial<StoreState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  /**
   * Get current state (immutable copy).
   */
  getState(): Readonly<StoreState> {
    return { ...this.state };
  }

  /**
   * Get all stores.
   */
  getStores(): readonly Store[] {
    return [...this.state.stores];
  }

  /**
   * Get selected store.
   */
  getSelectedStore(): Store | null {
    return this.state.selectedStore ? { ...this.state.selectedStore } : null;
  }

  /**
   * Get departments for selected store.
   */
  getDepartments(): readonly Department[] {
    return [...this.state.departments];
  }

  /**
   * Get selected department.
   */
  getSelectedDepartment(): Department | null {
    return this.state.selectedDepartment ? { ...this.state.selectedDepartment } : null;
  }

  /**
   * Get products (filtered by selected store/department).
   */
  getProducts(): readonly Product[] {
    return [...this.state.products];
  }

  /**
   * Check if loading.
   */
  isLoading(): boolean {
    return this.state.isLoading;
  }

  /**
   * Get error message.
   */
  getError(): string | null {
    return this.state.error;
  }

  /**
   * Load all stores from API.
   */
  async loadStores(): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      const stores = await fetchStores();
      this.setState({
        stores,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading stores:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to load stores',
      });
    }
  }

  /**
   * Select a store and load its departments and products.
   */
  async selectStore(storeId: number): Promise<void> {
    const store = this.state.stores.find((s) => s.id === storeId);
    if (!store) {
      console.error('Store not found:', storeId);
      return;
    }

    this.setState({
      selectedStore: store,
      selectedDepartment: null,
      departments: [],
      products: [],
      isLoading: true,
      error: null,
    });

    try {
      // Load departments and products in parallel
      const [departments, products] = await Promise.all([
        fetchDepartments(storeId),
        fetchStoreProducts(storeId),
      ]);

      this.setState({
        departments,
        products,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading store data:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to load store data',
      });
    }
  }

  /**
   * Select a department and filter products.
   */
  async selectDepartment(departmentId: number | null): Promise<void> {
    if (departmentId === null) {
      // Clear department selection - show all products for store
      this.setState({
        selectedDepartment: null,
      });

      // Reload all products for the store
      if (this.state.selectedStore) {
        this.setState({ isLoading: true });
        try {
          const products = await fetchStoreProducts(this.state.selectedStore.id);
          this.setState({
            products,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error loading store products:', error);
          this.setState({
            isLoading: false,
            error: 'Failed to load products',
          });
        }
      }
      return;
    }

    const department = this.state.departments.find((d) => d.id === departmentId);
    if (!department) {
      console.error('Department not found:', departmentId);
      return;
    }

    this.setState({
      selectedDepartment: department,
      isLoading: true,
      error: null,
    });

    try {
      // Load products for this department
      const products = await fetchDepartmentProducts(departmentId);
      this.setState({
        products,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading department products:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to load products',
      });
    }
  }

  /**
   * Clear selection and reset to initial state.
   */
  clearSelection(): void {
    this.setState({
      selectedStore: null,
      selectedDepartment: null,
      departments: [],
      products: [],
      error: null,
    });
  }

  /**
   * Reset all state (for logout).
   */
  reset(): void {
    this.setState({
      stores: [],
      selectedStore: null,
      departments: [],
      selectedDepartment: null,
      products: [],
      isLoading: false,
      error: null,
    });
  }
}

// Export singleton instance
export const storeState = new StoreStateManager();
