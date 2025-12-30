/**
 * Shopping list UI module.
 * Handles all UI interactions for the shopping list feature.
 *
 * @deprecated This file has been refactored into a modular structure.
 * Please use './shopping-list-ui/index.js' instead, or import specific modules:
 * - './shopping-list-ui/initialization.js' for main setup
 * - './shopping-list-ui/date-picker-manager.js' for DatePicker operations
 * - './shopping-list-ui/event-handlers.js' for event handling
 *
 * This file is kept for backward compatibility and re-exports all functions.
 *
 * Previous refactoring:
 * - Print preview logic: client/src/ui/shopping-list/print-preview.ts
 * - Dialog functions: client/src/ui/shopping-list/dialogs.ts
 * - Filter logic: client/src/ui/shopping-list/filters.ts
 * - Store management: client/src/ui/shopping-list/store-manager.ts
 * - Item operations: client/src/ui/shopping-list/item-operations.ts
 */

import { shoppingListState } from '../state/shopping-list-state.js';
import { showDeleteByDateDialog as showDeleteDialog } from './shopping-list/index.js';
import { getSelectedStoreId as getStoreId } from './shopping-list-ui/index.js';

// Re-export all public API from the modular structure
export {
  initShoppingListUI,
  getSelectedStoreId,
  initializeShoppingDatePicker,
  getShoppingDatePicker,
  getSelectedShoppingDate,
  setSelectedShoppingDate,
  updateDatePickerHighlights,
  setupAddItemHandlers,
  setupItemListHandlers,
} from './shopping-list-ui/index.js';

/**
 * Export showDeleteByDateDialog for external use
 */
export function showDeleteByDateDialog(): Promise<void> {
  return showDeleteDialog(
    getStoreId(),
    async () => {
      await shoppingListState.loadItems();
    }
  );
}

/**
 * Load and display all items from state.
 */
export async function loadItems(): Promise<void> {
  await shoppingListState.loadItems();
  // Rendering is handled by state subscription
}
