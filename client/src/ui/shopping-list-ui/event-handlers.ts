/**
 * Event handlers for shopping list UI.
 * Handles add button, item deletion, and item editing.
 */

import { shoppingListState } from '../../state/shopping-list-state.js';
import {
  handleEditItem,
  dateToISOString,
  addItemOrTemplate,
  deleteItem,
} from '../shopping-list/index.js';
import { getShoppingDatePicker } from './date-picker-manager.js';
import type { StoreManager } from '../shopping-list/index.js';

/**
 * Setup add button and input handlers
 */
export function setupAddItemHandlers(
  input: HTMLInputElement,
  mengeInput: HTMLInputElement,
  addBtn: HTMLButtonElement,
  storeManager: StoreManager
): void {
  const handleAdd = async () => {
    const val = input.value.trim();
    if (!val) {
      return;
    }

    const menge = mengeInput.value.trim() || undefined;

    // Get shopping date from DatePicker (format: ISO YYYY-MM-DD)
    let shoppingDate: string | undefined = undefined;
    const shoppingDatePicker = getShoppingDatePicker();
    if (shoppingDatePicker) {
      const dateValue = shoppingDatePicker.getValue();
      if (dateValue) {
        shoppingDate = dateToISOString(dateValue);
      }
    }

    const success = await addItemOrTemplate({
      name: val,
      menge,
      storeId: storeManager.getSelectedStoreId() || undefined,
      shoppingDate,
    });

    if (success) {
      input.value = '';
      mengeInput.value = '1';
      // Keep the date picker value for next item
      // UI updates automatically via state subscription
    }
  };

  // Add button handler
  addBtn.addEventListener('click', handleAdd);

  // Enter key handler for both inputs
  input.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });

  mengeInput.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });
}

/**
 * Setup item list event delegation for delete and edit actions
 */
export function setupItemListHandlers(
  itemsList: HTMLElement,
  storeManager: StoreManager
): void {
  itemsList.addEventListener('click', async (e: Event) => {
    const target = e.target as HTMLElement;

    // Check if the clicked element is a delete button
    if (target.classList.contains('removeBtn')) {
      const itemId = target.dataset.itemId;
      if (itemId) {
        // Prevent multiple rapid clicks
        if (target.hasAttribute('disabled')) {
          return;
        }

        // Disable button during deletion
        target.setAttribute('disabled', 'true');

        const success = await deleteItem(itemId);
        if (!success) {
          // Re-enable button if deletion failed
          target.removeAttribute('disabled');
        }
        // UI updates automatically via state subscription on success
      }
    }

    // Check if the clicked element is an edit button
    if (target.classList.contains('editBtn')) {
      const itemId = target.dataset.itemId;
      if (itemId) {
        // Prevent multiple rapid clicks
        if (target.hasAttribute('disabled')) {
          return;
        }

        await handleEditItem(
          itemId,
          storeManager.getSelectedStoreId(),
          async () => {
            await shoppingListState.loadItems();
          }
        );
      }
    }
  });
}
