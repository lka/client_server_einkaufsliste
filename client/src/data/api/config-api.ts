/**
 * Configuration API operations.
 */

import type { VersionInfo, Config } from './types.js';
import { API_VERSION, API_CONFIG } from './types.js';

/**
 * Get application version information.
 * This endpoint does not require authentication.
 */
export async function getVersion(): Promise<VersionInfo | null> {
  try {
    const res = await fetch(API_VERSION, {
      method: 'GET',
    });
    if (!res.ok) {
      console.error('Failed to fetch version:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching version:', error);
    return null;
  }
}

/**
 * Get server configuration.
 * This endpoint does not require authentication.
 */
export async function getConfig(): Promise<Config | null> {
  try {
    const res = await fetch(API_CONFIG, {
      method: 'GET',
    });
    if (!res.ok) {
      console.error('Failed to fetch config:', res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching config:', error);
    return null;
  }
}
