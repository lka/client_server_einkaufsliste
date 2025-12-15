/**
 * Shopping list UI module.
 * Handles all UI interactions for the shopping list feature.
 *
 * This module has been refactored to improve maintainability:
 * - Print preview logic: client/src/ui/shopping-list/print-preview.ts
 * - Dialog functions: client/src/ui/shopping-list/dialogs.ts
 * - Filter logic: client/src/ui/shopping-list/filters.ts
 * - Store management: client/src/ui/shopping-list/store-manager.ts
 * - Item operations: client/src/ui/shopping-list/item-operations.ts
 */

import { shoppingListState } from '../state/shopping-list-state.js';
import { renderItems } from '../data/dom.js';
import { getConfig } from '../data/api.js';
import { createDatePicker, type DatePickerInstance } from './components/datepicker.js';
import {
  showPrintPreview,
  showDeleteByDateDialog as showDeleteDialog,
  handleEditItem,
  filterItems,
  extractShoppingDates,
  dateToISOString,
  calculateNextShoppingDay,
  StoreManager,
  addItemOrTemplate,
  deleteItem,
} from './shopping-list/index.js';

// Store manager instance
const storeManager = new StoreManager();

/**
 * Get the currently selected store ID.
 * @returns The selected store ID or null if no store is selected
 */
export function getSelectedStoreId(): number | null {
  return storeManager.getSelectedStoreId();
}

// DatePicker instance for shopping date selection
let shoppingDatePicker: DatePickerInstance | null = null;

// Current selected shopping date for filtering (ISO format YYYY-MM-DD)
let selectedShoppingDate: string | null = null;

/**
 * Export showDeleteByDateDialog for external use
 */
export function showDeleteByDateDialog(): Promise<void> {
  return showDeleteDialog(
    storeManager.getSelectedStoreId(),
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

/**
 * Initialize shopping date picker
 */
async function initializeShoppingDatePicker(container: HTMLElement): Promise<void> {
  try {
    const config = await getConfig();
    // Default to Wednesday (2 in Python convention: 0=Monday)
    const mainShoppingDayPython = config?.main_shopping_day ?? 2;
    // Convert from Python convention (0=Monday) to JavaScript convention (0=Sunday)
    const mainShoppingDay = (mainShoppingDayPython + 1) % 7;

    // Calculate next occurrence of the configured shopping day
    const nextShoppingDay = calculateNextShoppingDay(mainShoppingDay);

    // Extract unique shopping dates from items
    const shoppingDates = extractShoppingDates(shoppingListState.getItems());

    shoppingDatePicker = createDatePicker({
      placeholder: 'Einkaufsdatum (optional)',
      format: 'dd.MM.yyyy',
      value: nextShoppingDay,
      highlightDates: shoppingDates,
      onChange: (date) => {
        // Update selected shopping date for filtering
        if (date) {
          selectedShoppingDate = dateToISOString(date);
        } else {
          selectedShoppingDate = null;
        }

        // Re-render items with new date filter
        updateItemsDisplay();
      },
    });
    container.appendChild(shoppingDatePicker.container);

    // Set initial selectedShoppingDate to match the default DatePicker value
    selectedShoppingDate = dateToISOString(nextShoppingDay);
  } catch (error) {
    console.error('Error loading config, using default Wednesday:', error);
    // Fallback to Wednesday (3 in JS convention: 0=Sunday)
    const mainShoppingDay = 3;
    const nextShoppingDay = calculateNextShoppingDay(mainShoppingDay);
    const shoppingDates = extractShoppingDates(shoppingListState.getItems());

    shoppingDatePicker = createDatePicker({
      placeholder: 'Einkaufsdatum (optional)',
      format: 'dd.MM.yyyy',
      value: nextShoppingDay,
      highlightDates: shoppingDates,
      onChange: (date) => {
        if (date) {
          selectedShoppingDate = dateToISOString(date);
        } else {
          selectedShoppingDate = null;
        }
        updateItemsDisplay();
      },
    });
    container.appendChild(shoppingDatePicker.container);
    selectedShoppingDate = dateToISOString(nextShoppingDay);
  }
}

/**
 * Update items display with current filters
 */
function updateItemsDisplay(): void {
  const items = shoppingListState.getItems();
  const filteredItems = filterItems(items, {
    storeId: storeManager.getSelectedStoreId(),
    shoppingDate: selectedShoppingDate,
  });
  renderItems(filteredItems);
}

/**
 * Setup add button and input handlers
 */
function setupAddItemHandlers(
  input: HTMLInputElement,
  mengeInput: HTMLInputElement,
  addBtn: HTMLButtonElement
): void {
  const handleAdd = async () => {
    const val = input.value.trim();
    if (!val) {
      return;
    }

    const menge = mengeInput.value.trim() || undefined;

    // Get shopping date from DatePicker (format: ISO YYYY-MM-DD)
    let shoppingDate: string | undefined = undefined;
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
 * Setup item list event delegation
 */
function setupItemListHandlers(itemsList: HTMLElement): void {
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
    initializeShoppingDatePicker(shoppingDatePickerContainer);
  }

  // Subscribe to state changes for automatic UI updates
  shoppingListState.subscribe((items) => {
    const filteredItems = filterItems(items, {
      storeId: storeManager.getSelectedStoreId(),
      shoppingDate: selectedShoppingDate,
    });
    renderItems(filteredItems);

    // Update DatePicker highlights when items change
    if (shoppingDatePicker) {
      const updatedShoppingDates = extractShoppingDates(items);
      shoppingDatePicker.setHighlightDates(updatedShoppingDates);
    }
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
  setupAddItemHandlers(input, mengeInput, addBtn);

  // Print button handler
  if (printBtn) {
    printBtn.addEventListener('click', async () => {
      await showPrintPreview({
        items: shoppingListState.getItems(),
        selectedStoreId: storeManager.getSelectedStoreId(),
        shoppingDatePicker,
      });
    });
  }

  // Setup item list event delegation
  if (itemsList) {
    setupItemListHandlers(itemsList);
  }

  // Initial load
  loadItems();
}
