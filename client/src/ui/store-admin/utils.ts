/**
 * Utility functions for store admin.
 */

import { showError } from '../components/toast.js';

/**
 * Generic reorder handler for items with up/down buttons.
 */
export async function handleReorder(options: {
  itemId: number;
  direction: 'up' | 'down';
  containerSelector: string;
  itemSelector: string;
  dataAttribute: string;
  updateFunction: (id: number, sortOrder: number) => Promise<unknown>;
  reloadCallback: () => Promise<void>;
}): Promise<void> {
  const container = document.querySelector(options.containerSelector);
  const allItems = container?.querySelectorAll(options.itemSelector);

  if (!allItems || allItems.length < 2) {
    return;
  }

  // Find current index
  const currentIndex = Array.from(allItems).findIndex(
    (item) => parseInt((item as HTMLElement).dataset[options.dataAttribute] || '0', 10) === options.itemId
  );

  if (currentIndex === -1) {
    return;
  }

  // Calculate swap target
  const swapIndex = options.direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (swapIndex < 0 || swapIndex >= allItems.length) {
    return;
  }

  // Get the item to swap with
  const swapItemId = parseInt(
    (allItems[swapIndex] as HTMLElement).dataset[options.dataAttribute] || '0',
    10
  );

  // Update both items with their new positions
  const result1 = await options.updateFunction(options.itemId, swapIndex);
  const result2 = await options.updateFunction(swapItemId, currentIndex);

  if (result1 && result2) {
    await options.reloadCallback();
  } else {
    showError('Fehler beim Ändern der Reihenfolge.');
  }
}
