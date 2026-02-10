/**
 * Modal content building logic.
 */

import type { ParsedIngredient } from '../types.js';
import type { RecipeModalState } from './types.js';
import { adjustQuantityByFactor } from '../ingredient-parser.js';
import {
  createQuantityAdjustmentSection,
  createAddItemForm,
  createAddedItemsList,
  createScrollableSection,
  createFixedFormSection
} from '../modal-shared.js';
import { renderIngredientsList } from './ingredient-renderer.js';
import { createButton } from '../../components/index.js';

/**
 * Build modal content with recipe details.
 */
export function buildModalContent(
  recipeData: any,
  parsedIngredients: ParsedIngredient[],
  state: RecipeModalState,
  originalQuantity: number,
  entryId?: number
): { contentDiv: HTMLDivElement; saveButton?: HTMLButtonElement } {
  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = 'display: flex; flex-direction: column; flex: 1; min-height: 0;';

  const scrollableSection = createScrollableSection();

  // Description
  if (recipeData.description) {
    const description = document.createElement('p');
    description.textContent = recipeData.description;
    description.style.cssText = 'color: #666; margin-bottom: 1rem; font-style: italic;';
    scrollableSection.appendChild(description);
  }

  let ingredientsListElement: HTMLUListElement | null = null;

  // Ingredients section with quantity adjustment
  if (recipeData.ingredients) {
    ingredientsListElement = renderIngredientsList(parsedIngredients, state);

    // Quantity adjustment section
    const adjustSection = createQuantityAdjustmentSection(
      originalQuantity,
      state.adjustedQuantity,
      (targetQuantity) => {
        state.adjustedQuantity = targetQuantity;
        const factor = targetQuantity / originalQuantity;

        state.adjustedQuantities.clear();

        parsedIngredients.forEach((ingredient) => {
          if (ingredient.quantity) {
            const adjusted = adjustQuantityByFactor(ingredient.quantity, factor);
            state.adjustedQuantities.set(ingredient.originalLine, adjusted);
          }
        });

        // Re-render the ingredients list
        if (ingredientsListElement) {
          const oldList = ingredientsListElement;
          ingredientsListElement = renderIngredientsList(parsedIngredients, state);
          if (oldList.parentNode) {
            oldList.parentNode.replaceChild(ingredientsListElement, oldList);
          }
        }
      }
    );

    scrollableSection.appendChild(adjustSection);
    scrollableSection.appendChild(ingredientsListElement);
  }

  // Added items section
  const addedItemsContainer = document.createElement('div');
  addedItemsContainer.style.cssText = 'margin-top: 1rem;';

  const renderAddedItems = () => {
    const newList = createAddedItemsList(state.addedItems, (name) => {
      state.addedItems.delete(name);
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

  const addForm = createAddItemForm(
    (name, menge) => {
      state.addedItems.set(name, { name, menge });
      renderAddedItems();
    }
  );

  addItemSection.appendChild(addForm);

  let saveButton: HTMLButtonElement | undefined;

  // Save button (only for entries, not for standalone recipe views)
  if (entryId) {
    const saveButtonDiv = document.createElement('div');
    saveButtonDiv.style.cssText = 'margin-top: 0.75rem; display: flex; justify-content: flex-end;';

    // Create save button using component library
    saveButton = createButton({
      label: 'Änderungen speichern',
      variant: 'primary',
      size: 'medium'
    });

    // Override button color to match original blue theme
    saveButton.style.backgroundColor = '#4a90e2';
    saveButton.addEventListener('mouseenter', () => {
      saveButton!.style.backgroundColor = '#357abd';
    });
    saveButton.addEventListener('mouseleave', () => {
      saveButton!.style.backgroundColor = '#4a90e2';
    });

    saveButtonDiv.appendChild(saveButton);
    addItemSection.appendChild(saveButtonDiv);
  }

  contentDiv.appendChild(addItemSection);

  return { contentDiv, saveButton };
}
