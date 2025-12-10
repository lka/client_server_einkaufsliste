/**
 * Event handlers for WebDAV admin.
 */

import { updateWebDAVSettings } from '../../data/api.js';
import { showError, showSuccess } from '../components/toast.js';
import { showDeleteConfirmation, showEditModal, showImportConfirmation } from './modals.js';

/**
 * Handle delete settings button click.
 */
export async function handleDeleteSettings(
  settingsId: number,
  onDeleted: () => Promise<void>
): Promise<void> {
  await showDeleteConfirmation(settingsId, onDeleted);
}

/**
 * Handle toggle settings enabled state.
 */
export async function handleToggleSettings(
  settingsId: number,
  enabled: boolean,
  onToggled: () => Promise<void>
): Promise<void> {
  try {
    await updateWebDAVSettings(settingsId, { enabled });
    showSuccess(`WebDAV-Konfiguration ${enabled ? 'aktiviert' : 'deaktiviert'}`);
    await onToggled();
  } catch (error) {
    showError('Fehler beim Aktualisieren der Konfiguration');
    console.error('Error updating WebDAV settings:', error);
  }
}

/**
 * Handle edit settings button click.
 */
export async function handleEditSettings(
  settingsId: number,
  onEdited: () => Promise<void>
): Promise<void> {
  await showEditModal(settingsId, onEdited);
}

/**
 * Handle import recipes button click.
 */
export async function handleImportRecipes(settingsId: number): Promise<void> {
  await showImportConfirmation(settingsId);
}

/**
 * Attach event listeners to dynamically rendered elements.
 */
export function attachDynamicListeners(
  onDeleted: () => Promise<void>,
  onToggled: () => Promise<void>,
  onEdited: () => Promise<void>
): void {
  // Delete settings buttons
  const deleteButtons = document.querySelectorAll('.delete-webdav-btn');
  deleteButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const settingsId = parseInt(target.dataset.settingsId || '0');
      await handleDeleteSettings(settingsId, onDeleted);
    });
  });

  // Toggle settings buttons
  const toggleButtons = document.querySelectorAll('.toggle-webdav-btn');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const settingsId = parseInt(target.dataset.settingsId || '0');
      const enabled = target.dataset.enabled === 'true';
      await handleToggleSettings(settingsId, !enabled, onToggled);
    });
  });

  // Edit settings buttons
  const editButtons = document.querySelectorAll('.edit-webdav-btn');
  editButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const settingsId = parseInt(target.dataset.settingsId || '0');
      await handleEditSettings(settingsId, onEdited);
    });
  });

  // Import recipes buttons
  const importButtons = document.querySelectorAll('.import-recipes-btn');
  importButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const settingsId = parseInt(target.dataset.settingsId || '0');
      await handleImportRecipes(settingsId);
    });
  });
}
