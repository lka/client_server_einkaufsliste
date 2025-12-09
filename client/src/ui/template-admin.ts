/**
 * Template administration UI component.
 *
 * Provides UI for managing shopping templates (create, edit, delete).
 */

import {
  createFormButtons,
  loadTemplates,
  attachTemplateAdminListeners,
  updateSaveButtonState } from './template-admin/index.js';

/**
 * Initialize the template admin UI.
 */
export function initTemplateAdmin(): void {
  // Create form action buttons
  createFormButtons();

  // Load and render templates
  loadTemplates();

  // Attach event listeners
  attachTemplateAdminListeners();

  // Set initial button state (disabled since no items at start)
  updateSaveButtonState();
}
