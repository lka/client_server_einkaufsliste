/**
 * Tests for user menu UI module.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { initUserMenu, updateUserDisplay } from './user-menu.js';
import * as auth from '../data/auth.js';
import { userState } from '../state/user-state.js';
import { shoppingListState } from '../state/shopping-list-state.js';

// Mock the modules
jest.mock('../data/auth.js');
jest.mock('../state/user-state.js');
jest.mock('../state/shopping-list-state.js');

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
            <button id="backToAppBtn">Zurück zur App</button>
            <button id="manageStoresBtn">Geschäfte verwalten</button>
            <button id="manageProductsBtn">Produkte verwalten</button>
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
        is_approved: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      (userState.loadCurrentUser as jest.MockedFunction<typeof userState.loadCurrentUser>).mockResolvedValue(
        mockUser
      );

      await updateUserDisplay();

      const header = document.querySelector('header h1');
      expect(header?.innerHTML).toBe('Einkaufsliste <small>(testuser)</small>');
    });

    it('should not update header when no user', async () => {
      (userState.loadCurrentUser as jest.MockedFunction<typeof userState.loadCurrentUser>).mockResolvedValue(
        null
      );

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
        is_approved: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      (userState.loadCurrentUser as jest.MockedFunction<typeof userState.loadCurrentUser>).mockResolvedValue(
        mockUser
      );

      await updateUserDisplay();

      // Should not throw error
      expect(userState.loadCurrentUser).toHaveBeenCalled();
    });

    it('should not add username twice if already present', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        is_active: true,
        is_approved: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      (userState.loadCurrentUser as jest.MockedFunction<typeof userState.loadCurrentUser>).mockResolvedValue(
        mockUser
      );

      // First call
      await updateUserDisplay();
      const header = document.querySelector('header h1');
      expect(header?.innerHTML).toBe('Einkaufsliste <small>(testuser)</small>');

      // Second call - should not add username again
      await updateUserDisplay();
      expect(header?.innerHTML).toBe('Einkaufsliste <small>(testuser)</small>');
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

    it('should navigate to app when back button clicked', () => {
      initUserMenu();

      const backToAppBtn = document.getElementById('backToAppBtn')!;
      backToAppBtn.click();

      expect((window as any).location.href).toBe('/app');
    });

    it('should navigate to stores when manage stores button clicked', () => {
      initUserMenu();

      const manageStoresBtn = document.getElementById('manageStoresBtn')!;
      manageStoresBtn.click();

      expect((window as any).location.href).toBe('/stores');
    });

    it('should navigate to products when manage products button clicked', () => {
      initUserMenu();

      const manageProductsBtn = document.getElementById('manageProductsBtn')!;
      manageProductsBtn.click();

      expect((window as any).location.href).toBe('/products');
    });

    it('should logout when logout button clicked', () => {
      (auth.logout as jest.MockedFunction<typeof auth.logout>).mockImplementation(() => {});
      (userState.clearUser as jest.MockedFunction<typeof userState.clearUser>).mockImplementation(() => {});
      (shoppingListState.clear as jest.MockedFunction<typeof shoppingListState.clear>).mockImplementation(() => {});

      initUserMenu();

      const logoutBtn = document.getElementById('logoutBtn')!;
      logoutBtn.click();

      expect(auth.logout).toHaveBeenCalled();
      expect(userState.clearUser).toHaveBeenCalled();
      expect(shoppingListState.clear).toHaveBeenCalled();
      expect((window as any).location.href).toBe('/');
    });


    it('should handle missing menu elements gracefully', () => {
      document.body.innerHTML = '<div></div>';

      jest.spyOn(console, 'error').mockImplementation(() => {});

      initUserMenu();

      expect(console.error).toHaveBeenCalledWith('User menu elements not found');
    });

    it('should handle missing back to app button', () => {
      document.getElementById('backToAppBtn')?.remove();

      initUserMenu();

      // Should not throw error
      expect(document.getElementById('backToAppBtn')).toBeNull();
    });

    it('should handle missing manage stores button', () => {
      document.getElementById('manageStoresBtn')?.remove();

      initUserMenu();

      // Should not throw error
      expect(document.getElementById('manageStoresBtn')).toBeNull();
    });

    it('should handle missing manage products button', () => {
      document.getElementById('manageProductsBtn')?.remove();

      initUserMenu();

      // Should not throw error
      expect(document.getElementById('manageProductsBtn')).toBeNull();
    });

    it('should handle missing logout button', () => {
      document.getElementById('logoutBtn')?.remove();

      (auth.logout as jest.MockedFunction<typeof auth.logout>).mockImplementation(() => {});

      initUserMenu();

      // Should not throw error
      expect(document.getElementById('logoutBtn')).toBeNull();
    });

    it('should handle missing delete button', async () => {
      document.getElementById('deleteAccountBtn')?.remove();

      (userState.deleteCurrentUser as jest.MockedFunction<typeof userState.deleteCurrentUser>).mockResolvedValue(
        true
      );

      initUserMenu();

      // Should not throw error
      expect(document.getElementById('deleteAccountBtn')).toBeNull();
    });
  });
});
