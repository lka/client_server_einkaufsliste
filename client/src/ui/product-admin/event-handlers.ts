/**
 * Product admin event handlers
 */

import { createProduct, updateProduct, deleteProduct } from '../../data/api.js';
import { createButton } from '../components/button.js';
import { Modal } from '../components/modal.js';
import { showError, showSuccess } from '../components/toast.js';
import { state, loadDepartments, loadProducts, applyFilter, getProductById, resetStateForStoreChange } from './state.js';
import { updateProductListDisplay } from './rendering.js';

// Global callback for re-rendering
let globalRerenderCallback: (() => void) | null = null;

/**
 * Set the global rerender callback
 */
export function setRerenderCallback(callback: () => void): void {
  globalRerenderCallback = callback;
}

/**
 * Handle store selection change
 */
export async function handleStoreChange(e: Event): Promise<void> {
  const select = e.target as HTMLSelectElement;
  const storeId = select.value;

  if (!storeId) {
    resetStateForStoreChange();
    globalRerenderCallback?.();
    return;
  }

  state.selectedStoreId = parseInt(storeId, 10);
  state.editingProductId = null;
  state.filterQuery = '';

  await Promise.all([
    loadDepartments(state.selectedStoreId),
    loadProducts(state.selectedStoreId)
  ]);

  globalRerenderCallback?.();
}

/**
 * Handle filter input change (with debouncing)
 */
export function handleFilterInput(e: Event): void {
  const input = e.target as HTMLInputElement;
  state.filterQuery = input.value;

  // Clear previous timeout
  if (state.filterTimeout !== null) {
    window.clearTimeout(state.filterTimeout);
  }

  // Set new timeout for debouncing (50ms for faster feedback)
  state.filterTimeout = window.setTimeout(() => {
    applyFilter();
    updateProductListDisplay();
    attachProductActionListeners();
    state.filterTimeout = null;
  }, 50);
}

/**
 * Handle filter clear button
 */
export function handleFilterClear(): void {
  state.filterQuery = '';
  const filterInput = document.getElementById('productFilterInput') as HTMLInputElement;
  if (filterInput) {
    filterInput.value = '';
    filterInput.focus();
  }
  applyFilter();
  updateProductListDisplay();
  attachProductActionListeners();
}

/**
 * Handle save product (create or update)
 */
export async function handleSaveProduct(): Promise<void> {
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

  if (!state.selectedStoreId) {
    showError('Kein Geschäft ausgewählt');
    return;
  }

  const deptId = parseInt(departmentId, 10);

  try {
    if (state.editingProductId) {
      // Update existing product
      const result = await updateProduct(state.editingProductId, {
        name,
        departmentId: deptId,
        fresh,
      });
      if (result) {
        state.editingProductId = null;
        await loadProducts(state.selectedStoreId);
        globalRerenderCallback?.();
        showSuccess('Produkt erfolgreich aktualisiert');
      } else {
        showError('Fehler beim Aktualisieren des Produkts');
      }
    } else {
      // Create new product
      const result = await createProduct(name, state.selectedStoreId, deptId, fresh);
      if (result) {
        await loadProducts(state.selectedStoreId);
        globalRerenderCallback?.();
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
export function handleEditProduct(productId: number): void {
  state.editingProductId = productId;
  globalRerenderCallback?.();
}

/**
 * Handle cancel edit
 */
export function handleCancelEdit(): void {
  state.editingProductId = null;
  globalRerenderCallback?.();
}

/**
 * Handle delete product
 */
export async function handleDeleteProduct(productId: number): Promise<void> {
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
          if (state.selectedStoreId) {
            await loadProducts(state.selectedStoreId);
            globalRerenderCallback?.();
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

/**
 * Attach event listeners to product action buttons
 */
export function attachProductActionListeners(): void {
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
