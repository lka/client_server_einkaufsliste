/**
 * Products API operations.
 */

import type { Product, ProductSuggestion } from './types.js';
import { API_STORES } from './types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from './utils.js';

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

/**
 * Fetch all products for a specific store.
 */
export async function fetchStoreProducts(storeId: number): Promise<Product[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(`${API_STORES}/${storeId}/products`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch store products:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching store products:', error);
    return [];
  }
}

/**
 * Fetch all products for a specific department.
 */
export async function fetchDepartmentProducts(departmentId: number): Promise<Product[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(`/api/departments/${departmentId}/products`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch department products:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching department products:', error);
    return [];
  }
}

/**
 * Create a new product.
 */
export async function createProduct(
  name: string,
  storeId: number,
  departmentId: number,
  fresh: boolean = false
): Promise<Product | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        store_id: storeId,
        department_id: departmentId,
        fresh,
      }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to create product:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
}

/**
 * Update a product.
 */
export async function updateProduct(
  productId: number,
  updates: {
    name?: string;
    storeId?: number;
    departmentId?: number;
    fresh?: boolean;
  }
): Promise<Product | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const body: Record<string, string | number | boolean> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.storeId !== undefined) body.store_id = updates.storeId;
    if (updates.departmentId !== undefined) body.department_id = updates.departmentId;
    if (updates.fresh !== undefined) body.fresh = updates.fresh;

    const res = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to update product:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

/**
 * Delete a product.
 */
export async function deleteProduct(productId: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    return res.ok;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}
