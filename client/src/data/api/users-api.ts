/**
 * User management API operations.
 */

import type { User } from './types.js';
import { API_USERS } from './types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from './utils.js';

/**
 * Fetch all users.
 */
export async function fetchAllUsers(): Promise<User[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(API_USERS, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch users:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Fetch pending (unapproved) users.
 */
export async function fetchPendingUsers(): Promise<User[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const res = await fetch(`${API_USERS}/pending`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch pending users:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return [];
  }
}

/**
 * Approve a user.
 */
export async function approveUser(userId: number): Promise<User | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return null;
  }

  try {
    const res = await fetch(`${API_USERS}/${userId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to approve user:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error approving user:', error);
    return null;
  }
}

/**
 * Delete a user (admin only).
 */
export async function deleteUser(userId: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return false;
  }

  try {
    const res = await fetch(`${API_USERS}/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to delete user:', errorData.detail || res.statusText);
      alert(`Fehler beim Löschen: ${errorData.detail || res.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}
