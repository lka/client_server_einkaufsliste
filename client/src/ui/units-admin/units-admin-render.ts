/**
 * Renders the list of units in the admin interface.
 */

import { Unit } from './types.js';
import { showEditUnitModal, showDeleteUnitModal, showAddUnitModal } from './edit-unit-modal.js';
import { handleDragStart, handleDragOver, handleDrop, handleDragEnd } from './handle-drag-and-drop.js';
import { moveUnit } from './units-admin-actions.js';

/**
 * Render units list.
 */
export function renderUnits(units: Unit[]): void {
  const container = document.getElementById('unitsListContainer');
  if (!container) return;

  if (units.length === 0) {
    container.innerHTML = '<p class="empty-message">Keine Einheiten vorhanden.</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'units-list';
  list.style.cssText = 'list-style: none; padding: 0; margin: 0;';

  units.forEach((unit, index) => {
    const li = document.createElement('li');
    li.className = 'unit-item';
    li.draggable = true;
    li.dataset.unitId = unit.id.toString();
    li.dataset.sortOrder = unit.sort_order.toString();
    li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 0.5rem; background: white; cursor: move;';

    // Unit name display
    const nameSpan = document.createElement('span');
    nameSpan.className = 'unit-name';
    nameSpan.textContent = unit.name;
    nameSpan.style.cssText = 'font-weight: 500; font-size: 1rem;';

    // Controls container
    const controls = document.createElement('div');
    controls.className = 'unit-controls';
    controls.style.cssText = 'display: flex; gap: 0.5rem;';

    // Reorder buttons
    const upBtn = document.createElement('button');
    upBtn.className = 'btn btn-sm';
    upBtn.textContent = '↑';
    upBtn.title = 'Nach oben';
    upBtn.disabled = index === 0;
    upBtn.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.875rem; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
    if (index === 0) upBtn.style.opacity = '0.5';
    upBtn.addEventListener('click', () => moveUnit(unit.id, 'up'));

    const downBtn = document.createElement('button');
    downBtn.className = 'btn btn-sm';
    downBtn.textContent = '↓';
    downBtn.title = 'Nach unten';
    downBtn.disabled = index === units.length - 1;
    downBtn.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.875rem; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
    if (index === units.length - 1) downBtn.style.opacity = '0.5';
    downBtn.addEventListener('click', () => moveUnit(unit.id, 'down'));

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm';
    editBtn.textContent = '✏️';
    editBtn.title = 'Bearbeiten';
    editBtn.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.875rem; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
    editBtn.addEventListener('click', () => showEditUnitModal(unit));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-danger';
    deleteBtn.textContent = '🗑️';
    deleteBtn.title = 'Löschen';
    deleteBtn.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.875rem; border: 1px solid #d32f2f; border-radius: 4px; background: white; color: #d32f2f; cursor: pointer;';
    deleteBtn.addEventListener('click', () => showDeleteUnitModal(unit));

    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(editBtn);
    controls.appendChild(deleteBtn);

    li.appendChild(nameSpan);
    li.appendChild(controls);
    list.appendChild(li);

    // Drag and drop handlers
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);
  });

  container.innerHTML = '';
  container.appendChild(list);
}

/**
 * Attach event listeners to admin controls.
 */
export function attachUnitsAdminListeners(): void {
  const addUnitBtn = document.getElementById('addUnitBtn');
  if (addUnitBtn) {
    addUnitBtn.addEventListener('click', () => showAddUnitModal());
  }
}