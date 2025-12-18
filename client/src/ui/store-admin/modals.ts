/**
 * Modal helper functions for store admin.
 */

import { Modal } from '../components/modal.js';
import { createButton } from '../components/button.js';
import { showError } from '../components/toast.js';

/**
 * Show a delete confirmation modal.
 */
export function showDeleteConfirmationModal(options: {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
}): void {
  const modalContent = document.createElement('div');
  modalContent.innerHTML = `<p>${options.message}</p>`;

  const modal = new Modal({
    title: options.title,
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
      await options.onConfirm();
      modal.close();
    },
  });

  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(deleteBtn);
  modalContent.appendChild(buttonContainer);

  modal.open();
}

/**
 * Show an edit modal with an input field.
 */
export function showEditModal(options: {
  title: string;
  currentValue: string;
  onSave: (newValue: string) => Promise<void>;
}): void {
  const modalContent = document.createElement('div');

  const label = document.createElement('label');
  label.textContent = 'Neuer Name:';
  label.htmlFor = 'edit-modal-input';
  label.style.cssText = 'display: block; margin-bottom: 0.5rem; font-weight: bold;';
  modalContent.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'edit-modal-input';
  input.name = 'editValue';
  input.value = options.currentValue;
  input.style.cssText = 'width: 100%; padding: 0.5rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 4px;';
  modalContent.appendChild(input);

  const modal = new Modal({
    title: options.title,
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
      const newValue = input.value.trim();
      if (!newValue) {
        showError('Bitte geben Sie einen Namen ein.');
        return;
      }
      await options.onSave(newValue);
      modal.close();
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
}
