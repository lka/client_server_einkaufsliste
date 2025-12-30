/**
 * Template fetch operations
 */

import type { Template } from '../types.js';
import { API_TEMPLATES } from '../types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from '../utils.js';

/**
 * Fetch all shopping templates.
 */
export async function fetchTemplates(): Promise<Template[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return [];
  }

  try {
    const res = await fetch(API_TEMPLATES, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return [];
    }
    if (!res.ok) {
      console.error('Failed to fetch templates:', res.statusText);
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

/**
 * Fetch a specific template by ID.
 */
export async function fetchTemplate(templateId: number): Promise<Template | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  try {
    const res = await fetch(`${API_TEMPLATES}/${templateId}`, {
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      console.error('Failed to fetch template:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}
