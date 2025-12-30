/**
 * DatePicker management for shopping list.
 * Handles initialization, updates, and date-based filtering.
 */

import { getConfig } from '../../data/api.js';
import { createDatePicker, type DatePickerInstance } from '../components/datepicker.js';
import { shoppingListState } from '../../state/shopping-list-state.js';
import {
  extractShoppingDates,
  dateToISOString,
  calculateNextShoppingDay,
} from '../shopping-list/index.js';

// DatePicker instance for shopping date selection
let shoppingDatePicker: DatePickerInstance | null = null;

// Current selected shopping date for filtering (ISO format YYYY-MM-DD)
let selectedShoppingDate: string | null = null;

/**
 * Get the DatePicker instance
 */
export function getShoppingDatePicker(): DatePickerInstance | null {
  return shoppingDatePicker;
}

/**
 * Get the currently selected shopping date
 */
export function getSelectedShoppingDate(): string | null {
  return selectedShoppingDate;
}

/**
 * Set the selected shopping date
 */
export function setSelectedShoppingDate(date: string | null): void {
  selectedShoppingDate = date;
}

/**
 * Initialize shopping date picker
 */
export async function initializeShoppingDatePicker(
  container: HTMLElement,
  onDateChange: (date: string | null) => void
): Promise<void> {
  try {
    const config = await getConfig();
    // Default to Wednesday (2 in Python convention: 0=Monday)
    const mainShoppingDayPython = config?.main_shopping_day ?? 2;
    // Convert from Python convention (0=Monday) to JavaScript convention (0=Sunday)
    const mainShoppingDay = (mainShoppingDayPython + 1) % 7;

    // Calculate next occurrence of the configured shopping day
    const nextShoppingDay = calculateNextShoppingDay(mainShoppingDay);

    // Extract unique shopping dates from items
    const shoppingDates = extractShoppingDates(shoppingListState.getItems());

    shoppingDatePicker = createDatePicker({
      placeholder: 'Einkaufsdatum (optional)',
      format: 'dd.MM.yyyy',
      value: nextShoppingDay,
      highlightDates: shoppingDates,
      onChange: (date) => {
        // Update selected shopping date for filtering
        if (date) {
          selectedShoppingDate = dateToISOString(date);
        } else {
          selectedShoppingDate = null;
        }

        // Trigger callback to re-render items
        onDateChange(selectedShoppingDate);
      },
    });
    container.appendChild(shoppingDatePicker.container);

    // Set initial selectedShoppingDate to match the default DatePicker value
    selectedShoppingDate = dateToISOString(nextShoppingDay);
  } catch (error) {
    console.error('Error loading config, using default Wednesday:', error);
    // Fallback to Wednesday (3 in JS convention: 0=Sunday)
    const mainShoppingDay = 3;
    const nextShoppingDay = calculateNextShoppingDay(mainShoppingDay);
    const shoppingDates = extractShoppingDates(shoppingListState.getItems());

    shoppingDatePicker = createDatePicker({
      placeholder: 'Einkaufsdatum (optional)',
      format: 'dd.MM.yyyy',
      value: nextShoppingDay,
      highlightDates: shoppingDates,
      onChange: (date) => {
        if (date) {
          selectedShoppingDate = dateToISOString(date);
        } else {
          selectedShoppingDate = null;
        }
        onDateChange(selectedShoppingDate);
      },
    });
    container.appendChild(shoppingDatePicker.container);
    selectedShoppingDate = dateToISOString(nextShoppingDay);
  }
}

/**
 * Update DatePicker highlights with current shopping dates
 */
export function updateDatePickerHighlights(): void {
  if (shoppingDatePicker) {
    const updatedShoppingDates = extractShoppingDates(shoppingListState.getItems());
    shoppingDatePicker.setHighlightDates(updatedShoppingDates);
  }
}
