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
  addedItemsContainer: HTMLElement
): {
  renderAddedItems: () => void;
  addItemForm: HTMLElement;
} {
  const renderAddedItems = () => {
    const newList = createAddedItemsList(addedItems, (name) => {
      addedItems.delete(name);
      renderAddedItems();
    });
    addedItemsContainer.innerHTML = '';
    addedItemsContainer.appendChild(newList);
  };

  const addItemForm = createAddItemForm(
    (name, menge) => {
      addedItems.set(name, { name, menge });
      renderAddedItems();
    }
  );

  return {
    renderAddedItems,
    addItemForm
  };
}
