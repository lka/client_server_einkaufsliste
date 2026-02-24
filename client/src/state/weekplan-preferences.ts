/**
 * Weekplan user preferences (persisted in localStorage).
 */

const KEY_SINGLE_SHOPPING_DAY = 'weekplan_single_shopping_day';

export function getSingleShoppingDay(): boolean {
  return localStorage.getItem(KEY_SINGLE_SHOPPING_DAY) === 'true';
}

export function setSingleShoppingDay(value: boolean): void {
  localStorage.setItem(KEY_SINGLE_SHOPPING_DAY, value ? 'true' : 'false');
}
