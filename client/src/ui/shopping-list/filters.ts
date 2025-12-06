/**
 * Shopping list filter utilities.
 * Handles filtering items by store and date.
 */

import type { Item } from '../../data/api.js';

export interface FilterOptions {
  storeId: number | null;
  shoppingDate: string | null;
}

/**
 * Filter items by selected store and shopping date.
 */
export function filterItems(items: Item[], options: FilterOptions): Item[] {
  let filtered = items;

  // Filter by store
  if (options.storeId !== null) {
    filtered = filtered.filter(item => item.store_id === options.storeId);
  }

  // Filter by shopping date
  if (options.shoppingDate !== null) {
    filtered = filtered.filter(item => item.shopping_date === options.shoppingDate);
  }

  return filtered;
}

/**
 * Extract unique shopping dates from all items for DatePicker highlighting.
 */
export function extractShoppingDates(items: Item[]): Date[] {
  const uniqueDates = new Set<string>();

  items.forEach(item => {
    if (item.shopping_date) {
      uniqueDates.add(item.shopping_date);
    }
  });

  // Convert ISO date strings to Date objects
  return Array.from(uniqueDates).map(dateStr => {
    const date = new Date(dateStr + 'T00:00:00'); // Ensure local timezone
    return date;
  });
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

/**
 * Calculate next occurrence of a specific day of the week.
 * @param mainShoppingDay - Day of week in JavaScript convention (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param fromDate - Starting date (defaults to today)
 * @returns Next occurrence of the shopping day
 */
export function calculateNextShoppingDay(mainShoppingDay: number, fromDate: Date = new Date()): Date {
  const currentDay = fromDate.getDay();
  const daysUntilShoppingDay = currentDay === mainShoppingDay ? 7 : (mainShoppingDay - currentDay + 7) % 7;
  const nextShoppingDay = new Date(fromDate);
  nextShoppingDay.setDate(fromDate.getDate() + (daysUntilShoppingDay === 0 ? 7 : daysUntilShoppingDay));
  return nextShoppingDay;
}
