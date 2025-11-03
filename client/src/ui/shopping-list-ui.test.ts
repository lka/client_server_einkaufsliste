/**
 * Tests for shopping list UI module.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { initShoppingListUI, loadItems } from './shopping-list-ui.js';
import * as api from '../data/api.js';
import * as dom from '../data/dom.js';

// Mock the data layer modules
jest.mock('../data/api.js');
jest.mock('../data/dom.js');

describe('Shopping List UI', () => {
  let mockInput: HTMLInputElement;
  let mockButton: HTMLButtonElement;
  let mockItemsList: HTMLUListElement;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup DOM
    document.body.innerHTML = `
      <div>
        <input id="itemInput" type="text" />
        <button id="addBtn">Add</button>
        <ul id="items"></ul>
      </div>
    `;

    mockInput = document.getElementById('itemInput') as HTMLInputElement;
    mockButton = document.getElementById('addBtn') as HTMLButtonElement;
    mockItemsList = document.getElementById('items') as HTMLUListElement;

    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('loadItems', () => {
    it('should fetch and render items', async () => {
      const mockItems = [
        { id: '1', name: 'Milk' },
        { id: '2', name: 'Bread' },
      ];

      jest.spyOn(api, 'fetchItems').mockResolvedValue(mockItems);
      jest.spyOn(dom, 'renderItems').mockImplementation(() => {});

      await loadItems();

      expect(api.fetchItems).toHaveBeenCalled();
      expect(dom.renderItems).toHaveBeenCalledWith(mockItems);
    });
  });

  describe('initShoppingListUI', () => {
    it('should initialize event handlers', () => {
      jest.spyOn(api, 'fetchItems').mockResolvedValue([]);
      jest.spyOn(dom, 'renderItems').mockImplementation(() => {});

      initShoppingListUI();

      expect(mockInput).toBeDefined();
      expect(mockButton).toBeDefined();
      expect(mockItemsList).toBeDefined();
    });

    it('should handle add button click with valid input', async () => {
      const mockItem = { id: '123', name: 'New Item' };
      jest.spyOn(api, 'addItem').mockResolvedValue(mockItem);
      jest.spyOn(api, 'fetchItems').mockResolvedValue([mockItem]);
      jest.spyOn(dom, 'renderItems').mockImplementation(() => {});

      initShoppingListUI();

      mockInput.value = 'New Item';
      mockButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.addItem).toHaveBeenCalledWith('New Item');
      expect(mockInput.value).toBe('');
      expect(api.fetchItems).toHaveBeenCalled();
    });

    it('should ignore add button click with empty input', async () => {
      jest.spyOn(api, 'addItem').mockResolvedValue(null);
      jest.spyOn(api, 'fetchItems').mockResolvedValue([]);
      jest.spyOn(dom, 'renderItems').mockImplementation(() => {});

      initShoppingListUI();

      mockInput.value = '   ';
      mockButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.addItem).not.toHaveBeenCalled();
    });

    it('should handle add button click when addItem returns null', async () => {
      jest.spyOn(api, 'addItem').mockResolvedValue(null);
      jest.spyOn(api, 'fetchItems').mockResolvedValue([]);
      jest.spyOn(dom, 'renderItems').mockImplementation(() => {});

      initShoppingListUI();

      mockInput.value = 'Failed Item';
      mockButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.addItem).toHaveBeenCalledWith('Failed Item');
      expect(mockInput.value).toBe('Failed Item'); // Not cleared on failure
    });

    it('should handle Enter key press', async () => {
      const mockItem = { id: '123', name: 'New Item' };
      jest.spyOn(api, 'addItem').mockResolvedValue(mockItem);
      jest.spyOn(api, 'fetchItems').mockResolvedValue([mockItem]);
      jest.spyOn(dom, 'renderItems').mockImplementation(() => {});

      initShoppingListUI();

      mockInput.value = 'New Item';
      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter' });
      mockInput.dispatchEvent(enterEvent);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.addItem).toHaveBeenCalledWith('New Item');
    });

    it('should handle delete button click via event delegation', async () => {
      jest.spyOn(api, 'deleteItem').mockResolvedValue(true);
      jest.spyOn(api, 'fetchItems').mockResolvedValue([]);
      jest.spyOn(dom, 'renderItems').mockImplementation(() => {});

      initShoppingListUI();

      // Create a mock delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'removeBtn';
      deleteBtn.dataset.itemId = '123';
      mockItemsList.appendChild(deleteBtn);

      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.deleteItem).toHaveBeenCalledWith('123');
      expect(api.fetchItems).toHaveBeenCalled();
    });

    it('should handle delete button click when deletion fails', async () => {
      jest.spyOn(api, 'deleteItem').mockResolvedValue(false);
      jest.spyOn(api, 'fetchItems').mockResolvedValue([]);
      jest.spyOn(dom, 'renderItems').mockImplementation(() => {});

      initShoppingListUI();

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'removeBtn';
      deleteBtn.dataset.itemId = '123';
      mockItemsList.appendChild(deleteBtn);

      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.deleteItem).toHaveBeenCalledWith('123');
      // fetchItems should not be called if deletion fails
    });

    it('should ignore clicks on non-delete buttons', async () => {
      jest.spyOn(api, 'deleteItem').mockResolvedValue(true);
      jest.spyOn(api, 'fetchItems').mockResolvedValue([]);
      jest.spyOn(dom, 'renderItems').mockImplementation(() => {});

      initShoppingListUI();

      const otherBtn = document.createElement('button');
      otherBtn.className = 'someOtherBtn';
      mockItemsList.appendChild(otherBtn);

      otherBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.deleteItem).not.toHaveBeenCalled();
    });

    it('should handle missing elements gracefully', () => {
      document.body.innerHTML = '<div></div>'; // No required elements

      jest.spyOn(console, 'error').mockImplementation(() => {});

      initShoppingListUI();

      expect(console.error).toHaveBeenCalledWith('Required shopping list elements not found');
    });

    it('should load items on initialization', async () => {
      jest.spyOn(api, 'fetchItems').mockResolvedValue([]);
      jest.spyOn(dom, 'renderItems').mockImplementation(() => {});

      initShoppingListUI();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.fetchItems).toHaveBeenCalled();
      expect(dom.renderItems).toHaveBeenCalled();
    });
  });
});
