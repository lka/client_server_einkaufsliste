/**
 * Store Admin state management.
 * Manages stores and departments state with WebSocket integration.
 */

import type { Store, Department } from '../data/api.js';
import { fetchStores } from '../data/api.js';
import * as websocket from '../data/websocket.js';

type StateChangeListener = (state: StoreAdminStateData) => void;

// Extended Store interface with departments
export interface StoreWithDepartments extends Store {
  departments?: Department[];
}

export interface StoreAdminStateData {
  stores: StoreWithDepartments[];
}

/**
 * Store Admin state manager.
 * Provides centralized state management with WebSocket integration.
 */
class StoreAdminState {
  private state: StoreAdminStateData = {
    stores: [],
  };

  private listeners: Set<StateChangeListener> = new Set();
  private wsUnsubscribers: Array<() => void> = [];
  private wsInitialized: boolean = false;

  constructor() {
    // Don't initialize WebSocket in constructor - wait for explicit call
    // This avoids race conditions with token availability on slower devices
  }

  /**
   * Initialize WebSocket event listeners for real-time updates.
   * This should be called explicitly after token is confirmed available.
   */
  initializeWebSocket(): void {
    // Prevent double initialization
    if (this.wsInitialized) {
      console.log('StoreAdminState: WebSocket already initialized');
      return;
    }

    // Only initialize if WebSocket is supported and feature flag is enabled
    if (!websocket.isWebSocketSupported()) {
      console.log('StoreAdminState: WebSocket not supported');
      return;
    }

    this.wsInitialized = true;

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
          this.notifyListeners();
        }
      })
    );

    // Subscribe to department events (affects store's departments array)
    this.wsUnsubscribers.push(
      websocket.onDepartmentAdded((department: Department) => {
        const store = this.state.stores.find(s => s.id === department.store_id);
        if (store && store.departments) {
          const existingIndex = store.departments.findIndex(d => d.id === department.id);
          if (existingIndex === -1) {
            store.departments.push(department);
            this.notifyListeners();
          }
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onDepartmentUpdated((department: Department) => {
        const store = this.state.stores.find(s => s.id === department.store_id);
        if (store && store.departments) {
          const existingIndex = store.departments.findIndex(d => d.id === department.id);
          if (existingIndex !== -1) {
            store.departments[existingIndex] = department;
            this.notifyListeners();
          }
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onDepartmentDeleted((data: { id: number }) => {
        // Find the store that contains this department
        for (const store of this.state.stores) {
          if (store.departments) {
            const initialLength = store.departments.length;
            store.departments = store.departments.filter(d => d.id !== data.id);
            if (store.departments.length !== initialLength) {
              this.notifyListeners();
              break;
            }
          }
        }
      })
    );
  }

  /**
   * Get current state (read-only copy).
   */
  getState(): StoreAdminStateData {
    return {
      stores: this.state.stores.map(store => ({
        ...store,
        departments: store.departments ? [...store.departments] : []
      }))
    };
  }

  /**
   * Get stores array directly.
   */
  getStores(): StoreWithDepartments[] {
    return this.state.stores.map(store => ({
      ...store,
      departments: store.departments ? [...store.departments] : []
    }));
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
   * Cleanup WebSocket subscriptions.
   */
  cleanup(): void {
    this.wsUnsubscribers.forEach(unsub => unsub());
    this.wsUnsubscribers = [];
  }
}

// Export singleton instance
export const storeAdminState = new StoreAdminState();
