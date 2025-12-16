/**
 * Weekplan API operations.
 */

import type { WeekplanEntry, WeekplanDeltas } from './types.js';
import { API_WEEKPLAN } from './types.js';
import { getAuthHeaders, handleUnauthorized, ensureFreshToken } from './utils.js';
import { fetchTemplates } from './templates-api.js';

/**
 * Cache for known units
 */
let knownUnitsCache: string[] = [];

/**
 * Get weekplan entries for a specific week
 */
export async function getWeekplanEntries(weekStart: string): Promise<WeekplanEntry[]> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`/api/weekplan/entries?week_start=${weekStart}`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch weekplan entries: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching weekplan entries:', error);
    throw error;
  }
}

/**
 * Create a new weekplan entry
 */
export async function createWeekplanEntry(entry: Omit<WeekplanEntry, 'id'>): Promise<WeekplanEntry> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch('/api/weekplan/entries', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(entry),
    });

    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to create weekplan entry: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating weekplan entry:', error);
    throw error;
  }
}

/**
 * Get weekplan entry suggestions based on query
 * Returns up to maxSuggestions unique template names
 */
export async function getWeekplanSuggestions(query: string, maxSuggestions: number = 5): Promise<string[]> {
  try {
    // Fetch all templates
    const templates = await fetchTemplates();

    // Extract only template names
    const templateNames: string[] = [];
    for (const template of templates) {
      if (template.name && template.name.trim()) {
        templateNames.push(template.name.trim());
      }
    }

    // Filter by query, sort alphabetically, and limit
    const lowerQuery = query.toLowerCase();
    const matches = templateNames
      .filter(name => name.toLowerCase().includes(lowerQuery))
      .sort()
      .slice(0, maxSuggestions);

    return matches;
  } catch (error) {
    console.error('Error fetching weekplan suggestions:', error);
    return [];
  }
}

/**
 * Delete a weekplan entry
 */
export async function deleteWeekplanEntry(entryId: number): Promise<void> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`/api/weekplan/entries/${entryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to delete weekplan entry: ${res.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting weekplan entry:', error);
    throw error;
  }
}

/**
 * Update the deltas for a weekplan entry.
 */
export async function updateWeekplanEntryDeltas(
  entryId: number,
  deltas: WeekplanDeltas
): Promise<WeekplanEntry> {
  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    throw new Error('Not authenticated');
  }

  try {
    const res = await fetch(`/api/weekplan/entries/${entryId}/deltas`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(deltas),
    });

    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(`Failed to update weekplan entry deltas: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating weekplan entry deltas:', error);
    throw error;
  }
}

/**
 * Fetch known measurement units from the server.
 * Uses a cache to avoid repeated requests.
 *
 * @returns Promise resolving to array of known units
 */
export async function fetchKnownUnits(): Promise<string[]> {
  // Return from cache if already loaded
  if (knownUnitsCache.length > 0) {
    return knownUnitsCache;
  }

  const tokenRefreshed = await ensureFreshToken();
  if (!tokenRefreshed) {
    return [];
  }

  try {
    const response = await fetch(`${API_WEEKPLAN}/known-units`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      handleUnauthorized();
      return [];
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch known units: ${response.statusText}`);
    }

    const units = await response.json();
    knownUnitsCache = units || [];
    return knownUnitsCache;
  } catch (error) {
    console.error('Error fetching known units:', error);
    // Return fallback if fetch fails
    knownUnitsCache = [];
    return [];
  }
}

/**
 * Get known units from cache or fetch if not yet loaded.
 * This is the main function to use for getting known units.
 *
 * @returns Array of known units (from cache or freshly fetched)
 */
export function getKnownUnits(): string[] {
  return knownUnitsCache;
}

/**
 * Initialize the known units cache.
 * Should be called after successful login.
 */
export async function initializeKnownUnits(): Promise<void> {
  await fetchKnownUnits();
}
