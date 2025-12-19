/**
 * Shopping templates API operations.
 */

import type { Template, TemplateItem } from './types.js';
import { API_TEMPLATES } from './types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from './utils.js';
import { showError } from '../../ui/components/index.js';


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

/**
 * Create a new shopping template.
 */
export async function createTemplate(
  name: string,
  description: string | undefined,
  personCount: number,
  items: TemplateItem[]
): Promise<Template | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  try {
    const res = await fetch(API_TEMPLATES, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description, person_count: personCount, items }),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to create template:', errorData.detail || res.statusText);
      showError(`Fehler beim Erstellen: ${errorData.detail || res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error creating template:', error);
    return null;
  }
}

/**
 * Update an existing template.
 */
export async function updateTemplate(
  templateId: number,
  name?: string,
  description?: string,
  personCount?: number,
  items?: TemplateItem[]
): Promise<Template | null> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return null;
  }

  const body: any = {};
  if (name !== undefined) body.name = name;
  if (description !== undefined) body.description = description;
  if (personCount !== undefined) body.person_count = personCount;
  if (items !== undefined) body.items = items;

  try {
    const res = await fetch(`${API_TEMPLATES}/${templateId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to update template:', errorData.detail || res.statusText);
      showError(`Fehler beim Aktualisieren: ${errorData.detail || res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error updating template:', error);
    return null;
  }
}

/**
 * Delete a template.
 */
export async function deleteTemplate(templateId: number): Promise<boolean> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    console.error('Token refresh failed');
    return false;
  }

  try {
    const res = await fetch(`${API_TEMPLATES}/${templateId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.status === 401) {
      handleUnauthorized();
      return false;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      console.error('Failed to delete template:', errorData.detail || res.statusText);
      showError(`Fehler beim Löschen: ${errorData.detail || res.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    return false;
  }
}
