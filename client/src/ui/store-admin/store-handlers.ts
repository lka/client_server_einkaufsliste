/**
 * Event handlers for store operations.
 */

import { updateStore, deleteStore } from '../../data/api.js';
import { showError, showSuccess } from '../components/toast.js';
import { showDeleteConfirmationModal } from './modals.js';
import { handleReorder } from './utils.js';

/**
 * Handle reordering of a store.
 */
export async function handleStoreReorder(e: Event, reloadCallback: () => Promise<void>): Promise<void> {
  const target = e.currentTarget as HTMLElement;
  const storeId = parseInt(target.dataset.storeId || '0', 10);
  const direction = target.dataset.direction as 'up' | 'down';
  const storeItem = target.closest('.store-item');
  const container = storeItem?.parentElement;

  if (!container) return;

  await handleReorder({
    itemId: storeId,
    direction,
    containerSelector: `#${container.id}`,
    itemSelector: '.store-item',
    dataAttribute: 'storeId',
    updateFunction: (id, sortOrder) => updateStore(id, undefined, undefined, sortOrder),
    reloadCallback,
  });
}

/**
 * Handle deleting a store.
 */
export async function handleStoreDelete(e: Event, reloadCallback: () => Promise<void>): Promise<void> {
  const target = e.currentTarget as HTMLElement;
  const storeId = parseInt(target.dataset.storeId || '0', 10);

  showDeleteConfirmationModal({
    title: 'Geschäft löschen',
    message: 'Möchten Sie dieses Geschäft wirklich löschen?<br><strong>Alle Abteilungen und Produkte werden ebenfalls gelöscht.</strong>',
    onConfirm: async () => {
      const success = await deleteStore(storeId);
      if (success) {
        await reloadCallback();
        showSuccess('Geschäft erfolgreich gelöscht');
      } else {
        showError('Fehler beim Löschen des Geschäfts.');
      }
    },
  });
}
