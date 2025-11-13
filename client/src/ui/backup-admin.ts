/**
 * Database backup and restore UI component.
 *
 * Provides UI for creating backups and restoring from backup files.
 */

import { createBackup, restoreBackup, type BackupData } from '../data/api.js';
import { showError, showSuccess } from './components/toast.js';
import { createButton } from './components/button.js';

/**
 * Initialize the backup admin UI.
 */
export function initBackupAdmin(): void {
  createBackupButtons();
  attachEventListeners();
}

/**
 * Create backup action buttons using the Button component.
 */
function createBackupButtons(): void {
  const backupActions = document.getElementById('backupActions');
  if (!backupActions) return;

  // Create backup button
  const createBackupBtn = createButton({
    label: '💾 Backup erstellen',
    variant: 'primary',
    onClick: handleCreateBackup,
  });
  createBackupBtn.id = 'createBackupBtn';
  backupActions.appendChild(createBackupBtn);

  // Restore button (file input is in HTML)
  const restoreBtn = createButton({
    label: '📂 Backup hochladen & wiederherstellen',
    variant: 'secondary',
    onClick: () => {
      const fileInput = document.getElementById('restoreFileInput') as HTMLInputElement;
      fileInput?.click();
    },
  });
  restoreBtn.id = 'restoreBtn';
  backupActions.appendChild(restoreBtn);
}

/**
 * Attach event listeners.
 */
function attachEventListeners(): void {
  const fileInput = document.getElementById('restoreFileInput') as HTMLInputElement;
  fileInput?.addEventListener('change', handleFileSelected);
}

/**
 * Handle creating a backup.
 */
async function handleCreateBackup(): Promise<void> {
  const backupBtn = document.getElementById('createBackupBtn') as HTMLButtonElement;
  if (!backupBtn) return;

  // Disable button during operation
  backupBtn.disabled = true;
  const originalText = backupBtn.textContent;
  backupBtn.textContent = '⏳ Erstelle Backup...';

  try {
    const backupData = await createBackup();

    if (!backupData) {
      showError('Backup konnte nicht erstellt werden.');
      return;
    }

    // Create download link for JSON file
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Generate filename with timestamp
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);
    a.download = `einkaufsliste-backup-${dateStr}.json`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Backup erfolgreich erstellt und heruntergeladen!');

    // Update info display
    updateBackupInfo(backupData);

  } catch (error) {
    console.error('Error creating backup:', error);
    showError('Fehler beim Erstellen des Backups.');
  } finally {
    // Re-enable button
    backupBtn.disabled = false;
    backupBtn.textContent = originalText || '💾 Backup erstellen';
  }
}

/**
 * Handle file selection for restore.
 */
async function handleFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  // Validate file type
  if (!file.name.endsWith('.json')) {
    showError('Bitte wählen Sie eine JSON-Datei aus.');
    input.value = '';
    return;
  }

  try {
    // Read file content
    const content = await file.text();
    const backupData: BackupData = JSON.parse(content);

    // Validate backup structure
    if (!backupData.version || !backupData.timestamp) {
      showError('Ungültiges Backup-Format.');
      input.value = '';
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm(
      `Backup wiederherstellen?\n\n` +
      `Version: ${backupData.version}\n` +
      `Zeitstempel: ${new Date(backupData.timestamp).toLocaleString('de-DE')}\n` +
      `Benutzer: ${backupData.users.length}\n` +
      `Geschäfte: ${backupData.stores.length}\n` +
      `Abteilungen: ${backupData.departments.length}\n` +
      `Produkte: ${backupData.products.length}\n` +
      `Einkaufsliste: ${backupData.items.length}\n` +
      `Templates: ${backupData.templates.length}\n\n` +
      `WARNUNG: Alle vorhandenen Daten werden gelöscht!`
    );

    if (!confirmed) {
      input.value = '';
      return;
    }

    // Perform restore
    await handleRestore(backupData);

    // Clear file input
    input.value = '';

  } catch (error) {
    console.error('Error reading backup file:', error);
    showError('Fehler beim Lesen der Backup-Datei. Bitte überprüfen Sie das Format.');
    input.value = '';
  }
}

/**
 * Handle restoring from backup data.
 */
async function handleRestore(backupData: BackupData): Promise<void> {
  const restoreBtn = document.getElementById('restoreBtn') as HTMLButtonElement;
  if (!restoreBtn) return;

  // Disable button during operation
  restoreBtn.disabled = true;
  const originalText = restoreBtn.textContent;
  restoreBtn.textContent = '⏳ Stelle wieder her...';

  try {
    const result = await restoreBackup(backupData, true);

    if (!result) {
      showError('Wiederherstellung fehlgeschlagen.');
      return;
    }

    showSuccess(
      `Datenbank erfolgreich wiederhergestellt!\n\n` +
      `Benutzer: ${result.restored.users}\n` +
      `Geschäfte: ${result.restored.stores}\n` +
      `Abteilungen: ${result.restored.departments}\n` +
      `Produkte: ${result.restored.products}\n` +
      `Einkaufsliste: ${result.restored.items}\n` +
      `Templates: ${result.restored.templates}`
    );

    // Suggest page reload
    setTimeout(() => {
      if (confirm('Möchten Sie die Seite neu laden, um die wiederhergestellten Daten zu sehen?')) {
        window.location.reload();
      }
    }, 2000);

  } catch (error) {
    console.error('Error restoring backup:', error);
    showError('Fehler bei der Wiederherstellung.');
  } finally {
    // Re-enable button
    restoreBtn.disabled = false;
    restoreBtn.textContent = originalText || '📂 Backup hochladen & wiederherstellen';
  }
}

/**
 * Update the backup info display with data counts.
 */
function updateBackupInfo(backupData: BackupData): void {
  const infoDiv = document.getElementById('backupInfo');
  if (!infoDiv) return;

  const timestamp = new Date(backupData.timestamp).toLocaleString('de-DE');

  infoDiv.innerHTML = `
    <div class="backup-info-card">
      <h3>Letztes Backup</h3>
      <p><strong>Version:</strong> ${backupData.version}</p>
      <p><strong>Zeitstempel:</strong> ${timestamp}</p>
      <hr>
      <h4>Enthaltene Daten:</h4>
      <ul>
        <li>Benutzer: ${backupData.users.length}</li>
        <li>Geschäfte: ${backupData.stores.length}</li>
        <li>Abteilungen: ${backupData.departments.length}</li>
        <li>Produkte: ${backupData.products.length}</li>
        <li>Einkaufsliste: ${backupData.items.length}</li>
        <li>Templates: ${backupData.templates.length}</li>
        <li>Template-Items: ${backupData.template_items.length}</li>
      </ul>
    </div>
  `;
}
