/**
 * Navigation event handlers for user menu.
 */

import { getSelectedStoreId, showDeleteByDateDialog } from '../shopping-list-ui.js';

/**
 * Navigate to a URL.
 */
function navigateTo(url: string): void {
  window.location.href = url;
}

/**
 * Attach navigation handlers to menu items.
 */
export function attachNavigationHandlers(): void {
  // Back to app button
  const backToAppBtn = document.getElementById('backToAppBtn');
  if (backToAppBtn) {
    backToAppBtn.addEventListener('click', () => navigateTo('/app'));
  }

  // Weekplan button
  const weekplanBtn = document.getElementById('weekplanBtn');
  if (weekplanBtn) {
    weekplanBtn.addEventListener('click', () => navigateTo('/weekplan'));
  }

  // Manage stores button
  const manageStoresBtn = document.getElementById('manageStoresBtn');
  if (manageStoresBtn) {
    manageStoresBtn.addEventListener('click', () => navigateTo('/stores'));
  }

  // Manage products button
  const manageProductsBtn = document.getElementById('manageProductsBtn');
  if (manageProductsBtn) {
    manageProductsBtn.addEventListener('click', () => {
      const selectedStoreId = getSelectedStoreId();
      const url = selectedStoreId ? `/products?store=${selectedStoreId}` : '/products';
      navigateTo(url);
    });
  }

  // Manage templates button
  const manageTemplatesBtn = document.getElementById('manageTemplatesBtn');
  if (manageTemplatesBtn) {
    manageTemplatesBtn.addEventListener('click', () => navigateTo('/templates'));
  }

  // Manage users button
  const manageUsersBtn = document.getElementById('manageUsersBtn');
  if (manageUsersBtn) {
    manageUsersBtn.addEventListener('click', () => navigateTo('/users'));
  }

  // Manage backup button
  const manageBackupBtn = document.getElementById('manageBackupBtn');
  if (manageBackupBtn) {
    manageBackupBtn.addEventListener('click', () => navigateTo('/backup'));
  }

  // Manage WebDAV button
  const manageWebDAVBtn = document.getElementById('manageWebDAVBtn');
  if (manageWebDAVBtn) {
    manageWebDAVBtn.addEventListener('click', () => navigateTo('/webdav'));
  }

  // Clear by date button
  const clearByDateBtn = document.getElementById('clearByDateBtn');
  if (clearByDateBtn) {
    clearByDateBtn.addEventListener('click', async () => {
      await showDeleteByDateDialog();
    });
  }

  // Documentation button
  const documentationBtn = document.getElementById('documentationBtn');
  if (documentationBtn) {
    documentationBtn.addEventListener('click', () => {
      window.open('https://github.com/lka/client_server_einkaufsliste/blob/master/README.md', '_blank');
    });
  }
}
