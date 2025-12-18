/**
 * WebDAV settings list rendering.
 */

import type { WebDAVSettings } from '../../data/api.js';

/**
 * Render a single WebDAV settings item.
 */
function renderWebDAVItem(setting: WebDAVSettings): string {
  return `
    <div class="webdav-item" data-settings-id="${setting.id}">
      <div class="webdav-info">
        <div class="webdav-url">
          <strong>URL:</strong> ${setting.url}
        </div>
        <div class="webdav-details">
          <span><strong>Benutzername:</strong> ${setting.username}</span>
          <span><strong>Dateiname:</strong> ${setting.filename}</span>
          <span class="webdav-status ${setting.enabled ? 'enabled' : 'disabled'}">
            ${setting.enabled ? '✓ Aktiv' : '✗ Inaktiv'}
          </span>
        </div>
      </div>
      <div class="webdav-controls">
        <button class="import-recipes-btn" data-settings-id="${setting.id}" title="Rezepte einlesen" ${!setting.enabled ? 'disabled' : ''}>
          📥 Rezepte einlesen
        </button>
        <button class="toggle-webdav-btn" data-settings-id="${setting.id}" data-enabled="${setting.enabled}" title="${setting.enabled ? 'Deaktivieren' : 'Aktivieren'}">
          ${setting.enabled ? '⏸' : '▶'}
        </button>
        <button class="edit-webdav-btn" data-settings-id="${setting.id}" title="Bearbeiten">
          ✏️
        </button>
        <button class="delete-webdav-btn" data-settings-id="${setting.id}" title="Löschen">
          🗑️
        </button>
      </div>
    </div>`;
}

/**
 * Render WebDAV settings list.
 */
export function renderWebDAVSettings(
  settings: readonly WebDAVSettings[],
  onRendered: () => void
): void {
  const container = document.getElementById('webdavList');
  if (!container) return;

  if (settings.length === 0) {
    container.innerHTML = '<div class="no-settings">Keine WebDAV-Konfigurationen vorhanden.</div>';
    return;
  }

  const html = settings.map(renderWebDAVItem).join('');
  container.innerHTML = html;

  // Re-attach event listeners after rendering
  onRendered();
}
