/**
 * Product search operations
 */

import type { ProductSuggestion } from '../types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from '../utils.js';

/**
 * Get product suggestions for autocomplete (includes products and template items).
 */
export async function getProductSuggestions(
  storeId: number,
  query: string,
  limit: number = 10
): Promise<ProductSuggestion[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  if (!query.trim()) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    const res = await fetch(
      `/api/stores/${storeId}/products/suggestions?${params}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error(
        'Failed to fetch product suggestions:',
        res.status,
        res.statusText
      );
      return [];
    }
    const suggestions: ProductSuggestion[] = await res.json();
    return suggestions;
  } catch (error) {
    console.error('Error fetching product suggestions:', error);
    return [];
  }
}
