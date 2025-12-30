/**
 * Initialization logic for user admin UI.
 */

import { fetchAllUsers, fetchPendingUsers, type User } from '../../data/api.js';
import { getCurrentUser } from '../../data/auth.js';
import { renderPendingUsers, renderAllUsers } from './rendering.js';
import { handleApproveUser, handleDeleteUser, initDeleteSelfAccountButton } from './event-handlers.js';

let currentUser: User | null = null;

/**
 * Initialize the user admin UI.
 */
export async function initUserAdmin(): Promise<void> {
  // Load current user info
  currentUser = await getCurrentUser();

  // Load and render users
  await loadUsers();

  // Initialize delete own account button
  initDeleteSelfAccountButton(currentUser);
}

/**
 * Load and render all users.
 */
async function loadUsers(): Promise<void> {
  const [pendingUsers, allUsers] = await Promise.all([
    fetchPendingUsers(),
    fetchAllUsers(),
  ]);

  renderPendingUsers(pendingUsers, async (userId) => {
    await handleApproveUser(userId, loadUsers);
  });

  renderAllUsers(allUsers, currentUser, async (userId) => {
    await handleDeleteUser(userId, loadUsers);
  });
}
