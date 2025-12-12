/**
 * Product Admin state management.
 * Manages product, store, and department state with WebSocket integration.
 */

import type { Store, Department, Product } from '../data/api.js';
import {
  fetchStores,
  fetchDepartments,
  fetchStoreProducts,
} from '../data/api.js';
import * as websocket from '../data/websocket.js';

type StateChangeListener = (state: ProductAdminStateData) => void;

export interface ProductAdminStateData {
  stores: Store[];
  selectedStoreId: number | null;
  departments: Department[];
  products: Product[];
  filteredProducts: Product[];
  editingProductId: number | null;
  filterQuery: string;
}

/**
 * Product Admin state manager.
 * Provides centralized state management with WebSocket integration.
 */
class ProductAdminState {
  private state: ProductAdminStateData = {
    stores: [],
    selectedStoreId: null,
    departments: [],
    products: [],
    filteredProducts: [],
    editingProductId: null,
    filterQuery: '',
  };

  private listeners: Set<StateChangeListener> = new Set();
  private wsUnsubscribers: Array<() => void> = [];

  constructor() {
    this.initializeWebSocket();
  }

  /**
   * Initialize WebSocket event listeners for real-time updates.
   */
  private initializeWebSocket(): void {
    // Only initialize if WebSocket is supported and feature flag is enabled
    if (!websocket.isWebSocketSupported()) {
      console.log('WebSocket not supported for product-admin');
      return;
    }

    const wsEnabled = localStorage.getItem('enable_ws') === 'true';
    if (!wsEnabled) {
      console.log('WebSocket disabled by feature flag for product-admin');
      return;
    }

    // Subscribe to product events
    this.wsUnsubscribers.push(
      websocket.onProductAdded((product: Product) => {
        // Only add if it belongs to the currently selected store
        if (this.state.selectedStoreId && product.store_id === this.state.selectedStoreId) {
          const existingIndex = this.state.products.findIndex(p => p.id === product.id);
          if (existingIndex === -1) {
            this.state.products.push(product);
            this.applyFilter();
            this.notifyListeners();
          }
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onProductUpdated((product: Product) => {
        const existingIndex = this.state.products.findIndex(p => p.id === product.id);
        if (existingIndex !== -1) {
          this.state.products[existingIndex] = product;
          this.applyFilter();
          this.notifyListeners();
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onProductDeleted((data: { id: number }) => {
        const initialLength = this.state.products.length;
        this.state.products = this.state.products.filter(p => p.id !== data.id);
        if (this.state.products.length !== initialLength) {
          this.applyFilter();
          this.notifyListeners();
        }
      })
    );

    // Subscribe to department events
    this.wsUnsubscribers.push(
      websocket.onDepartmentAdded((department: Department) => {
        if (this.state.selectedStoreId && department.store_id === this.state.selectedStoreId) {
          const existingIndex = this.state.departments.findIndex(d => d.id === department.id);
          if (existingIndex === -1) {
            this.state.departments.push(department);
            this.notifyListeners();
          }
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onDepartmentUpdated((department: Department) => {
        const existingIndex = this.state.departments.findIndex(d => d.id === department.id);
        if (existingIndex !== -1) {
          this.state.departments[existingIndex] = department;
          this.applyFilter(); // Re-apply filter as department names might be used in search
          this.notifyListeners();
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onDepartmentDeleted((data: { id: number }) => {
        const initialLength = this.state.departments.length;
        this.state.departments = this.state.departments.filter(d => d.id !== data.id);
        if (this.state.departments.length !== initialLength) {
          this.notifyListeners();
        }
      })
    );

    // Subscribe to store events
    this.wsUnsubscribers.push(
      websocket.onStoreAdded((store: Store) => {
        const existingIndex = this.state.stores.findIndex(s => s.id === store.id);
        if (existingIndex === -1) {
          this.state.stores.push(store);
          this.notifyListeners();
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onStoreUpdated((store: Store) => {
        const existingIndex = this.state.stores.findIndex(s => s.id === store.id);
        if (existingIndex !== -1) {
          this.state.stores[existingIndex] = store;
          this.notifyListeners();
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onStoreDeleted((data: { id: number }) => {
        const initialLength = this.state.stores.length;
        this.state.stores = this.state.stores.filter(s => s.id !== data.id);
        if (this.state.stores.length !== initialLength) {
          // If the deleted store was selected, reset selection
          if (this.state.selectedStoreId === data.id) {
            this.resetStateForStoreChange();
          }
          this.notifyListeners();
        }
      })
    );
  }

  /**
   * Get current state (read-only copy).
   */
  getState(): ProductAdminStateData {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change.
   */
  private notifyListeners(): void {
    const stateCopy = this.getState();
    this.listeners.forEach(listener => listener(stateCopy));
  }

  /**
   * Load stores from API.
   */
  async loadStores(): Promise<void> {
    this.state.stores = await fetchStores();
    this.notifyListeners();
  }

  /**
   * Load departments for a specific store.
   */
  async loadDepartments(storeId: number): Promise<void> {
    this.state.departments = await fetchDepartments(storeId);
    this.notifyListeners();
  }

  /**
   * Load products for a specific store.
   */
  async loadProducts(storeId: number): Promise<void> {
    this.state.products = await fetchStoreProducts(storeId);
    this.applyFilter();
    this.notifyListeners();
  }

  /**
   * Set selected store ID.
   */
  setSelectedStoreId(storeId: number | null): void {
    this.state.selectedStoreId = storeId;
    this.notifyListeners();
  }

  /**
   * Set editing product ID.
   */
  setEditingProductId(productId: number | null): void {
    this.state.editingProductId = productId;
    this.notifyListeners();
  }

  /**
   * Set filter query and apply filter.
   */
  setFilterQuery(query: string): void {
    this.state.filterQuery = query;
    this.applyFilter();
    this.notifyListeners();
  }

  /**
   * Apply filter to products list.
   */
  private applyFilter(): void {
    if (!this.state.filterQuery.trim()) {
      this.state.filteredProducts = [...this.state.products];
      return;
    }

    const query = this.state.filterQuery.toLowerCase();
    this.state.filteredProducts = this.state.products.filter(product => {
      // Search in product name
      if (product.name.toLowerCase().includes(query)) {
        return true;
      }

      // Search in department name
      const dept = this.state.departments.find(d => d.id === product.department_id);
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
   * Get product by ID.
   */
  getProductById(productId: number): Product | undefined {
    return this.state.products.find(p => p.id === productId);
  }

  /**
   * Reset state when changing stores.
   */
  resetStateForStoreChange(): void {
    this.state.selectedStoreId = null;
    this.state.departments = [];
    this.state.products = [];
    this.state.filteredProducts = [];
    this.state.editingProductId = null;
    this.state.filterQuery = '';
    this.notifyListeners();
  }

  /**
   * Cleanup WebSocket subscriptions.
   */
  cleanup(): void {
    this.wsUnsubscribers.forEach(unsub => unsub());
    this.wsUnsubscribers = [];
  }
}

// Export singleton instance
export const productAdminState = new ProductAdminState();
