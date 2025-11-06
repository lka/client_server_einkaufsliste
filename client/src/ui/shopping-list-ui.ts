/**
 * Shopping list UI module.
 * Handles all UI interactions for the shopping list feature.
 */

import { shoppingListState } from '../state/shopping-list-state.js';
import { renderItems } from '../data/dom.js';
import { fetchStores } from '../data/api.js';

// Current selected store ID (null = all stores)
let selectedStoreId: number | null = null;

/**
 * Load and display all items from state.
 */
export async function loadItems(): Promise<void> {
  await shoppingListState.loadItems();
  // Rendering is handled by state subscription
}

/**
 * Load stores into the filter dropdown.
 */
async function loadStoreFilter(): Promise<void> {
  const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
  if (!storeFilter) return;

  const stores = await fetchStores();

  // Clear existing options except first (Alle Geschäfte)
  while (storeFilter.options.length > 1) {
    storeFilter.remove(1);
  }

  // Add store options
  stores.forEach(store => {
    const option = document.createElement('option');
    option.value = store.id.toString();
    option.textContent = store.name;
    storeFilter.appendChild(option);
  });

  // Select first store by default if stores exist
  if (stores.length > 0) {
    storeFilter.value = stores[0].id.toString();
    selectedStoreId = stores[0].id;
    // Trigger re-render with filtered items
    const items = shoppingListState.getItems();
    const filteredItems = filterItemsByStore(items);
    renderItems(filteredItems);
  }
}

/**
 * Filter items by selected store.
 */
function filterItemsByStore(items: any[]): any[] {
  if (selectedStoreId === null) {
    return items; // Show all items
  }
  return items.filter(item => item.store_id === selectedStoreId);
}

/**
 * Initialize shopping list event handlers.
 */
export function initShoppingListUI(): void {
  const input = document.getElementById('itemInput') as HTMLInputElement;
  const mengeInput = document.getElementById('mengeInput') as HTMLInputElement;
  const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
  const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
  const clearStoreBtn = document.getElementById('clearStoreBtn') as HTMLButtonElement;
  const itemsList = document.getElementById('items');

  if (!input || !mengeInput || !addBtn) {
    console.error('Required shopping list elements not found');
    return;
  }

  // Subscribe to state changes for automatic UI updates
  shoppingListState.subscribe((items) => {
    const filteredItems = filterItemsByStore(items);
    renderItems(filteredItems);
  });

  // Load stores into filter (this will also set the default selection)
  loadStoreFilter();

  // Store filter change handler
  if (storeFilter) {
    storeFilter.addEventListener('change', () => {
      const value = storeFilter.value;
      selectedStoreId = value ? parseInt(value, 10) : null;

      // Re-render with filtered items
      const items = shoppingListState.getItems();
      const filteredItems = filterItemsByStore(items);
      renderItems(filteredItems);
    });
  }

  // Add button handler
  addBtn.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val) {
      return;
    }

    const menge = mengeInput.value.trim() || undefined;
    const item = await shoppingListState.addItem(val, menge, selectedStoreId || undefined);
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

  // Clear store items button handler
  if (clearStoreBtn) {
    clearStoreBtn.addEventListener('click', async () => {
      // Only allow clearing if a specific store is selected
      if (selectedStoreId === null) {
        alert('Bitte wählen Sie ein spezifisches Geschäft aus, um dessen Liste zu leeren.');
        return;
      }

      // Get store name for confirmation
      const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
      const storeName = storeFilter.options[storeFilter.selectedIndex].text;

      // Confirm deletion
      const confirmed = confirm(
        `Möchten Sie wirklich alle Einträge für "${storeName}" löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
      );

      if (!confirmed) {
        return;
      }

      // Disable button during deletion
      clearStoreBtn.disabled = true;

      const success = await shoppingListState.deleteStoreItems(selectedStoreId);

      // Re-enable button
      clearStoreBtn.disabled = false;

      if (!success) {
        alert('Fehler beim Löschen der Einträge.');
      }
      // UI updates automatically via state subscription on success
    });
  }

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
