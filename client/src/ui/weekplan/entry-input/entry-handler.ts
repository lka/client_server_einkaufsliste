/**
 * Main entry handler for adding weekplan entries
 */

import { createEntryInput } from './input-creation.js';
import { saveEntry } from './entry-save.js';

/**
 * Handle adding a new meal entry
 * Creates an input field with autocomplete for entering weekplan items
 */
export async function handleAddMealEntry(event: Event): Promise<void> {
  const button = event.target as HTMLButtonElement;
  const mealSection = button.closest('.meal-section');
  const mealContent = mealSection?.querySelector('.meal-content');
  const dayColumn = button.closest('.day-column');

  if (!mealContent || !mealSection || !dayColumn) return;

  const meal = mealSection.getAttribute('data-meal');
  const dayName = dayColumn.getAttribute('data-day');

  if (!meal || !dayName) return;

  // Check if there's already an input field
  const existingInput = mealContent.querySelector('.meal-input') as HTMLInputElement;
  if (existingInput) {
    // If there's content, save it first, then create a new input
    if (existingInput.value.trim()) {
      const textToSave = existingInput.value.trim();
      const existingWrapper = existingInput.closest('div');

      // Disable the input to prevent double-submission
      existingInput.disabled = true;

      const success = await saveEntry(mealContent, meal, dayName, textToSave, {
        onSuccess: () => {
          // Remove the existing input wrapper
          if (existingWrapper) {
            existingWrapper.remove();
          }
        },
        onError: () => {
          existingInput.disabled = false;
        }
      });

      if (!success) {
        return; // Don't create a new input if save failed
      }
    } else {
      // Empty input, just focus it
      existingInput.focus();
      return;
    }
  }

  // Create the entry input field
  createEntryInput(mealContent, meal, dayName);
}
