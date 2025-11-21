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
import { Modal } from './components/modal.js';
import { createButton } from './components/button.js';
import { showError, showSuccess } from './components/toast.js';

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
          <button class="delete-store-btn" data-store-id="${store.id}" title="Geschäft löschen">
            🗑️
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
            ⏎ Ok
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
                <button class="edit-department-btn" data-department-id="${dept.id}" data-department-name="${dept.name}" title="Abteilungsname bearbeiten">
                  ✏️
                </button>
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
        showError('Fehler beim Ändern der Reihenfolge.');
      }
    });
  });

  // Delete store buttons
  const deleteStoreBtns = document.querySelectorAll('.delete-store-btn');
  deleteStoreBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const storeId = parseInt(target.dataset.storeId || '0', 10);

      // Use Modal component for confirmation
      const modalContent = document.createElement('div');
      modalContent.innerHTML = `<p>Möchten Sie dieses Geschäft wirklich löschen?<br><strong>Alle Abteilungen und Produkte werden ebenfalls gelöscht.</strong></p>`;

      const modal = new Modal({
        title: 'Geschäft löschen',
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
          const success = await deleteStore(storeId);
          if (success) {
            modal.close();
            await loadStores();
            showSuccess('Geschäft erfolgreich gelöscht');
          } else {
            showError('Fehler beim Löschen des Geschäfts.');
          }
        },
      });

      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(deleteBtn);
      modalContent.appendChild(buttonContainer);

      modal.open();
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
        showError('Bitte geben Sie einen Abteilungsnamen ein.');
        return;
      }

      const newDepartment = await createDepartment(storeId, name);
      if (newDepartment) {
        input.value = '';
        await loadStores();
        showSuccess('Abteilung erfolgreich erstellt');
      } else {
        showError('Fehler beim Erstellen der Abteilung.');
      }
    });
  });

  // Edit department buttons
  const editDepartmentBtns = document.querySelectorAll('.edit-department-btn');
  editDepartmentBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const departmentId = parseInt(target.dataset.departmentId || '0', 10);
      const currentName = target.dataset.departmentName || '';

      // Create modal with input field
      const modalContent = document.createElement('div');

      const label = document.createElement('label');
      label.textContent = 'Neuer Name:';
      label.style.cssText = 'display: block; margin-bottom: 0.5rem; font-weight: bold;';
      modalContent.appendChild(label);

      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentName;
      input.style.cssText = 'width: 100%; padding: 0.5rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 4px;';
      modalContent.appendChild(input);

      const modal = new Modal({
        title: 'Abteilungsname bearbeiten',
        content: modalContent,
        size: 'small',
      });

      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '10px';
      buttonContainer.style.justifyContent = 'flex-end';

      const cancelBtn = createButton({
        label: '❌ Abbrechen',
        variant: 'secondary',
        onClick: () => modal.close(),
      });

      const saveBtn = createButton({
        label: '💾 Speichern',
        variant: 'primary',
        onClick: async () => {
          const newName = input.value.trim();
          if (!newName) {
            showError('Bitte geben Sie einen Namen ein.');
            return;
          }

          const success = await updateDepartment(departmentId, newName, undefined);
          if (success) {
            modal.close();
            await loadStores();
            showSuccess('Abteilungsname erfolgreich geändert');
          } else {
            showError('Fehler beim Ändern des Namens.');
          }
        },
      });

      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(saveBtn);
      modalContent.appendChild(buttonContainer);

      modal.open();

      // Focus input and select text
      setTimeout(() => {
        input.focus();
        input.select();
      }, 100);
    });
  });

  // Delete department buttons
  const deleteDepartmentBtns = document.querySelectorAll('.delete-department-btn');
  deleteDepartmentBtns.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const departmentId = parseInt(target.dataset.departmentId || '0', 10);

      // Use Modal component for confirmation
      const modalContent = document.createElement('div');
      modalContent.innerHTML = `<p>Möchten Sie diese Abteilung wirklich löschen?<br><strong>Alle Produkte in dieser Abteilung werden ebenfalls gelöscht.</strong></p>`;

      const modal = new Modal({
        title: 'Abteilung löschen',
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
          const success = await deleteDepartment(departmentId);
          if (success) {
            modal.close();
            await loadStores();
            showSuccess('Abteilung erfolgreich gelöscht');
          } else {
            showError('Fehler beim Löschen der Abteilung.');
          }
        },
      });

      buttonContainer.appendChild(cancelBtn);
      buttonContainer.appendChild(deleteBtn);
      modalContent.appendChild(buttonContainer);

      modal.open();
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
        showError('Fehler beim Ändern der Reihenfolge.');
      }
    });
  });
}
