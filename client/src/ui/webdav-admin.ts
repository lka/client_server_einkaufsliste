/**
 * WebDAV settings administration UI component.
 *
 * Provides UI for managing WebDAV settings (create, update, delete).
 */

import {
  fetchWebDAVSettings,
  createWebDAVSettings,
  updateWebDAVSettings,
  deleteWebDAVSettings,
  importRecipesFromWebDAV,
} from '../data/api.js';
import type { WebDAVSettings } from '../data/api.js';
import { createButton, createInput } from './components/index.js';
import { Modal } from './components/modal.js';
import { showError, showSuccess, showWarning } from './components/toast.js';

/**
 * Initialize the WebDAV settings admin UI.
 */
export function initWebDAVAdmin(): void {
  // Load and render settings
  loadWebDAVSettings();

  // Render the form
  renderWebDAVForm();

  // Attach event listeners
  attachWebDAVAdminListeners();
}

/**
 * Load and render WebDAV settings from API.
 */
async function loadWebDAVSettings(): Promise<void> {
  try {
    const settings = await fetchWebDAVSettings();
    await renderWebDAVSettings(settings);
  } catch (error) {
    showError('Fehler beim Laden der WebDAV-Einstellungen');
    console.error('Error loading WebDAV settings:', error);
  }
}

/**
 * Render the WebDAV form.
 */
function renderWebDAVForm(): void {
  const formContainer = document.getElementById('webdavForm');
  if (!formContainer) return;

  const urlInputGroup = createInput({
    label: 'WebDAV URL',
    placeholder: 'https://cloud.example.com/remote.php/dav/files/user/',
    type: 'url',
    required: true,
  });

  const usernameInputGroup = createInput({
    label: 'Benutzername',
    placeholder: 'Benutzername',
    type: 'text',
    required: true,
  });

  const passwordInputGroup = createInput({
    label: 'Passwort',
    placeholder: 'Passwort',
    type: 'password',
    required: true,
  });

  const filenameInputGroup = createInput({
    label: 'Dateiname',
    placeholder: 'rezepte.json',
    type: 'text',
    required: true,
  });

  const saveButton = createButton({
    label: 'Speichern',
    variant: 'primary',
    size: 'medium',
    onClick: async () => {
      await handleSaveSettings({
        url: urlInputGroup.input.value,
        username: usernameInputGroup.input.value,
        password: passwordInputGroup.input.value,
        filename: filenameInputGroup.input.value,
      });
    },
  });

  formContainer.innerHTML = '';
  formContainer.appendChild(urlInputGroup.container);
  formContainer.appendChild(usernameInputGroup.container);
  formContainer.appendChild(passwordInputGroup.container);
  formContainer.appendChild(filenameInputGroup.container);
  formContainer.appendChild(saveButton);
}

/**
 * Handle saving WebDAV settings.
 */
async function handleSaveSettings(settings: WebDAVSettings): Promise<void> {
  if (!settings.url || !settings.username || !settings.password || !settings.filename) {
    showError('Bitte fülle alle Felder aus');
    return;
  }

  try {
    await createWebDAVSettings(settings);
    showSuccess('WebDAV-Einstellungen gespeichert');

    // Clear form by re-rendering
    renderWebDAVForm();

    // Reload settings list
    await loadWebDAVSettings();
  } catch (error) {
    showError('Fehler beim Speichern der Einstellungen');
    console.error('Error saving WebDAV settings:', error);
  }
}

/**
 * Render WebDAV settings list.
 */
async function renderWebDAVSettings(settings: readonly WebDAVSettings[]): Promise<void> {
  const container = document.getElementById('webdavList');
  if (!container) return;

  if (settings.length === 0) {
    container.innerHTML = '<div class="no-settings">Keine WebDAV-Konfigurationen vorhanden.</div>';
    return;
  }

  const html = settings
    .map(
      (setting) => `
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
        <button class="import-recipes-btn" data-settings-id="${setting.id}" title="Rezepte importieren" ${!setting.enabled ? 'disabled' : ''}>
          📥 Rezepte importieren
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
    </div>
  `
    )
    .join('');

  container.innerHTML = html;

  // Re-attach event listeners after rendering
  attachDynamicListeners();
}

/**
 * Attach event listeners to admin controls.
 */
function attachWebDAVAdminListeners(): void {
  // Event listeners are handled through dynamic attachment
}

/**
 * Attach dynamic event listeners (for dynamically rendered elements).
 */
function attachDynamicListeners(): void {
  // Delete settings buttons
  const deleteButtons = document.querySelectorAll('.delete-webdav-btn');
  deleteButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const settingsId = parseInt(target.dataset.settingsId || '0');
      await handleDeleteSettings(settingsId);
    });
  });

  // Toggle settings buttons
  const toggleButtons = document.querySelectorAll('.toggle-webdav-btn');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const settingsId = parseInt(target.dataset.settingsId || '0');
      const enabled = target.dataset.enabled === 'true';
      await handleToggleSettings(settingsId, !enabled);
    });
  });

  // Edit settings buttons
  const editButtons = document.querySelectorAll('.edit-webdav-btn');
  editButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const settingsId = parseInt(target.dataset.settingsId || '0');
      await handleEditSettings(settingsId);
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

/**
 * Handle deleting WebDAV settings.
 */
