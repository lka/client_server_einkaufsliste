/**
 * Tests for user menu UI module.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { initUserMenu, updateUserDisplay } from './user-menu.js';
import * as auth from '../data/auth.js';

// Mock the auth module
jest.mock('../data/auth.js');

// Mock window.location
delete (window as any).location;
(window as any).location = { href: '' };

// Mock window.confirm and window.alert
global.confirm = jest.fn() as unknown as typeof confirm;
global.alert = jest.fn() as unknown as typeof alert;

describe('User Menu UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).location.href = '';

    // Setup DOM
    document.body.innerHTML = `
      <header>
        <h1>Einkaufsliste</h1>
        <div class="user-menu">
          <button id="menuBtn">⋮</button>
          <div id="menuDropdown" class="menu-dropdown">
            <button id="logoutBtn">Abmelden</button>
            <button id="deleteAccountBtn">Account löschen</button>
          </div>
        </div>
      </header>
    `;

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('updateUserDisplay', () => {
    it('should update header with username', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };

      jest.spyOn(auth, 'getCurrentUser').mockResolvedValue(mockUser);

      await updateUserDisplay();

      const header = document.querySelector('header h1');
      expect(header?.innerHTML).toBe('Einkaufsliste <small>(testuser)</small>');
    });

    it('should not update header when no user', async () => {
      jest.spyOn(auth, 'getCurrentUser').mockResolvedValue(null);

      await updateUserDisplay();

      const header = document.querySelector('header h1');
      expect(header?.innerHTML).toBe('Einkaufsliste');
    });

    it('should handle missing header element', async () => {
      document.body.innerHTML = '<div></div>';

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
      };

      jest.spyOn(auth, 'getCurrentUser').mockResolvedValue(mockUser);

      await updateUserDisplay();

      // Should not throw error
      expect(auth.getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('initUserMenu', () => {
    it('should initialize menu event handlers', () => {
      initUserMenu();

      const menuBtn = document.getElementById('menuBtn');
      const menuDropdown = document.getElementById('menuDropdown');

      expect(menuBtn).toBeDefined();
      expect(menuDropdown).toBeDefined();
    });

    it('should toggle menu on button click', () => {
      initUserMenu();

      const menuBtn = document.getElementById('menuBtn')!;
      const menuDropdown = document.getElementById('menuDropdown')!;

      expect(menuDropdown.classList.contains('show')).toBe(false);

      menuBtn.click();
      expect(menuDropdown.classList.contains('show')).toBe(true);

      menuBtn.click();
      expect(menuDropdown.classList.contains('show')).toBe(false);
    });

    it('should close menu when clicking outside', () => {
      initUserMenu();

      const menuBtn = document.getElementById('menuBtn')!;
      const menuDropdown = document.getElementById('menuDropdown')!;

      // Open menu
      menuBtn.click();
      expect(menuDropdown.classList.contains('show')).toBe(true);

      // Click outside (on document)
      document.body.click();
      expect(menuDropdown.classList.contains('show')).toBe(false);
    });

    it('should not close menu when clicking inside dropdown', () => {
      initUserMenu();

      const menuBtn = document.getElementById('menuBtn')!;
      const menuDropdown = document.getElementById('menuDropdown')!;

      // Open menu
      menuBtn.click();
      expect(menuDropdown.classList.contains('show')).toBe(true);

      // Click inside dropdown
      menuDropdown.click();
      expect(menuDropdown.classList.contains('show')).toBe(true);
    });

    it('should logout when logout button clicked', () => {
      jest.spyOn(auth, 'logout').mockImplementation(() => {});

      initUserMenu();

      const logoutBtn = document.getElementById('logoutBtn')!;
      logoutBtn.click();

      expect(auth.logout).toHaveBeenCalled();
      expect((window as any).location.href).toBe('/');
    });

    it('should handle delete account with confirmation', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.alert as jest.Mock).mockImplementation(() => {});
      jest.spyOn(auth, 'deleteUser').mockResolvedValue(true);

      initUserMenu();

      const deleteBtn = document.getElementById('deleteAccountBtn')!;
      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.confirm).toHaveBeenCalledWith(
        'Möchten Sie Ihren Account wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
      );
      expect(auth.deleteUser).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Ihr Account wurde erfolgreich gelöscht.');
      expect((window as any).location.href).toBe('/');
    });

    it('should not delete account when user cancels confirmation', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);
      jest.spyOn(auth, 'deleteUser').mockResolvedValue(true);

      initUserMenu();

      const deleteBtn = document.getElementById('deleteAccountBtn')!;
      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.confirm).toHaveBeenCalled();
      expect(auth.deleteUser).not.toHaveBeenCalled();
    });

    it('should show error when account deletion fails', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      (global.alert as jest.Mock).mockImplementation(() => {});
      jest.spyOn(auth, 'deleteUser').mockResolvedValue(false);

      initUserMenu();

      const deleteBtn = document.getElementById('deleteAccountBtn')!;
      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.deleteUser).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(
        'Fehler beim Löschen des Accounts. Bitte versuchen Sie es erneut.'
      );
      expect((window as any).location.href).toBe(''); // Not redirected
    });

    it('should handle missing menu elements gracefully', () => {
      document.body.innerHTML = '<div></div>';

      jest.spyOn(console, 'error').mockImplementation(() => {});

      initUserMenu();

      expect(console.error).toHaveBeenCalledWith('User menu elements not found');
    });

    it('should handle missing logout button', () => {
      document.getElementById('logoutBtn')?.remove();

      jest.spyOn(auth, 'logout').mockImplementation(() => {});

      initUserMenu();

      // Should not throw error
      expect(document.getElementById('logoutBtn')).toBeNull();
    });

    it('should handle missing delete button', async () => {
      document.getElementById('deleteAccountBtn')?.remove();

      jest.spyOn(auth, 'deleteUser').mockResolvedValue(true);

      initUserMenu();

      // Should not throw error
      expect(document.getElementById('deleteAccountBtn')).toBeNull();
    });
  });
});
