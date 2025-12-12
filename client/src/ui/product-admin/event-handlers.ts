/**
 * Product admin event handlers
 */

import { createProduct, updateProduct, deleteProduct } from '../../data/api.js';
import { createButton } from '../components/button.js';
import { Modal } from '../components/modal.js';
import { showError, showSuccess } from '../components/toast.js';
import { productAdminState } from '../../state/product-admin-state.js';

/**
 * Set the global rerender callback (kept for backwards compatibility with init.ts)
 */
export function setRerenderCallback(_callback: () => void): void {
  // No longer needed - state subscriptions handle re-rendering automatically
  // Kept for backwards compatibility
}

/**
 * Handle store selection change
 */
export async function handleStoreChange(e: Event): Promise<void> {
  const select = e.target as HTMLSelectElement;
  const storeId = select.value;

  if (!storeId) {
    productAdminState.resetStateForStoreChange();
    // State change will trigger rerender via subscription
    return;
  }

  const storeIdNum = parseInt(storeId, 10);
  productAdminState.setSelectedStoreId(storeIdNum);
  productAdminState.setEditingProductId(null);
  productAdminState.setFilterQuery('');

  await Promise.all([
    productAdminState.loadDepartments(storeIdNum),
    productAdminState.loadProducts(storeIdNum)
  ]);

  // State change will trigger rerender via subscription
}

// Timeout for debouncing filter input
let filterTimeout: number | null = null;

/**
 * Handle filter input change (with debouncing)
 */
export function handleFilterInput(e: Event): void {
  const input = e.target as HTMLInputElement;

  // Clear previous timeout
  if (filterTimeout !== null) {
    window.clearTimeout(filterTimeout);
  }

  // Set new timeout for debouncing (50ms for faster feedback)
  filterTimeout = window.setTimeout(() => {
    productAdminState.setFilterQuery(input.value);
    // State change will trigger rerender via subscription
    filterTimeout = null;
  }, 50);
}

/**
 * Handle filter clear button
 */
export function handleFilterClear(): void {
  const filterInput = document.getElementById('productFilterInput') as HTMLInputElement;
  if (filterInput) {
    filterInput.value = '';
    filterInput.focus();
  }
  productAdminState.setFilterQuery('');
  // State change will trigger rerender via subscription
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

  const state = productAdminState.getState();
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
        productAdminState.setEditingProductId(null);
        await productAdminState.loadProducts(state.selectedStoreId);
        showSuccess('Produkt erfolgreich aktualisiert');
      } else {
        showError('Fehler beim Aktualisieren des Produkts');
      }
    } else {
      // Create new product
      const result = await createProduct(name, state.selectedStoreId, deptId, fresh);
      if (result) {
        await productAdminState.loadProducts(state.selectedStoreId);
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
  productAdminState.setEditingProductId(productId);
  // State change will trigger rerender via subscription
}

/**
 * Handle cancel edit
 */
export function handleCancelEdit(): void {
  productAdminState.setEditingProductId(null);
  // State change will trigger rerender via subscription
}

/**
 * Handle delete product
 */
export async function handleDeleteProduct(productId: number): Promise<void> {
  const product = productAdminState.getProductById(productId);
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
          const state = productAdminState.getState();
          if (state.selectedStoreId) {
            await productAdminState.loadProducts(state.selectedStoreId);
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
