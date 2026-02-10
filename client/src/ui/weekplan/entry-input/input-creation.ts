/**
 * Input creation and management for entry input
 */

import { Autocomplete, createInput } from '../../components/index.js';
import { saveEntry } from './entry-save.js';
import { searchSuggestions, parseSuggestionId, MAX_SUGGESTIONS } from './autocomplete-helpers.js';

/**
 * Create an entry input field with autocomplete
 */
export function createEntryInput(
  mealContent: Element,
  meal: string,
  dayName: string
): void {
  // Create wrapper for input and autocomplete
  const inputWrapper = document.createElement('div');
  inputWrapper.style.cssText = `
    position: relative;
    margin-bottom: 0.5rem;
  `;

  // Create input field using component library
  const inputGroup = createInput({
    type: 'text',
    id: `weekplan-entry-input-${dayName}-${meal}`,
    name: `weekplanEntry_${dayName}_${meal}`,
    placeholder: 'Eintrag hinzufügen...',
    className: 'meal-input'
  });

  // Apply custom styling for weekplan entry input
  inputGroup.container.style.marginBottom = '0';
  inputGroup.input.style.fontSize = '0.9rem';

  const input = inputGroup.input;

  inputWrapper.appendChild(inputGroup.container);

  // Function to save the entry and clean up
  const saveAndCleanup = async (
    text: string,
    recipeId?: number,
    templateId?: number,
    entryType?: 'text' | 'template' | 'recipe'
  ) => {
    input.disabled = true;

    const success = await saveEntry(mealContent, meal, dayName, text, {
      recipeId,
      templateId,
      entryType,
      onSuccess: () => {
        autocomplete.destroy();
        inputWrapper.remove();
      },
      onError: () => {
        input.disabled = false;
      }
    });

    return success;
  };

  // Initialize Autocomplete for entry suggestions (including recipes)
  const autocomplete = new Autocomplete({
    input,
    onSearch: searchSuggestions,
    onSelect: (suggestion) => {
      // Save entry immediately when suggestion is selected
      const { recipeId, templateId, entryType } = parseSuggestionId(String(suggestion.id));
      saveAndCleanup(suggestion.data, recipeId, templateId, entryType);
    },
    debounceMs: 300,
    minChars: 2,
    maxSuggestions: MAX_SUGGESTIONS,
  });

  // Add entry on Enter key
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      await saveAndCleanup(input.value);
    } else if (e.key === 'Escape') {
      autocomplete.destroy();
      inputWrapper.remove();
    }
  });

  // Remove input on blur if empty
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!input.value.trim()) {
        autocomplete.destroy();
        inputWrapper.remove();
      }
    }, 200);
  });

  mealContent.insertBefore(inputWrapper, mealContent.firstChild);
  input.focus();
}
