/**
 * Store browser UI component.
 *
 * Provides UI for selecting stores, departments, and browsing products.
 * Integrates with store-state for reactive updates.
 */

import { storeState } from '../state/store-state.js';
import { shoppingListState } from '../state/shopping-list-state.js';
import type { Store, Department, Product } from '../data/api.js';

/**
 * Initialize the store browser UI.
 */
export function initStoreBrowser(): void {
  const container = document.getElementById('store-browser');
  if (!container) {
    console.warn('Store browser container not found');
    return;
  }

  // Subscribe to store state changes
  storeState.subscribe(() => {
    renderStoreBrowser();
  });

  // Load stores on initialization
  storeState.loadStores();

  // Initial render
  renderStoreBrowser();
}

/**
 * Render the store browser UI.
 */
function renderStoreBrowser(): void {
  const container = document.getElementById('store-browser');
  if (!container) return;

  const state = storeState.getState();

  // Build HTML
  const html = `
    <div class="store-browser-container">
      <h2>Produktkatalog</h2>

      ${renderStoreSelection(state.stores, state.selectedStore)}

      ${state.selectedStore ? renderDepartmentSelection(state.departments, state.selectedDepartment) : ''}

      ${state.selectedStore ? renderProductList(state.products, state.isLoading) : ''}

      ${state.error ? `<div class="error-message">${state.error}</div>` : ''}
    </div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  attachStoreBrowserListeners();
}

/**
 * Render store selection dropdown.
 */
function renderStoreSelection(stores: readonly Store[], selectedStore: Store | null): string {
  return `
    <div class="store-selection">
      <label for="store-select">Geschäft auswählen:</label>
      <select id="store-select" ${stores.length === 0 ? 'disabled' : ''}>
        <option value="">-- Geschäft wählen --</option>
        ${stores
          .map(
            (store) => `
          <option value="${store.id}" ${selectedStore?.id === store.id ? 'selected' : ''}>
            ${store.name}
          </option>
        `
          )
          .join('')}
      </select>
    </div>
  `;
}

/**
 * Render department selection (filter).
 */
function renderDepartmentSelection(
  departments: readonly Department[],
  selectedDepartment: Department | null
): string {
  return `
    <div class="department-selection">
      <label>Abteilung filtern:</label>
      <div class="department-pills">
        <button
          class="department-pill ${selectedDepartment === null ? 'active' : ''}"
          data-department-id="">
          Alle
        </button>
        ${departments
          .map(
            (dept) => `
          <button
            class="department-pill ${selectedDepartment?.id === dept.id ? 'active' : ''}"
            data-department-id="${dept.id}">
            ${dept.name}
          </button>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

/**
 * Render product list.
 */
function renderProductList(products: readonly Product[], isLoading: boolean): string {
  if (isLoading) {
    return '<div class="loading">Lade Produkte...</div>';
  }

  if (products.length === 0) {
    return '<div class="no-products">Keine Produkte gefunden.</div>';
  }

  return `
    <div class="product-list">
      <h3>Produkte (${products.length})</h3>
      <div class="products-grid">
        ${products
          .map(
            (product) => `
          <div class="product-card" data-product-id="${product.id}">
            <div class="product-name">${product.name}</div>
            ${product.fresh ? `<div class="product-fresh">🌿 Frisch</div>` : ''}
            <button class="add-product-btn" data-product-name="${product.name}">
              + Zur Liste
            </button>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

/**
 * Attach event listeners to store browser elements.
 */
function attachStoreBrowserListeners(): void {
  // Store selection
  const storeSelect = document.getElementById('store-select') as HTMLSelectElement;
  if (storeSelect) {
    storeSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const storeId = parseInt(target.value, 10);
      if (storeId) {
        storeState.selectStore(storeId);
      } else {
        storeState.clearSelection();
      }
    });
  }

  // Department filter buttons
  const departmentPills = document.querySelectorAll('.department-pill');
  departmentPills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const departmentId = target.dataset.departmentId;
      if (departmentId === '' || departmentId === undefined) {
        storeState.selectDepartment(null);
      } else {
        storeState.selectDepartment(parseInt(departmentId, 10));
      }
    });
  });

  // Add product buttons
  const addProductBtns = document.querySelectorAll('.add-product-btn');
  addProductBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const productName = target.dataset.productName || '';

      if (productName) {
        // Add to shopping list without unit
        await shoppingListState.addItem(productName);

        // Visual feedback
        target.textContent = '✓ Hinzugefügt';
        target.classList.add('added');
        setTimeout(() => {
          target.textContent = '+ Zur Liste';
          target.classList.remove('added');
        }, 1500);
      }
    });
  });
}

/**
 * Toggle store browser visibility.
 */
export function toggleStoreBrowser(): void {
  const container = document.getElementById('store-browser');
  if (!container) return;

  container.classList.toggle('hidden');
}

/**
 * Show store browser.
 */
export function showStoreBrowser(): void {
  const container = document.getElementById('store-browser');
  if (!container) return;

  container.classList.remove('hidden');
}

/**
 * Hide store browser.
 */
export function hideStoreBrowser(): void {
  const container = document.getElementById('store-browser');
  if (!container) return;

  container.classList.add('hidden');
}
