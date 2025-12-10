/**
 * WebDAV settings administration UI component.
 *
 * Provides UI for managing WebDAV settings (create, update, delete).
 */

import { fetchWebDAVSettings } from '../data/api.js';
import { showError } from './components/toast.js';
import { renderWebDAVForm } from './webdav-admin/form.js';
import { renderWebDAVSettings } from './webdav-admin/renderer.js';
import { attachDynamicListeners } from './webdav-admin/event-handlers.js';

/**
 * Initialize the WebDAV settings admin UI.
 */
export function initWebDAVAdmin(): void {
  // Load and render settings
  loadWebDAVSettings();

  // Render the form
  renderWebDAVForm(loadWebDAVSettings);
}

/**
 * Load and render WebDAV settings from API.
 */
async function loadWebDAVSettings(): Promise<void> {
  try {
    const settings = await fetchWebDAVSettings();
    renderWebDAVSettings(settings, () => {
      attachDynamicListeners(
        loadWebDAVSettings,
        loadWebDAVSettings,
        loadWebDAVSettings
      );
    });
  } catch (error) {
    showError('Fehler beim Laden der WebDAV-Einstellungen');
    console.error('Error loading WebDAV settings:', error);
  }
}
