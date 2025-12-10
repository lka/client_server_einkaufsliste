/**
 * WebDAV form rendering and handling.
 */

import type { WebDAVSettings } from '../../data/api.js';
import { createWebDAVSettings } from '../../data/api.js';
import { createButton, createInput } from '../components/index.js';
import { showError, showSuccess } from '../components/toast.js';

/**
 * Render the WebDAV form.
 */
export function renderWebDAVForm(onSaved: () => Promise<void>): void {
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
      await handleSaveSettings(
        {
          url: urlInputGroup.input.value,
          username: usernameInputGroup.input.value,
          password: passwordInputGroup.input.value,
          filename: filenameInputGroup.input.value,
        },
        () => renderWebDAVForm(onSaved),
        onSaved
      );
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
async function handleSaveSettings(
  settings: WebDAVSettings,
  clearForm: () => void,
  onSaved: () => Promise<void>
): Promise<void> {
  if (!settings.url || !settings.username || !settings.password || !settings.filename) {
    showError('Bitte fülle alle Felder aus');
    return;
  }

  try {
    await createWebDAVSettings(settings);
    showSuccess('WebDAV-Einstellungen gespeichert');
    clearForm();
    await onSaved();
  } catch (error) {
    showError('Fehler beim Speichern der Einstellungen');
    console.error('Error saving WebDAV settings:', error);
  }
}
