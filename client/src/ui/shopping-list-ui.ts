/**
 * Shopping list UI module.
 * Handles all UI interactions for the shopping list feature.
 */

import { fetchItems, addItem, deleteItem } from '../data/api.js';
import { renderItems } from '../data/dom.js';

/**
 * Load and display all items from the API.
 */
export async function loadItems(): Promise<void> {
  const list = await fetchItems();
  renderItems(list);
}

/**
 * Initialize shopping list event handlers.
 */
export function initShoppingListUI(): void {
  const input = document.getElementById('itemInput') as HTMLInputElement;
  const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
  const itemsList = document.getElementById('items');

  if (!input || !addBtn) {
    console.error('Required shopping list elements not found');
    return;
  }

  // Add button handler
  addBtn.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val) {
      return;
    }

    const item = await addItem(val);
    if (item) {
      input.value = '';
      await loadItems();
    }
  });

  // Enter key handler
  input.addEventListener('keyup', (e: KeyboardEvent) => {
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

          const success = await deleteItem(itemId);
          if (success) {
            await loadItems();
          } else {
            // Re-enable button if deletion failed
            target.removeAttribute('disabled');
          }
        }
      }
    });
  }

  // Initial load
  loadItems();
}
