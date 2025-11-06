/**
 * Tests for script-products.ts products page entry point.
 */

import * as domModule from './data/dom.js';
import * as authModule from './data/auth.js';
import * as productAdminModule from './ui/product-admin.js';
import * as userMenuModule from './ui/user-menu.js';

// Mock all dependencies
jest.mock('./data/dom.js', () => ({
  loadAppTemplate: jest.fn(),
}));

jest.mock('./data/auth.js', () => ({
  isAuthenticated: jest.fn(),
}));

jest.mock('./ui/product-admin.js', () => ({
  initProductAdmin: jest.fn(),
}));

jest.mock('./ui/user-menu.js', () => ({
  initUserMenu: jest.fn(),
  updateUserDisplay: jest.fn(),
}));

describe('script-products.ts products page entry point', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let mockIsAuthenticated: jest.MockedFunction<typeof authModule.isAuthenticated>;
  let mockLoadAppTemplate: jest.MockedFunction<typeof domModule.loadAppTemplate>;
  let mockInitProductAdmin: jest.MockedFunction<typeof productAdminModule.initProductAdmin>;
  let mockInitUserMenu: jest.MockedFunction<typeof userMenuModule.initUserMenu>;
  let mockUpdateUserDisplay: jest.MockedFunction<typeof userMenuModule.updateUserDisplay>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Get mocked functions
    mockIsAuthenticated = authModule.isAuthenticated as jest.MockedFunction<typeof authModule.isAuthenticated>;
    mockLoadAppTemplate = domModule.loadAppTemplate as jest.MockedFunction<typeof domModule.loadAppTemplate>;
    mockInitProductAdmin = productAdminModule.initProductAdmin as jest.MockedFunction<typeof productAdminModule.initProductAdmin>;
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
    // Restore spies
    addEventListenerSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should register DOMContentLoaded event listener', () => {
    // Re-import to trigger the module code
    jest.isolateModules(() => {
      require('./script-products.js');
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
      require('./script-products.js');
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
    expect(mockInitProductAdmin).not.toHaveBeenCalled();
    expect(mockInitUserMenu).not.toHaveBeenCalled();
  });

  it('should initialize products page when authenticated and template loads successfully', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockLoadAppTemplate.mockResolvedValue(true);
    mockUpdateUserDisplay.mockResolvedValue();
    mockInitProductAdmin.mockResolvedValue();

    let domContentLoadedCallback: any = null;

    // Capture the callback
    addEventListenerSpy.mockImplementation((event: string, callback: any) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback;
      }
    });

    // Re-import to register the listener
    jest.isolateModules(() => {
      require('./script-products.js');
    });

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      await domContentLoadedCallback();
    }

    // Verify initialization sequence
    expect(mockIsAuthenticated).toHaveBeenCalledTimes(1);
    expect(mockLoadAppTemplate).toHaveBeenCalledWith('products.html');
    expect(mockUpdateUserDisplay).toHaveBeenCalledTimes(1);
    expect(mockInitUserMenu).toHaveBeenCalledTimes(1);
    expect(mockInitProductAdmin).toHaveBeenCalledTimes(1);

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
      require('./script-products.js');
    });

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      await domContentLoadedCallback();
    }

    // Verify authentication and template loading were attempted
    expect(mockIsAuthenticated).toHaveBeenCalledTimes(1);
    expect(mockLoadAppTemplate).toHaveBeenCalledWith('products.html');

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load products template');

    // Verify no further initialization happened
    expect(mockUpdateUserDisplay).not.toHaveBeenCalled();
    expect(mockInitProductAdmin).not.toHaveBeenCalled();
    expect(mockInitUserMenu).not.toHaveBeenCalled();
  });

  it('should initialize UI modules after updating user display', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockLoadAppTemplate.mockResolvedValue(true);

    const callOrder: string[] = [];
    mockUpdateUserDisplay.mockImplementation(async () => {
      callOrder.push('updateUserDisplay');
    });
    mockInitUserMenu.mockImplementation(() => {
      callOrder.push('initUserMenu');
    });
    mockInitProductAdmin.mockImplementation(async () => {
      callOrder.push('initProductAdmin');
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
      require('./script-products.js');
    });

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      await domContentLoadedCallback();
    }

    // Verify correct call order
    expect(callOrder).toEqual([
      'updateUserDisplay',
      'initUserMenu',
      'initProductAdmin'
    ]);
  });

  it('should only register one DOMContentLoaded listener', () => {
    // Re-import to trigger the module code
    jest.isolateModules(() => {
      require('./script-products.js');
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
      require('./script-products.js');
    });

    // Verify no initialization functions were called yet
    expect(mockIsAuthenticated).not.toHaveBeenCalled();
    expect(mockLoadAppTemplate).not.toHaveBeenCalled();
    expect(mockUpdateUserDisplay).not.toHaveBeenCalled();
    expect(mockInitProductAdmin).not.toHaveBeenCalled();
    expect(mockInitUserMenu).not.toHaveBeenCalled();
  });

  it('should load products.html template specifically', async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockLoadAppTemplate.mockResolvedValue(true);
    mockUpdateUserDisplay.mockResolvedValue();
    mockInitProductAdmin.mockResolvedValue();

    let domContentLoadedCallback: any = null;

    // Capture the callback
    addEventListenerSpy.mockImplementation((event: string, callback: any) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback;
      }
    });

    // Re-import to register the listener
    jest.isolateModules(() => {
      require('./script-products.js');
    });

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      await domContentLoadedCallback();
    }

    // Verify the correct template was requested
    expect(mockLoadAppTemplate).toHaveBeenCalledWith('products.html');
    expect(mockLoadAppTemplate).not.toHaveBeenCalledWith('app.html');
    expect(mockLoadAppTemplate).not.toHaveBeenCalledWith('stores.html');
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
      require('./script-products.js');
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
