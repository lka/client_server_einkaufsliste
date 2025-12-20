/**
 * Weekplan entry input functionality
 * Handles creating and managing entry input fields with autocomplete
 */

import { Autocomplete, showError, createInput } from '../components/index.js';
import { createWeekplanEntry } from '../../data/api.js';
import { searchRecipes } from '../../data/api/recipes-api.js';
import { fetchTemplates } from '../../data/api/templates-api.js';
import { broadcastWeekplanAdd } from '../../data/websocket.js';
import { weekplanState } from './weekplan-state.js';
import { getMonday, formatISODate } from './weekplan-utils.js';
import { addMealItemToDOM } from './weekplan-rendering.js';
import { DAY_NAMES } from './types.js';


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

      // Calculate date for the entry
      const dateISO = calculateDateForDay(dayName);

      try {
        const entry = await createWeekplanEntry({
          date: dateISO,
          meal: meal,
          text: textToSave
        });

        // Add to state
        weekplanState.addEntry(entry);

        // Add to DOM
        addMealItemToDOM(mealContent, entry.text, entry.id!, entry.recipe_id, entry.template_id, entry.entry_type);

        // Remove the existing input wrapper
        if (existingWrapper) {
          existingWrapper.remove();
        }

        // Broadcast to other users via WebSocket
        broadcastWeekplanAdd(entry);

        // Continue to create a new input below
      } catch (error) {
        console.error('Failed to create entry:', error);
        existingInput.disabled = false;
        showError('Fehler beim Speichern des Eintrags');
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

/**
 * Calculate the ISO date string for a given day name
 */
function calculateDateForDay(dayName: string): string {
  const today = new Date();
  const offset = weekplanState.getWeekOffset();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (offset * 7));
  const monday = getMonday(targetDate);

  const dayIndex = DAY_NAMES.indexOf(dayName as any);
  const date = new Date(monday);
  date.setDate(monday.getDate() + dayIndex);

  return formatISODate(date);
}

/**
 * Create an entry input field with autocomplete
 */
function createEntryInput(
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

  // Function to save the entry
  const saveEntry = async (text: string, recipeId?: number, templateId?: number, entryType?: 'text' | 'template' | 'recipe') => {
    if (!text.trim()) return;

    input.disabled = true;

    // Calculate date for the entry
    const dateISO = calculateDateForDay(dayName);

    try {
      const entry = await createWeekplanEntry({
        date: dateISO,
        meal: meal,
        text: text.trim(),
        entry_type: entryType || 'text',
        recipe_id: recipeId,
        template_id: templateId
      });

      // Add to state
      weekplanState.addEntry(entry);

      // Add to DOM
      addMealItemToDOM(mealContent, entry.text, entry.id!, entry.recipe_id, entry.template_id, entry.entry_type);
      autocomplete.destroy();
      inputWrapper.remove();

      // Broadcast to other users via WebSocket
      broadcastWeekplanAdd(entry);
    } catch (error) {
      console.error('Failed to create entry:', error);
      input.disabled = false;
      showError('Fehler beim Speichern des Eintrags');
    }
  };

  // Initialize Autocomplete for entry suggestions (including recipes)
  const autocomplete = new Autocomplete({
    input,
    onSearch: async (query: string) => {
      // Fetch templates, recipes in parallel
      const [templates, recipeSuggestions] = await Promise.all([
        fetchTemplates().catch(() => []),
        searchRecipes(query, 5).catch(() => []) // Fallback to empty array on error
      ]);

      // Filter templates by query
      const lowerQuery = query.toLowerCase();
      const templateSuggestions = templates
        .filter(t => t.name.toLowerCase().includes(lowerQuery))
        .slice(0, 5);

      // Combine both suggestion types - templates first, then recipes
      type SuggestionItem = {
        id: string;
        label: string;
        data: string;
        name?: string;
      };

      const combined: SuggestionItem[] = [
        ...templateSuggestions.map(template => ({
          id: `template-${template.id}`,
          label: template.name,
          data: template.name,
        })),
        ...recipeSuggestions.map(recipe => ({
          id: `recipe-${recipe.id}`,
          label: `🍳 ${recipe.name}`,
          data: recipe.name,
          name: recipe.name, // Store original name for duplicate detection
        }))
      ];

      // Add numbering to recipes with duplicate names
      const recipeNameCounts = new Map<string, number>();
      const recipeNameIndices = new Map<string, number>();

      // Count occurrences of each recipe name
      combined.forEach(item => {
        if (item.id.startsWith('recipe-') && item.name) {
          recipeNameCounts.set(item.name, (recipeNameCounts.get(item.name) || 0) + 1);
        }
      });

      // Add numbering only to duplicates
      const numberedCombined = combined.map(item => {
        if (item.id.startsWith('recipe-') && item.name) {
          const count = recipeNameCounts.get(item.name) || 0;
          if (count > 1) {
            const index = (recipeNameIndices.get(item.name) || 0) + 1;
            recipeNameIndices.set(item.name, index);
            return {
              ...item,
              label: `🍳 ${item.name} (${index})`,
            };
          }
        }
        return item;
      });

      // Limit to maxSuggestions
      return numberedCombined.slice(0, 5);
    },
    onSelect: (suggestion) => {
      // Save entry immediately when suggestion is selected
      const id = String(suggestion.id);

      let recipeId: number | undefined;
      let templateId: number | undefined;
      let entryType: 'text' | 'template' | 'recipe';

      if (id.startsWith('recipe-')) {
        recipeId = parseInt(id.replace('recipe-', ''));
        entryType = 'recipe';
      } else if (id.startsWith('template-')) {
        templateId = parseInt(id.replace('template-', ''));
        entryType = 'template';
      } else {
        entryType = 'text';
      }

      saveEntry(suggestion.data, recipeId, templateId, entryType);
    },
    debounceMs: 300,
    minChars: 2,
    maxSuggestions: 5,
  });

  // Add entry on Enter key
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      await saveEntry(input.value);
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
