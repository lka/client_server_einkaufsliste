/**
 * Store state manager with Observer pattern for reactive updates.
 *
 * Manages the state for stores, departments, and products.
 * Provides subscription mechanism for UI components to react to state changes.
 */

import type { Store, Department, Product } from '../data/api.js';
import type { StoreState, StoreStateListener } from './store-state/types.js';
import * as StoreOps from './store-state/store-operations.js';
import * as DepartmentOps from './store-state/department-operations.js';
import * as ProductOps from './store-state/product-operations.js';
import * as Selection from './store-state/selection.js';

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
  private setState = (updates: Partial<StoreState>): void => {
    this.state = { ...this.state, ...updates };
    this.notify();
  };

  /**
   * Get current state (immutable copy).
   */
  getState(): Readonly<StoreState> {
    return { ...this.state };
  }

  // ========== GETTERS ==========

  getStores(): readonly Store[] {
    return [...this.state.stores];
  }

  getSelectedStore(): Store | null {
    return this.state.selectedStore ? { ...this.state.selectedStore } : null;
  }

  getDepartments(): readonly Department[] {
    return [...this.state.departments];
  }

  getSelectedDepartment(): Department | null {
    return this.state.selectedDepartment ? { ...this.state.selectedDepartment } : null;
  }

  getProducts(): readonly Product[] {
    return [...this.state.products];
  }

  isLoading(): boolean {
    return this.state.isLoading;
  }

  getError(): string | null {
    return this.state.error;
  }

  // ========== SELECTION ==========

  async loadStores(): Promise<void> {
    return Selection.loadStores(this.setState);
  }

  async selectStore(storeId: number): Promise<void> {
    return Selection.selectStore(this.state, this.setState, storeId);
  }

  async selectDepartment(departmentId: number | null): Promise<void> {
    return Selection.selectDepartment(this.state, this.setState, departmentId);
  }

  clearSelection(): void {
    Selection.clearSelection(this.setState);
  }

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

  // ========== STORE CRUD ==========

  async addStore(name: string, location: string = ''): Promise<Store | null> {
    return StoreOps.addStore(this.state, this.setState, name, location);
  }

  async modifyStore(
    storeId: number,
    name?: string,
    location?: string,
    sortOrder?: number
  ): Promise<Store | null> {
    return StoreOps.modifyStore(this.state, this.setState, storeId, name, location, sortOrder);
  }

  async removeStore(storeId: number): Promise<boolean> {
    return StoreOps.removeStore(this.state, this.setState, storeId);
  }

  // ========== DEPARTMENT CRUD ==========

  async addDepartment(
    storeId: number,
    name: string,
    sortOrder: number = 0
  ): Promise<Department | null> {
    return DepartmentOps.addDepartment(this.state, this.setState, storeId, name, sortOrder);
  }

  async modifyDepartment(
    departmentId: number,
    name?: string,
    sortOrder?: number
  ): Promise<Department | null> {
    return DepartmentOps.modifyDepartment(this.state, this.setState, departmentId, name, sortOrder);
  }

  async removeDepartment(departmentId: number): Promise<boolean> {
    return DepartmentOps.removeDepartment(this.state, this.setState, departmentId);
  }

  // ========== PRODUCT CRUD ==========

  async addProduct(name: string, departmentId: number): Promise<Product | null> {
    return ProductOps.addProduct(this.state, this.setState, name, departmentId);
  }

  async modifyProduct(
    productId: number,
    updates: { name?: string; department_id?: number }
  ): Promise<Product | null> {
    return ProductOps.modifyProduct(this.state, this.setState, productId, updates);
  }

  async removeProduct(productId: number): Promise<boolean> {
    return ProductOps.removeProduct(this.state, this.setState, productId);
  }
}

// Export singleton instance
export const storeState = new StoreStateManager();
