/**
 * API client for shopping list operations.
 */

import { getToken, clearToken, refreshToken } from './auth.js';

export interface Item {
  id: string;
  name: string;
}

export const API_BASE = '/api/items';

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
export async function addItem(name: string): Promise<Item | null> {
  // Refresh token before making the request
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
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
