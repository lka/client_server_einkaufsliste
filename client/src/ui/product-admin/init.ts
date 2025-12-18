/**
 * Product admin initialization
 */

import { productAdminState } from '../../state/product-admin-state.js';
import type { ProductAdminStateData } from '../../state/product-admin-state.js';
import { renderUI, updateProductListDisplay } from './rendering.js';
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
  // Track previous state to detect what changed
  let previousState: ProductAdminStateData | null = null;

  // Subscribe to state changes for automatic UI updates
  productAdminState.subscribe((newState) => {
    // Check if only filter changed (to preserve input focus)
    const onlyFilterChanged = previousState &&
      previousState.selectedStoreId === newState.selectedStoreId &&
      previousState.editingProductId === newState.editingProductId &&
      previousState.products === newState.products &&
      previousState.departments === newState.departments &&
      previousState.stores === newState.stores &&
      previousState.filterQuery !== newState.filterQuery;

    if (onlyFilterChanged) {
      // Only update the product list, preserving input focus
      updateProductListDisplay();
      // Re-attach product action listeners after DOM update
      attachProductActionListeners();
    } else {
      // Full re-render for all other changes
      renderAndAttach();
    }

    previousState = newState;
  });

  await productAdminState.loadStores();

  // Check for store parameter in URL
  const params = new URLSearchParams(window.location.search);
  const storeParam = params.get('store');

  if (storeParam) {
    const storeId = parseInt(storeParam, 10);
    // Verify that the store ID is valid
    const state = productAdminState.getState();
    if (state.stores.find(s => s.id === storeId)) {
      productAdminState.setSelectedStoreId(storeId);
      // Load departments and products for the pre-selected store
      await Promise.all([
        productAdminState.loadDepartments(storeId),
        productAdminState.loadProducts(storeId)
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
