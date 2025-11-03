/**
 * Shopping list UI module.
 * Handles all UI interactions for the shopping list feature.
 */

import { shoppingListState } from '../state/shopping-list-state.js';
import { renderItems } from '../data/dom.js';

/**
 * Load and display all items from state.
 */
export async function loadItems(): Promise<void> {
  await shoppingListState.loadItems();
  // Rendering is handled by state subscription
}

/**
 * Initialize shopping list event handlers.
 */
export function initShoppingListUI(): void {
  const input = document.getElementById('itemInput') as HTMLInputElement;
  const mengeInput = document.getElementById('mengeInput') as HTMLInputElement;
  const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
  const itemsList = document.getElementById('items');

  if (!input || !mengeInput || !addBtn) {
    console.error('Required shopping list elements not found');
    return;
  }

  // Subscribe to state changes for automatic UI updates
  shoppingListState.subscribe((items) => {
    renderItems(items);
  });

  // Add button handler
  addBtn.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val) {
      return;
    }

    const menge = mengeInput.value.trim() || undefined;
    const item = await shoppingListState.addItem(val, menge);
    if (item) {
      input.value = '';
      mengeInput.value = '';
      // UI updates automatically via state subscription
    }
  });

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

  // Event delegation for delete buttons - single listener for all delete operations
  // This is more efficient than attaching individual listeners to each button
  if (itemsList) {
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

          const success = await shoppingListState.deleteItem(itemId);
          if (!success) {
            // Re-enable button if deletion failed
            target.removeAttribute('disabled');
          }
          // UI updates automatically via state subscription on success
        }
      }
    });
  }

  // Initial load
  loadItems();
}
