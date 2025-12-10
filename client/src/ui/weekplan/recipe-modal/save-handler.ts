/**
 * Save handler for recipe deltas.
 */

import type { WeekplanEntry } from '../types.js';
import type { RecipeModalState } from './types.js';
import { updateWeekplanEntryDeltas } from '../../../data/api.js';
import { createDeltasForSave } from './delta-manager.js';

/**
 * Handle save button click.
 */
export async function handleSaveDeltas(
  entryId: number,
  state: RecipeModalState,
  originalQuantity: number,
  currentEntry: WeekplanEntry | undefined,
  saveButton: HTMLButtonElement,
  onSuccess: () => void
): Promise<void> {
  try {
    saveButton.disabled = true;
    saveButton.textContent = 'Speichere...';

    const newDeltas = createDeltasForSave(state, originalQuantity);
    await updateWeekplanEntryDeltas(entryId, newDeltas);

    // Update local store
    if (currentEntry) {
      currentEntry.deltas = newDeltas;
    }

    saveButton.textContent = '✓ Gespeichert';
    saveButton.style.backgroundColor = '#5cb85c';

    setTimeout(() => {
      onSuccess();
    }, 500);
  } catch (error) {
    console.error('Failed to save deltas:', error);
    saveButton.disabled = false;
    saveButton.textContent = 'Fehler - Nochmal versuchen';
    saveButton.style.backgroundColor = '#d9534f';
    setTimeout(() => {
      saveButton.textContent = 'Änderungen speichern';
      saveButton.style.backgroundColor = '#4a90e2';
    }, 2000);
  }
}
