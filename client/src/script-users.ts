/**
 * User administration page entry point.
 * Orchestrates the initialization of the user admin module.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated } from './data/auth.js';
import { initUserAdmin } from './ui/user-admin.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';

/**
 * Initialize the user admin page when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Load the users template
  const templateLoaded = await loadAppTemplate('users.html');
  if (!templateLoaded) {
    console.error('Failed to initialize user admin page');
    return;
  }

  // Update user display
  await updateUserDisplay();

  // Initialize user admin module
  initUserAdmin();
  initUserMenu();
});