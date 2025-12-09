/**
 * Helper functions for print preview
 */

import type { Item } from '../../data/api.js';
import type { DatePickerInstance } from '../components/datepicker.js';

/**
 * Filter items by store ID
 */
export function filterItemsByStore(items: Item[], storeId: number | null): Item[] {
  if (storeId === null) {
    return items;
  }
  return items.filter(item => item.store_id === storeId);
}

/**
 * Filter items by selected date
 */
export function filterItemsByDate(items: Item[], date: string | null): Item[] {
  if (!date) {
    return items;
  }
  return items.filter(item => item.shopping_date === date);
}

/**
 * Extract unique shopping dates from items
 */
export function extractUniqueDates(items: Item[]): string[] {
  const uniqueDates = Array.from(new Set(
    items
      .filter(item => item.shopping_date)
      .map(item => item.shopping_date!)
  )).sort();
  return uniqueDates;
}

/**
 * Get initial selected date from date picker or fallback to smallest date
 */
export function getInitialSelectedDate(
  uniqueDates: string[],
  shoppingDatePicker: DatePickerInstance | null
): string | null {
  let selectedDate: string | null = null;
  if (shoppingDatePicker) {
    const dateValue = shoppingDatePicker.getValue();
    if (dateValue) {
      const isoDate = dateToISOString(dateValue);
      selectedDate = uniqueDates.includes(isoDate) ? isoDate : null;
    }
  }
  if (!selectedDate) {
    selectedDate = uniqueDates.length > 0 ? uniqueDates[0] : null;
  }
  return selectedDate;
}

/**
 * Convert Date to ISO string (YYYY-MM-DD)
 */
export function dateToISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
