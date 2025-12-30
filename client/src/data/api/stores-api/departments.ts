/**
 * Department API operations (CRUD).
 */

import type { Department } from '../types.js';
import { API_STORES } from '../types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from '../utils.js';

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
 * Update a department (partial update).
 */
export async function updateDepartment(
  departmentId: number,
  name?: string,
  sortOrder?: number
): Promise<Department | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const body: { name?: string; sort_order?: number } = {};

    if (name !== undefined) {
      body.name = name;
    }
    if (sortOrder !== undefined) {
      body.sort_order = sortOrder;
    }

    const res = await fetch(`/api/departments/${departmentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }

    if (!res.ok) {
      console.error('Failed to update department:', res.statusText);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating department:', error);
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
