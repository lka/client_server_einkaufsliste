/**
 * Modals for adding, editing, and deleting units in the admin interface.
 */

import { Unit } from './types.js';
import { createUnit, deleteUnit, updateUnit, fetchUnits } from '../../data/api.js';
import { loadUnits } from './units-admin-actions.js';
import { showError, showSuccess } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { createButton } from '../components/button.js';

/**
 * Show modal to add new unit.
 */
export function showAddUnitModal(): void {
  const content = document.createElement('div');

  const label = document.createElement('label');
  label.textContent = 'Einheit:';
  label.style.cssText = 'display: block; margin-bottom: 0.5rem; font-weight: 500;';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'z.B. kg, g, EL, TL';
  input.style.cssText = 'width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;';

  content.appendChild(label);
  content.appendChild(input);

  const saveBtn = createButton({
    label: 'Hinzufügen',
    onClick: async () => {
      const name = input.value.trim();
      if (!name) {
        showError('Bitte geben Sie eine Einheit ein');
        return;
      }

      try {
        const units = await fetchUnits();
        const maxSortOrder = units.length > 0 ? Math.max(...units.map(u => u.sort_order)) : -1;

        await createUnit({ name, sort_order: maxSortOrder + 1 });
        await loadUnits();
        modal.close();
        showSuccess(`Einheit "${name}" wurde hinzugefügt`);
      } catch (error) {
        showError('Fehler beim Hinzufügen der Einheit');
        console.error('Error adding unit:', error);
      }
    },
  });

  const cancelBtn = createButton({
    label: 'Abbrechen',
    onClick: () => modal.close(),
    variant: 'secondary',
  });

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 0.5rem; margin-top: 1rem; justify-content: flex-end;';
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(saveBtn);

  content.appendChild(buttonContainer);

  const modal = new Modal({
    title: 'Neue Einheit hinzufügen',
    content,
    size: 'small',
  });

  modal.open();
  input.focus();
}

/**
 * Show modal to edit unit.
 */
export function showEditUnitModal(unit: Unit): void {
  const content = document.createElement('div');

  const label = document.createElement('label');
  label.textContent = 'Einheit:';
  label.style.cssText = 'display: block; margin-bottom: 0.5rem; font-weight: 500;';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = unit.name;
  input.style.cssText = 'width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;';

  content.appendChild(label);
  content.appendChild(input);

  const saveBtn = createButton({
    label: 'Speichern',
    onClick: async () => {
      const name = input.value.trim();
      if (!name) {
        showError('Bitte geben Sie eine Einheit ein');
        return;
      }

      try {
        await updateUnit(unit.id, { name });
        await loadUnits();
        modal.close();
        showSuccess(`Einheit wurde aktualisiert`);
      } catch (error) {
        showError('Fehler beim Aktualisieren der Einheit');
        console.error('Error updating unit:', error);
      }
    },
  });

  const cancelBtn = createButton({
    label: 'Abbrechen',
    onClick: () => modal.close(),
    variant: 'secondary',
  });

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 0.5rem; margin-top: 1rem; justify-content: flex-end;';
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(saveBtn);

  content.appendChild(buttonContainer);

  const modal = new Modal({
    title: 'Einheit bearbeiten',
    content,
    size: 'small',
  });

  modal.open();
  input.focus();
}

/**
 * Show delete confirmation modal.
 */
export function showDeleteUnitModal(unit: Unit): void {
  const content = document.createElement('p');
  content.textContent = `Möchten Sie die Einheit "${unit.name}" wirklich löschen?`;

  const deleteBtn = createButton({
    label: 'Löschen',
    onClick: async () => {
      try {
        await deleteUnit(unit.id);
        await loadUnits();
        modal.close();
        showSuccess(`Einheit "${unit.name}" wurde gelöscht`);
      } catch (error) {
        showError('Fehler beim Löschen der Einheit');
        console.error('Error deleting unit:', error);
      }
    },
    variant: 'danger',
  });

  const cancelBtn = createButton({
    label: 'Abbrechen',
    onClick: () => modal.close(),
    variant: 'secondary',
  });

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 0.5rem; margin-top: 1rem; justify-content: flex-end;';
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(deleteBtn);

  content.appendChild(buttonContainer);

  const modal = new Modal({
    title: 'Einheit löschen',
    content,
    size: 'small',
  });

  modal.open();
}
