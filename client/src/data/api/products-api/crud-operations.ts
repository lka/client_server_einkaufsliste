/**
 * Product CRUD operations
 */

import type { Product } from '../types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from '../utils.js';

/**
 * Create a new product.
 */
export async function createProduct(
  name: string,
  storeId: number,
  departmentId: number,
  fresh: boolean = false,
  manufacturer?: string
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
        manufacturer,
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
    manufacturer?: string;
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
    if (updates.manufacturer !== undefined) body.manufacturer = updates.manufacturer;

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
