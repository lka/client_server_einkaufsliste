/**
 * Ingredient list rendering logic.
 */

import type { ParsedIngredient } from '../types.js';
import type { RecipeModalState } from './types.js';

/**
 * Render ingredients list with checkboxes and quantities.
 */
export function renderIngredientsList(
  parsedIngredients: ParsedIngredient[],
  state: RecipeModalState
): HTMLUListElement {
  const ingredientsList = document.createElement('ul');
  ingredientsList.style.cssText = 'list-style: none; padding: 0; margin: 0;';

  parsedIngredients.forEach((ingredient, index) => {
    const isRemoved = state.removedItems.has(ingredient.name);

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

    const checkboxId = `recipe-ingredient-checkbox-${index}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.name = `recipeIngredient_${index}`;
    checkbox.checked = isRemoved;
    checkbox.style.cssText = 'cursor: pointer; width: 16px; height: 16px;';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = ingredient.name;
    nameSpan.style.cssText = `
      font-weight: 500;
      ${isRemoved ? 'text-decoration: line-through; opacity: 0.6;' : ''}
    `;

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        state.removedItems.add(ingredient.name);
        li.style.backgroundColor = '#ffe6e6';
        nameSpan.style.textDecoration = 'line-through';
        nameSpan.style.opacity = '0.6';
      } else {
        state.removedItems.delete(ingredient.name);
        li.style.backgroundColor = '#f8f9fa';
        nameSpan.style.textDecoration = 'none';
        nameSpan.style.opacity = '1';
      }
    });

    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(nameSpan);
    li.appendChild(leftDiv);

    if (ingredient.quantity) {
      const quantitySpan = document.createElement('span');
      const displayQuantity = state.adjustedQuantities.get(ingredient.originalLine) || ingredient.quantity;
      quantitySpan.textContent = displayQuantity;
      quantitySpan.style.cssText = 'color: #666; font-size: 0.85rem; margin-left: 0.5rem;';
      li.appendChild(quantitySpan);
    }

    ingredientsList.appendChild(li);
  });

  return ingredientsList;
}

/**
 * Parse ingredient text and filter out HTML and empty lines.
 */
export function parseIngredientText(ingredientsText: string): string[] {
  return ingredientsText.split('\n').filter((line: string) => {
    const trimmed = line.trim();
    return trimmed && !/<[^>]+>/.test(trimmed);
  });
}
