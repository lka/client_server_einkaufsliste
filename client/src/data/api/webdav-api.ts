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
 * Progress callback type for recipe import.
 */
export type ImportProgressCallback = (progress: {
  status: string;
  message: string;
  total?: number;
  current?: number;
  imported?: number;
  deleted?: number;
  errors?: string[];
  success?: boolean;
}) => void;

/**
 * Import recipes from WebDAV using specified settings with progress tracking (requires authentication).
 */
export async function importRecipesFromWebDAV(
  settingsId: number,
  onProgress?: ImportProgressCallback
): Promise<{ success: boolean; imported: number; deleted: number; errors: string[]; message: string }> {
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

    // Check if response is Server-Sent Events
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('text/event-stream')) {
      return await processEventStream(res, onProgress);
    }

    // Fallback to regular JSON response
    return await res.json();
  } catch (error) {
    console.error('Error importing recipes from WebDAV:', error);
    throw error;
  }
}

/**
 * Process Server-Sent Events stream for import progress.
 */
async function processEventStream(
  response: Response,
  onProgress?: ImportProgressCallback
): Promise<{ success: boolean; imported: number; deleted: number; errors: string[]; message: string }> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult: any = null;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          // Check for errors
          if (data.error) {
            throw new Error(data.error);
          }

          // Call progress callback
          if (onProgress) {
            onProgress(data);
          }

          // Store final result
          if (data.status === 'complete') {
            finalResult = data;
          }
        }
      }
    }

    if (!finalResult) {
      throw new Error('Import completed without final result');
    }

    return {
      success: finalResult.success,
      imported: finalResult.imported,
      deleted: finalResult.deleted,
      errors: finalResult.errors || [],
      message: finalResult.message,
    };
  } finally {
    reader.releaseLock();
  }
}
