/**
 * Recipe details modal for weekplan
 * Handles recipe display, ingredient adjustments, and delta management
 */

import { Modal } from '../components/modal.js';
import { getRecipe, searchRecipes, updateWeekplanEntryDeltas } from '../../data/api.js';
import type { WeekplanEntry, WeekplanDeltas, DeltaItem } from './types.js';
import { weekplanState } from './weekplan-state.js';
import { parseIngredients, adjustQuantityByFactor } from './ingredient-parser.js';
import {
  createQuantityAdjustmentSection,
  createAddItemForm,
  createAddedItemsList,
  createScrollableSection,
  createFixedFormSection
} from './modal-shared.js';

/**
 * Show recipe details by recipe ID
 */
export async function showRecipeDetailsById(recipeId: number, entryId: number): Promise<void> {
  try {
    // Fetch full recipe details
    const recipe = await getRecipe(recipeId);

    // Parse the JSON data
    const recipeData = typeof recipe.data === 'string' ? JSON.parse(recipe.data) : recipe.data;

    await displayRecipeModal(recipe.name, recipeData, entryId);
  } catch (error) {
    console.error('Error showing recipe details:', error);
  }
}

/**
 * Show recipe details by recipe name
 */
export async function showRecipeDetails(recipeName: string): Promise<void> {
  try {
    // Search for recipe by name
    const recipes = await searchRecipes(recipeName, 10);
    const matchingRecipe = recipes.find(r => r.name.toLowerCase() === recipeName.toLowerCase());

    if (!matchingRecipe) {
      return; // Not a recipe, do nothing
    }

    // Fetch full recipe details
    const recipe = await getRecipe(matchingRecipe.id);

    // Parse the JSON data
    const recipeData = typeof recipe.data === 'string' ? JSON.parse(recipe.data) : recipe.data;

    await displayRecipeModal(recipe.name, recipeData);
  } catch (error) {
    console.error('Error showing recipe details:', error);
  }
}

/**
 * Display recipe modal with given data
 */
