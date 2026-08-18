/**
 * Added items management for template modal
 */

import type { DeltaItem } from '../types.js';
import { createAddedItemsList, createAddItemForm } from '../modal-shared.js';

/**
 * Setup added items management
 */
export function setupAddedItems(
  addedItems: Map<string, DeltaItem>,
  addedItemsContainer: HTMLElement,
  getSelectedItemName: () => string | null,
  onCommitSelection: (originalName: string) => void
): {
  renderAddedItems: () => void;
  addItemForm: HTMLElement;
  tryAddPending: () => void;
  selectForEdit: (name: string, menge: string) => void;
} {
  const renderAddedItems = () => {
    const newList = createAddedItemsList(addedItems, (name) => {
      addedItems.delete(name);
      renderAddedItems();
    });
    addedItemsContainer.innerHTML = '';
    addedItemsContainer.appendChild(newList);
  };

  const { form: addItemForm, tryAddPending, selectForEdit } = createAddItemForm(
    (name, menge) => {
      const selectedItemName = getSelectedItemName();
      if (selectedItemName) {
        onCommitSelection(selectedItemName);
      }
      addedItems.set(name, { name, menge });
      renderAddedItems();
    }
  );

  return {
    renderAddedItems,
    addItemForm,
    tryAddPending,
    selectForEdit
  };
}
