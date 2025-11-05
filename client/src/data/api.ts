/**
 * API client for shopping list operations.
 */

import { getToken, clearToken, refreshToken } from './auth.js';

export interface Item {
  id: string;
  name: string;
  menge?: string;
  user_id?: number;
  store_id?: number;
  product_id?: number;
}

export interface Store {
  id: number;
  name: string;
  location?: string;
}

export interface Department {
  id: number;
  name: string;
  store_id: number;
  sort_order?: number;
}

export interface Product {
  id: number;
  name: string;
  store_id: number;
  department_id: number;
  fresh: boolean;
}

export const API_BASE = '/api/items';
export const API_STORES = '/api/stores';

/**
 * Get authorization headers with JWT token.
 */
function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Handle 401 responses by clearing token and redirecting to login.
 */
function handleUnauthorized(): void {
  clearToken();
  window.location.href = '/';
}

/**
 * Refresh token before making API calls.
 * This extends the token validity with each API interaction.
 */
async function ensureFreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    return false;
  }

  // Refresh token to extend its validity
  const refreshed = await refreshToken();
  if (!refreshed) {
    handleUnauthorized();
    return false;
  }

  return true;
}

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
 * Add a new item to the shopping list.
 */
export async function addItem(name: string, menge?: string, storeId?: number): Promise<Item | null> {
  // Refresh token before making the request
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const body: { name: string; menge?: string; store_id?: number } = { name };
    if (menge) body.menge = menge;
    if (storeId) body.store_id = storeId;

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
 * Fetch all stores from the API.
 */
export async function fetchStores(): Promise<Store[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(API_STORES, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch stores:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
}

/**
 * Fetch all departments for a specific store.
 */
export async function fetchDepartments(storeId: number): Promise<Department[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(`${API_STORES}/${storeId}/departments`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch departments:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching departments:', error);
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
 * Create a new store.
 */
export async function createStore(name: string, location: string = ''): Promise<Store | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, location }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to create store:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating store:', error);
    return null;
  }
}

/**
 * Delete a store.
 */
export async function deleteStore(storeId: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`/api/stores/${storeId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    return res.ok;
  } catch (error) {
    console.error('Error deleting store:', error);
    return false;
  }
}

/**
 * Create a new department for a store.
 */
export async function createDepartment(
  storeId: number,
  name: string,
  sortOrder: number = 0
): Promise<Department | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch(`/api/stores/${storeId}/departments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, sort_order: sortOrder }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to create department:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating department:', error);
    return null;
  }
}

/**
 * Delete a department.
 */
export async function deleteDepartment(departmentId: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`/api/departments/${departmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    return res.ok;
  } catch (error) {
    console.error('Error deleting department:', error);
    return false;
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
