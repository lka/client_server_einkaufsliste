/**
 * Tests for user state management.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { userState } from './user-state';
import { User } from '../data/auth';

// Mock the auth module
jest.mock('../data/auth', () => ({
  getCurrentUser: jest.fn(),
  deleteUser: jest.fn(),
}));

import * as auth from '../data/auth';

describe('User State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear state
    userState.clearUser();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('should start with no user', () => {
      expect(userState.getCurrentUser()).toBeNull();
    });

    it('should not be loading initially', () => {
      expect(userState.isLoading()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return a copy of user (not reference)', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };
      (auth.getCurrentUser as jest.MockedFunction<typeof auth.getCurrentUser>).mockResolvedValue(mockUser);

      await userState.loadCurrentUser();
      const user1 = userState.getCurrentUser();
      const user2 = userState.getCurrentUser();

      expect(user1).toEqual(user2);
      expect(user1).not.toBe(user2); // Different references
    });

    it('should return null when no user', () => {
      expect(userState.getCurrentUser()).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on state change', async () => {
      const listener = jest.fn();
      userState.subscribe(listener);

      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };
      (auth.getCurrentUser as jest.MockedFunction<typeof auth.getCurrentUser>).mockResolvedValue(mockUser);

      await userState.loadCurrentUser();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(mockUser);
    });

    it('should return unsubscribe function', async () => {
      const listener = jest.fn();
      const unsubscribe = userState.subscribe(listener);

      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };
      (auth.getCurrentUser as jest.MockedFunction<typeof auth.getCurrentUser>).mockResolvedValue(mockUser);

      await userState.loadCurrentUser();
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      await userState.loadCurrentUser();
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should notify multiple listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      userState.subscribe(listener1);
      userState.subscribe(listener2);

      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };
      (auth.getCurrentUser as jest.MockedFunction<typeof auth.getCurrentUser>).mockResolvedValue(mockUser);

      await userState.loadCurrentUser();

      expect(listener1).toHaveBeenCalledWith(mockUser);
      expect(listener2).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('loadCurrentUser', () => {
    it('should load user from API and update state', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };
      (auth.getCurrentUser as jest.MockedFunction<typeof auth.getCurrentUser>).mockResolvedValue(mockUser);

      const result = await userState.loadCurrentUser();

      expect(result).toEqual(mockUser);
      expect(userState.getCurrentUser()).toEqual(mockUser);
      expect(auth.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should set loading state during operation', async () => {
      let loadingDuringFetch = false;
      (auth.getCurrentUser as jest.Mock).mockImplementation(async () => {
        loadingDuringFetch = userState.isLoading();
        return null;
      });

      await userState.loadCurrentUser();

      expect(loadingDuringFetch).toBe(true);
      expect(userState.isLoading()).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      (auth.getCurrentUser as jest.MockedFunction<typeof auth.getCurrentUser>).mockRejectedValue(new Error('Network error'));

      const result = await userState.loadCurrentUser();

      expect(result).toBeNull();
      expect(userState.getCurrentUser()).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error loading current user in state:',
        expect.any(Error)
      );
    });

    it('should reset loading state after error', async () => {
      (auth.getCurrentUser as jest.MockedFunction<typeof auth.getCurrentUser>).mockRejectedValue(new Error('Network error'));

      await userState.loadCurrentUser();

      expect(userState.isLoading()).toBe(false);
    });

    it('should handle null user response', async () => {
      (auth.getCurrentUser as jest.MockedFunction<typeof auth.getCurrentUser>).mockResolvedValue(null);

      const result = await userState.loadCurrentUser();

      expect(result).toBeNull();
      expect(userState.getCurrentUser()).toBeNull();
    });
  });

  describe('deleteCurrentUser', () => {
    beforeEach(async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };
      (auth.getCurrentUser as jest.MockedFunction<typeof auth.getCurrentUser>).mockResolvedValue(mockUser);
      await userState.loadCurrentUser();
    });

    it('should delete user via API and clear state', async () => {
      (auth.deleteUser as jest.MockedFunction<typeof auth.deleteUser>).mockResolvedValue(true);

      const listener = jest.fn();
      userState.subscribe(listener);

      const result = await userState.deleteCurrentUser();

      expect(result).toBe(true);
      expect(userState.getCurrentUser()).toBeNull();
      expect(listener).toHaveBeenCalledWith(null);
    });

    it('should handle API failure', async () => {
      (auth.deleteUser as jest.MockedFunction<typeof auth.deleteUser>).mockResolvedValue(false);

      const result = await userState.deleteCurrentUser();

      expect(result).toBe(false);
      // State should not change
      expect(userState.getCurrentUser()).not.toBeNull();
    });

    it('should handle API errors', async () => {
      (auth.deleteUser as jest.MockedFunction<typeof auth.deleteUser>).mockRejectedValue(new Error('Network error'));

      const result = await userState.deleteCurrentUser();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting user in state:',
        expect.any(Error)
      );
    });
  });

  describe('clearUser', () => {
    it('should clear user and notify listeners', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };
      (auth.getCurrentUser as jest.MockedFunction<typeof auth.getCurrentUser>).mockResolvedValue(mockUser);
      await userState.loadCurrentUser();

      const listener = jest.fn();
      userState.subscribe(listener);

      userState.clearUser();

      expect(userState.getCurrentUser()).toBeNull();
      expect(listener).toHaveBeenCalledWith(null);
    });
  });

  describe('setUser', () => {
    it('should set user directly and notify listeners', () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };

      const listener = jest.fn();
      userState.subscribe(listener);

      userState.setUser(mockUser);

      expect(userState.getCurrentUser()).toEqual(mockUser);
      expect(listener).toHaveBeenCalledWith(mockUser);
    });
  });
});
