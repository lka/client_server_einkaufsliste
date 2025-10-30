/**
 * Tests for DOM manipulation functions.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderItems, createItemElement } from './dom';
import { Item } from './api';

describe('DOM Utilities', () => {
  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <div id="app">
        <ul id="items"></ul>
      </div>
    `;
    jest.spyOn(console, 'error').mockImplementation(() => {});
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

    it('should call onDelete callback when delete button is clicked', () => {
      const item: Item = { id: '456', name: 'Test Item' };
      const onDelete = jest.fn();

      const li = createItemElement(item, onDelete);
      const button = li.querySelector('button') as HTMLButtonElement;

      button.click();

      expect(onDelete).toHaveBeenCalledWith('456');
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('should not error when onDelete is not provided', () => {
      const item: Item = { id: '789', name: 'Test Item' };
      const li = createItemElement(item);
      const button = li.querySelector('button') as HTMLButtonElement;

      expect(() => button.click()).not.toThrow();
    });
  });
});
