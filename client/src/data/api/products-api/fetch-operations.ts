/**
 * Product fetch operations
 */

import type { Product } from '../types.js';
import { API_STORES } from '../types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from '../utils.js';

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
