/**
 * Rendering functions for store admin UI.
 */

import type { Store } from '../../data/api.js';
import { fetchDepartments } from '../../data/api.js';

/**
 * Generate HTML for a department item.
 */
function renderDepartmentItem(dept: { id: number; name: string }, index: number, total: number): string {
  return `
    <div class="department-item" data-department-id="${dept.id}">
      <span class="department-name">${dept.name}</span>
      <div class="department-controls">
        <button class="edit-department-btn" data-department-id="${dept.id}" data-department-name="${dept.name}" title="Abteilungsname bearbeiten">
          ✏️
        </button>
        <button class="reorder-btn up-btn" data-department-id="${dept.id}" data-direction="up" ${index === 0 ? 'disabled' : ''}>
          ↑
        </button>
        <button class="reorder-btn down-btn" data-department-id="${dept.id}" data-direction="down" ${index === total - 1 ? 'disabled' : ''}>
          ↓
        </button>
        <button class="delete-department-btn" data-department-id="${dept.id}">
          ×
        </button>
      </div>
    </div>`;
}

/**
 * Generate HTML for the departments section.
 */
function renderDepartmentsSection(storeId: number, departments: readonly { id: number; name: string }[]): string {
  const departmentsList = departments.length > 0
    ? departments.map((dept, index) => renderDepartmentItem(dept, index, departments.length)).join('')
    : '<div class="no-departments">Keine Abteilungen</div>';

  return `
    <div class="departments-section">
      <h4>Abteilungen (${departments.length})</h4>
      <div class="add-department-form">
        <label for="department-input-${storeId}" class="visually-hidden">Neue Abteilung</label>
        <input
          type="text"
          id="department-input-${storeId}"
          name="departmentName"
          placeholder="Neue Abteilung"
          class="department-name-input"
          data-store-id="${storeId}"
        />
        <button class="add-department-btn" data-store-id="${storeId}">
          ⏎ Ok
        </button>
      </div>
      <div class="departments-list">
        ${departmentsList}
      </div>
    </div>`;
}

/**
 * Generate HTML for a store item.
 */
function renderStoreItem(
  store: Store,
  departments: readonly { id: number; name: string }[],
  index: number,
  total: number
): string {
  return `
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
          <button class="reorder-store-btn down-btn" data-store-id="${store.id}" data-direction="down" ${index === total - 1 ? 'disabled' : ''}>
            ↓
          </button>
          <button class="delete-store-btn" data-store-id="${store.id}" title="Geschäft löschen">
            🗑️
          </button>
        </div>
      </div>
      ${renderDepartmentsSection(store.id, departments)}
    </div>`;
}

/**
 * Render stores list with departments.
 */
export async function renderStores(
  stores: readonly Store[],
  attachListenersCallback: () => void
): Promise<void> {
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
    .map(({ store, departments }, index) =>
      renderStoreItem(store, departments, index, storesWithDepartments.length)
    )
    .join('');

  container.innerHTML = html;

  // Re-attach event listeners after rendering
  attachListenersCallback();
}
