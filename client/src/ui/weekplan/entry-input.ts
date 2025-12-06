/**
 * Weekplan entry input functionality
 * Handles creating and managing entry input fields with autocomplete
 */

import { Autocomplete } from '../components/autocomplete.js';
import { createWeekplanEntry, getWeekplanSuggestions } from '../../data/api.js';
import { searchRecipes } from '../../data/api/recipes-api.js';
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
        addMealItemToDOM(mealContent, entry.text, entry.id!);

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
        alert('Fehler beim Speichern des Eintrags');
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

  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'meal-input';
  input.placeholder = 'Eintrag hinzufügen...';
  input.style.cssText = `
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  `;

  inputWrapper.appendChild(input);

  // Function to save the entry
  const saveEntry = async (text: string, recipeId?: number) => {
    if (!text.trim()) return;

    input.disabled = true;

    // Calculate date for the entry
    const dateISO = calculateDateForDay(dayName);

    try {
      const entry = await createWeekplanEntry({
        date: dateISO,
        meal: meal,
        text: text.trim(),
        recipe_id: recipeId
      });

      // Add to state
      weekplanState.addEntry(entry);

      // Add to DOM
      addMealItemToDOM(mealContent, entry.text, entry.id!, recipeId);
      autocomplete.destroy();
      inputWrapper.remove();

      // Broadcast to other users via WebSocket
      broadcastWeekplanAdd(entry);
    } catch (error) {
      console.error('Failed to create entry:', error);
      input.disabled = false;
      alert('Fehler beim Speichern des Eintrags');
    }
  };

  // Initialize Autocomplete for entry suggestions (including recipes)
  const autocomplete = new Autocomplete({
    input,
    onSearch: async (query: string) => {
      // Fetch both weekplan suggestions and recipe suggestions in parallel
      const [weekplanSuggestions, recipeSuggestions] = await Promise.all([
        getWeekplanSuggestions(query, 5),
        searchRecipes(query, 5).catch(() => []) // Fallback to empty array on error
      ]);

      // Combine both suggestion types - templates/weekplan first, then recipes
      const combined = [
        ...weekplanSuggestions.map(text => ({
          id: text,
          label: text,
          data: text,
        })),
        ...recipeSuggestions.map(recipe => ({
          id: `recipe-${recipe.id}`,
          label: `🍳 ${recipe.name}`,
          data: recipe.name,
        }))
      ];

      // Limit to maxSuggestions
      return combined.slice(0, 5);
    },
    onSelect: (suggestion) => {
      // Save entry immediately when suggestion is selected
      // Extract recipe ID if it's a recipe (id starts with "recipe-")
      const id = String(suggestion.id);
      const recipeId = id.startsWith('recipe-')
        ? parseInt(id.replace('recipe-', ''))
        : undefined;
      saveEntry(suggestion.data, recipeId);
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
