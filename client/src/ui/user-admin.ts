/**
 * User administration UI component.
 *
 * Provides UI for managing users (approve pending users, view all users).
 */

import { fetchAllUsers, fetchPendingUsers, approveUser, deleteUser, type User } from '../data/api.js';
import { getCurrentUser, logout } from '../data/auth.js';
import { userState } from '../state/user-state.js';
import { shoppingListState } from '../state/shopping-list-state.js';

let currentUser: User | null = null;

/**
 * Initialize the user admin UI.
 */
export async function initUserAdmin(): Promise<void> {
  // Load current user info
  currentUser = await getCurrentUser();

  // Load and render users
  loadUsers();

  // Initialize delete own account button
  initDeleteSelfAccountButton();
}

/**
 * Load and render all users.
 */
async function loadUsers(): Promise<void> {
  const [pendingUsers, allUsers] = await Promise.all([
    fetchPendingUsers(),
    fetchAllUsers(),
  ]);

  renderPendingUsers(pendingUsers);
  renderAllUsers(allUsers);
}

/**
 * Render pending (unapproved) users list.
 */
function renderPendingUsers(users: readonly User[]): void {
  const container = document.getElementById('pendingUsersList');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML =
      '<div class="empty-state">✓ Keine ausstehenden Genehmigungen</div>';
    return;
  }

  const html = users
    .map(
      (user) => `
    <div class="user-card pending" data-user-id="${user.id}">
      <div class="user-info">
        <div class="user-name">${escapeHtml(user.username)}</div>
        <div class="user-email">${escapeHtml(user.email)}</div>
        <div class="user-meta">
          <span class="user-badge pending">Wartet auf Freischaltung</span>
          <span class="user-created">📅 ${formatDate(user.created_at)}</span>
        </div>
      </div>
      <div class="user-actions">
        <button class="btn-approve" data-user-id="${user.id}" title="Benutzer freischalten">
          ✓ Freischalten
        </button>
      </div>
    </div>
  `
    )
    .join('');

  container.innerHTML = html;

  // Attach event listeners for approve buttons
  container.querySelectorAll('.btn-approve').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const userId = parseInt(target.dataset.userId || '0', 10);
      if (userId) {
        await handleApproveUser(userId);
      }
    });
  });
}

/**
 * Render all users list.
 */
function renderAllUsers(users: readonly User[]): void {
  const container = document.getElementById('allUsersList');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<div class="empty-state">Keine Benutzer vorhanden.</div>';
    return;
  }

  // Separate users by status for better organization
  const approvedUsers = users.filter(u => u.is_approved);
  const pendingUsers = users.filter(u => !u.is_approved);

  const isAdmin = currentUser?.is_admin ?? false;

  const html = [...pendingUsers, ...approvedUsers]
    .map(
      (user) => {
        const cardClass = user.is_admin ? 'admin' : user.is_approved ? 'approved' : 'pending';
        const canDelete = isAdmin && currentUser?.id !== user.id;
        return `
    <div class="user-card ${cardClass}" data-user-id="${user.id}">
      <div class="user-info">
        <div class="user-name">${escapeHtml(user.username)}</div>
        <div class="user-email">${escapeHtml(user.email)}</div>
        <div class="user-meta">
          ${user.is_admin ? '<span class="user-badge admin">👑 Administrator</span>' : ''}
          ${user.is_approved ? '<span class="user-badge approved">✓ Freigeschaltet</span>' : '<span class="user-badge pending">⏳ Ausstehend</span>'}
          ${!user.is_active ? '<span class="user-badge inactive">❌ Inaktiv</span>' : ''}
          <span class="user-created">📅 ${formatDate(user.created_at)}</span>
        </div>
      </div>
      ${canDelete ? `
      <div class="user-actions">
        <button class="btn-delete" data-user-id="${user.id}" title="Benutzer löschen">
          🗑️ Löschen
        </button>
      </div>
      ` : ''}
    </div>
  `;
      }
    )
    .join('');

  container.innerHTML = html;

  // Attach event listeners for delete buttons
  if (isAdmin) {
    container.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLElement;
        const userId = parseInt(target.dataset.userId || '0', 10);
        if (userId) {
          await handleDeleteUser(userId);
        }
      });
    });
  }
}

/**
 * Handle approving a user.
 */
async function handleApproveUser(userId: number): Promise<void> {
  const confirmed = confirm('Möchten Sie diesen Benutzer wirklich freischalten?');
  if (!confirmed) return;

  const approved = await approveUser(userId);
  if (approved) {
    // Reload users
    await loadUsers();
  } else {
    alert('Fehler beim Freischalten des Benutzers.');
  }
}

/**
 * Handle deleting a user.
 */
async function handleDeleteUser(userId: number): Promise<void> {
  const confirmed = confirm(
    'Möchten Sie diesen Benutzer wirklich löschen?\n\n' +
    'Diese Aktion kann nicht rückgängig gemacht werden!\n' +
    'Alle Items des Benutzers werden ebenfalls gelöscht.'
  );
  if (!confirmed) return;

  const deleted = await deleteUser(userId);
  if (deleted) {
    // Reload users
    await loadUsers();
  }
  // Error message is already shown in deleteUser function
}

/**
 * Format date string for display.
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Escape HTML to prevent XSS.
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize delete own account button.
 * Only visible for non-admin users.
 */
function initDeleteSelfAccountButton(): void {
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
      alert('Ihr Account wurde erfolgreich gelöscht.');
      window.location.href = '/';
    } else {
      alert('Fehler beim Löschen des Accounts. Bitte versuchen Sie es erneut.');
    }
  });
}