async function displayRecipeModal(recipeName: string, recipeData: any, entryId?: number): Promise<void> {
  // Build content
  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = 'display: flex; flex-direction: column; max-height: 600px;';

  // Scrollable section for recipe details
  const scrollableSection = createScrollableSection();

  // Description
  if (recipeData.description) {
    const description = document.createElement('p');
    description.textContent = recipeData.description;
    description.style.cssText = 'color: #666; margin-bottom: 1rem; font-style: italic;';
    scrollableSection.appendChild(description);
  }

  // Get current entry to load existing deltas
  const currentEntry = entryId ? findEntryById(entryId) : undefined;

  const currentDeltas: WeekplanDeltas = currentEntry?.deltas || {
    removed_items: [],
    added_items: [],
  };

  // Track removed items
  const removedItems = new Set<string>(currentDeltas.removed_items);

  // Track added items
  const addedItems = new Map<string, DeltaItem>(
    currentDeltas.added_items.map(item => [item.name, item])
  );

  // Store adjusted quantities for recipe items
  const adjustedQuantities = new Map<string, string>();

  // Parse original quantity, default to 1 if not recognized
  let originalQuantity = 1;
  if (recipeData.quantity) {
    const parsed = parseInt(String(recipeData.quantity));
    if (!isNaN(parsed) && parsed > 0) {
      originalQuantity = parsed;
    }
  }

  // Use person_count from deltas if available, otherwise use originalQuantity
  let adjustedQuantity = (currentDeltas.person_count !== undefined && currentDeltas.person_count > 0)
    ? currentDeltas.person_count
    : originalQuantity;

  // Parse ingredients string into structured data
  const ingredientsText = recipeData.ingredients || '';
  const ingredientLines = ingredientsText.split('\n').filter((line: string) => {
    const trimmed = line.trim();
    // Filter out empty lines and lines that contain HTML tags
    return trimmed && !/<[^>]+>/.test(trimmed);
  });

  // Parse each line into {quantity, name, originalLine}
  const parsedIngredients = await parseIngredients(ingredientLines);

  // If person_count is set in deltas, apply the adjustment automatically
  if (currentDeltas.person_count !== undefined) {
    const factor = currentDeltas.person_count / originalQuantity;
    parsedIngredients.forEach((ingredient) => {
      if (ingredient.quantity) {
        const adjusted = adjustQuantityByFactor(ingredient.quantity, factor);
        adjustedQuantities.set(ingredient.originalLine, adjusted);
      }
    });
  }

  const renderIngredientsList = () => {
    const ingredientsList = document.createElement('ul');
    ingredientsList.style.cssText = 'list-style: none; padding: 0; margin: 0;';

    parsedIngredients.forEach((ingredient) => {
      const isRemoved = removedItems.has(ingredient.name);

      const li = document.createElement('li');
      li.style.cssText = `
        padding: 0.25rem 0.5rem;
        background: ${isRemoved ? '#ffe6e6' : '#f8f9fa'};
        border-radius: 3px;
        margin-bottom: 0.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
      `;

      const leftDiv = document.createElement('div');
      leftDiv.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = isRemoved;
      checkbox.style.cssText = 'cursor: pointer; width: 16px; height: 16px;';
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          removedItems.add(ingredient.name);
          li.style.backgroundColor = '#ffe6e6';
          nameSpan.style.textDecoration = 'line-through';
          nameSpan.style.opacity = '0.6';
        } else {
          removedItems.delete(ingredient.name);
          li.style.backgroundColor = '#f8f9fa';
          nameSpan.style.textDecoration = 'none';
          nameSpan.style.opacity = '1';
        }
      });

      const nameSpan = document.createElement('span');
      nameSpan.textContent = ingredient.name;
      nameSpan.style.cssText = `
        font-weight: 500;
        ${isRemoved ? 'text-decoration: line-through; opacity: 0.6;' : ''}
      `;

      leftDiv.appendChild(checkbox);
      leftDiv.appendChild(nameSpan);
      li.appendChild(leftDiv);

      if (ingredient.quantity) {
        const quantitySpan = document.createElement('span');
        // Use adjusted quantity if available, otherwise use original
        const displayQuantity = adjustedQuantities.get(ingredient.originalLine) || ingredient.quantity;
        quantitySpan.textContent = displayQuantity;
        quantitySpan.style.cssText = 'color: #666; font-size: 0.85rem; margin-left: 0.5rem;';
        li.appendChild(quantitySpan);
      }

      ingredientsList.appendChild(li);
    });

    return ingredientsList;
  };

  // Ingredients section with quantity adjustment
  if (recipeData.ingredients) {
    let ingredientsListElement = renderIngredientsList();

    // Quantity adjustment section
    const adjustSection = createQuantityAdjustmentSection(
      originalQuantity,
      adjustedQuantity,
      (targetQuantity) => {
        // Store the adjusted quantity
        adjustedQuantity = targetQuantity;

        // Calculate the factor
        const factor = targetQuantity / originalQuantity;

        // Clear previous adjustments
        adjustedQuantities.clear();

        // Apply adjustment to all ingredients with quantities
        parsedIngredients.forEach((ingredient) => {
          if (ingredient.quantity) {
            const adjusted = adjustQuantityByFactor(ingredient.quantity, factor);
            adjustedQuantities.set(ingredient.originalLine, adjusted);
          }
        });

        // Re-render the ingredients list
        const oldList = ingredientsListElement;
        ingredientsListElement = renderIngredientsList();
        if (oldList.parentNode) {
          oldList.parentNode.replaceChild(ingredientsListElement, oldList);
        }
      }
    );

    scrollableSection.appendChild(adjustSection);
    scrollableSection.appendChild(ingredientsListElement);
  }

  // Added items section
  const addedItemsContainer = document.createElement('div');
  addedItemsContainer.style.cssText = 'margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;';

  const renderAddedItems = () => {
    const newList = createAddedItemsList(addedItems, (name) => {
      addedItems.delete(name);
      renderAddedItems();
    });
    addedItemsContainer.innerHTML = '';
    addedItemsContainer.appendChild(newList);
  };

  renderAddedItems();
  scrollableSection.appendChild(addedItemsContainer);

  contentDiv.appendChild(scrollableSection);

  // Fixed section for adding new items
  const addItemSection = createFixedFormSection();

  // Get existing ingredient names for validation
  const existingIngredientNames = parsedIngredients.map(ing => ing.name);

  const addForm = createAddItemForm(
    (name, menge) => {
      addedItems.set(name, { name, menge });
      renderAddedItems();
    },
    existingIngredientNames
  );

  addItemSection.appendChild(addForm);

  // Save button
  if (entryId) {
    const saveButtonDiv = document.createElement('div');
    saveButtonDiv.style.cssText = 'margin-top: 0.75rem; display: flex; justify-content: flex-end;';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Änderungen speichern';
    saveButton.style.cssText = `
      background: #4a90e2;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    `;
    saveButton.addEventListener('mouseover', () => {
      saveButton.style.backgroundColor = '#357abd';
    });
    saveButton.addEventListener('mouseout', () => {
      saveButton.style.backgroundColor = '#4a90e2';
    });

    saveButton.addEventListener('click', async () => {
      try {
        saveButton.disabled = true;
        saveButton.textContent = 'Speichere...';

        const newDeltas: WeekplanDeltas = {
          removed_items: Array.from(removedItems),
          added_items: Array.from(addedItems.values()),
          person_count: adjustedQuantity !== originalQuantity ? adjustedQuantity : undefined
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
    addItemSection.appendChild(saveButtonDiv);
  }

  contentDiv.appendChild(addItemSection);

  // Create and show modal
  const modal = new Modal({
    title: `🍳 ${recipeName}`,
    content: contentDiv,
    size: 'medium'
  });

  modal.open();
}

/**
 * Find an entry by ID in the weekplan state
 */
function findEntryById(entryId: number): WeekplanEntry | undefined {
  const allEntries = weekplanState.getAllEntries();
  for (const dateMap of allEntries.values()) {
    for (const entries of dateMap.values()) {
      const entry = entries.find(e => e.id === entryId);
      if (entry) return entry;
    }
  }
  return undefined;
}
