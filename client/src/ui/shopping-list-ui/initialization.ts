/**
 * Initialization logic for shopping list UI.
 * Orchestrates all UI components and subscriptions.
 */

import { shoppingListState } from '../../state/shopping-list-state.js';
import { renderItems } from '../../data/dom.js';
import { filterItems, showPrintPreview, StoreManager } from '../shopping-list/index.js';
import {
  initializeShoppingDatePicker,
  getShoppingDatePicker,
  getSelectedShoppingDate,
  updateDatePickerHighlights,
} from './date-picker-manager.js';
import { setupAddItemHandlers, setupItemListHandlers } from './event-handlers.js';

// Store manager instance
const storeManager = new StoreManager();

/**
 * Get the currently selected store ID.
 * @returns The selected store ID or null if no store is selected
 */
export function getSelectedStoreId(): number | null {
  return storeManager.getSelectedStoreId();
}

/**
 * Update items display with current filters
 */
function updateItemsDisplay(): void {
  const items = shoppingListState.getItems();
  const filteredItems = filterItems(items, {
    storeId: storeManager.getSelectedStoreId(),
    shoppingDate: getSelectedShoppingDate(),
  });
  renderItems(filteredItems);
}

/**
 * Initialize shopping list event handlers.
 */
export function initShoppingListUI(): void {
  const input = document.getElementById('itemInput') as HTMLInputElement;
  const mengeInput = document.getElementById('mengeInput') as HTMLInputElement;
  const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
  const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
  const itemsList = document.getElementById('items');
  const shoppingDatePickerContainer = document.getElementById('shoppingDatePicker');
  const printBtn = document.getElementById('printBtn') as HTMLButtonElement;

  if (!input || !mengeInput || !addBtn) {
    console.error('Required shopping list elements not found');
    return;
  }

  // Initialize DatePicker for shopping date selection
  if (shoppingDatePickerContainer) {
    initializeShoppingDatePicker(shoppingDatePickerContainer, updateItemsDisplay);
  }

  // Subscribe to state changes for automatic UI updates
  shoppingListState.subscribe((items) => {
    const filteredItems = filterItems(items, {
      storeId: storeManager.getSelectedStoreId(),
      shoppingDate: getSelectedShoppingDate(),
    });
    renderItems(filteredItems);

    // Update DatePicker highlights when items change
    updateDatePickerHighlights();
  });

  // Load stores into filter and set up change handler
  if (storeFilter) {
    storeManager.loadStoreFilter(storeFilter, updateItemsDisplay).then(() => {
      // Initialize autocomplete after stores are loaded
      storeManager.initializeAutocomplete(input, mengeInput);
    });

    // Re-initialize autocomplete when store changes
    storeManager.onStoreChange(() => {
      storeManager.initializeAutocomplete(input, mengeInput);
    });
  }

  // Setup add item handlers
  setupAddItemHandlers(input, mengeInput, addBtn, storeManager);

  // Print button handler
  if (printBtn) {
    printBtn.addEventListener('click', async () => {
      await showPrintPreview({
        items: shoppingListState.getItems(),
        selectedStoreId: storeManager.getSelectedStoreId(),
        shoppingDatePicker: getShoppingDatePicker(),
      });
    });
  }

  // Setup item list event delegation
  if (itemsList) {
    setupItemListHandlers(itemsList, storeManager);
  }

  // Initial load
  shoppingListState.loadItems();
}
