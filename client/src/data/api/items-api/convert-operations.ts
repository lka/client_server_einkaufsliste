/**
 * Convert operations for shopping list items.
 */

import type { Item } from '../types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from '../utils.js';

/**
 * Convert an item to a product by assigning it to a department.
 * Creates a product in the catalog based on the item name (without quantity).
 */
export async function convertItemToProduct(
  itemId: string,
  departmentId: number
): Promise<Item | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  try {
    const res = await fetch(`/api/items/${itemId}/convert-to-product`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ department_id: departmentId }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error(
        'Failed to convert item to product:',
        res.status,
        res.statusText
      );
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error converting item to product:', error);
    return null;
  }
}
