/**
 * Create and delete operations for shopping list items.
 */

import type { Item } from '../types.js';
import { API_BASE } from '../types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from '../utils.js';

/**
 * Add a new item to the shopping list.
 */
export async function addItem(
  name: string,
  menge?: string,
  storeId?: number,
  shoppingDate?: string
): Promise<Item | null> {
  // Refresh token before making the request
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const body: { name: string; menge?: string; store_id?: number; shopping_date?: string } = { name };
    if (menge) body.menge = menge;
    if (storeId) body.store_id = storeId;
    if (shoppingDate) body.shopping_date = shoppingDate;

    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to add item:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error adding item:', error);
    return null;
  }
}

/**
 * Delete an item from the shopping list.
 */
export async function deleteItem(id: string): Promise<boolean> {
  // Refresh token before making the request
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    if (!res.ok) {
      console.error('Failed to delete item:', res.statusText);
    }
    return res.ok;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
}

/**
 * Delete all items with shopping_date before the specified date.
 * @param beforeDate - ISO date string (YYYY-MM-DD)
 * @param storeId - Optional store ID to filter items
 */
export async function deleteItemsBeforeDate(beforeDate: string, storeId?: number): Promise<number> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return 0;
  }

  try {
    // Build URL with optional store_id query parameter
    const url = new URL(`${API_BASE}/by-date/${beforeDate}`, window.location.origin);
    if (storeId !== undefined) {
      url.searchParams.append('store_id', storeId.toString());
    }

    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return 0;
    }
    if (!res.ok) {
      console.error('Failed to delete items before date:', res.statusText);
      return 0;
    }
    const result = await res.json();
    return result.deleted_count || 0;
  } catch (error) {
    console.error('Error deleting items before date:', error);
    return 0;
  }
}
