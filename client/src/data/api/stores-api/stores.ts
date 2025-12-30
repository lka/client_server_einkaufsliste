/**
 * Store API operations (CRUD).
 */

import type { Store } from '../types.js';
import { API_STORES } from '../types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from '../utils.js';

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
 * Update a store.
 */
export async function updateStore(
  storeId: number,
  name?: string,
  location?: string,
  sortOrder?: number
): Promise<Store | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const body: Record<string, string | number> = {};
    if (name !== undefined) body.name = name;
    if (location !== undefined) body.location = location;
    if (sortOrder !== undefined) body.sort_order = sortOrder;

    const res = await fetch(`/api/stores/${storeId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error updating store:', error);
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
