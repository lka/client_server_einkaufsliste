/**
 * Tests for script-stores.ts store admin page entry point.
 */

import * as domModule from './data/dom.js';
import * as authModule from './data/auth.js';
import * as storeAdminModule from './ui/store-admin.js';
import * as userMenuModule from './ui/user-menu.js';
import * as websocketConnectionModule from './data/websocket/connection.js';

// Mock all dependencies
jest.mock('./data/dom.js', () => ({
  loadAppTemplate: jest.fn(),
}));

jest.mock('./data/auth.js', () => ({
  isAuthenticated: jest.fn(),
  getToken: jest.fn(() => 'mock-token'),
  getTokenExpiresIn: jest.fn(() => 1800), // 30 minutes in seconds
}));

jest.mock('./ui/store-admin.js', () => ({
  initStoreAdmin: jest.fn(),
}));

jest.mock('./ui/user-menu.js', () => ({
  initUserMenu: jest.fn(),
  updateUserDisplay: jest.fn(),
}));

jest.mock('./data/inactivity-tracker.js', () => ({
  initInactivityTracker: jest.fn(),
}));

describe('script-stores.ts store admin entry point', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let mockIsAuthenticated: jest.MockedFunction<typeof authModule.isAuthenticated>;
  let mockLoadAppTemplate: jest.MockedFunction<typeof domModule.loadAppTemplate>;
  let mockInitStoreAdmin: jest.MockedFunction<typeof storeAdminModule.initStoreAdmin>;
  let mockInitUserMenu: jest.MockedFunction<typeof userMenuModule.initUserMenu>;
  let mockUpdateUserDisplay: jest.MockedFunction<typeof userMenuModule.updateUserDisplay>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Use fake timers to prevent timer leaks
    jest.useFakeTimers();

    // Clear all mocks
    jest.clearAllMocks();

    // Get mocked functions
    mockIsAuthenticated = authModule.isAuthenticated as jest.MockedFunction<typeof authModule.isAuthenticated>;
    mockLoadAppTemplate = domModule.loadAppTemplate as jest.MockedFunction<typeof domModule.loadAppTemplate>;
    mockInitStoreAdmin = storeAdminModule.initStoreAdmin as jest.MockedFunction<typeof storeAdminModule.initStoreAdmin>;
    mockInitUserMenu = userMenuModule.initUserMenu as jest.MockedFunction<typeof userMenuModule.initUserMenu>;
    mockUpdateUserDisplay = userMenuModule.updateUserDisplay as jest.MockedFunction<typeof userMenuModule.updateUserDisplay>;

    // Spy on window.addEventListener
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    // Spy on console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  afterEach(() => {
    // Clean up WebSocket connections and timers
    websocketConnectionModule.disconnect();

    // Clear all timers
    jest.clearAllTimers();
    jest.useRealTimers();

    // Restore spies
    addEventListenerSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should register DOMContentLoaded event listener', () => {
    // Re-import to trigger the module code
    jest.isolateModules(() => {
      require('./script-stores.js');
    });

    // Verify addEventListener was called with DOMContentLoaded
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'DOMContentLoaded',
      expect.any(Function)
    );
  });

  it('should redirect to login if not authenticated', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    let domContentLoadedCallback: any = null;

    // Capture the callback
    addEventListenerSpy.mockImplementation((event: string, callback: any) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback;
      }
    });

    // Re-import to register the listener
    jest.isolateModules(() => {
      require('./script-stores.js');
    });

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      await domContentLoadedCallback();
    }

    // Verify redirect to login
    expect(window.location.href).toBe('/');

    // Verify no initialization happened
    expect(mockLoadAppTemplate).not.toHaveBeenCalled();
    expect(mockUpdateUserDisplay).not.toHaveBeenCalled();
    expect(mockInitStoreAdmin).not.toHaveBeenCalled();
    expect(mockInitUserMenu).not.toHaveBeenCalled();
  });

  it('should initialize store admin page when authenticated and template loads successfully', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockLoadAppTemplate.mockResolvedValue(true);
    mockUpdateUserDisplay.mockResolvedValue();

    let domContentLoadedCallback: any = null;

    // Capture the callback
    addEventListenerSpy.mockImplementation((event: string, callback: any) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback;
      }
    });

    // Re-import to register the listener
    jest.isolateModules(() => {
      require('./script-stores.js');
    });

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      await domContentLoadedCallback();
    }

    // Verify initialization sequence
    expect(mockIsAuthenticated).toHaveBeenCalledTimes(1);
    expect(mockLoadAppTemplate).toHaveBeenCalledWith('stores.html');
    expect(mockUpdateUserDisplay).toHaveBeenCalledTimes(1);
    expect(mockInitStoreAdmin).toHaveBeenCalledTimes(1);
    expect(mockInitUserMenu).toHaveBeenCalledTimes(1);

    // Verify no redirect
    expect(window.location.href).toBe('');

    // Verify no error logged
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should log error and not initialize if template fails to load', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockLoadAppTemplate.mockResolvedValue(false);

    let domContentLoadedCallback: any = null;

    // Capture the callback
    addEventListenerSpy.mockImplementation((event: string, callback: any) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback;
      }
    });

    // Re-import to register the listener
    jest.isolateModules(() => {
      require('./script-stores.js');
    });

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      await domContentLoadedCallback();
    }

    // Verify authentication and template loading were attempted
    expect(mockIsAuthenticated).toHaveBeenCalledTimes(1);
    expect(mockLoadAppTemplate).toHaveBeenCalledWith('stores.html');

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize store admin page');

    // Verify no further initialization happened
    expect(mockUpdateUserDisplay).not.toHaveBeenCalled();
    expect(mockInitStoreAdmin).not.toHaveBeenCalled();
    expect(mockInitUserMenu).not.toHaveBeenCalled();
  });

  it('should initialize UI modules after updating user display', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockLoadAppTemplate.mockResolvedValue(true);

    const callOrder: string[] = [];
    mockUpdateUserDisplay.mockImplementation(async () => {
      callOrder.push('updateUserDisplay');
    });
    mockInitStoreAdmin.mockImplementation(() => {
      callOrder.push('initStoreAdmin');
    });
    mockInitUserMenu.mockImplementation(async () => {
      callOrder.push('initUserMenu');
    });

    let domContentLoadedCallback: any = null;

    // Capture the callback
    addEventListenerSpy.mockImplementation((event: string, callback: any) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback;
      }
    });

    // Re-import to register the listener
    jest.isolateModules(() => {
      require('./script-stores.js');
    });

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      await domContentLoadedCallback();
    }

    // Verify correct call order
    expect(callOrder).toEqual([
      'updateUserDisplay',
      'initStoreAdmin',
      'initUserMenu'
    ]);
  });

  it('should only register one DOMContentLoaded listener', () => {
    // Re-import to trigger the module code
    jest.isolateModules(() => {
      require('./script-stores.js');
    });

    // Count how many times DOMContentLoaded listener was added
    const domContentLoadedCalls = addEventListenerSpy.mock.calls.filter(
      (call) => call[0] === 'DOMContentLoaded'
    );

    expect(domContentLoadedCalls).toHaveLength(1);
  });

  it('should not initialize before DOMContentLoaded event', () => {
    // Re-import to trigger the module code
    jest.isolateModules(() => {
      require('./script-stores.js');
    });

    // Verify no initialization functions were called yet
    expect(mockIsAuthenticated).not.toHaveBeenCalled();
    expect(mockLoadAppTemplate).not.toHaveBeenCalled();
    expect(mockUpdateUserDisplay).not.toHaveBeenCalled();
    expect(mockInitStoreAdmin).not.toHaveBeenCalled();
    expect(mockInitUserMenu).not.toHaveBeenCalled();
  });

  it('should load stores.html template specifically', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockLoadAppTemplate.mockResolvedValue(true);
    mockUpdateUserDisplay.mockResolvedValue();

    let domContentLoadedCallback: any = null;

    // Capture the callback
    addEventListenerSpy.mockImplementation((event: string, callback: any) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback;
      }
    });

    // Re-import to register the listener
    jest.isolateModules(() => {
      require('./script-stores.js');
    });

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      await domContentLoadedCallback();
    }

    // Verify the correct template was requested
    expect(mockLoadAppTemplate).toHaveBeenCalledWith('stores.html');
    expect(mockLoadAppTemplate).not.toHaveBeenCalledWith('app.html');
  });

  it('should check authentication before loading template', async () => {
    mockIsAuthenticated.mockReturnValue(false);

    let domContentLoadedCallback: any = null;

    // Capture the callback
    addEventListenerSpy.mockImplementation((event: string, callback: any) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback;
      }
    });

    // Re-import to register the listener
    jest.isolateModules(() => {
      require('./script-stores.js');
    });

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      await domContentLoadedCallback();
    }

    // Verify authentication was checked first
    expect(mockIsAuthenticated).toHaveBeenCalledTimes(1);

    // Verify template loading was never attempted
    expect(mockLoadAppTemplate).not.toHaveBeenCalled();
  });
});
