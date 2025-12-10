/**
 * Store administration UI component.
 *
 * Provides UI for managing stores and departments (create, delete).
 */

import { fetchStores, createStore } from '../data/api.js';
import { showError, showSuccess } from './components/toast.js';
import { renderStores } from './store-admin/renderer.js';
import {
  handleStoreReorder,
  handleStoreDelete,
} from './store-admin/store-handlers.js';
import {
  handleDepartmentAdd,
  handleDepartmentEdit,
  handleDepartmentDelete,
  handleDepartmentReorder,
} from './store-admin/department-handlers.js';

/**
 * Initialize the store admin UI.
 */
export function initStoreAdmin(): void {
  // Load and render stores
  loadStores();

  // Attach event listeners
  attachStoreAdminListeners();
}

/**
 * Load and render stores from API.
 */
async function loadStores(): Promise<void> {
  const stores = await fetchStores();
  await renderStores(stores, attachDynamicListeners);
}

/**
 * Attach event listeners to admin controls.
 */
function attachStoreAdminListeners(): void {
  // Add store button
  const addStoreBtn = document.getElementById('addStoreBtn');
  if (addStoreBtn) {
    addStoreBtn.addEventListener('click', async () => {
      const nameInput = document.getElementById('storeNameInput') as HTMLInputElement;
      const locationInput = document.getElementById('storeLocationInput') as HTMLInputElement;

      const name = nameInput.value.trim();
      const location = locationInput.value.trim();

      if (!name) {
        showError('Bitte geben Sie einen Geschäftsnamen ein.');
        return;
      }

      const newStore = await createStore(name, location);
      if (newStore) {
        nameInput.value = '';
        locationInput.value = '';
        await loadStores();
        showSuccess('Geschäft erfolgreich erstellt');
      } else {
        showError('Fehler beim Erstellen des Geschäfts. Existiert es bereits?');
      }
    });
  }

  // Back button
  const backBtn = document.getElementById('backToAppBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = '/app';
    });
  }
}

/**
 * Attach event listeners to dynamically created elements.
 */
function attachDynamicListeners(): void {
  // Reorder store buttons
  document.querySelectorAll('.reorder-store-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => handleStoreReorder(e, loadStores));
  });

  // Delete store buttons
  document.querySelectorAll('.delete-store-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => handleStoreDelete(e, loadStores));
  });

  // Add department buttons
  document.querySelectorAll('.add-department-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => handleDepartmentAdd(e, loadStores));
  });

  // Edit department buttons
  document.querySelectorAll('.edit-department-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => handleDepartmentEdit(e, loadStores));
  });

  // Delete department buttons
  document.querySelectorAll('.delete-department-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => handleDepartmentDelete(e, loadStores));
  });

  // Reorder department buttons
  document.querySelectorAll('.reorder-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => handleDepartmentReorder(e, loadStores));
  });
}
