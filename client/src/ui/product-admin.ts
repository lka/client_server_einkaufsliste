/**
 * Product Admin UI - Manages product creation, editing, and deletion
 */

import type { Store, Department, Product } from '../data/api.js';
import {
  fetchStores,
  fetchDepartments,
  fetchStoreProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../data/api.js';
import { createButton } from './components/button.js';
import { Modal } from './components/modal.js';
import { showError, showSuccess } from './components/toast.js';

let stores: Store[] = [];
let selectedStoreId: number | null = null;
let departments: Department[] = [];
let products: Product[] = [];
let filteredProducts: Product[] = [];
let editingProductId: number | null = null;
let filterQuery: string = '';
let filterTimeout: number | null = null;

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
    if (stores.find(s => s.id === storeId)) {
      selectedStoreId = storeId;
      // Load departments and products for the pre-selected store
      await Promise.all([
        loadDepartments(storeId),
        loadProducts(storeId)
      ]);
    }
  }

  renderUI();
  attachEventListeners();
}

/**
 * Load all stores
 */
async function loadStores(): Promise<void> {
  stores = await fetchStores();
}

/**
 * Load departments for a specific store
 */
async function loadDepartments(storeId: number): Promise<void> {
  departments = await fetchDepartments(storeId);
}

/**
 * Load products for a specific store
 */
async function loadProducts(storeId: number): Promise<void> {
  products = await fetchStoreProducts(storeId);
  applyFilter();
}

/**
 * Apply filter to products list
 */
function applyFilter(): void {
  if (!filterQuery.trim()) {
    filteredProducts = [...products];
    return;
  }

  const query = filterQuery.toLowerCase();
  filteredProducts = products.filter(product => {
    // Search in product name
    if (product.name.toLowerCase().includes(query)) {
      return true;
    }

    // Search in department name
    const dept = departments.find(d => d.id === product.department_id);
    if (dept && dept.name.toLowerCase().includes(query)) {
      return true;
    }

    // Search for "frisch" keyword
    if (product.fresh && 'frisch'.includes(query)) {
      return true;
    }

    return false;
  });
}

/**
 * Render the entire UI
 */
function renderUI(): void {
  const container = document.getElementById('product-admin-container');
  if (!container) return;

  container.innerHTML = `
    <div class="product-admin">
      <h2>Produkte verwalten</h2>

      <!-- Store Selection -->
      <section class="store-selection">
        <label for="storeSelect">Geschäft auswählen:</label>
        <select id="storeSelect">
          <option value="">Bitte Geschäft auswählen...</option>
          ${stores.map(store => `
            <option value="${store.id}" ${selectedStoreId === store.id ? 'selected' : ''}>
              ${store.name}
            </option>
          `).join('')}
        </select>
      </section>

      ${selectedStoreId ? renderProductManagement() : ''}
    </div>
  `;

  attachEventListeners();
}

/**
 * Render product management section
 */
