/**
 * Modal dialogs for WebDAV admin.
 */

import type { WebDAVSettings } from '../../data/api.js';
import {
  fetchWebDAVSettings,
  updateWebDAVSettings,
  deleteWebDAVSettings,
  importRecipesFromWebDAV } from '../../data/api.js';
import {
  createButton,
  createInput,
  showError,
  showSuccess,
  showWarning,
  Modal } from '../components/index.js';

/**
 * Show delete confirmation modal.
 */
export async function showDeleteConfirmation(
  settingsId: number,
  onDeleted: () => Promise<void>
): Promise<void> {
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
        await onDeleted();
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
 * Show edit settings modal.
 */
export async function showEditModal(
  settingsId: number,
  onUpdated: () => Promise<void>
): Promise<void> {
  try {
    const settings = await fetchWebDAVSettings();
    const setting = settings.find((s) => s.id === settingsId);
    if (!setting) {
      showError('Konfiguration nicht gefunden');
      return;
    }

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
          await onUpdated();
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
 * Show import recipes confirmation modal.
 */
export async function showImportConfirmation(settingsId: number): Promise<void> {
  const modalContent = document.createElement('div');

  const messageEl = document.createElement('p');
  messageEl.textContent = 'Möchtest du jetzt die Rezepte von WebDAV einlesen? Dies kann bis zu 30 Sekunden dauern.';
  modalContent.appendChild(messageEl);

  // Progress container (initially hidden)
  const progressContainer = document.createElement('div');
  progressContainer.style.display = 'none';
  progressContainer.style.marginTop = '20px';
  progressContainer.style.marginBottom = '20px';

  const progressMessage = document.createElement('div');
  progressMessage.style.marginBottom = '10px';
  progressMessage.style.fontSize = '0.9rem';
  progressMessage.style.color = '#666';
  progressContainer.appendChild(progressMessage);

  const progressBarOuter = document.createElement('div');
  progressBarOuter.style.width = '100%';
  progressBarOuter.style.height = '24px';
  progressBarOuter.style.backgroundColor = '#e0e0e0';
  progressBarOuter.style.borderRadius = '12px';
  progressBarOuter.style.overflow = 'hidden';
  progressBarOuter.style.position = 'relative';

  const progressBarInner = document.createElement('div');
  progressBarInner.style.height = '100%';
  progressBarInner.style.width = '0%';
  progressBarInner.style.backgroundColor = '#007bff';
  progressBarInner.style.transition = 'width 0.3s ease';
  progressBarInner.style.borderRadius = '12px';
  progressBarOuter.appendChild(progressBarInner);

  const progressText = document.createElement('div');
  progressText.style.position = 'absolute';
  progressText.style.top = '50%';
  progressText.style.left = '50%';
  progressText.style.transform = 'translate(-50%, -50%)';
  progressText.style.fontSize = '0.85rem';
  progressText.style.fontWeight = 'bold';
  progressText.style.color = '#333';
  progressText.textContent = '0%';
  progressBarOuter.appendChild(progressText);

  progressContainer.appendChild(progressBarOuter);
  modalContent.appendChild(progressContainer);

  const modal = new Modal({
    title: 'Rezepte einlesen',
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

  const importBtn = createButton({
    label: '📥 Einlesen',
    variant: 'primary',
    onClick: async () => {
      importBtn.disabled = true;
      cancelBtn.disabled = true;
      progressContainer.style.display = 'block';
      messageEl.style.display = 'none';

      try {
        const result = await importRecipesFromWebDAV(settingsId, (progress) => {
          // Update progress UI
          if (progress.message) {
            progressMessage.textContent = progress.message;
          }

          if (progress.total && progress.current !== undefined) {
            const percentage = Math.round((progress.current / progress.total) * 100);
            progressBarInner.style.width = `${percentage}%`;
            progressText.textContent = `${percentage}%`;

            if (progress.imported !== undefined) {
              progressText.textContent = `${percentage}% (${progress.imported} Rezepte)`;
            }
          } else if (progress.status === 'downloading' || progress.status === 'extracting') {
            // Indeterminate progress
            progressBarInner.style.width = '100%';
            progressBarInner.style.animation = 'pulse 1.5s ease-in-out infinite';
            progressText.textContent = '';
          } else if (progress.status === 'committing') {
            progressBarInner.style.width = '95%';
            progressText.textContent = '95%';
          }
        });

        modal.close();

        if (result.errors && result.errors.length > 0) {
          showWarning(`${result.message}. Es gab ${result.errors.length} Fehler.`);
          console.warn('Import errors:', result.errors);
        } else {
          showSuccess(result.message);
        }
      } catch (error) {
        importBtn.disabled = false;
        cancelBtn.disabled = false;
        progressContainer.style.display = 'none';
        messageEl.style.display = 'block';

        if (error instanceof Error) {
          showError(`Einlesen fehlgeschlagen: ${error.message}`);
        } else {
          showError('Einlesen fehlgeschlagen');
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
