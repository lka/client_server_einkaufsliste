/**
 * Shopping list state management.
 * Manages shopping list items state and provides observers for UI updates.
 */

import { Item, fetchItems as apiFetchItems, addItem as apiAddItem, deleteItem as apiDeleteItem, deleteStoreItems as apiDeleteStoreItems } from '../data/api.js';

type StateChangeListener = (items: Item[]) => void;

/**
 * Shopping list state manager.
 * Provides centralized state management for shopping list items.
 */
class ShoppingListState {
  private items: Item[] = [];
  private listeners: Set<StateChangeListener> = new Set();
  private loading: boolean = false;

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
  async addItem(name: string, menge?: string, storeId?: number): Promise<Item | null> {
    if (!name.trim()) {
      console.error('Cannot add empty item');
      return null;
    }

    this.loading = true;
    try {
      const returnedItem = await apiAddItem(name, menge, storeId);
      if (returnedItem) {
        // Check if item already exists in state (by ID)
        const existingIndex = this.items.findIndex(item => item.id === returnedItem.id);

        if (existingIndex !== -1) {
          // Update existing item
          this.items[existingIndex] = returnedItem;
        } else {
          // Add new item
          this.items.push(returnedItem);
        }

        this.notifyListeners();
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
   * Delete all items for a specific store via API and update state.
   */
  async deleteStoreItems(storeId: number): Promise<boolean> {
    this.loading = true;
    try {
      const success = await apiDeleteStoreItems(storeId);
      if (success) {
        this.items = this.items.filter(item => item.store_id !== storeId);
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting store items in state:', error);
      return false;
    } finally {
      this.loading = false;
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
