/**
 * Store administration UI component.
 *
 * Provides UI for managing stores and departments (create, delete).
 */

import {
  fetchStores,
  fetchDepartments,
  createStore,
  updateStore,
  deleteStore,
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from '../data/api.js';
import type { Store } from '../data/api.js';

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
  await renderStores(stores);
}

/**
 * Render stores list with departments.
 */
async function renderStores(stores: readonly Store[]): Promise<void> {
  const container = document.getElementById('storesList');
  if (!container) return;

  if (stores.length === 0) {
    container.innerHTML = '<div class="no-stores">Keine Geschäfte vorhanden.</div>';
    return;
  }

  // Load departments for each store
  const storesWithDepartments = await Promise.all(
    stores.map(async (store) => {
      const departments = await fetchDepartments(store.id);
      return { store, departments };
    })
  );

  const html = storesWithDepartments
    .map(
      ({ store, departments }, index) => `
    <div class="store-item" data-store-id="${store.id}">
      <div class="store-header">
        <div class="store-info">
          <h3>${store.name}</h3>
          ${store.location ? `<span class="store-location">${store.location}</span>` : ''}
        </div>
        <div class="store-controls">
          <button class="reorder-store-btn up-btn" data-store-id="${store.id}" data-direction="up" ${index === 0 ? 'disabled' : ''}>
            ↑
          </button>
          <button class="reorder-store-btn down-btn" data-store-id="${store.id}" data-direction="down" ${index === storesWithDepartments.length - 1 ? 'disabled' : ''}>
            ↓
          </button>
          <button class="delete-store-btn" data-store-id="${store.id}">
            Löschen
          </button>
        </div>
      </div>

      <div class="departments-section">
        <h4>Abteilungen (${departments.length})</h4>
        <div class="add-department-form">
          <input
            type="text"
            placeholder="Neue Abteilung"
            class="department-name-input"
            data-store-id="${store.id}"
          />
          <button class="add-department-btn" data-store-id="${store.id}">
            + Hinzufügen
          </button>
        </div>

        <div class="departments-list">
          ${
            departments.length > 0
              ? departments
                  .map(
                    (dept, index) => `
            <div class="department-item" data-department-id="${dept.id}">
              <span class="department-name">${dept.name}</span>
              <div class="department-controls">
                <button class="reorder-btn up-btn" data-department-id="${dept.id}" data-direction="up" ${index === 0 ? 'disabled' : ''}>
                  ↑
                </button>
                <button class="reorder-btn down-btn" data-department-id="${dept.id}" data-direction="down" ${index === departments.length - 1 ? 'disabled' : ''}>
                  ↓
                </button>
                <button class="delete-department-btn" data-department-id="${dept.id}">
                  ×
                </button>
              </div>
            </div>
          `
                  )
                  .join('')
              : '<div class="no-departments">Keine Abteilungen</div>'
          }
        </div>
      </div>
    </div>
  `
    )
    .join('');

  container.innerHTML = html;

  // Re-attach event listeners after rendering
  attachDynamicListeners();
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
        alert('Bitte geben Sie einen Geschäftsnamen ein.');
        return;
      }

      const newStore = await createStore(name, location);
      if (newStore) {
        nameInput.value = '';
        locationInput.value = '';
        await loadStores();
      } else {
        alert('Fehler beim Erstellen des Geschäfts. Existiert es bereits?');
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
  // Reorder store buttons (up/down arrows)
  const reorderStoreBtns = document.querySelectorAll('.reorder-store-btn');
  reorderStoreBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const storeId = parseInt(target.dataset.storeId || '0', 10);
      const direction = target.dataset.direction as 'up' | 'down';

      // Find all stores
      const storeItem = target.closest('.store-item');
      const container = storeItem?.parentElement;
      const allStoreItems = container?.querySelectorAll('.store-item');

      if (!allStoreItems || allStoreItems.length < 2) {
        return;
      }

      // Find current index
      const currentIndex = Array.from(allStoreItems).findIndex(
        (item) => parseInt((item as HTMLElement).dataset.storeId || '0', 10) === storeId
      );

      if (currentIndex === -1) {
        return;
      }

      // Calculate swap target
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (swapIndex < 0 || swapIndex >= allStoreItems.length) {
        return;
      }

      // Get the store to swap with
      const swapStoreId = parseInt(
        (allStoreItems[swapIndex] as HTMLElement).dataset.storeId || '0',
        10
      );

      // Swap sort_order values
      const currentSortOrder = currentIndex;
      const swapSortOrder = swapIndex;

      // Update both stores
      const success1 = await updateStore(storeId, undefined, undefined, swapSortOrder);
      const success2 = await updateStore(swapStoreId, undefined, undefined, currentSortOrder);

      if (success1 && success2) {
        await loadStores();
      } else {
        alert('Fehler beim Ändern der Reihenfolge.');
      }
    });
  });

  // Delete store buttons
  const deleteStoreBtns = document.querySelectorAll('.delete-store-btn');
  deleteStoreBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const storeId = parseInt(target.dataset.storeId || '0', 10);

      if (!confirm('Möchten Sie dieses Geschäft wirklich löschen? Alle Abteilungen und Produkte werden ebenfalls gelöscht.')) {
        return;
      }

      const success = await deleteStore(storeId);
      if (success) {
        await loadStores();
      } else {
        alert('Fehler beim Löschen des Geschäfts.');
      }
    });
  });

  // Add department buttons
  const addDepartmentBtns = document.querySelectorAll('.add-department-btn');
  addDepartmentBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const storeId = parseInt(target.dataset.storeId || '0', 10);
      const input = document.querySelector(
        `.department-name-input[data-store-id="${storeId}"]`
      ) as HTMLInputElement;

      const name = input.value.trim();
      if (!name) {
        alert('Bitte geben Sie einen Abteilungsnamen ein.');
        return;
      }

      const newDepartment = await createDepartment(storeId, name);
      if (newDepartment) {
        input.value = '';
        await loadStores();
      } else {
        alert('Fehler beim Erstellen der Abteilung.');
      }
    });
  });

  // Delete department buttons
  const deleteDepartmentBtns = document.querySelectorAll('.delete-department-btn');
  deleteDepartmentBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const departmentId = parseInt(target.dataset.departmentId || '0', 10);

      if (!confirm('Möchten Sie diese Abteilung wirklich löschen? Alle Produkte in dieser Abteilung werden ebenfalls gelöscht.')) {
        return;
      }

      const success = await deleteDepartment(departmentId);
      if (success) {
        await loadStores();
      } else {
        alert('Fehler beim Löschen der Abteilung.');
      }
    });
  });

  // Reorder department buttons (up/down arrows)
  const reorderBtns = document.querySelectorAll('.reorder-btn');
  reorderBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const departmentId = parseInt(target.dataset.departmentId || '0', 10);
      const direction = target.dataset.direction as 'up' | 'down';

      // Find all departments for this store (siblings in the same departments-list)
      const departmentItem = target.closest('.department-item');
      const departmentsList = departmentItem?.closest('.departments-list');
      const allDeptItems = departmentsList?.querySelectorAll('.department-item');

      if (!allDeptItems || allDeptItems.length < 2) {
        return;
      }

      // Find current index
      const currentIndex = Array.from(allDeptItems).findIndex(
        (item) => parseInt((item as HTMLElement).dataset.departmentId || '0', 10) === departmentId
      );

      if (currentIndex === -1) {
        return;
      }

      // Calculate swap target
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (swapIndex < 0 || swapIndex >= allDeptItems.length) {
        return;
      }

      // Get the department to swap with
      const swapDeptId = parseInt(
        (allDeptItems[swapIndex] as HTMLElement).dataset.departmentId || '0',
        10
      );

      // Swap sort_order values
      // Current department gets swap target's sort_order, and vice versa
      const currentSortOrder = currentIndex;
      const swapSortOrder = swapIndex;

      // Update both departments
      const success1 = await updateDepartment(departmentId, undefined, swapSortOrder);
      const success2 = await updateDepartment(swapDeptId, undefined, currentSortOrder);

      if (success1 && success2) {
        await loadStores();
      } else {
        alert('Fehler beim Ändern der Reihenfolge.');
      }
    });
  });
}
