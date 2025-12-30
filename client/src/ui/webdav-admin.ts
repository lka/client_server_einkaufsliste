/**
 * WebDAV settings administration UI component.
 *
 * Provides UI for managing WebDAV settings (create, update, delete).
 */

import { webdavAdminState } from '../state/webdav-admin-state.js';
import { showError } from './components/toast.js';
import { renderWebDAVForm } from './webdav-admin/form.js';
import { renderWebDAVSettings } from './webdav-admin/renderer.js';
import { attachDynamicListeners } from './webdav-admin/event-handlers.js';

/**
 * Initialize the WebDAV settings admin UI.
 */
export function initWebDAVAdmin(): void {
  // Subscribe to state changes for reactive updates
  webdavAdminState.subscribe((state) => {
    renderWebDAVSettings(state.settings, () => {
      attachDynamicListeners(
        loadWebDAVSettings,
        loadWebDAVSettings,
        loadWebDAVSettings
      );
    });
  });

  // Initialize WebSocket
  webdavAdminState.initializeWebSocket();

  // Load initial data
  loadWebDAVSettings();

  // Render the form
  renderWebDAVForm(loadWebDAVSettings);
}

/**
 * Load WebDAV settings from API.
 */
async function loadWebDAVSettings(): Promise<void> {
  try {
    await webdavAdminState.loadSettings();
  } catch (error) {
    showError('Fehler beim Laden der WebDAV-Einstellungen');
    console.error('Error loading WebDAV settings:', error);
  }
}

/**
 * Cleanup WebDAV admin state.
 */
export function cleanupWebDAVAdmin(): void {
  webdavAdminState.destroy();
}
