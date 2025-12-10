/**
 * Utility functions for user menu.
 */

import { getVersion } from '../../data/api.js';

// Cache for menu template to avoid redundant fetches
let menuTemplateCache: string | null = null;

/**
 * Load the menu dropdown template from HTML file.
 */
export async function loadMenuTemplate(menuDropdown: HTMLElement): Promise<void> {
  try {
    // Return cached template if available
    if (menuTemplateCache) {
      menuDropdown.innerHTML = menuTemplateCache;
      return;
    }

    // Fetch template
    const response = await fetch('src/ui/components/menu-dropdown.html');
    if (!response.ok) {
      console.error('Failed to load menu template:', response.statusText);
      return;
    }

    const html = await response.text();
    menuTemplateCache = html;
    menuDropdown.innerHTML = html;
  } catch (error) {
    console.error('Error loading menu template:', error);
  }
}

/**
 * Load and display version information in the menu.
 */
export async function loadVersionInfo(): Promise<void> {
  const versionInfo = await getVersion();

  // Find or create version display element
  const versionElement = document.getElementById('versionInfo');

  if (versionInfo && versionElement) {
    versionElement.textContent = `v${versionInfo.version}`;
    versionElement.title = `API: ${versionInfo.api}`;
  }
}
