/**
 * Tests for DOM manipulation functions.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderItems, createItemElement, loadTemplate, loadAppTemplate, clearTemplateCache } from './dom';
import { Item } from './api';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('DOM Utilities', () => {
  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <div id="app">
        <ul id="items"></ul>
      </div>
    `;
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    clearTemplateCache(); // Reset template cache between tests
  });

  describe('renderItems', () => {
    it('should render empty state when list is empty', () => {
      renderItems([]);

      const ul = document.getElementById('items');
      expect(ul?.children.length).toBe(1);
      expect(ul?.children[0].className).toBe('muted');
      expect(ul?.children[0].textContent).toBe('Keine Artikel');
    });

    it('should render multiple items', () => {
      const items: Item[] = [
        { id: '1', name: 'Milk' },
        { id: '2', name: 'Bread' },
        { id: '3', name: 'Eggs' },
      ];

      renderItems(items);

      const ul = document.getElementById('items');
      expect(ul?.children.length).toBe(3);

      const firstItem = ul?.children[0];
      expect(firstItem?.querySelector('span')?.textContent).toBe('Milk');
      expect(firstItem?.querySelector('button')?.textContent).toBe('Entfernen');
    });

    it('should clear previous items before rendering', () => {
      const items1: Item[] = [{ id: '1', name: 'Milk' }];
      const items2: Item[] = [{ id: '2', name: 'Bread' }];

      renderItems(items1);
      const ul = document.getElementById('items');
      expect(ul?.children.length).toBe(1);

      renderItems(items2);
      expect(ul?.children.length).toBe(1);
      expect(ul?.querySelector('span')?.textContent).toBe('Bread');
    });

    it('should log error when items element not found', () => {
      document.body.innerHTML = '<div></div>';

      renderItems([{ id: '1', name: 'Milk' }]);

      expect(console.error).toHaveBeenCalledWith(
        'Items list element not found'
      );
    });

    it('should batch DOM updates using DocumentFragment', () => {
      const items: Item[] = [
        { id: '1', name: 'Milk' },
        { id: '2', name: 'Bread' },
        { id: '3', name: 'Eggs' },
      ];

      const ul = document.getElementById('items');
      const appendChildSpy = jest.spyOn(ul!, 'appendChild');

      renderItems(items);

      // Should call appendChild once for the fragment (batched)
      // Plus the innerHTML clear doesn't count as appendChild
      expect(appendChildSpy).toHaveBeenCalledTimes(1);

      // Verify all items are rendered
      expect(ul?.children.length).toBe(3);

      appendChildSpy.mockRestore();
    });
  });

  describe('createItemElement', () => {
    it('should create list item with correct structure', () => {
      const item: Item = { id: '123', name: 'Test Item' };
      const li = createItemElement(item);

      expect(li.tagName).toBe('LI');

      const span = li.querySelector('span');
      expect(span?.textContent).toBe('Test Item');

      const button = li.querySelector('button');
      expect(button?.className).toBe('removeBtn');
      expect(button?.textContent).toBe('Entfernen');
      expect(button?.dataset.itemId).toBe('123');
    });

    it('should create button with data-item-id for event delegation', () => {
      const item: Item = { id: '456', name: 'Test Item' };
      const li = createItemElement(item);
      const button = li.querySelector('button') as HTMLButtonElement;

      // Button should have data attribute for event delegation
      expect(button.dataset.itemId).toBe('456');
      // Button should have the correct class for event delegation
      expect(button.classList.contains('removeBtn')).toBe(true);
    });

    it('should not attach individual click handlers to button', () => {
      const item: Item = { id: '789', name: 'Test Item' };
      const li = createItemElement(item);
      const button = li.querySelector('button') as HTMLButtonElement;

      // Clicking the button should not cause any errors
      // Event handling is done via delegation on the parent container
      expect(() => button.click()).not.toThrow();
    });
  });

  describe('loadTemplate', () => {
    it('should load template successfully and inject into DOM', async () => {
      const mockHtml = '<div><h1>Test Template</h1></div>';
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      } as Response);

      const result = await loadTemplate('test-template.html');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('test-template.html');
      expect(document.getElementById('app')?.innerHTML).toBe(mockHtml);
    });

    it('should cache template and not fetch again on second call', async () => {
      const mockHtml = '<div>Cached Template</div>';
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      } as Response);

      // First call - should fetch
      const result1 = await loadTemplate('cached-template.html');
      expect(result1).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call - should return immediately without fetching
      const result2 = await loadTemplate('cached-template.html');
      expect(result2).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should return false when fetch fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      const result = await loadTemplate('missing-template.html');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load template:',
        'Not Found'
      );
    });

    it('should return false when app container not found', async () => {
      document.body.innerHTML = '<div></div>'; // No #app element

      const result = await loadTemplate('test-template.html');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('App container not found');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await loadTemplate('test-template.html');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading template:',
        expect.any(Error)
      );
    });
  });

  describe('loadAppTemplate', () => {
    it('should load app template from correct path', async () => {
      const mockHtml = '<div>App Template</div>';
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      } as Response);

      const result = await loadAppTemplate();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('src/pages/app.html');
    });
  });
});
