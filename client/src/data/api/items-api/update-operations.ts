/**
 * Update operations for shopping list items.
 */

import type { Item } from '../types.js';
import { API_BASE } from '../types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from '../utils.js';

/**
 * Move an item to a different shopping date (e.g. between main shopping day
 * and fresh products day). If an item with the same name already exists on
 * the target date, the server merges the quantities into that item and
 * returns it instead (with a different id).
 */
export async function updateItemShoppingDate(
  id: string,
  shoppingDate: string
): Promise<Item | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ shopping_date: shoppingDate }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to move item:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error moving item:', error);
    return null;
  }
}
