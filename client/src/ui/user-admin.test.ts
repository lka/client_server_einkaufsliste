/**
 * Tests for user-admin.ts
 */

import { initUserAdmin } from './user-admin.js';
import * as api from '../data/api.js';
import * as auth from '../data/auth.js';

// Mock the API and auth modules
jest.mock('../data/api.js');
jest.mock('../data/auth.js');

// Helper to wait for async rendering
const waitForRender = () => new Promise(resolve => setTimeout(resolve, 0));

describe('User Admin', () => {
  let mockUser: api.User;
  let mockPendingUsers: api.User[];
  let mockAllUsers: api.User[];

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="pendingUsersList"></div>
      <div id="allUsersList"></div>
    `;

    // Create mock users
    mockUser = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      is_active: true,
      is_approved: true,
      is_admin: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockPendingUsers = [
      {
        id: 2,
        username: 'pendinguser',
        email: 'pending@example.com',
        is_active: true,
        is_approved: false,
        is_admin: false,
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    mockAllUsers = [
      mockUser,
      ...mockPendingUsers,
      {
        id: 3,
        username: 'regularuser',
        email: 'regular@example.com',
        is_active: true,
        is_approved: true,
        is_admin: false,
        created_at: '2024-01-03T00:00:00Z',
      },
    ];

    // Setup mocks
    jest.spyOn(auth, 'getCurrentUser').mockResolvedValue(mockUser);
    jest.spyOn(api, 'fetchPendingUsers').mockResolvedValue(mockPendingUsers);
    jest.spyOn(api, 'fetchAllUsers').mockResolvedValue(mockAllUsers);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initUserAdmin', () => {
    it('should load current user and render users', async () => {
      await initUserAdmin();

      expect(auth.getCurrentUser).toHaveBeenCalled();
      expect(api.fetchPendingUsers).toHaveBeenCalled();
      expect(api.fetchAllUsers).toHaveBeenCalled();
    });

    it('should render pending users list', async () => {
      await initUserAdmin();
      await waitForRender();

      const pendingList = document.getElementById('pendingUsersList');
      expect(pendingList).toBeTruthy();
      expect(pendingList?.innerHTML).toContain('pendinguser');
      expect(pendingList?.innerHTML).toContain('pending@example.com');
      expect(pendingList?.innerHTML).toContain('Wartet auf Freischaltung');
    });

    it('should render all users list', async () => {
      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      expect(allList).toBeTruthy();
      expect(allList?.innerHTML).toContain('admin');
      expect(allList?.innerHTML).toContain('regularuser');
    });

    it('should show empty state when no pending users', async () => {
      jest.spyOn(api, 'fetchPendingUsers').mockResolvedValue([]);

      await initUserAdmin();
      await waitForRender();

      const pendingList = document.getElementById('pendingUsersList');
      expect(pendingList?.innerHTML).toContain('Keine ausstehenden Genehmigungen');
    });

    it('should show empty state when no users', async () => {
      jest.spyOn(api, 'fetchAllUsers').mockResolvedValue([]);

      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      expect(allList?.innerHTML).toContain('Keine Benutzer vorhanden');
    });
  });

  describe('User Cards', () => {
    it('should display user badges correctly', async () => {
      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      expect(allList?.innerHTML).toContain('👑 Administrator');
      expect(allList?.innerHTML).toContain('✓ Freigeschaltet');
      expect(allList?.innerHTML).toContain('⏳ Ausstehend');
    });

    it('should format dates correctly', async () => {
      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      expect(allList?.innerHTML).toContain('📅');
    });

    it('should escape HTML in user data', async () => {
      const maliciousUser = {
        id: 99,
        username: '<script>alert("xss")</script>',
        email: '<img src=x onerror=alert(1)>',
        is_active: true,
        is_approved: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
      };
      jest.spyOn(api, 'fetchAllUsers').mockResolvedValue([maliciousUser]);

      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      expect(allList?.innerHTML).not.toContain('<script>');
      expect(allList?.innerHTML).toContain('&lt;script&gt;');
      expect(allList?.innerHTML).toContain('&lt;img');
      // Verify the email is escaped
      expect(allList?.querySelector('.user-email')?.textContent).toContain('<img');
    });

    it('should apply correct CSS classes based on user status', async () => {
      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      expect(allList?.querySelector('.user-card.admin')).toBeTruthy();
      expect(allList?.querySelector('.user-card.approved')).toBeTruthy();
      expect(allList?.querySelector('.user-card.pending')).toBeTruthy();
    });
  });

  describe('Admin Functions', () => {
    it('should show delete button for admin users', async () => {
      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      const deleteButtons = allList?.querySelectorAll('.btn-delete');
      expect(deleteButtons?.length).toBeGreaterThan(0);
    });

    it('should not show delete button for own account', async () => {
      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      const adminCard = allList?.querySelector('[data-user-id="1"]');
      expect(adminCard?.querySelector('.btn-delete')).toBeFalsy();
    });

    it('should not show delete button for non-admin users', async () => {
      const regularUser = {
        id: 5,
        username: 'regular',
        email: 'regular@example.com',
        is_active: true,
        is_approved: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
      };
      jest.spyOn(auth, 'getCurrentUser').mockResolvedValue(regularUser);

      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      const deleteButtons = allList?.querySelectorAll('.btn-delete');
      expect(deleteButtons?.length).toBe(0);
    });

    it('should show approve button for pending users', async () => {
      await initUserAdmin();
      await waitForRender();

      const pendingList = document.getElementById('pendingUsersList');
      const approveButtons = pendingList?.querySelectorAll('.btn-approve');
      expect(approveButtons?.length).toBe(1);
    });
  });

  describe('Approve User', () => {
    it('should approve user when approve button is clicked', async () => {
      const approvedUser = { ...mockPendingUsers[0], is_approved: true };
      jest.spyOn(api, 'approveUser').mockResolvedValue(approvedUser);
      jest.spyOn(window, 'confirm').mockReturnValue(true);

      await initUserAdmin();
      await waitForRender();

      const approveBtn = document.querySelector('.btn-approve') as HTMLElement;
      expect(approveBtn).toBeTruthy();

      approveBtn.click();
      await waitForRender();

      expect(window.confirm).toHaveBeenCalledWith('Möchten Sie diesen Benutzer wirklich freischalten?');
      expect(api.approveUser).toHaveBeenCalledWith(2);
    });

    it('should not approve user if confirmation is cancelled', async () => {
      jest.spyOn(api, 'approveUser').mockResolvedValue(null);
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      await initUserAdmin();
      await waitForRender();

      const approveBtn = document.querySelector('.btn-approve') as HTMLElement;
      approveBtn.click();
      await waitForRender();

      expect(window.confirm).toHaveBeenCalled();
      expect(api.approveUser).not.toHaveBeenCalled();
    });

    it('should show error alert if approval fails', async () => {
      jest.spyOn(api, 'approveUser').mockResolvedValue(null);
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(window, 'alert').mockImplementation(() => {});

      await initUserAdmin();
      await waitForRender();

      const approveBtn = document.querySelector('.btn-approve') as HTMLElement;
      approveBtn.click();
      await waitForRender();

      expect(window.alert).toHaveBeenCalledWith('Fehler beim Freischalten des Benutzers.');
    });

    it('should reload users after successful approval', async () => {
      const approvedUser = { ...mockPendingUsers[0], is_approved: true };
      jest.spyOn(api, 'approveUser').mockResolvedValue(approvedUser);
      jest.spyOn(window, 'confirm').mockReturnValue(true);

      await initUserAdmin();
      await waitForRender();

      const initialCallCount = (api.fetchAllUsers as jest.Mock).mock.calls.length;

      const approveBtn = document.querySelector('.btn-approve') as HTMLElement;
      approveBtn.click();
      await waitForRender();

      expect(api.fetchAllUsers).toHaveBeenCalledTimes(initialCallCount + 1);
      expect(api.fetchPendingUsers).toHaveBeenCalledTimes(initialCallCount + 1);
    });
  });

  describe('Delete User', () => {
    it('should delete user when delete button is clicked', async () => {
      jest.spyOn(api, 'deleteUser').mockResolvedValue(true);
      jest.spyOn(window, 'confirm').mockReturnValue(true);

      await initUserAdmin();
      await waitForRender();

      const deleteBtn = document.querySelector('.btn-delete') as HTMLElement;
      expect(deleteBtn).toBeTruthy();

      deleteBtn.click();
      await waitForRender();

      expect(window.confirm).toHaveBeenCalled();
      expect(api.deleteUser).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should show confirmation dialog with warning', async () => {
      jest.spyOn(api, 'deleteUser').mockResolvedValue(true);
      jest.spyOn(window, 'confirm').mockReturnValue(true);

      await initUserAdmin();
      await waitForRender();

      const deleteBtn = document.querySelector('.btn-delete') as HTMLElement;
      deleteBtn.click();
      await waitForRender();

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Möchten Sie diesen Benutzer wirklich löschen?')
      );
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('kann nicht rückgängig gemacht werden')
      );
    });

    it('should not delete user if confirmation is cancelled', async () => {
      jest.spyOn(api, 'deleteUser').mockResolvedValue(false);
      jest.spyOn(window, 'confirm').mockReturnValue(false);

      await initUserAdmin();
      await waitForRender();

      const deleteBtn = document.querySelector('.btn-delete') as HTMLElement;
      deleteBtn.click();
      await waitForRender();

      expect(window.confirm).toHaveBeenCalled();
      expect(api.deleteUser).not.toHaveBeenCalled();
    });

    it('should reload users after successful deletion', async () => {
      jest.spyOn(api, 'deleteUser').mockResolvedValue(true);
      jest.spyOn(window, 'confirm').mockReturnValue(true);

      await initUserAdmin();
      await waitForRender();

      const initialCallCount = (api.fetchAllUsers as jest.Mock).mock.calls.length;

      const deleteBtn = document.querySelector('.btn-delete') as HTMLElement;
      deleteBtn.click();
      await waitForRender();

      expect(api.fetchAllUsers).toHaveBeenCalledTimes(initialCallCount + 1);
      expect(api.fetchPendingUsers).toHaveBeenCalledTimes(initialCallCount + 1);
    });

    it('should not show error alert on failed deletion (handled in API)', async () => {
      jest.spyOn(api, 'deleteUser').mockResolvedValue(false);
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(window, 'alert').mockImplementation(() => {});

      await initUserAdmin();
      await waitForRender();

      const deleteBtn = document.querySelector('.btn-delete') as HTMLElement;
      deleteBtn.click();
      await waitForRender();

      // Error is shown in deleteUser function, not here
      expect(window.alert).not.toHaveBeenCalled();
    });
  });

  describe('User Organization', () => {
    it('should display pending users before approved users in all users list', async () => {
      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      const cards = allList?.querySelectorAll('.user-card');

      expect(cards).toBeTruthy();
      if (cards && cards.length > 1) {
        // First card should be pending user
        expect(cards[0].classList.contains('pending')).toBeTruthy();
        // Subsequent cards should be approved
        expect(cards[1].classList.contains('admin') || cards[1].classList.contains('approved')).toBeTruthy();
      }
    });

    it('should handle multiple pending users', async () => {
      const multiplePending: api.User[] = [
        {
          id: 10,
          username: 'pending1',
          email: 'pending1@example.com',
          is_active: true,
          is_approved: false,
          is_admin: false,
          created_at: '2024-01-10T00:00:00Z',
        },
        {
          id: 11,
          username: 'pending2',
          email: 'pending2@example.com',
          is_active: true,
          is_approved: false,
          is_admin: false,
          created_at: '2024-01-11T00:00:00Z',
        },
      ];
      jest.spyOn(api, 'fetchPendingUsers').mockResolvedValue(multiplePending);

      await initUserAdmin();
      await waitForRender();

      const pendingList = document.getElementById('pendingUsersList');
      const approveButtons = pendingList?.querySelectorAll('.btn-approve');
      expect(approveButtons?.length).toBe(2);
    });

    it('should display inactive user badge', async () => {
      const inactiveUser: api.User = {
        id: 20,
        username: 'inactive',
        email: 'inactive@example.com',
        is_active: false,
        is_approved: true,
        is_admin: false,
        created_at: '2024-01-20T00:00:00Z',
      };
      jest.spyOn(api, 'fetchAllUsers').mockResolvedValue([mockUser, inactiveUser]);

      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      expect(allList?.innerHTML).toContain('❌ Inaktiv');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing DOM elements gracefully', async () => {
      document.body.innerHTML = '';

      await expect(initUserAdmin()).resolves.not.toThrow();
    });

    it('should handle null current user', async () => {
      jest.spyOn(auth, 'getCurrentUser').mockResolvedValue(null);

      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      const deleteButtons = allList?.querySelectorAll('.btn-delete');
      expect(deleteButtons?.length).toBe(0);
    });

    it('should handle invalid date strings', async () => {
      const userWithBadDate: api.User = {
        id: 30,
        username: 'baddate',
        email: 'baddate@example.com',
        is_active: true,
        is_approved: true,
        is_admin: false,
        created_at: 'invalid-date',
      };
      jest.spyOn(api, 'fetchAllUsers').mockResolvedValue([userWithBadDate]);

      await initUserAdmin();
      await waitForRender();

      const allList = document.getElementById('allUsersList');
      // Invalid dates are displayed as "Invalid Date" by JavaScript
      expect(allList?.innerHTML).toContain('Invalid Date');
    });

    it('should handle empty user arrays', async () => {
      jest.spyOn(api, 'fetchPendingUsers').mockResolvedValue([]);
      jest.spyOn(api, 'fetchAllUsers').mockResolvedValue([]);

      await initUserAdmin();
      await waitForRender();

      const pendingList = document.getElementById('pendingUsersList');
      const allList = document.getElementById('allUsersList');

      expect(pendingList?.querySelector('.empty-state')).toBeTruthy();
      expect(allList?.querySelector('.empty-state')).toBeTruthy();
    });
  });
});
