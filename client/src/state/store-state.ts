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
  createStore,
  updateStore,
  deleteStore,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createProduct,
  updateProduct,
  deleteProduct,
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

  // ========== STORE CRUD OPERATIONS ==========

  /**
   * Create a new store and add it to state.
   */
  async addStore(name: string, location: string = ''): Promise<Store | null> {
    this.setState({ isLoading: true, error: null });

    try {
      const newStore = await createStore(name, location);
      if (newStore) {
        // Add to stores list
        this.setState({
          stores: [...this.state.stores, newStore],
          isLoading: false,
          error: null,
        });
        return newStore;
      }
      this.setState({ isLoading: false, error: 'Failed to create store' });
      return null;
    } catch (error) {
      console.error('Error creating store:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to create store',
      });
      return null;
    }
  }

  /**
   * Update an existing store in state.
   */
  async modifyStore(
    storeId: number,
    name?: string,
    location?: string,
    sortOrder?: number
  ): Promise<Store | null> {
    this.setState({ isLoading: true, error: null });

    try {
      const updatedStore = await updateStore(storeId, name, location, sortOrder);
      if (updatedStore) {
        // Update in stores list
        const updatedStores = this.state.stores.map((s) =>
          s.id === storeId ? updatedStore : s
        );

        // Update selected store if it's the one being modified
        const updatedSelectedStore =
          this.state.selectedStore?.id === storeId
            ? updatedStore
            : this.state.selectedStore;

        this.setState({
          stores: updatedStores,
          selectedStore: updatedSelectedStore,
          isLoading: false,
          error: null,
        });
        return updatedStore;
      }
      this.setState({ isLoading: false, error: 'Failed to update store' });
      return null;
    } catch (error) {
      console.error('Error updating store:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to update store',
      });
      return null;
    }
  }

  /**
   * Delete a store from state.
   */
  async removeStore(storeId: number): Promise<boolean> {
    this.setState({ isLoading: true, error: null });

    try {
      const success = await deleteStore(storeId);
      if (success) {
        // Remove from stores list
        const filteredStores = this.state.stores.filter((s) => s.id !== storeId);

        // Clear selection if deleted store was selected
        const shouldClearSelection = this.state.selectedStore?.id === storeId;

        this.setState({
          stores: filteredStores,
          selectedStore: shouldClearSelection ? null : this.state.selectedStore,
          departments: shouldClearSelection ? [] : this.state.departments,
          selectedDepartment: shouldClearSelection ? null : this.state.selectedDepartment,
          products: shouldClearSelection ? [] : this.state.products,
          isLoading: false,
          error: null,
        });
        return true;
      }
      this.setState({ isLoading: false, error: 'Failed to delete store' });
      return false;
    } catch (error) {
      console.error('Error deleting store:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to delete store',
      });
      return false;
    }
  }

  // ========== DEPARTMENT CRUD OPERATIONS ==========

  /**
   * Create a new department and add it to state.
   */
  async addDepartment(
    storeId: number,
    name: string,
    sortOrder: number = 0
  ): Promise<Department | null> {
    this.setState({ isLoading: true, error: null });

    try {
      const newDepartment = await createDepartment(storeId, name, sortOrder);
      if (newDepartment) {
        // Add to departments list if current store is selected
        if (this.state.selectedStore?.id === storeId) {
          this.setState({
            departments: [...this.state.departments, newDepartment],
            isLoading: false,
            error: null,
          });
        } else {
          this.setState({ isLoading: false, error: null });
        }
        return newDepartment;
      }
      this.setState({ isLoading: false, error: 'Failed to create department' });
      return null;
    } catch (error) {
      console.error('Error creating department:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to create department',
      });
      return null;
    }
  }

  /**
   * Update an existing department in state.
   */
  async modifyDepartment(
    departmentId: number,
    name?: string,
    sortOrder?: number
  ): Promise<Department | null> {
    this.setState({ isLoading: true, error: null });

    try {
      const updatedDepartment = await updateDepartment(departmentId, name, sortOrder);
      if (updatedDepartment) {
        // Update in departments list
        const updatedDepartments = this.state.departments.map((d) =>
          d.id === departmentId ? updatedDepartment : d
        );

        // Update selected department if it's the one being modified
        const updatedSelectedDepartment =
          this.state.selectedDepartment?.id === departmentId
            ? updatedDepartment
            : this.state.selectedDepartment;

        this.setState({
          departments: updatedDepartments,
          selectedDepartment: updatedSelectedDepartment,
          isLoading: false,
          error: null,
        });
        return updatedDepartment;
      }
      this.setState({ isLoading: false, error: 'Failed to update department' });
      return null;
    } catch (error) {
      console.error('Error updating department:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to update department',
      });
      return null;
    }
  }

  /**
   * Delete a department from state.
   */
  async removeDepartment(departmentId: number): Promise<boolean> {
    this.setState({ isLoading: true, error: null });

    try {
      const success = await deleteDepartment(departmentId);
      if (success) {
        // Remove from departments list
        const filteredDepartments = this.state.departments.filter(
          (d) => d.id !== departmentId
        );

        // Clear department selection if deleted department was selected
        const shouldClearDepartmentSelection =
          this.state.selectedDepartment?.id === departmentId;

        // Reload products if we're clearing department selection
        let updatedProducts = this.state.products;
        if (shouldClearDepartmentSelection && this.state.selectedStore) {
          // Reload all store products after department deletion
          try {
            updatedProducts = await fetchStoreProducts(this.state.selectedStore.id);
          } catch (error) {
            console.error('Error reloading products after department deletion:', error);
          }
        }

        this.setState({
          departments: filteredDepartments,
          selectedDepartment: shouldClearDepartmentSelection
            ? null
            : this.state.selectedDepartment,
          products: updatedProducts,
          isLoading: false,
          error: null,
        });
        return true;
      }
      this.setState({ isLoading: false, error: 'Failed to delete department' });
      return false;
    } catch (error) {
      console.error('Error deleting department:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to delete department',
      });
      return false;
    }
  }

  // ========== PRODUCT CRUD OPERATIONS ==========

  /**
   * Create a new product and add it to state.
   * Requires a selected store to be set.
   */
  async addProduct(
    name: string,
    departmentId: number
  ): Promise<Product | null> {
    if (!this.state.selectedStore) {
      console.error('Cannot create product: no store selected');
      this.setState({ error: 'No store selected' });
      return null;
    }

    this.setState({ isLoading: true, error: null });

    try {
      const newProduct = await createProduct(name, this.state.selectedStore.id, departmentId);
      if (newProduct) {
        // Add to products list if viewing all products or the product's department
        const shouldAddToList =
          !this.state.selectedDepartment ||
          this.state.selectedDepartment.id === departmentId;

        if (shouldAddToList) {
          this.setState({
            products: [...this.state.products, newProduct],
            isLoading: false,
            error: null,
          });
        } else {
          this.setState({ isLoading: false, error: null });
        }
        return newProduct;
      }
      this.setState({ isLoading: false, error: 'Failed to create product' });
      return null;
    } catch (error) {
      console.error('Error creating product:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to create product',
      });
      return null;
    }
  }

  /**
   * Update an existing product in state.
   */
  async modifyProduct(
    productId: number,
    updates: { name?: string; department_id?: number }
  ): Promise<Product | null> {
    this.setState({ isLoading: true, error: null });

    try {
      const updatedProduct = await updateProduct(productId, updates);
      if (updatedProduct) {
        // If department changed, product might need to be removed from current view
        const departmentChanged =
          updates.department_id !== undefined &&
          this.state.selectedDepartment &&
          updates.department_id !== this.state.selectedDepartment.id;

        let updatedProducts;
        if (departmentChanged) {
          // Remove from products list if department changed and we're viewing specific department
          updatedProducts = this.state.products.filter((p) => p.id !== productId);
        } else {
          // Update in products list
          updatedProducts = this.state.products.map((p) =>
            p.id === productId ? updatedProduct : p
          );
        }

        this.setState({
          products: updatedProducts,
          isLoading: false,
          error: null,
        });
        return updatedProduct;
      }
      this.setState({ isLoading: false, error: 'Failed to update product' });
      return null;
    } catch (error) {
      console.error('Error updating product:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to update product',
      });
      return null;
    }
  }

  /**
   * Delete a product from state.
   */
  async removeProduct(productId: number): Promise<boolean> {
    this.setState({ isLoading: true, error: null });

    try {
      const success = await deleteProduct(productId);
      if (success) {
        // Remove from products list
        const filteredProducts = this.state.products.filter((p) => p.id !== productId);

        this.setState({
          products: filteredProducts,
          isLoading: false,
          error: null,
        });
        return true;
      }
      this.setState({ isLoading: false, error: 'Failed to delete product' });
      return false;
    } catch (error) {
      console.error('Error deleting product:', error);
      this.setState({
        isLoading: false,
        error: 'Failed to delete product',
      });
      return false;
    }
  }
}

// Export singleton instance
export const storeState = new StoreStateManager();
