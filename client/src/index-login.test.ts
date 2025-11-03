/**
 * Tests for index-login.ts entry point.
 */

import * as loginModule from './pages/login.js';

// Mock the login module
jest.mock('./pages/login.js', () => ({
  initLoginPage: jest.fn(),
}));

describe('index-login entry point', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let mockInitLoginPage: jest.MockedFunction<typeof loginModule.initLoginPage>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Get the mocked function
    mockInitLoginPage = loginModule.initLoginPage as jest.MockedFunction<typeof loginModule.initLoginPage>;

    // Spy on window.addEventListener
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
  });

  afterEach(() => {
    // Restore spies
    addEventListenerSpy.mockRestore();
  });

  it('should register DOMContentLoaded event listener', () => {
    // Re-import to trigger the module code
    jest.isolateModules(() => {
      require('./index-login.js');
    });

    // Verify addEventListener was called with DOMContentLoaded
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'DOMContentLoaded',
      expect.any(Function)
    );
  });

  it('should call initLoginPage when DOMContentLoaded fires', () => {
    let domContentLoadedCallback: any = null;

    // Capture the callback
    addEventListenerSpy.mockImplementation((event: string, callback: any) => {
      if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = callback;
      }
    });

    // Re-import to register the listener
    jest.isolateModules(() => {
      require('./index-login.js');
    });

    // Verify the listener was registered
    expect(domContentLoadedCallback).not.toBeNull();

    // Simulate DOMContentLoaded event
    if (domContentLoadedCallback && typeof domContentLoadedCallback === 'function') {
      domContentLoadedCallback();
    }

    // Verify initLoginPage was called
    expect(mockInitLoginPage).toHaveBeenCalledTimes(1);
  });

  it('should only register one DOMContentLoaded listener', () => {
    // Re-import to trigger the module code
    jest.isolateModules(() => {
      require('./index-login.js');
    });

    // Count how many times DOMContentLoaded listener was added
    const domContentLoadedCalls = addEventListenerSpy.mock.calls.filter(
      (call) => call[0] === 'DOMContentLoaded'
    );

    expect(domContentLoadedCalls).toHaveLength(1);
  });

  it('should not call initLoginPage before DOMContentLoaded', () => {
    // Re-import to trigger the module code
    jest.isolateModules(() => {
      require('./index-login.js');
    });

    // Verify initLoginPage was not called yet
    expect(mockInitLoginPage).not.toHaveBeenCalled();
  });
});
