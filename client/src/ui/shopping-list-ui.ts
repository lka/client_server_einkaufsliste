/**
 * Shopping list UI module.
 * Handles all UI interactions for the shopping list feature.
 */

import { shoppingListState } from '../state/shopping-list-state.js';
import { renderItems } from '../data/dom.js';
import {
  fetchStores,
  fetchDepartments,
  convertItemToProduct,
  type Department,
} from '../data/api.js';

// Current selected store ID (null = all stores)
let selectedStoreId: number | null = null;

/**
 * Handle edit button click - show department selection dialog
 */
async function handleEditItem(itemId: string): Promise<void> {
  if (!selectedStoreId) {
    alert('Bitte wählen Sie ein Geschäft aus, um eine Abteilung zuzuweisen.');
    return;
  }

  // Fetch departments for the selected store
  const departments = await fetchDepartments(selectedStoreId);

  if (!departments || departments.length === 0) {
    alert('Keine Abteilungen für dieses Geschäft vorhanden.');
    return;
  }

  // Create a simple dialog with department selection
  const departmentId = await showDepartmentSelectionDialog(departments);

  if (departmentId !== null) {
    // Convert item to product with selected department
    const updatedItem = await convertItemToProduct(itemId, departmentId);

    if (updatedItem) {
      // Reload items to reflect changes
      await shoppingListState.loadItems();
      // UI updates automatically via state subscription
    } else {
      alert('Fehler beim Zuweisen der Abteilung.');
    }
  }
}

/**
 * Show a modal dialog for department selection
 */
function showDepartmentSelectionDialog(
  departments: Department[]
): Promise<number | null> {
  return new Promise((resolve) => {
    // Create dialog backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'department-dialog';
    dialog.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Abteilung auswählen';
    title.style.cssText = 'margin-top: 0; margin-bottom: 1rem;';
    dialog.appendChild(title);

    const description = document.createElement('p');
    description.textContent =
      'Wähle eine Abteilung, um dieses Produkt dem Katalog hinzuzufügen:';
    description.style.cssText = 'margin-bottom: 1rem; color: #666;';
    dialog.appendChild(description);

    // Create department list
    const list = document.createElement('div');
    list.style.cssText = 'margin-bottom: 1.5rem; max-height: 300px; overflow-y: auto;';

    departments.forEach((dept) => {
      const btn = document.createElement('button');
      btn.textContent = dept.name;
      btn.className = 'department-option-btn';
      btn.style.cssText = `
        display: block;
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        border: 1px solid #ddd;
        background: white;
        text-align: left;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
      `;

      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#f0f0f0';
        btn.style.borderColor = '#999';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'white';
        btn.style.borderColor = '#ddd';
      });

      btn.addEventListener('click', () => {
        document.body.removeChild(backdrop);
        resolve(dept.id);
      });

      list.appendChild(btn);
    });

    dialog.appendChild(list);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Abbrechen';
    cancelBtn.style.cssText = `
      padding: 0.5rem 1rem;
      background: #999;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
    `;
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(backdrop);
      resolve(null);
    });
    dialog.appendChild(cancelBtn);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        document.body.removeChild(backdrop);
        resolve(null);
      }
    });
  });
}

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

  // Event delegation for delete and edit buttons - single listener for all operations
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

      // Check if the clicked element is an edit button
      if (target.classList.contains('editBtn')) {
        const itemId = target.dataset.itemId;
        if (itemId) {
          // Prevent multiple rapid clicks
          if (target.hasAttribute('disabled')) {
            return;
          }

          await handleEditItem(itemId);
        }
      }
    });
  }

  // Initial load
  loadItems();
}
