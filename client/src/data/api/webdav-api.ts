/**
 * WebDAV settings API operations.
 */

import { getToken, clearToken } from '../auth.js';
import type { WebDAVSettings } from './types.js';
import { API_WEBDAV } from './types.js';

/**
 * Fetch all WebDAV settings (requires authentication).
 */
export async function fetchWebDAVSettings(): Promise<WebDAVSettings[]> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(API_WEBDAV, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch WebDAV settings: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching WebDAV settings:', error);
    throw error;
  }
}

/**
 * Create new WebDAV settings (requires authentication).
 */
export async function createWebDAVSettings(settings: WebDAVSettings): Promise<WebDAVSettings> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(API_WEBDAV, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to create WebDAV settings: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating WebDAV settings:', error);
    throw error;
  }
}

/**
 * Update existing WebDAV settings (requires authentication).
 */
export async function updateWebDAVSettings(id: number, settings: Partial<WebDAVSettings>): Promise<WebDAVSettings> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`${API_WEBDAV}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to update WebDAV settings: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating WebDAV settings:', error);
    throw error;
  }
}

/**
 * Delete WebDAV settings (requires authentication).
 */
export async function deleteWebDAVSettings(id: number): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`${API_WEBDAV}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to delete WebDAV settings: ${res.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting WebDAV settings:', error);
    throw error;
  }
}

/**
 * Import recipes from WebDAV using specified settings (requires authentication).
 */
export async function importRecipesFromWebDAV(settingsId: number): Promise<{ success: boolean; imported: number; deleted: number; errors: string[]; message: string }> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`${API_WEBDAV}/${settingsId}/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      clearToken();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorData.detail || `Failed to import recipes: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error importing recipes from WebDAV:', error);
    throw error;
  }
}
