/**
 * Authentication event handlers for user menu.
 */

import { logout } from '../../data/auth.js';
import { userState } from '../../state/user-state.js';
import { shoppingListState } from '../../state/shopping-list-state.js';
import { stopInactivityTracker } from '../../data/inactivity-tracker.js';

/**
 * Update user display in header with current username.
 */
export async function updateUserDisplay(): Promise<void> {
  const user = await userState.loadCurrentUser();
  if (user) {
    const header = document.querySelector('header h1');
    if (header) {
      // Get current text and check if username is already added
      const currentText = header.textContent || '';
      if (!currentText.includes(`(${user.username})`)) {
        // Append username to existing header text
        header.innerHTML = `${currentText} <small>(${user.username})</small>`;
      }
    }
  }
}

/**
 * Attach logout handler.
 */
export function attachLogoutHandler(): void {
  const logoutBtn = document.getElementById('logoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      stopInactivityTracker();
      logout();
      userState.clearUser();
      shoppingListState.clear();
      window.location.href = '/';
    });
  }
}
