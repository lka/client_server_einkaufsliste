/**
 * Modal helper functions for store admin.
 */

import { Modal } from '../components/modal.js';
import { createButton } from '../components/button.js';
import { createInput } from '../components/input.js';
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

  // Create input using component library
  const inputGroup = createInput({
    label: 'Neuer Name:',
    type: 'text',
    id: 'edit-modal-input',
    name: 'editValue',
    value: options.currentValue
  });

  inputGroup.container.style.marginBottom = '1rem';
  modalContent.appendChild(inputGroup.container);

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
      const newValue = inputGroup.input.value.trim();
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
    inputGroup.input.focus();
    inputGroup.input.select();
  }, 100);
}
