/**
 * Tests for script-users.ts
 *
 * Note: script-users.ts registers a DOMContentLoaded event listener on module load.
 * These tests verify the behavior of that event handler.
 */

// Mock all dependencies BEFORE importing the module
jest.mock('./data/dom.js');
jest.mock('./data/auth.js');
jest.mock('./ui/user-admin.js');
jest.mock('./ui/user-menu.js');

import * as dom from './data/dom.js';
import * as auth from './data/auth.js';
import * as userAdmin from './ui/user-admin.js';
import * as userMenu from './ui/user-menu.js';

describe('script-users.ts', () => {
  let mockLocation: { href: string };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock location
    mockLocation = {
      href: '/',
    };

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    // Setup default mocks
    (auth.isAuthenticated as jest.Mock).mockReturnValue(true);
    (dom.loadAppTemplate as jest.Mock).mockResolvedValue(true);
    (userMenu.updateUserDisplay as jest.Mock).mockResolvedValue(undefined);
    (userAdmin.initUserAdmin as jest.Mock).mockResolvedValue(undefined);
    (userMenu.initUserMenu as jest.Mock).mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('DOMContentLoaded Event Handler', () => {
    beforeEach(async () => {
      // Dynamically import the module to trigger event listener registration
      await import('./script-users.js');
    });

    it('should redirect to home if user is not authenticated', async () => {
      (auth.isAuthenticated as jest.Mock).mockReturnValue(false);

      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(auth.isAuthenticated).toHaveBeenCalled();
      expect(window.location.href).toBe('/');
      expect(dom.loadAppTemplate).not.toHaveBeenCalled();
    });

    it('should load users template when authenticated', async () => {
      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(auth.isAuthenticated).toHaveBeenCalled();
      expect(dom.loadAppTemplate).toHaveBeenCalledWith('users.html');
    });

    it('should update user display after loading template', async () => {
      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(userMenu.updateUserDisplay).toHaveBeenCalled();
    });

    it('should initialize user admin module after loading template', async () => {
      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(userAdmin.initUserAdmin).toHaveBeenCalled();
    });

    it('should initialize user menu after loading template', async () => {
      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(userMenu.initUserMenu).toHaveBeenCalled();
    });

    it('should call functions in correct order', async () => {
      const callOrder: string[] = [];

      (auth.isAuthenticated as jest.Mock).mockImplementation(() => {
        callOrder.push('isAuthenticated');
        return true;
      });

      (dom.loadAppTemplate as jest.Mock).mockImplementation(async () => {
        callOrder.push('loadAppTemplate');
        return true;
      });

      (userMenu.updateUserDisplay as jest.Mock).mockImplementation(async () => {
        callOrder.push('updateUserDisplay');
      });

      (userAdmin.initUserAdmin as jest.Mock).mockImplementation(async () => {
        callOrder.push('initUserAdmin');
      });

      (userMenu.initUserMenu as jest.Mock).mockImplementation(() => {
        callOrder.push('initUserMenu');
      });

      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(callOrder).toEqual([
        'isAuthenticated',
        'loadAppTemplate',
        'updateUserDisplay',
        'initUserAdmin',
        'initUserMenu',
      ]);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await import('./script-users.js');
    });

    it('should log error and not initialize modules if template loading fails', async () => {
      (dom.loadAppTemplate as jest.Mock).mockResolvedValue(false);

      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(console.error).toHaveBeenCalledWith('Failed to initialize user admin page');
      expect(userAdmin.initUserAdmin).not.toHaveBeenCalled();
      expect(userMenu.initUserMenu).not.toHaveBeenCalled();
    });

    it('should not update user display if template loading fails', async () => {
      (dom.loadAppTemplate as jest.Mock).mockResolvedValue(false);

      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(userMenu.updateUserDisplay).not.toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    beforeEach(async () => {
      await import('./script-users.js');
    });

    it('should successfully initialize page with all dependencies', async () => {
      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify complete initialization
      expect(auth.isAuthenticated).toHaveBeenCalled();
      expect(dom.loadAppTemplate).toHaveBeenCalledWith('users.html');
      expect(userMenu.updateUserDisplay).toHaveBeenCalled();
      expect(userAdmin.initUserAdmin).toHaveBeenCalled();
      expect(userMenu.initUserMenu).toHaveBeenCalled();
    });

    it('should not initialize if not authenticated', async () => {
      (auth.isAuthenticated as jest.Mock).mockReturnValue(false);

      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(dom.loadAppTemplate).not.toHaveBeenCalled();
      expect(userMenu.updateUserDisplay).not.toHaveBeenCalled();
      expect(userAdmin.initUserAdmin).not.toHaveBeenCalled();
      expect(userMenu.initUserMenu).not.toHaveBeenCalled();
      expect(window.location.href).toBe('/');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await import('./script-users.js');
    });

    it('should handle multiple DOMContentLoaded events', async () => {
      // Trigger the event multiple times
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 5));

      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 5));

      // Each event should trigger its own initialization
      expect(auth.isAuthenticated).toHaveBeenCalledTimes(2);
      expect(dom.loadAppTemplate).toHaveBeenCalledTimes(2);
    });

    it('should work when location.href is already set', async () => {
      mockLocation.href = '/users';

      // Trigger the event
      window.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(auth.isAuthenticated).toHaveBeenCalled();
      expect(dom.loadAppTemplate).toHaveBeenCalled();
    });
  });
});
