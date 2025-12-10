/**
 * Recipe details modal for weekplan
 * Handles recipe display, ingredient adjustments, and delta management
 */

import { Modal } from '../components/modal.js';
import type { WeekplanDeltas } from './types.js';
import { parseIngredients, adjustQuantityByFactor } from './ingredient-parser.js';
import { loadRecipeById, loadRecipeByName } from './recipe-modal/recipe-loader.js';
import { parseIngredientText } from './recipe-modal/ingredient-renderer.js';
import { initializeStateFromDeltas } from './recipe-modal/delta-manager.js';
import { buildModalContent } from './recipe-modal/modal-builder.js';
import { handleSaveDeltas } from './recipe-modal/save-handler.js';
import { findEntryById, parseOriginalQuantity } from './recipe-modal/utils.js';

/**
 * Show recipe details by recipe ID
 */
export async function showRecipeDetailsById(recipeId: number, entryId: number): Promise<void> {
  try {
    const recipe = await loadRecipeById(recipeId);
    await displayRecipeModal(recipe.name, recipe.data, entryId);
  } catch (error) {
    console.error('Error showing recipe details:', error);
  }
}

/**
 * Show recipe details by recipe name
 */
export async function showRecipeDetails(recipeName: string): Promise<void> {
  try {
    const recipe = await loadRecipeByName(recipeName);
    if (!recipe) {
      return; // Not a recipe, do nothing
    }
    await displayRecipeModal(recipe.name, recipe.data);
  } catch (error) {
    console.error('Error showing recipe details:', error);
  }
}

/**
 * Display recipe modal with given data
 */
async function displayRecipeModal(recipeName: string, recipeData: any, entryId?: number): Promise<void> {
  const currentEntry = entryId ? findEntryById(entryId) : undefined;

  const currentDeltas: WeekplanDeltas = currentEntry?.deltas || {
    removed_items: [],
    added_items: [],
  };

  const originalQuantity = parseOriginalQuantity(recipeData);
  const state = initializeStateFromDeltas(currentDeltas, originalQuantity);

  // Parse ingredients
  const ingredientsText = recipeData.ingredients || '';
  const ingredientLines = parseIngredientText(ingredientsText);
  const parsedIngredients = await parseIngredients(ingredientLines);

  // Apply automatic adjustment if person_count is set
  if (currentDeltas.person_count !== undefined) {
    const factor = currentDeltas.person_count / originalQuantity;
    parsedIngredients.forEach((ingredient) => {
      if (ingredient.quantity) {
        const adjusted = adjustQuantityByFactor(ingredient.quantity, factor);
        state.adjustedQuantities.set(ingredient.originalLine, adjusted);
      }
    });
  }

  // Build modal content
  const { contentDiv, saveButton } = buildModalContent(
    recipeData,
    parsedIngredients,
    state,
    originalQuantity,
    entryId
  );

  // Create and show modal
  const modal = new Modal({
    title: `🍳 ${recipeName}`,
    content: contentDiv,
    size: 'medium'
  });

  // Attach save handler
  if (saveButton && entryId) {
    saveButton.addEventListener('click', async () => {
      await handleSaveDeltas(entryId, state, originalQuantity, currentEntry, saveButton, () => {
        modal.close();
      });
    });
  }

  modal.open();
}
