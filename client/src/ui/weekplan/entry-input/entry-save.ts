/**
 * Entry saving logic for weekplan
 */

import { createWeekplanEntry } from '../../../data/api.js';
import { broadcastWeekplanAdd } from '../../../data/websocket.js';
import { weekplanState } from '../weekplan-state.js';
import { addMealItemToDOM } from '../weekplan-rendering.js';
import { showError } from '../../components/index.js';
import { calculateDateForDay } from './date-utils.js';

/**
 * Save a weekplan entry
 */
export async function saveEntry(
  mealContent: Element,
  meal: string,
  dayName: string,
  text: string,
  options?: {
    recipeId?: number;
    templateId?: number;
    entryType?: 'text' | 'template' | 'recipe';
    onSuccess?: () => void;
    onError?: () => void;
  }
): Promise<boolean> {
  if (!text.trim()) return false;

  // Calculate date for the entry
  const dateISO = calculateDateForDay(dayName);

  try {
    const entry = await createWeekplanEntry({
      date: dateISO,
      meal: meal,
      text: text.trim(),
      entry_type: options?.entryType || 'text',
      recipe_id: options?.recipeId,
      template_id: options?.templateId
    });

    // Add to state
    weekplanState.addEntry(entry);

    // Add to DOM
    addMealItemToDOM(mealContent, entry.text, entry.id!, entry.recipe_id, entry.template_id, entry.entry_type);

    // Broadcast to other users via WebSocket
    broadcastWeekplanAdd(entry);

    // Call success callback
    options?.onSuccess?.();

    return true;
  } catch (error) {
    console.error('Failed to create entry:', error);
    showError('Fehler beim Speichern des Eintrags');

    // Call error callback
    options?.onError?.();

    return false;
  }
}
