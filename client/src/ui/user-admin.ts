/**
 * User administration UI component.
 *
 * Provides UI for managing users (approve pending users, view all users).
 */

import { fetchAllUsers, fetchPendingUsers, approveUser, type User } from '../data/api.js';

/**
 * Initialize the user admin UI.
 */
export function initUserAdmin(): void {
  // Load and render users
  loadUsers();
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
      '<div class="no-users">Keine Benutzer zur Genehmigung vorhanden.</div>';
    return;
  }

  const html = users
    .map(
      (user) => `
    <div class="user-item" data-user-id="${user.id}">
      <div class="user-info">
        <div class="user-name">${user.username}</div>
        <div class="user-email">${user.email}</div>
        <div class="user-meta">Registriert: ${formatDate(user.created_at)}</div>
      </div>
      <div class="user-controls">
        <button class="approve-user-btn" data-user-id="${user.id}" title="Benutzer freischalten">
          ✓ Freischalten
        </button>
      </div>
    </div>
  `
    )
    .join('');

  container.innerHTML = html;

  // Attach event listeners for approve buttons
  container.querySelectorAll('.approve-user-btn').forEach((btn) => {
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
    container.innerHTML = '<div class="no-users">Keine Benutzer vorhanden.</div>';
    return;
  }

  const html = users
    .map(
      (user) => `
    <div class="user-item${user.is_approved ? '' : ' pending'}" data-user-id="${user.id}">
      <div class="user-info">
        <div class="user-name">
          ${user.username}
          ${user.is_admin ? '<span class="user-badge admin">Admin</span>' : ''}
          ${!user.is_approved ? '<span class="user-badge pending">Ausstehend</span>' : ''}
          ${!user.is_active ? '<span class="user-badge inactive">Inaktiv</span>' : ''}
        </div>
        <div class="user-email">${user.email}</div>
        <div class="user-meta">Registriert: ${formatDate(user.created_at)}</div>
      </div>
    </div>
  `
    )
    .join('');

  container.innerHTML = html;
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