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

// Mock fetch for menu template loading
const mockFetch = jest.fn() as any;
(global as any).fetch = mockFetch;

describe('User Menu UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).location.href = '';

    // Reset fetch mock to default implementation
    mockFetch.mockImplementation((url: string) => {
      if (url === 'src/ui/components/menu-dropdown.html') {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`
            <button id="settingsMenuBtn" class="menu-item menu-item-submenu">⚙️ Einstellungen <span class="submenu-arrow">›</span></button>
            <div id="settingsSubmenu" class="menu-submenu">
              <button id="manageStoresBtn" class="menu-item">🏪 Geschäfte verwalten</button>
              <button id="manageProductsBtn" class="menu-item">📦 Produkte verwalten</button>
              <button id="manageTemplatesBtn" class="menu-item">📋 Vorlagen verwalten</button>
              <button id="manageUsersBtn" class="menu-item">👥 Benutzer verwalten</button>
              <button id="manageBackupBtn" class="menu-item">💾 Datenbank-Backup</button>
            </div>
            <button id="websocketMenuBtn" class="menu-item menu-item-submenu">🔌 WebSocket <span class="submenu-arrow">›</span></button>
            <div id="websocketSubmenu" class="menu-submenu">
              <button id="toggleWebSocketBtn" class="menu-item">🔌 WebSocket aktivieren</button>
              <button id="copyWebSocketLinkBtn" class="menu-item">📋 Link kopieren</button>
            </div>
            <button id="logoutBtn" class="menu-item">🚪 Abmelden</button>
            <div id="versionInfo" class="menu-version"></div>
          `),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Setup DOM
    document.body.innerHTML = `
      <header>
        <h1>Einkaufsliste</h1>
        <div class="user-menu">
          <button id="menuBtn">⋮</button>
          <div id="menuDropdown" class="menu-dropdown">
            <!-- Menu items will be loaded dynamically -->
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
    it('should initialize menu event handlers', async () => {
      await initUserMenu();

      const menuBtn = document.getElementById('menuBtn');
      const menuDropdown = document.getElementById('menuDropdown');

      expect(menuBtn).toBeDefined();
      expect(menuDropdown).toBeDefined();
    });

    it('should toggle menu on button click', async () => {
      await initUserMenu();

      const menuBtn = document.getElementById('menuBtn')!;
      const menuDropdown = document.getElementById('menuDropdown')!;

      expect(menuDropdown.classList.contains('show')).toBe(false);

      menuBtn.click();
      expect(menuDropdown.classList.contains('show')).toBe(true);

      menuBtn.click();
      expect(menuDropdown.classList.contains('show')).toBe(false);
    });

    it('should close menu when clicking outside', async () => {
      await initUserMenu();

      const menuBtn = document.getElementById('menuBtn')!;
      const menuDropdown = document.getElementById('menuDropdown')!;

      // Open menu
      menuBtn.click();
      expect(menuDropdown.classList.contains('show')).toBe(true);

      // Click outside (on document)
      document.body.click();
      expect(menuDropdown.classList.contains('show')).toBe(false);
    });

    it('should not close menu when clicking inside dropdown', async () => {
      await initUserMenu();

      const menuBtn = document.getElementById('menuBtn')!;
      const menuDropdown = document.getElementById('menuDropdown')!;

      // Open menu
      menuBtn.click();
      expect(menuDropdown.classList.contains('show')).toBe(true);

      // Click inside dropdown
      menuDropdown.click();
      expect(menuDropdown.classList.contains('show')).toBe(true);
    });

    it('should navigate to app when back button clicked', async () => {
      // Add backToAppBtn to DOM for this test
      const backBtn = document.createElement('button');
      backBtn.id = 'backToAppBtn';
      document.body.appendChild(backBtn);

      await initUserMenu();

      const backToAppBtn = document.getElementById('backToAppBtn')!;
      backToAppBtn.click();

      expect((window as any).location.href).toBe('/app');
    });

    it('should navigate to stores when manage stores button clicked', async () => {
      await initUserMenu();

      const manageStoresBtn = document.getElementById('manageStoresBtn')!;
      manageStoresBtn.click();

      expect((window as any).location.href).toBe('/stores');
    });

    it('should navigate to products when manage products button clicked', async () => {
      await initUserMenu();

      const manageProductsBtn = document.getElementById('manageProductsBtn')!;
      manageProductsBtn.click();

      expect((window as any).location.href).toBe('/products');
    });

    it('should logout when logout button clicked', async () => {
      (auth.logout as jest.MockedFunction<typeof auth.logout>).mockImplementation(() => {});
      (userState.clearUser as jest.MockedFunction<typeof userState.clearUser>).mockImplementation(() => {});
      (shoppingListState.clear as jest.MockedFunction<typeof shoppingListState.clear>).mockImplementation(() => {});

      await initUserMenu();

      const logoutBtn = document.getElementById('logoutBtn')!;
      logoutBtn.click();

      expect(auth.logout).toHaveBeenCalled();
      expect(userState.clearUser).toHaveBeenCalled();
      expect(shoppingListState.clear).toHaveBeenCalled();
      expect((window as any).location.href).toBe('/');
    });


    it('should handle missing menu elements gracefully', async () => {
      document.body.innerHTML = '<div></div>';

      jest.spyOn(console, 'error').mockImplementation(() => {});

      await initUserMenu();

      expect(console.error).toHaveBeenCalledWith('User menu elements not found');
    });

    it('should handle missing back to app button', async () => {
      await initUserMenu();

      // backToAppBtn is not in the menu template, so it should be null
      expect(document.getElementById('backToAppBtn')).toBeNull();
    });

    it('should load menu template with all buttons', async () => {
      await initUserMenu();

      // Verify main menu buttons
      expect(document.getElementById('settingsMenuBtn')).not.toBeNull();
      expect(document.getElementById('websocketMenuBtn')).not.toBeNull();
      expect(document.getElementById('logoutBtn')).not.toBeNull();
      expect(document.getElementById('versionInfo')).not.toBeNull();

      // Verify settings submenu
      expect(document.getElementById('settingsSubmenu')).not.toBeNull();
      expect(document.getElementById('manageStoresBtn')).not.toBeNull();
      expect(document.getElementById('manageProductsBtn')).not.toBeNull();
      expect(document.getElementById('manageTemplatesBtn')).not.toBeNull();
      expect(document.getElementById('manageUsersBtn')).not.toBeNull();
      expect(document.getElementById('manageBackupBtn')).not.toBeNull();

      // Verify websocket submenu
      expect(document.getElementById('websocketSubmenu')).not.toBeNull();
      expect(document.getElementById('toggleWebSocketBtn')).not.toBeNull();
      expect(document.getElementById('copyWebSocketLinkBtn')).not.toBeNull();
    });

    it('should toggle settings submenu on button click', async () => {
      await initUserMenu();

      const settingsMenuBtn = document.getElementById('settingsMenuBtn')!;
      const settingsSubmenu = document.getElementById('settingsSubmenu')!;

      expect(settingsSubmenu.classList.contains('show')).toBe(false);
      expect(settingsMenuBtn.classList.contains('expanded')).toBe(false);

      settingsMenuBtn.click();
      expect(settingsSubmenu.classList.contains('show')).toBe(true);
      expect(settingsMenuBtn.classList.contains('expanded')).toBe(true);

      settingsMenuBtn.click();
      expect(settingsSubmenu.classList.contains('show')).toBe(false);
      expect(settingsMenuBtn.classList.contains('expanded')).toBe(false);
    });

    it('should toggle websocket submenu on button click', async () => {
      await initUserMenu();

      const websocketMenuBtn = document.getElementById('websocketMenuBtn')!;
      const websocketSubmenu = document.getElementById('websocketSubmenu')!;

      expect(websocketSubmenu.classList.contains('show')).toBe(false);
      expect(websocketMenuBtn.classList.contains('expanded')).toBe(false);

      websocketMenuBtn.click();
      expect(websocketSubmenu.classList.contains('show')).toBe(true);
      expect(websocketMenuBtn.classList.contains('expanded')).toBe(true);

      websocketMenuBtn.click();
      expect(websocketSubmenu.classList.contains('show')).toBe(false);
      expect(websocketMenuBtn.classList.contains('expanded')).toBe(false);
    });

    it('should handle missing delete button', async () => {
      (userState.deleteCurrentUser as jest.MockedFunction<typeof userState.deleteCurrentUser>).mockResolvedValue(
        true
      );

      await initUserMenu();

      // deleteAccountBtn is not in the menu template, so it should be null
      expect(document.getElementById('deleteAccountBtn')).toBeNull();
    });
  });
});
