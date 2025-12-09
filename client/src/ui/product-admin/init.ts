/**
 * Product admin initialization
 */

import { state, loadStores, loadDepartments, loadProducts } from './state.js';
import { renderUI } from './rendering.js';
import {
  setRerenderCallback,
  handleStoreChange,
  handleFilterInput,
  handleFilterClear,
  handleSaveProduct,
  handleCancelEdit,
  attachProductActionListeners
} from './event-handlers.js';

/**
 * Initialize the product admin UI
 */
export async function initProductAdmin(): Promise<void> {
  await loadStores();

  // Check for store parameter in URL
  const params = new URLSearchParams(window.location.search);
  const storeParam = params.get('store');

  if (storeParam) {
    const storeId = parseInt(storeParam, 10);
    // Verify that the store ID is valid
    if (state.stores.find(s => s.id === storeId)) {
      state.selectedStoreId = storeId;
      // Load departments and products for the pre-selected store
      await Promise.all([
        loadDepartments(storeId),
        loadProducts(storeId)
      ]);
    }
  }

  // Set rerender callback
  setRerenderCallback(renderAndAttach);

  renderAndAttach();
}

/**
 * Render UI and attach event listeners
 */
function renderAndAttach(): void {
  const container = document.getElementById('product-admin-container');
  if (!container) return;

  container.innerHTML = renderUI();
  attachEventListeners();
}

/**
 * Attach event listeners
 */
function attachEventListeners(): void {
  const storeSelect = document.getElementById('storeSelect') as HTMLSelectElement;
  if (storeSelect) {
    storeSelect.addEventListener('change', handleStoreChange);
  }

  const saveBtn = document.getElementById('saveProductBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveProduct);
  }

  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', handleCancelEdit);
  }

  // Edit and delete buttons
  attachProductActionListeners();

  // Filter input
  const filterInput = document.getElementById('productFilterInput') as HTMLInputElement;
  if (filterInput) {
    filterInput.addEventListener('input', handleFilterInput);
    filterInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        filterInput.blur();
      }
    });
  }

  // Filter clear button
  const filterClear = document.getElementById('productFilterClear');
  if (filterClear) {
    filterClear.addEventListener('click', handleFilterClear);
  }
}
