/**
 * Shopping list state management.
 * Manages shopping list items state and provides observers for UI updates.
 * Integrates with WebSocket for real-time collaborative updates.
 */

import { Item, fetchItems as apiFetchItems, addItem as apiAddItem, deleteItem as apiDeleteItem } from '../data/api.js';
import * as websocket from '../data/websocket.js';

type StateChangeListener = (items: Item[]) => void;

/**
 * Shopping list state manager.
 * Provides centralized state management for shopping list items.
 */
class ShoppingListState {
  private items: Item[] = [];
  private listeners: Set<StateChangeListener> = new Set();
  private loading: boolean = false;
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
      console.log('WebSocket not supported, using HTTP polling fallback');
      return;
    }

    // Check feature flag from localStorage
    const wsEnabled = localStorage.getItem('enable_ws') === 'true';
    if (!wsEnabled) {
      console.log('WebSocket disabled by feature flag');
      return;
    }

    // Subscribe to WebSocket events
    this.wsUnsubscribers.push(
      websocket.onItemAdded((item: Item) => {
        // Add item from other user to local state
        const existingIndex = this.items.findIndex(i => i.id === item.id);
        if (existingIndex === -1) {
          this.items.push(item);
          this.notifyListeners();
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onItemDeleted((data: any) => {
        // Remove item deleted by other user
        // Server sends { id: itemId } in data field
        const itemId = typeof data === 'string' ? data : data.id;
        const initialLength = this.items.length;
        this.items = this.items.filter(item => item.id !== itemId);
        if (this.items.length !== initialLength) {
          this.notifyListeners();
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onItemUpdated((item: Item) => {
        // Update item modified by other user
        const existingIndex = this.items.findIndex(i => i.id === item.id);
        if (existingIndex !== -1) {
          this.items[existingIndex] = item;
          this.notifyListeners();
        }
      })
    );

    this.wsUnsubscribers.push(
      websocket.onDepartmentUpdated(() => {
        // Department was updated (name or sort_order changed)
        // Reload all items to get updated department information
        this.loadItems();
      })
    );
  }

  /**
   * Get current items (read-only copy).
   */
  getItems(): Item[] {
    return [...this.items];
  }

  /**
   * Check if state is currently loading.
   */
  isLoading(): boolean {
    return this.loading;
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
    const itemsCopy = this.getItems();
    this.listeners.forEach(listener => listener(itemsCopy));
  }

  /**
   * Load items from API and update state.
   */
  async loadItems(): Promise<boolean> {
    this.loading = true;
    try {
      const items = await apiFetchItems();
      this.items = items;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error loading items in state:', error);
      return false;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Add a new item via API and update state.
   * If the server returns an existing item (due to fuzzy matching or exact match),
   * the existing item in state is updated instead of adding a duplicate.
   */
  async addItem(name: string, menge?: string, storeId?: number, shoppingDate?: string): Promise<Item | null> {
    if (!name.trim()) {
      console.error('Cannot add empty item');
      return null;
    }

    this.loading = true;
    try {
      const returnedItem = await apiAddItem(name, menge, storeId, shoppingDate);
      if (returnedItem) {
        // Check if item already exists in state (by ID)
        const existingIndex = this.items.findIndex(item => item.id === returnedItem.id);

        if (existingIndex !== -1) {
          // Check if item was deleted (menge is null after subtraction to 0)
          if (returnedItem.menge === null || returnedItem.menge === '') {
            // Remove item from state (was deleted due to subtraction)
            this.items.splice(existingIndex, 1);
            this.notifyListeners();
            // Note: Server already broadcasts deletion via WebSocket
          } else {
            // Update existing item (e.g., quantity was merged)
            this.items[existingIndex] = returnedItem;
            this.notifyListeners();
            // Note: Server already broadcasts update via WebSocket
          }
        } else {
          // Add new item
          this.items.push(returnedItem);
          this.notifyListeners();

          // Broadcast add to other users via WebSocket
          if (websocket.isConnected()) {
            websocket.broadcastItemAdd(returnedItem);
          }
        }

        return returnedItem;
      }
      return null;
    } catch (error) {
      console.error('Error adding item in state:', error);
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Delete an item via API and update state.
   */
  async deleteItem(id: string): Promise<boolean> {
    this.loading = true;
    try {
      const success = await apiDeleteItem(id);
      if (success) {
        this.items = this.items.filter(item => item.id !== id);
        this.notifyListeners();

        // Broadcast to other users via WebSocket
        if (websocket.isConnected()) {
          websocket.broadcastItemDelete(id);
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting item in state:', error);
      return false;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Update an item locally and broadcast to other clients.
   * Use this when you already have the updated item from an API call.
   */
  updateItem(updatedItem: Item): void {
    const existingIndex = this.items.findIndex(item => item.id === updatedItem.id);

    if (existingIndex !== -1) {
      // Update existing item
      this.items[existingIndex] = updatedItem;
      this.notifyListeners();

      // Broadcast to other users via WebSocket
      if (websocket.isConnected()) {
        websocket.broadcastItemUpdate(updatedItem);
      }
    } else {
      console.warn(`Item with id ${updatedItem.id} not found in state, cannot update`);
    }
  }

  /**
   * Clear all items from state (local only, doesn't call API).
   */
  clear(): void {
    this.items = [];
    this.notifyListeners();
  }
}

// Export singleton instance
export const shoppingListState = new ShoppingListState();
