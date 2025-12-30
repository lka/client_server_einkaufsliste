/**
 * Save handler for template modal
 */

import type { WeekplanEntry, WeekplanDeltas, DeltaItem } from '../types.js';
import type { Template } from '../../../data/api/types.js';
import { updateWeekplanEntryDeltas } from '../../../data/api.js';
import { Modal } from '../../components/modal.js';
import { createButton } from '../../components/index.js';

/**
 * Create and setup save button with handler
 */
export function createSaveButton(
  entryId: number,
  template: Template,
  currentEntry: WeekplanEntry | undefined,
  contentDiv: HTMLElement,
  removedItems: Set<string>,
  addedItems: Map<string, DeltaItem>,
  getAdjustedPersonCount: () => number | null,
  modal: Modal
): HTMLElement {
  const saveButtonDiv = document.createElement('div');
  saveButtonDiv.style.cssText = 'margin-top: 0.75rem; display: flex; justify-content: flex-end;';

  // Create save button using component library
  const saveButton = createButton({
    label: 'Änderungen speichern',
    variant: 'primary',
    size: 'medium'
  });

  // Override button color to match original blue theme
  saveButton.style.backgroundColor = '#4a90e2';
  saveButton.addEventListener('mouseenter', () => {
    saveButton.style.backgroundColor = '#357abd';
  });
  saveButton.addEventListener('mouseleave', () => {
    saveButton.style.backgroundColor = '#4a90e2';
  });

  // Collect checkbox states from DOM
  const collectCheckboxStates = () => {
    removedItems.clear();
    const checkboxes = contentDiv.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb, index) => {
      const checkbox = cb as HTMLInputElement;
      if (checkbox.checked && template.items[index]) {
        removedItems.add(template.items[index].name);
      }
    });
  };

  saveButton.addEventListener('click', async () => {
    try {
      saveButton.disabled = true;
      saveButton.textContent = 'Speichere...';

      collectCheckboxStates();

      const adjustedPersonCount = getAdjustedPersonCount();
      const newDeltas: WeekplanDeltas = {
        removed_items: Array.from(removedItems),
        added_items: Array.from(addedItems.values()),
        person_count: adjustedPersonCount !== null ? adjustedPersonCount : undefined
      };

      await updateWeekplanEntryDeltas(entryId, newDeltas);

      // Update local store
      if (currentEntry) {
        currentEntry.deltas = newDeltas;
      }

      saveButton.textContent = '✓ Gespeichert';
      saveButton.style.backgroundColor = '#5cb85c';

      setTimeout(() => {
        modal.close();
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
  });

  saveButtonDiv.appendChild(saveButton);
  return saveButtonDiv;
}
