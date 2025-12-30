/**
 * Event handlers for user admin UI.
 */

import { approveUser, deleteUser, type User } from '../../data/api.js';
import { logout } from '../../data/auth.js';
import { userState } from '../../state/user-state.js';
import { shoppingListState } from '../../state/shopping-list-state.js';
import { showError, showSuccess } from '../components/index.js';

/**
 * Handle approving a user.
 */
export async function handleApproveUser(
  userId: number,
  onSuccess: () => Promise<void>
): Promise<void> {
  const confirmed = confirm('Möchten Sie diesen Benutzer wirklich freischalten?');
  if (!confirmed) return;

  const approved = await approveUser(userId);
  if (approved) {
    await onSuccess();
  } else {
    showError('Fehler beim Freischalten des Benutzers.');
  }
}

/**
 * Handle deleting a user.
 */
export async function handleDeleteUser(
  userId: number,
  onSuccess: () => Promise<void>
): Promise<void> {
  const confirmed = confirm(
    'Möchten Sie diesen Benutzer wirklich löschen?\n\n' +
    'Diese Aktion kann nicht rückgängig gemacht werden!\n' +
    'Alle Items des Benutzers werden ebenfalls gelöscht.'
  );
  if (!confirmed) return;

  const deleted = await deleteUser(userId);
  if (deleted) {
    await onSuccess();
  }
  // Error message is already shown in deleteUser function
}

/**
 * Initialize delete own account button.
 * Only visible for non-admin users.
 */
export function initDeleteSelfAccountButton(currentUser: User | null): void {
  const deleteSelfAccountSection = document.querySelector('.delete-account-section') as HTMLElement;
  const deleteSelfAccountBtn = document.getElementById('deleteSelfAccountBtn');

  // Hide the entire section if user is admin
  if (currentUser?.is_admin) {
    if (deleteSelfAccountSection) {
      deleteSelfAccountSection.style.display = 'none';
    }
    return;
  }

  if (!deleteSelfAccountBtn) return;

  deleteSelfAccountBtn.addEventListener('click', async () => {
    const confirmed = confirm(
      'Möchten Sie Ihren eigenen Account wirklich löschen?\n\n' +
      'Diese Aktion kann nicht rückgängig gemacht werden!'
    );

    if (!confirmed) return;

    const success = await userState.deleteCurrentUser();
    if (success) {
      logout();
      userState.clearUser();
      shoppingListState.clear();
      showSuccess('Ihr Account wurde erfolgreich gelöscht.');
      window.location.href = '/';
    } else {
      showError('Fehler beim Löschen des Accounts. Bitte versuchen Sie es erneut.');
    }
  });
}
