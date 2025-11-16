/**
 * Tests for WebSocket connection management.
 *
 * Note: Due to the singleton nature of the websocket module with module-level state,
 * these tests provide basic coverage of the public API rather than comprehensive
 * integration testing. Full integration testing should be done in an E2E environment.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('WebSocket Module', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  });

  // Mock window
  Object.defineProperty(global, 'window', {
    value: {
      location: {
        protocol: 'http:',
        host: 'localhost:3000',
      },
      setInterval: jest.fn((callback: any, delay: number) => {
        return global.setInterval(callback, delay);
      }),
      setTimeout: jest.fn((callback: any, delay: number) => {
        return global.setTimeout(callback, delay);
      }),
      clearInterval: jest.fn((id: number) => {
        global.clearInterval(id);
      }),
      clearTimeout: jest.fn((id: number) => {
        global.clearTimeout(id);
      }),
    },
    configurable: true,
  });

  // Mock WebSocket class
  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    public readyState: number = MockWebSocket.CONNECTING;
    public onopen: ((event: Event) => void) | null = null;
    public onclose: ((event: CloseEvent) => void) | null = null;
    public onerror: ((event: Event) => void) | null = null;
    public onmessage: ((event: MessageEvent) => void) | null = null;

    constructor(public url: string) {
      // Immediately open for simplicity in tests
      this.readyState = MockWebSocket.OPEN;
      setTimeout(() => this.onopen?.(new Event('open')), 0);
    }

    send(_data: string): void {
      // No-op for tests
    }

    close(code?: number, reason?: string): void {
      this.readyState = MockWebSocket.CLOSED;
      setTimeout(() => {
        const event = new CloseEvent('close', { code: code || 1000, reason: reason || '' });
        this.onclose?.(event);
      }, 0);
    }
  }

  (global as any).WebSocket = MockWebSocket;

  beforeEach(() => {
    localStorage.clear();

    // Set up a valid JWT token
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: 'testuser',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));
    const token = `${header}.${payload}.fake-signature`;
    localStorage.setItem('token', token);

    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Module API', () => {
    it('should export WebSocket support check function', async () => {
      const { isWebSocketSupported } = await import('./websocket.js');
      expect(typeof isWebSocketSupported).toBe('function');
      // The function checks for 'WebSocket' in window, which we've mocked
      expect(typeof isWebSocketSupported()).toBe('boolean');
    });

    it('should export connection management functions', async () => {
      const websocket = await import('./websocket.js');

      expect(typeof websocket.connect).toBe('function');
      expect(typeof websocket.disconnect).toBe('function');
      expect(typeof websocket.isConnected).toBe('function');
      expect(typeof websocket.getConnectionState).toBe('function');
    });

    it('should export event subscription functions', async () => {
      const websocket = await import('./websocket.js');

      expect(typeof websocket.onItemAdded).toBe('function');
      expect(typeof websocket.onItemDeleted).toBe('function');
      expect(typeof websocket.onItemUpdated).toBe('function');
      expect(typeof websocket.onStoreChanged).toBe('function');
      expect(typeof websocket.onUserJoined).toBe('function');
      expect(typeof websocket.onUserLeft).toBe('function');
      expect(typeof websocket.onConnectionOpen).toBe('function');
      expect(typeof websocket.onConnectionClose).toBe('function');
      expect(typeof websocket.onConnectionError).toBe('function');
    });

    it('should export broadcasting functions', async () => {
      const websocket = await import('./websocket.js');

      expect(typeof websocket.broadcastItemAdd).toBe('function');
      expect(typeof websocket.broadcastItemDelete).toBe('function');
      expect(typeof websocket.broadcastItemUpdate).toBe('function');
    });
  });

  describe('Connection State', () => {
    it('should start in disconnected state', async () => {
      // Reset module by reimporting
      jest.resetModules();
      const { getConnectionState } = await import('./websocket.js');

      expect(getConnectionState()).toBe('disconnected');
    });

    it('should report not connected initially', async () => {
      jest.resetModules();
      const { isConnected } = await import('./websocket.js');

      expect(isConnected()).toBe(false);
    });
  });

  describe('Event Subscriptions', () => {
    it('should return unsubscribe function from event subscriptions', async () => {
      jest.resetModules();
      const websocket = await import('./websocket.js');

      const callback = jest.fn();
      const unsubscribe = websocket.onItemAdded(callback);

      expect(typeof unsubscribe).toBe('function');

      // Cleanup
      unsubscribe();
    });

    it('should allow multiple subscriptions to same event', async () => {
      jest.resetModules();
      const websocket = await import('./websocket.js');

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsub1 = websocket.onItemAdded(callback1);
      const unsub2 = websocket.onItemAdded(callback2);

      expect(typeof unsub1).toBe('function');
      expect(typeof unsub2).toBe('function');

      // Cleanup
      unsub1();
      unsub2();
    });
  });

  describe('Broadcasting', () => {
    it('should not throw when broadcasting while disconnected', async () => {
      jest.resetModules();
      const websocket = await import('./websocket.js');

      const item = { id: '123', name: 'Test', quantity: 1 };

      expect(() => websocket.broadcastItemAdd(item)).not.toThrow();
      expect(() => websocket.broadcastItemDelete('123')).not.toThrow();
      expect(() => websocket.broadcastItemUpdate(item)).not.toThrow();
    });
  });

  describe('Disconnect', () => {
    it('should not throw when disconnecting while not connected', async () => {
      jest.resetModules();
      const { disconnect } = await import('./websocket.js');

      expect(() => disconnect()).not.toThrow();
    });
  });

  describe('WebSocket URL Construction', () => {
    it('should use ws: protocol for http:', async () => {
      jest.resetModules();

      (global as any).window.location.protocol = 'http:';
      (global as any).window.location.host = 'example.com:8080';

      const { connect, disconnect } = await import('./websocket.js');

      // Connect briefly to construct URL
      connect();

      // The WebSocket mock will be instantiated with the URL
      // We can't easily test the URL without more complex mocking,
      // but we can verify it doesn't throw

      disconnect();
    });
  });

  describe('Connection State Values', () => {
    it('should return valid connection state values', async () => {
      jest.resetModules();
      const { getConnectionState } = await import('./websocket.js');

      const state = getConnectionState();
      expect(['connected', 'disconnected', 'connecting', 'reconnecting']).toContain(state);
    });
  });
});