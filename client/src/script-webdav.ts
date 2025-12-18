/**
 * WebDAV settings page entry point.
 * Orchestrates the initialization of the WebDAV admin module.
 */

import { loadAppTemplate } from './data/dom.js';
import { isAuthenticated, getTokenExpiresIn } from './data/auth.js';
import { initWebDAVAdmin } from './ui/webdav-admin.js';
import { initUserMenu, updateUserDisplay } from './ui/user-menu.js';
import { initializeComponents } from './ui/components/index.js';
import { initInactivityTracker } from './data/inactivity-tracker.js';

/**
 * Initialize the WebDAV settings page when DOM is ready.
 */
window.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  // Initialize component library styles
  initializeComponents();

  // Load the webdav template
  const templateLoaded = await loadAppTemplate('webdav.html');
  if (!templateLoaded) {
    console.error('Failed to initialize WebDAV settings page');
    return;
  }

  // Update user display
  await updateUserDisplay();

  // Initialize WebDAV admin module
  initWebDAVAdmin();
  initUserMenu();

  // Initialize inactivity tracker
  const expiresIn = getTokenExpiresIn();
  if (expiresIn) {
    initInactivityTracker(expiresIn);
  } else {
    console.warn('Token expiration time not found - inactivity tracker not initialized');
  }
});
