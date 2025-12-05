/**
 * Backup and restore API operations.
 */

import type { BackupData, RestoreResult } from './types.js';
import { API_BACKUP } from './types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from './utils.js';

/**
 * Create a database backup.
 * Returns JSON backup data that can be saved as a file.
 */
export async function createBackup(): Promise<BackupData | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  try {
    const res = await fetch(API_BACKUP, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to create backup:', errorData.detail || res.statusText);
      alert(`Fehler beim Backup: ${errorData.detail || res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
  }
}

/**
 * Restore database from backup JSON data.
 * @param backupData - The backup data to restore
 * @param clearExisting - Whether to clear existing data first (default: true)
 */
export async function restoreBackup(
  backupData: BackupData,
  clearExisting: boolean = true
): Promise<RestoreResult | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  try {
    const url = `${API_BACKUP}/restore?clear_existing=${clearExisting}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(backupData),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to restore backup:', errorData.detail || res.statusText);
      alert(`Fehler beim Restore: ${errorData.detail || res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error restoring backup:', error);
    return null;
  }
}
