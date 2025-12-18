/**
 * User administration page entry point.
 * Orchestrates the initialization of the user admin module.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated, getTokenExpiresIn } from './data/auth.js';
import { initUserAdmin } from './ui/user-admin.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';
import { initInactivityTracker } from './data/inactivity-tracker.js';

/**
 * Initialize the user admin page when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize component library styles
  initializeComponents();

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

  // Initialize inactivity tracker
  const expiresIn = getTokenExpiresIn();
  if (expiresIn) {
    initInactivityTracker(expiresIn);
  } else {
    console.warn('Token expiration time not found - inactivity tracker not initialized');
  }
});