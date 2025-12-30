/**
 * Weekplan rendering functionality
 *
 * Note: This is a partial extraction. The full rendering logic including
 * renderWeek() and addMealItemToDOM() with all event handlers remains
 * in the main weekplan.ts file for now due to complex interdependencies.
 * Future refactoring phases should extract these completely.
 */

import { deleteWeekplanEntry } from '../../data/api.js';
import { broadcastWeekplanDelete } from '../../data/websocket.js';
import { weekplanState } from '../../state/weekplan-state.js';
import { showError, createButton } from '../components/index.js';


/**
 * Add a meal item to the DOM
 * @param container The meal content container
 * @param text The entry text
 * @param entryId The entry ID
 * @param recipeId Optional recipe ID
 * @param templateId Optional template ID
 * @param entryType Optional entry type
 */
export function addMealItemToDOM(container: Element, text: string, entryId: number, recipeId?: number, templateId?: number, entryType?: string): void {
  const item = document.createElement('div');
  item.className = 'meal-item';
  item.dataset.entryId = String(entryId);
  if (recipeId !== undefined) {
    item.dataset.recipeId = String(recipeId);
  }
  if (templateId !== undefined) {
    item.dataset.templateId = String(templateId);
  }
  if (entryType) {
    item.dataset.entryType = entryType;
  }
  item.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.6rem;
    background: white;
    border-radius: 4px;
    margin-bottom: 0.3rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `;

  const span = document.createElement('span');
  span.textContent = text;
  span.style.cssText = `
    flex: 1;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    transition: all 0.2s;
    user-select: none;
  `;

  // Make text clickable - handlers will be attached by main weekplan module
  span.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Dispatch custom event for main module to handle
    const event = new CustomEvent('weekplan:show-details', {
      detail: { text, entryId, recipeId, templateId, entryType },
      bubbles: true
    });
    item.dispatchEvent(event);
  });

  span.addEventListener('mouseover', () => {
    span.style.backgroundColor = '#e8f4fd';
    span.style.textDecoration = 'underline';
    span.style.color = '#0066cc';
  });

  span.addEventListener('mouseout', () => {
    span.style.backgroundColor = 'transparent';
    span.style.textDecoration = 'none';
    span.style.color = 'inherit';
  });

  // Create delete button using component library
  const deleteBtn = createButton({
    label: '🗑️',
    variant: 'danger',
    size: 'small',
    onClick: async () => {
      deleteBtn.disabled = true;
      try {
        await deleteWeekplanEntry(entryId);

        // Remove from state
        weekplanState.removeEntry(entryId);

        // Remove from DOM
        item.remove();

        // Broadcast to other users via WebSocket
        broadcastWeekplanDelete(entryId);
      } catch (error) {
        console.error('Failed to delete entry:', error);
        deleteBtn.disabled = false;
        showError('Fehler beim Löschen des Eintrags');
      }
    }
  });

  // Override button styles for compact appearance
  deleteBtn.className = 'delete-meal-item';
  deleteBtn.style.cssText = `
    background: transparent;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.2s;
    filter: grayscale(100%);
  `;

  deleteBtn.addEventListener('mouseover', () => {
    deleteBtn.style.opacity = '1';
    deleteBtn.style.filter = 'grayscale(0%)';
  });

  deleteBtn.addEventListener('mouseout', () => {
    deleteBtn.style.opacity = '0.6';
    deleteBtn.style.filter = 'grayscale(100%)';
  });

  item.appendChild(span);
  item.appendChild(deleteBtn);
  container.appendChild(item);
}
