/**
 * Shopping list dialog functions.
 * Handles department selection and delete-by-date dialogs.
 */

import { Modal } from '../components/modal.js';
import { createButton } from '../components/button.js';
import { createDatePicker } from '../components/datepicker.js';
import { showError, showSuccess } from '../components/toast.js';
import { fetchDepartments, deleteItemsBeforeDate, type Department } from '../../data/api.js';

/**
 * Show a modal dialog for department selection
 */
export function showDepartmentSelectionDialog(
  departments: Department[]
): Promise<number | null> {
  return new Promise((resolve) => {
    // Create modal content
    const modalContent = document.createElement('div');

    const description = document.createElement('p');
    description.textContent =
      'Wähle eine Abteilung, um dieses Produkt dem Katalog hinzuzufügen:';
    description.style.cssText = 'margin-bottom: 1rem; color: #666;';
    modalContent.appendChild(description);

    // Create department list
    const list = document.createElement('div');
    list.style.cssText = 'margin-bottom: 1.5rem; max-height: 300px; overflow-y: auto;';

    departments.forEach((dept) => {
      const btn = createButton({
        label: dept.name,
        variant: 'secondary',
        onClick: () => {
          modal.close();
          resolve(dept.id);
        },
      });
      btn.style.cssText = `
        display: block;
        width: 100%;
        margin-bottom: 0.5rem;
        text-align: left;
      `;
      list.appendChild(btn);
    });

    modalContent.appendChild(list);

    // Create cancel button
    const cancelBtn = createButton({
      label: '❌ Abbrechen',
      variant: 'secondary',
      onClick: () => {
        modal.close();
        resolve(null);
      },
    });
    cancelBtn.style.width = '100%';
    modalContent.appendChild(cancelBtn);

    // Create and open modal
    const modal = new Modal({
      title: 'Abteilung auswählen',
      content: modalContent,
      size: 'small',
      closeOnBackdropClick: true,
      closeOnEscape: true,
      onClose: () => resolve(null),
    });

    modal.open();
  });
}

/**
 * Show a modal dialog for selecting a date to delete items before
 */
export function showDeleteByDateDialog(
  selectedStoreId: number | null,
  onSuccess: () => Promise<void>
): Promise<void> {
  return new Promise((resolve) => {
    // Create modal content
    const modalContent = document.createElement('div');

    // Get store name for display
    const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
    const storeName = selectedStoreId
      ? storeFilter.options[storeFilter.selectedIndex]?.text || 'Ausgewähltes Geschäft'
      : 'alle Geschäfte';

    const description = document.createElement('p');
    description.textContent =
      `Wählen Sie ein Datum. Alle Items für ${storeName} mit einem Einkaufsdatum vor diesem Datum werden gelöscht:`;
    description.style.cssText = 'margin-bottom: 1rem; color: #666;';
    modalContent.appendChild(description);

    // Create DatePicker container
    const datePickerContainer = document.createElement('div');
    datePickerContainer.style.cssText = 'margin-bottom: 1.5rem; overflow: visible; position: relative; z-index: 100;';

    const datePicker = createDatePicker({
      placeholder: 'Datum auswählen',
      format: 'dd.MM.yyyy',
      value: new Date(),
    });
    datePickerContainer.appendChild(datePicker.container);
    modalContent.appendChild(datePickerContainer);

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 0.5rem;';

    // Create delete button
    const deleteBtn = createButton({
      label: '🗑️ Löschen',
      variant: 'primary',
      onClick: async () => {
        const selectedDate = datePicker.getValue();
        if (!selectedDate) {
          showError('Bitte wählen Sie ein Datum aus.');
          return;
        }

        // Convert to ISO format (YYYY-MM-DD) using local time, not UTC
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const isoDate = `${year}-${month}-${day}`;

        // Confirm deletion
        const confirmed = confirm(
          `Möchten Sie wirklich alle Items mit Einkaufsdatum vor dem ${selectedDate.toLocaleDateString('de-DE')} löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
        );

        if (!confirmed) {
          return;
        }

        modal.close();

        // Delete items (pass selectedStoreId if a store is selected)
        const deletedCount = await deleteItemsBeforeDate(
          isoDate,
          selectedStoreId || undefined
        );

        if (deletedCount > 0) {
          showSuccess(`${deletedCount} Items erfolgreich gelöscht.`);
          // Call success callback to reload items
          await onSuccess();
        } else {
          showError('Keine Items gefunden oder Fehler beim Löschen.');
        }

        resolve();
      },
    });
    deleteBtn.style.flex = '1';
    buttonContainer.appendChild(deleteBtn);

    // Create cancel button
    const cancelBtn = createButton({
      label: '❌ Abbrechen',
      variant: 'secondary',
      onClick: () => {
        modal.close();
        resolve();
      },
    });
    cancelBtn.style.flex = '1';
    buttonContainer.appendChild(cancelBtn);

    modalContent.appendChild(buttonContainer);

    // Create and open modal
    const modal = new Modal({
      title: 'Items vor Datum löschen',
      content: modalContent,
      size: 'medium',
      closeOnBackdropClick: true,
      closeOnEscape: true,
      onClose: () => resolve(),
    });

    modal.open();

    // After modal is opened, adjust positioning and overflow for DatePicker
    setTimeout(() => {
      const modalContentEl = document.querySelector('.modal-content') as HTMLElement;
      const modalDialogEl = document.querySelector('.modal-dialog') as HTMLElement;
      if (modalContentEl) {
        modalContentEl.style.overflow = 'visible';
        modalContentEl.style.minHeight = '350px';

        // Add click handler to close DatePicker calendar when clicking elsewhere in modal
        modalContentEl.addEventListener('click', (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const datePickerContainerEl = modalContentEl.querySelector('.datepicker-container');
          const calendar = document.querySelector('.datepicker-calendar');

          if (datePickerContainerEl && calendar &&
              !datePickerContainerEl.contains(target) &&
              !calendar.contains(target)) {
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            document.body.dispatchEvent(clickEvent);
          }
        });
      }
      if (modalDialogEl) {
        modalDialogEl.style.top = '30%';
        modalDialogEl.style.transform = 'translate(-50%, -30%) scale(1)';
      }
    }, 50);
  });
}

/**
 * Handle edit button click - show department selection dialog
 */
export async function handleEditItem(
  itemId: string,
  selectedStoreId: number | null,
  onSuccess: () => Promise<void>
): Promise<void> {
  if (!selectedStoreId) {
    showError('Bitte wählen Sie ein Geschäft aus, um eine Abteilung zuzuweisen.');
    return;
  }

  // Fetch departments for the selected store
  const departments = await fetchDepartments(selectedStoreId);

  if (!departments || departments.length === 0) {
    showError('Keine Abteilungen für dieses Geschäft vorhanden.');
    return;
  }

  // Show department selection dialog
  const departmentId = await showDepartmentSelectionDialog(departments);

  if (departmentId !== null) {
    // Convert item to product with selected department
    const { convertItemToProduct } = await import('../../data/api.js');
    const updatedItem = await convertItemToProduct(itemId, departmentId);

    if (updatedItem) {
      // Call success callback to reload items
      await onSuccess();
      showSuccess('Produkt erfolgreich zugewiesen');
    } else {
      showError('Fehler beim Zuweisen der Abteilung.');
    }
  }
}
