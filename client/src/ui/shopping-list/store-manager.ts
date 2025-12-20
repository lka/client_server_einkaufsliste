/**
 * Shopping list store management.
 * Handles store selection and autocomplete initialization.
 */

import { fetchStores, getProductSuggestions, type ProductSuggestion } from '../../data/api.js';
import { Autocomplete } from '../components/index.js';

export class StoreManager {
  private selectedStoreId: number | null = null;
  private autocompleteInstance: Autocomplete | null = null;
  private onStoreChangeCallback: ((storeId: number | null) => void) | null = null;

  /**
   * Get the currently selected store ID.
   */
  getSelectedStoreId(): number | null {
    return this.selectedStoreId;
  }

  /**
   * Set store change callback
   */
  onStoreChange(callback: (storeId: number | null) => void): void {
    this.onStoreChangeCallback = callback;
  }

  /**
   * Load stores into the filter dropdown.
   */
  async loadStoreFilter(
    storeFilterElement: HTMLSelectElement,
    onFilterChange: () => void
  ): Promise<void> {
    const stores = await fetchStores();

    // Clear existing options except first (Alle Geschäfte)
    while (storeFilterElement.options.length > 1) {
      storeFilterElement.remove(1);
    }

    // Add store options
    stores.forEach(store => {
      const option = document.createElement('option');
      option.value = store.id.toString();
      option.textContent = store.name;
      storeFilterElement.appendChild(option);
    });

    // Select first store by default if stores exist
    if (stores.length > 0) {
      storeFilterElement.value = stores[0].id.toString();
      this.selectedStoreId = stores[0].id;
      onFilterChange();
    }

    // Add store filter change handler
    storeFilterElement.addEventListener('change', () => {
      const value = storeFilterElement.value;
      this.selectedStoreId = value ? parseInt(value, 10) : null;

      // Re-initialize autocomplete with new store
      this.destroyAutocomplete();

      // Notify callback
      if (this.onStoreChangeCallback) {
        this.onStoreChangeCallback(this.selectedStoreId);
      }

      onFilterChange();
    });
  }

  /**
   * Initialize autocomplete for product suggestions
   */
  initializeAutocomplete(
    inputElement: HTMLInputElement,
    mengeInputElement: HTMLInputElement
  ): void {
    if (this.autocompleteInstance) {
      this.autocompleteInstance.destroy();
      this.autocompleteInstance = null;
    }

    if (this.selectedStoreId && inputElement) {
      const storeId = this.selectedStoreId;
      this.autocompleteInstance = new Autocomplete({
        input: inputElement,
        onSearch: async (query: string) => {
          if (!storeId) {
            return [];
          }
          const suggestions = await getProductSuggestions(storeId, query, 10);
          return suggestions.map((suggestion: ProductSuggestion) => ({
            id: suggestion.name,
            label: suggestion.name,
            data: suggestion,
          }));
        },
        onSelect: (suggestion) => {
          inputElement.value = suggestion.label;
          mengeInputElement.focus();
        },
        debounceMs: 300,
        minChars: 2,
        maxSuggestions: 10,
      });
    }
  }

  /**
   * Destroy autocomplete instance
   */
  destroyAutocomplete(): void {
    if (this.autocompleteInstance) {
      this.autocompleteInstance.destroy();
      this.autocompleteInstance = null;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.destroyAutocomplete();
    this.onStoreChangeCallback = null;
  }
}
