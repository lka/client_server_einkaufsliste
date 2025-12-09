/**
 * Print preview controls (store and date dropdowns)
 */

import type { Item } from '../../data/api.js';

export interface ControlsCallbacks {
  onStoreChange: (storeId: number | null, storeName: string) => void;
  onDateChange: (date: string | null) => void;
  filterItemsByDate: (items: Item[], date: string | null) => Item[];
  renderSingleStore: (items: Item[]) => void;
  renderMultiStore: (date: string | null) => Promise<void>;
}

/**
 * Create store and date header with dropdowns
 */
export function createStoreAndDateControls(
  currentStoreId: number | null,
  selectedDate: string | null,
  uniqueDates: string[],
  allStores: any[],
  allItems: Item[],
  callbacks: ControlsCallbacks
): HTMLElement {
  const header = document.createElement('div');
  header.style.cssText = 'display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;';

  // Store dropdown
  const storeDropdown = createStoreDropdown(allStores, currentStoreId);

  // Date dropdown
  const dateDropdown = createDateDropdown(uniqueDates, selectedDate);

  // Handle store selection change
  storeDropdown.addEventListener('change', async () => {
    const newStoreId = storeDropdown.value ? parseInt(storeDropdown.value) : null;
    const newStoreName = newStoreId
      ? allStores.find(s => s.id === newStoreId)?.name || 'Alle Geschäfte'
      : 'Alle Geschäfte';

    callbacks.onStoreChange(newStoreId, newStoreName);

    const currentDate = dateDropdown.value || null;
    if (newStoreId === null) {
      await callbacks.renderMultiStore(currentDate);
    } else {
      const storeFilteredItems = allItems.filter(item => item.store_id === newStoreId);
      const dateFilteredItems = callbacks.filterItemsByDate(storeFilteredItems, currentDate);
      callbacks.renderSingleStore(dateFilteredItems);
    }
  });

  // Handle date selection change
  dateDropdown.addEventListener('change', async () => {
    const newDate = dateDropdown.value || null;
    callbacks.onDateChange(newDate);

    const currentStoreId = storeDropdown.value ? parseInt(storeDropdown.value) : null;
    if (currentStoreId === null) {
      await callbacks.renderMultiStore(newDate);
    } else {
      const storeFilteredItems = allItems.filter(item => item.store_id === currentStoreId);
      const dateFilteredItems = callbacks.filterItemsByDate(storeFilteredItems, newDate);
      callbacks.renderSingleStore(dateFilteredItems);
    }
  });

  header.appendChild(storeDropdown);
  header.appendChild(dateDropdown);
  return header;
}

/**
 * Create store dropdown
 */
function createStoreDropdown(allStores: any[], currentStoreId: number | null): HTMLSelectElement {
  const storeDropdown = document.createElement('select');
  storeDropdown.style.cssText = 'font-size: 1.2rem; font-weight: bold; padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';

  // Add "Alle Geschäfte" option
  const allStoresOption = document.createElement('option');
  allStoresOption.value = '';
  allStoresOption.textContent = 'Alle Geschäfte';
  storeDropdown.appendChild(allStoresOption);

  // Add store options
  allStores.forEach(store => {
    const option = document.createElement('option');
    option.value = store.id.toString();
    option.textContent = store.name;
    storeDropdown.appendChild(option);
  });

  // Set default to current store
  if (currentStoreId) {
    storeDropdown.value = currentStoreId.toString();
  }

  return storeDropdown;
}

/**
 * Create date dropdown
 */
function createDateDropdown(uniqueDates: string[], selectedDate: string | null): HTMLSelectElement {
  const dateDropdown = document.createElement('select');
  dateDropdown.style.cssText = 'color: #666; font-size: 0.8rem; padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';

  // Add "Alle Daten" option
  const allDatesOption = document.createElement('option');
  allDatesOption.value = '';
  allDatesOption.textContent = 'Alle Daten';
  dateDropdown.appendChild(allDatesOption);

  // Add date options
  uniqueDates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    // Format date as DD.MM.YYYY for display
    const dateObj = new Date(date + 'T00:00:00');
    option.textContent = dateObj.toLocaleDateString('de-DE');
    dateDropdown.appendChild(option);
  });

  // Set default to selected date
  if (selectedDate) {
    dateDropdown.value = selectedDate;
  }

  return dateDropdown;
}

/**
 * Setup department title visibility toggle
 */
export function setupDepartmentTitleToggle(
  checkbox: HTMLInputElement,
  previewContent: HTMLElement,
  backPage: HTMLElement
): void {
  checkbox.addEventListener('change', () => {
    const frontDeptTitles = previewContent.querySelectorAll('.department-title');
    const backDeptTitles = backPage.querySelectorAll('.department-title');

    frontDeptTitles.forEach(title => {
      (title as HTMLElement).style.display = checkbox.checked ? 'none' : '';
    });

    backDeptTitles.forEach(title => {
      (title as HTMLElement).style.display = checkbox.checked ? 'none' : '';
    });
  });
}
