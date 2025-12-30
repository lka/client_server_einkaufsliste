/**
 * WebDAV Recipe Import operations with Server-Sent Events support.
 */

import { getToken, clearToken } from '../../auth.js';
import { API_WEBDAV } from '../types.js';

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
 * Result type for recipe import.
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  deleted: number;
  errors: string[];
  message: string;
}

/**
 * Import recipes from WebDAV using specified settings with progress tracking (requires authentication).
 */
export async function importRecipesFromWebDAV(
  settingsId: number,
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
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
): Promise<ImportResult> {
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