function renderProductManagement(): string {
  return `
    <!-- Product Form -->
    <section class="product-form">
      <h3>${editingProductId ? 'Produkt bearbeiten' : 'Neues Produkt erstellen'}</h3>
      <div class="form-row">
        <input
          type="text"
          id="productName"
          placeholder="Produktname"
          value="${editingProductId ? getProductById(editingProductId)?.name || '' : ''}"
        />
      </div>
      <div class="form-row">
        <label for="departmentSelect">Abteilung:</label>
        <select id="departmentSelect">
          <option value="">Abteilung wählen...</option>
          ${departments.map(dept => {
            const currentProduct = editingProductId ? getProductById(editingProductId) : null;
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
            ${editingProductId && getProductById(editingProductId)?.fresh ? 'checked' : ''}
          />
          Frisches Produkt (verderblich)
        </label>
      </div>
      <div class="form-buttons">
        <button id="saveProductBtn" class="btn-primary">
          ⏎ Ok
        </button>
        ${editingProductId ? '<button id="cancelEditBtn" class="btn-secondary" title="Abbrechen">❌ Abbrechen</button>' : ''}
      </div>
    </section>

    <!-- Product List -->
    <section class="product-list-section">
      <div class="product-list-header">
        <h3>Produkte (${filteredProducts.length}${filterQuery ? ` von ${products.length}` : ''})</h3>
        <div class="product-filter-wrapper">
          <input
            id="productFilterInput"
            type="text"
            placeholder="🔍 Produkte filtern..."
            class="product-filter-input"
            value="${filterQuery}"
          />
          <button
            id="productFilterClear"
            class="product-filter-clear"
            title="Filter löschen"
            style="display: ${filterQuery ? 'block' : 'none'};"
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
function renderProductListContent(): string {
  if (filteredProducts.length === 0) {
    if (filterQuery) {
      return '<p class="no-products">Keine Produkte gefunden.</p>';
    }
    return '<p class="no-products">Keine Produkte vorhanden.</p>';
  }

  // Group products by department
  const productsByDept = new Map<number, Product[]>();
  filteredProducts.forEach(product => {
    if (!productsByDept.has(product.department_id)) {
      productsByDept.set(product.department_id, []);
    }
    productsByDept.get(product.department_id)!.push(product);
  });

  let html = '';

  departments.forEach(dept => {
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
              <div class="product-item ${editingProductId === product.id ? 'editing' : ''}">
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
function renderProductList(): string {
  return `<div class="products-by-department">${renderProductListContent()}</div>`;
}

/**
 * Get product by ID
 */
function getProductById(productId: number): Product | undefined {
  return products.find(p => p.id === productId);
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

/**
 * Handle store selection change
 */
async function handleStoreChange(e: Event): Promise<void> {
  const select = e.target as HTMLSelectElement;
  const storeId = select.value;

  if (!storeId) {
    selectedStoreId = null;
    departments = [];
    products = [];
    filteredProducts = [];
    editingProductId = null;
    filterQuery = '';
    renderUI();
    return;
  }

  selectedStoreId = parseInt(storeId, 10);
  editingProductId = null;
  filterQuery = '';

  await Promise.all([
    loadDepartments(selectedStoreId),
    loadProducts(selectedStoreId)
  ]);

  renderUI();
}

/**
 * Handle filter input change (with debouncing)
 */
function handleFilterInput(e: Event): void {
  const input = e.target as HTMLInputElement;
  filterQuery = input.value;

  // Clear previous timeout
  if (filterTimeout !== null) {
    window.clearTimeout(filterTimeout);
  }

  // Set new timeout for debouncing (50ms for faster feedback)
  filterTimeout = window.setTimeout(() => {
    applyFilter();
    updateProductListDisplay();
    filterTimeout = null;
  }, 50);
}

/**
 * Handle filter clear button
 */
function handleFilterClear(): void {
  filterQuery = '';
  const filterInput = document.getElementById('productFilterInput') as HTMLInputElement;
  if (filterInput) {
    filterInput.value = '';
    filterInput.focus();
  }
  applyFilter();
  updateProductListDisplay();
}

/**
 * Update product list display efficiently (only updates what changed)
 */
function updateProductListDisplay(): void {
  // Update counter in header
  const counterElement = document.querySelector('.product-list-header h3');
  if (counterElement) {
    counterElement.textContent = `Produkte (${filteredProducts.length}${filterQuery ? ` von ${products.length}` : ''})`;
  }

  // Update clear button visibility
  const filterClear = document.getElementById('productFilterClear') as HTMLButtonElement;
  if (filterClear) {
    filterClear.style.display = filterQuery ? 'block' : 'none';
  }

  // Update only the products container (using inner content only)
  const productsContainer = document.querySelector('.products-by-department');
  if (productsContainer) {
    productsContainer.innerHTML = renderProductListContent();

    // Re-attach edit and delete buttons only
    attachProductActionListeners();
  }
}

/**
 * Attach event listeners to product action buttons
 */
function attachProductActionListeners(): void {
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const productId = target.dataset.productId;
      if (productId) {
        handleEditProduct(parseInt(productId, 10));
      }
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const productId = target.dataset.productId;
      if (productId) {
        handleDeleteProduct(parseInt(productId, 10));
      }
    });
  });
}

/**
 * Handle save product (create or update)
 */
async function handleSaveProduct(): Promise<void> {
  const nameInput = document.getElementById('productName') as HTMLInputElement;
  const deptSelect = document.getElementById('departmentSelect') as HTMLSelectElement;
  const freshCheckbox = document.getElementById('productFresh') as HTMLInputElement;

  if (!nameInput || !deptSelect) return;

  const name = nameInput.value.trim();
  const departmentId = deptSelect.value;
  const fresh = freshCheckbox?.checked || false;

  if (!name) {
    showError('Bitte Produktname eingeben');
    return;
  }

  if (!departmentId) {
    showError('Bitte Abteilung auswählen');
    return;
  }

  if (!selectedStoreId) {
    showError('Kein Geschäft ausgewählt');
    return;
  }

  const deptId = parseInt(departmentId, 10);

  try {
    if (editingProductId) {
      // Update existing product
      const result = await updateProduct(editingProductId, {
        name,
        departmentId: deptId,
        fresh,
      });
      if (result) {
        editingProductId = null;
        await loadProducts(selectedStoreId);
        renderUI();
        showSuccess('Produkt erfolgreich aktualisiert');
      } else {
        showError('Fehler beim Aktualisieren des Produkts');
      }
    } else {
      // Create new product
      const result = await createProduct(name, selectedStoreId, deptId, fresh);
      if (result) {
        await loadProducts(selectedStoreId);
        renderUI();
        showSuccess('Produkt erfolgreich erstellt');
      } else {
        showError('Fehler beim Erstellen des Produkts');
      }
    }
  } catch (error) {
    console.error('Error saving product:', error);
    showError('Fehler beim Speichern des Produkts');
  }
}

/**
 * Handle edit product
 */
function handleEditProduct(productId: number): void {
  editingProductId = productId;
  renderUI();
}

/**
 * Handle cancel edit
 */
function handleCancelEdit(): void {
  editingProductId = null;
  renderUI();
}

/**
 * Handle delete product
 */
async function handleDeleteProduct(productId: number): Promise<void> {
  const product = getProductById(productId);
  if (!product) return;

  // Use Modal component for confirmation
  const modalContent = document.createElement('div');
  modalContent.innerHTML = `<p>Möchten Sie das Produkt "<strong>${product.name}</strong>" wirklich löschen?</p>`;

  const modal = new Modal({
    title: 'Produkt löschen',
    content: modalContent,
    size: 'small',
  });

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.justifyContent = 'flex-end';
  buttonContainer.style.marginTop = '20px';

  const cancelBtn = createButton({
    label: '❌ Abbrechen',
    variant: 'secondary',
    onClick: () => modal.close(),
  });

  const deleteBtn = createButton({
    label: '🗑️ Löschen',
    variant: 'danger',
    onClick: async () => {
      try {
        const success = await deleteProduct(productId);
        if (success) {
          modal.close();
          if (selectedStoreId) {
            await loadProducts(selectedStoreId);
            renderUI();
          }
          showSuccess('Produkt erfolgreich gelöscht');
        } else {
          showError('Fehler beim Löschen des Produkts');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        showError('Fehler beim Löschen des Produkts');
      }
    },
  });

  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(deleteBtn);
  modalContent.appendChild(buttonContainer);

  modal.open();
}
