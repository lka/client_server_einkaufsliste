/**
 * Units API operations.
 */

import type { Unit } from './types.js';
import { API_UNITS } from './types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from './utils.js';

/**
 * Fetch all units from the API.
 */
export async function fetchUnits(): Promise<Unit[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(API_UNITS, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch units:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching units:', error);
    return [];
  }
}

/**
 * Create a new unit.
 */
export async function createUnit(data: Omit<Unit, 'id'>): Promise<Unit | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch(API_UNITS, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to create unit:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating unit:', error);
    return null;
  }
}

/**
 * Update a unit.
 */
export async function updateUnit(id: number, data: Partial<Omit<Unit, 'id'>>): Promise<Unit | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch(`${API_UNITS}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to update unit:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error updating unit:', error);
    return null;
  }
}

/**
 * Delete a unit.
 */
export async function deleteUnit(id: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`${API_UNITS}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    if (!res.ok) {
      console.error('Failed to delete unit:', res.statusText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting unit:', error);
    return false;
  }
}
