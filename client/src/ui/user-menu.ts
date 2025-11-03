/**
 * User menu module.
 * Handles user menu interactions (logout, account deletion).
 */

import { logout, getCurrentUser, deleteUser } from '../data/auth.js';

/**
 * Update user display in header with current username.
 */
export async function updateUserDisplay(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    const header = document.querySelector('header h1');
    if (header) {
      header.innerHTML = `Einkaufsliste <small>(${user.username})</small>`;
    }
  }
}

/**
 * Initialize user menu event handlers.
 */
export function initUserMenu(): void {
  const menuBtn = document.getElementById('menuBtn');
  const menuDropdown = document.getElementById('menuDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');

  if (!menuBtn || !menuDropdown) {
    console.error('User menu elements not found');
    return;
  }

  // Menu toggle handler
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('show');
  });

  // Close menu when clicking outside
  document.addEventListener('click', () => {
    menuDropdown.classList.remove('show');
  });

  // Prevent menu from closing when clicking inside dropdown
  menuDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Logout button handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      window.location.href = '/';
    });
  }

  // Delete account button handler
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
      const confirmed = confirm(
        'Möchten Sie Ihren Account wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
      );
      if (confirmed) {
        const success = await deleteUser();
        if (success) {
          alert('Ihr Account wurde erfolgreich gelöscht.');
          window.location.href = '/';
        } else {
          alert('Fehler beim Löschen des Accounts. Bitte versuchen Sie es erneut.');
        }
      }
    });
  }
}
