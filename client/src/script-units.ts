/**
 * Units administration page entry point.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated } from './data/auth.js';
import { initUnitsAdmin } from './ui/units-admin.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';

/**
 * Initialize the units admin page when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize component library styles
  initializeComponents();

  // Load the units template
  const templateLoaded = await loadAppTemplate('units.html');
  if (!templateLoaded) {
    console.error('Failed to initialize units admin page');
    return;
  }

  // Initialize user menu
  initUserMenu();
  updateUserDisplay();

  // Initialize units admin
  initUnitsAdmin();
});
