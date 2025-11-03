/**
 * User state management.
 * Manages current user state and authentication status.
 */

import { User, getCurrentUser as apiGetCurrentUser, deleteUser as apiDeleteUser } from '../data/auth.js';

type UserStateChangeListener = (user: User | null) => void;

/**
 * User state manager.
 * Provides centralized state management for current user.
 */
class UserState {
  private currentUser: User | null = null;
  private listeners: Set<UserStateChangeListener> = new Set();
  private loading: boolean = false;

  /**
   * Get current user (read-only copy).
   */
  getCurrentUser(): User | null {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  /**
   * Check if state is currently loading.
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * Subscribe to user state changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: UserStateChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change.
   */
  private notifyListeners(): void {
    const userCopy = this.getCurrentUser();
    this.listeners.forEach(listener => listener(userCopy));
  }

  /**
   * Load current user from API and update state.
   */
  async loadCurrentUser(): Promise<User | null> {
    this.loading = true;
    try {
      const user = await apiGetCurrentUser();
      this.currentUser = user;
      this.notifyListeners();
      return user;
    } catch (error) {
      console.error('Error loading current user in state:', error);
      this.currentUser = null;
      this.notifyListeners();
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Delete current user via API and clear state.
   */
  async deleteCurrentUser(): Promise<boolean> {
    this.loading = true;
    try {
      const success = await apiDeleteUser();
      if (success) {
        this.currentUser = null;
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user in state:', error);
      return false;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Clear user state (e.g., on logout).
   */
  clearUser(): void {
    this.currentUser = null;
    this.notifyListeners();
  }

  /**
   * Set user state directly (e.g., after login/register).
   */
  setUser(user: User): void {
    this.currentUser = user;
    this.notifyListeners();
  }
}

// Export singleton instance
export const userState = new UserState();
