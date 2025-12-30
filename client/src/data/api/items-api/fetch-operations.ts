/**
 * Fetch operations for shopping list items.
 */

import type { Item } from '../types.js';
import { API_BASE } from '../types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from '../utils.js';

/**
 * Fetch all items from the API.
 */
export async function fetchItems(): Promise<Item[]> {
  // Refresh token before making the request
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(API_BASE, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch items:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

/**
 * Fetch items for a specific shopping date across all stores.
 */
export async function fetchItemsByDate(
  shoppingDate: string
): Promise<Item[]> {
  // Refresh token before making the request
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(
      `${API_BASE}/by-date?shopping_date=${shoppingDate}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch items by date:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching items by date:', error);
    return [];
  }
}
