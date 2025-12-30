/**
 * Rendering functions for user admin UI.
 */

import type { User } from '../../data/api.js';
import { escapeHtml, formatDate } from './utils.js';

/**
 * Render pending (unapproved) users list.
 */
export function renderPendingUsers(
  users: readonly User[],
  onApprove: (userId: number) => Promise<void>
): void {
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
        await onApprove(userId);
      }
    });
  });
}

/**
 * Render all users list.
 */
export function renderAllUsers(
  users: readonly User[],
  currentUser: User | null,
  onDelete: (userId: number) => Promise<void>
): void {
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
          await onDelete(userId);
        }
      });
    });
  }
}
