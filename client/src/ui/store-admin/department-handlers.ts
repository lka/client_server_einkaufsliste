/**
 * Event handlers for department operations.
 */

import { createDepartment, updateDepartment, deleteDepartment } from '../../data/api.js';
import { showError, showSuccess } from '../components/toast.js';
import { showDeleteConfirmationModal, showEditModal } from './modals.js';
import { handleReorder } from './utils.js';

/**
 * Handle adding a department.
 */
export async function handleDepartmentAdd(e: Event, reloadCallback: () => Promise<void>): Promise<void> {
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
    await reloadCallback();
    showSuccess('Abteilung erfolgreich erstellt');
  } else {
    showError('Fehler beim Erstellen der Abteilung.');
  }
}

/**
 * Handle editing a department.
 */
export async function handleDepartmentEdit(e: Event, reloadCallback: () => Promise<void>): Promise<void> {
  const target = e.currentTarget as HTMLElement;
  const departmentId = parseInt(target.dataset.departmentId || '0', 10);
  const currentName = target.dataset.departmentName || '';

  showEditModal({
    title: 'Abteilungsname bearbeiten',
    currentValue: currentName,
    onSave: async (newName) => {
      const success = await updateDepartment(departmentId, newName, undefined);
      if (success) {
        await reloadCallback();
        showSuccess('Abteilungsname erfolgreich geändert');
      } else {
        showError('Fehler beim Ändern des Namens.');
      }
    },
  });
}

/**
 * Handle deleting a department.
 */
export async function handleDepartmentDelete(e: Event, reloadCallback: () => Promise<void>): Promise<void> {
  const target = e.currentTarget as HTMLElement;
  const departmentId = parseInt(target.dataset.departmentId || '0', 10);

  showDeleteConfirmationModal({
    title: 'Abteilung löschen',
    message: 'Möchten Sie diese Abteilung wirklich löschen?<br><strong>Alle Produkte in dieser Abteilung werden ebenfalls gelöscht.</strong>',
    onConfirm: async () => {
      const success = await deleteDepartment(departmentId);
      if (success) {
        await reloadCallback();
        showSuccess('Abteilung erfolgreich gelöscht');
      } else {
        showError('Fehler beim Löschen der Abteilung.');
      }
    },
  });
}

/**
 * Handle reordering of a department.
 */
export async function handleDepartmentReorder(e: Event, reloadCallback: () => Promise<void>): Promise<void> {
  const target = e.currentTarget as HTMLElement;
  const departmentId = parseInt(target.dataset.departmentId || '0', 10);
  const direction = target.dataset.direction as 'up' | 'down';
  const departmentItem = target.closest('.department-item');
  const departmentsList = departmentItem?.closest('.departments-list');

  if (!departmentsList) return;

  // Find a unique selector for this departments list
  const storeItem = departmentsList.closest('.store-item');
  const storeId = storeItem ? (storeItem as HTMLElement).dataset.storeId : '';

  await handleReorder({
    itemId: departmentId,
    direction,
    containerSelector: `.store-item[data-store-id="${storeId}"] .departments-list`,
    itemSelector: '.department-item',
    dataAttribute: 'departmentId',
    updateFunction: (id, sortOrder) => updateDepartment(id, undefined, sortOrder),
    reloadCallback,
  });
}