async function handleDeleteSettings(settingsId: number): Promise<void> {
  const modalContent = document.createElement('div');
  modalContent.innerHTML = '<p>Möchtest du diese WebDAV-Konfiguration wirklich löschen?</p>';

  const modal = new Modal({
    title: 'WebDAV-Konfiguration löschen',
    content: modalContent,
    size: 'small',
  });

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.justifyContent = 'flex-end';
  buttonContainer.style.marginTop = '20px';

  const cancelBtn = createButton({
    label: 'Abbrechen',
    variant: 'secondary',
    onClick: () => modal.close(),
  });

  const deleteBtn = createButton({
    label: 'Löschen',
    variant: 'danger',
    onClick: async () => {
      try {
        await deleteWebDAVSettings(settingsId);
        showSuccess('WebDAV-Konfiguration gelöscht');
        modal.close();
        await loadWebDAVSettings();
      } catch (error) {
        showError('Fehler beim Löschen der Konfiguration');
        console.error('Error deleting WebDAV settings:', error);
      }
    },
  });

  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(deleteBtn);
  modalContent.appendChild(buttonContainer);

  modal.open();
}

/**
 * Handle toggling WebDAV settings enabled state.
 */
async function handleToggleSettings(settingsId: number, enabled: boolean): Promise<void> {
  try {
    await updateWebDAVSettings(settingsId, { enabled });
    showSuccess(`WebDAV-Konfiguration ${enabled ? 'aktiviert' : 'deaktiviert'}`);
    await loadWebDAVSettings();
  } catch (error) {
    showError('Fehler beim Aktualisieren der Konfiguration');
    console.error('Error updating WebDAV settings:', error);
  }
}

/**
 * Handle editing WebDAV settings.
 */
async function handleEditSettings(settingsId: number): Promise<void> {
  try {
    const settings = await fetchWebDAVSettings();
    const setting = settings.find((s) => s.id === settingsId);
    if (!setting) {
      showError('Konfiguration nicht gefunden');
      return;
    }

    // Create modal with edit form
    const modalContent = document.createElement('div');
    modalContent.className = 'webdav-edit-form';

    const urlInputGroup = createInput({
      label: 'WebDAV URL',
      placeholder: 'https://cloud.example.com/remote.php/dav/files/user/',
      type: 'url',
      required: true,
      value: setting.url,
    });

    const usernameInputGroup = createInput({
      label: 'Benutzername',
      placeholder: 'Benutzername',
      type: 'text',
      required: true,
      value: setting.username,
    });

    const passwordInputGroup = createInput({
      label: 'Passwort (leer lassen für unverändert)',
      placeholder: 'Neues Passwort',
      type: 'password',
      required: false,
    });

    const filenameInputGroup = createInput({
      label: 'Dateiname',
      placeholder: 'rezepte.json',
      type: 'text',
      required: true,
      value: setting.filename,
    });

    modalContent.appendChild(urlInputGroup.container);
    modalContent.appendChild(usernameInputGroup.container);
    modalContent.appendChild(passwordInputGroup.container);
    modalContent.appendChild(filenameInputGroup.container);

    const modal = new Modal({
      title: 'WebDAV-Konfiguration bearbeiten',
      content: modalContent,
      size: 'medium',
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.marginTop = '20px';

    const cancelBtn = createButton({
      label: 'Abbrechen',
      variant: 'secondary',
      onClick: () => modal.close(),
    });

    const saveBtn = createButton({
      label: 'Speichern',
      variant: 'primary',
      onClick: async () => {
        const updateData: Partial<WebDAVSettings> = {
          url: urlInputGroup.input.value,
          username: usernameInputGroup.input.value,
          filename: filenameInputGroup.input.value,
        };

        if (passwordInputGroup.input.value) {
          updateData.password = passwordInputGroup.input.value;
        }

        try {
          await updateWebDAVSettings(settingsId, updateData);
          showSuccess('WebDAV-Konfiguration aktualisiert');
          modal.close();
          await loadWebDAVSettings();
        } catch (error) {
          showError('Fehler beim Aktualisieren der Konfiguration');
          console.error('Error updating WebDAV settings:', error);
        }
      },
    });

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);
    modalContent.appendChild(buttonContainer);

    modal.open();
  } catch (error) {
    showError('Fehler beim Laden der Konfiguration');
    console.error('Error loading WebDAV settings:', error);
  }
}

/**
 * Handle importing recipes from WebDAV.
 */
async function handleImportRecipes(settingsId: number): Promise<void> {
  const modalContent = document.createElement('div');
  modalContent.innerHTML = '<p>Möchtest du jetzt die Rezepte von WebDAV importieren? Dies kann einige Sekunden dauern.</p>';

  const modal = new Modal({
    title: 'Rezepte importieren',
    content: modalContent,
    size: 'small',
  });

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.justifyContent = 'flex-end';
  buttonContainer.style.marginTop = '20px';

  const cancelBtn = createButton({
    label: 'Abbrechen',
    variant: 'secondary',
    onClick: () => modal.close(),
  });

  const importBtn = createButton({
    label: '📥 Importieren',
    variant: 'primary',
    onClick: async () => {
      importBtn.disabled = true;
      importBtn.textContent = '⏳ Importiere...';

      try {
        const result = await importRecipesFromWebDAV(settingsId);

        modal.close();

        if (result.errors && result.errors.length > 0) {
          showWarning(`${result.message}. Es gab ${result.errors.length} Fehler.`);
          console.warn('Import errors:', result.errors);
        } else {
          showSuccess(result.message);
        }
      } catch (error) {
        importBtn.disabled = false;
        importBtn.textContent = '📥 Importieren';

        if (error instanceof Error) {
          showError(`Import fehlgeschlagen: ${error.message}`);
        } else {
          showError('Import fehlgeschlagen');
        }
        console.error('Error importing recipes:', error);
      }
    },
  });

  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(importBtn);
  modalContent.appendChild(buttonContainer);

  modal.open();
}
