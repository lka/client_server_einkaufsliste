/**
 * Product admin rendering functions
 */

import type { Product } from '../../data/api.js';
import { state, getProductById } from './state.js';

/**
 * Render the entire UI
 */
export function renderUI(): string {
  return `
    <div class="product-admin">
      <h2>Produkte verwalten</h2>

      <!-- Store Selection -->
      <section class="store-selection">
        <label for="storeSelect">Geschäft auswählen:</label>
        <select id="storeSelect">
          <option value="">Bitte Geschäft auswählen...</option>
          ${state.stores.map(store => `
            <option value="${store.id}" ${state.selectedStoreId === store.id ? 'selected' : ''}>
              ${store.name}
            </option>
          `).join('')}
        </select>
      </section>

      ${state.selectedStoreId ? renderProductManagement() : ''}
    </div>
  `;
}

/**
 * Render product management section
 */
export function renderProductManagement(): string {
  return `
    <!-- Product Form -->
    <section class="product-form">
      <h3>${state.editingProductId ? 'Produkt bearbeiten' : 'Neues Produkt erstellen'}</h3>
      <div class="form-row">
        <input
          type="text"
          id="productName"
          placeholder="Produktname"
          value="${state.editingProductId ? getProductById(state.editingProductId)?.name || '' : ''}"
        />
      </div>
      <div class="form-row">
        <label for="departmentSelect">Abteilung:</label>
        <select id="departmentSelect">
          <option value="">Abteilung wählen...</option>
          ${state.departments.map(dept => {
            const currentProduct = state.editingProductId ? getProductById(state.editingProductId) : null;
            return `
              <option value="${dept.id}" ${currentProduct?.department_id === dept.id ? 'selected' : ''}>
                ${dept.name}
              </option>
            `;
          }).join('')}
        </select>
      </div>
      <div class="form-row checkbox-row">
        <label>
          <input
            type="checkbox"
            id="productFresh"
            ${state.editingProductId && getProductById(state.editingProductId)?.fresh ? 'checked' : ''}
          />
          Frisches Produkt (verderblich)
        </label>
      </div>
      <div class="form-buttons">
        <button id="saveProductBtn" class="btn-primary">
          ⏎ Ok
        </button>
        ${state.editingProductId ? '<button id="cancelEditBtn" class="btn-secondary" title="Abbrechen">❌ Abbrechen</button>' : ''}
      </div>
    </section>

    <!-- Product List -->
    <section class="product-list-section">
      <div class="product-list-header">
        <h3>Produkte (${state.filteredProducts.length}${state.filterQuery ? ` von ${state.products.length}` : ''})</h3>
        <div class="product-filter-wrapper">
          <input
            id="productFilterInput"
            type="text"
            placeholder="🔍 Produkte filtern..."
            class="product-filter-input"
            value="${state.filterQuery}"
          />
          <button
            id="productFilterClear"
            class="product-filter-clear"
            title="Filter löschen"
            style="display: ${state.filterQuery ? 'block' : 'none'};"
          >
            ✕
          </button>
        </div>
      </div>
      ${renderProductList()}
    </section>
  `;
}

/**
 * Render the list of products (inner content only, no wrapper)
 */
export function renderProductListContent(): string {
  if (state.filteredProducts.length === 0) {
    if (state.filterQuery) {
      return '<p class="no-products">Keine Produkte gefunden.</p>';
    }
    return '<p class="no-products">Keine Produkte vorhanden.</p>';
  }

  // Group products by department
  const productsByDept = new Map<number, Product[]>();
  state.filteredProducts.forEach(product => {
    if (!productsByDept.has(product.department_id)) {
      productsByDept.set(product.department_id, []);
    }
    productsByDept.get(product.department_id)!.push(product);
  });

  let html = '';

  state.departments.forEach(dept => {
    const deptProducts = productsByDept.get(dept.id) || [];
    if (deptProducts.length > 0) {
      // Sort products alphabetically by name
      const sortedProducts = [...deptProducts].sort((a, b) =>
        a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })
      );

      html += `
        <div class="department-group">
          <h4>${dept.name}</h4>
          <div class="product-items">
            ${sortedProducts.map(product => `
              <div class="product-item ${state.editingProductId === product.id ? 'editing' : ''}">
                <div class="product-info">
                  <span class="product-name">${product.name}</span>
                  ${product.fresh ? '<span class="product-badge fresh">🌿 Frisch</span>' : ''}
                </div>
                <div class="product-actions">
                  <button class="btn-edit" data-product-id="${product.id}" title="Bearbeiten">✏️</button>
                  <button class="btn-delete" data-product-id="${product.id}" title="Löschen">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  });

  return html;
}

/**
 * Render the list of products with wrapper (for initial render)
 */
export function renderProductList(): string {
  return `<div class="products-by-department">${renderProductListContent()}</div>`;
}

/**
 * Update product list display efficiently (only updates what changed)
 */
export function updateProductListDisplay(): void {
  // Update counter in header
  const counterElement = document.querySelector('.product-list-header h3');
  if (counterElement) {
    counterElement.textContent = `Produkte (${state.filteredProducts.length}${state.filterQuery ? ` von ${state.products.length}` : ''})`;
  }

  // Update clear button visibility
  const filterClear = document.getElementById('productFilterClear') as HTMLButtonElement;
  if (filterClear) {
    filterClear.style.display = state.filterQuery ? 'block' : 'none';
  }

  // Update only the products container (using inner content only)
  const productsContainer = document.querySelector('.products-by-department');
  if (productsContainer) {
    productsContainer.innerHTML = renderProductListContent();
  }
}
