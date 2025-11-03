/**
 * Tests for shopping list UI module.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { initShoppingListUI, loadItems } from './shopping-list-ui.js';
import { shoppingListState } from '../state/shopping-list-state.js';

// Mock the modules
jest.mock('../data/dom.js');
jest.mock('../state/shopping-list-state.js');

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
    it('should load items via state', async () => {
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      await loadItems();

      expect(shoppingListState.loadItems).toHaveBeenCalled();
    });
  });

  describe('initShoppingListUI', () => {
    it('should initialize event handlers and subscribe to state', () => {
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      expect(mockInput).toBeDefined();
      expect(mockButton).toBeDefined();
      expect(mockItemsList).toBeDefined();
      expect(shoppingListState.subscribe).toHaveBeenCalled();
    });

    it('should handle add button click with valid input', async () => {
      const mockItem = { id: '123', name: 'New Item' };
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.addItem as jest.MockedFunction<typeof shoppingListState.addItem>).mockResolvedValue(mockItem);
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      mockInput.value = 'New Item';
      mockButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(shoppingListState.addItem).toHaveBeenCalledWith('New Item');
      expect(mockInput.value).toBe('');
    });

    it('should ignore add button click with empty input', async () => {
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      mockInput.value = '   ';
      mockButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(shoppingListState.addItem).not.toHaveBeenCalled();
    });

    it('should handle add button click when addItem returns null', async () => {
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.addItem as jest.MockedFunction<typeof shoppingListState.addItem>).mockResolvedValue(null);
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      mockInput.value = 'Failed Item';
      mockButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(shoppingListState.addItem).toHaveBeenCalledWith('Failed Item');
      expect(mockInput.value).toBe('Failed Item'); // Not cleared on failure
    });

    it('should handle Enter key press', async () => {
      const mockItem = { id: '123', name: 'New Item' };
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.addItem as jest.MockedFunction<typeof shoppingListState.addItem>).mockResolvedValue(mockItem);
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      mockInput.value = 'New Item';
      const event = new KeyboardEvent('keyup', { key: 'Enter' });
      mockInput.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(shoppingListState.addItem).toHaveBeenCalledWith('New Item');
    });

    it('should handle delete button click via event delegation', async () => {
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.deleteItem as jest.MockedFunction<typeof shoppingListState.deleteItem>).mockResolvedValue(true);
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      // Create a mock delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'removeBtn';
      deleteButton.dataset.itemId = '123';
      mockItemsList.appendChild(deleteButton);

      deleteButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(shoppingListState.deleteItem).toHaveBeenCalledWith('123');
    });

    it('should disable button during deletion', async () => {
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.deleteItem as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 50))
      );
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      // Create a mock delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'removeBtn';
      deleteButton.dataset.itemId = '123';
      mockItemsList.appendChild(deleteButton);

      deleteButton.click();

      // Button should be disabled immediately
      expect(deleteButton.hasAttribute('disabled')).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should re-enable button if deletion fails', async () => {
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.deleteItem as jest.MockedFunction<typeof shoppingListState.deleteItem>).mockResolvedValue(false);
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      // Create a mock delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'removeBtn';
      deleteButton.dataset.itemId = '123';
      mockItemsList.appendChild(deleteButton);

      deleteButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(deleteButton.hasAttribute('disabled')).toBe(false);
    });

    it('should prevent multiple rapid clicks on delete button', async () => {
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.deleteItem as jest.MockedFunction<typeof shoppingListState.deleteItem>).mockResolvedValue(true);
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      // Create a mock delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'removeBtn';
      deleteButton.dataset.itemId = '123';
      mockItemsList.appendChild(deleteButton);

      deleteButton.click();
      deleteButton.setAttribute('disabled', 'true');
      deleteButton.click(); // Second click while disabled

      await new Promise(resolve => setTimeout(resolve, 0));

      // Should only be called once
      expect(shoppingListState.deleteItem).toHaveBeenCalledTimes(1);
    });

    it('should log error when required elements not found', () => {
      document.body.innerHTML = '<div></div>';

      initShoppingListUI();

      expect(console.error).toHaveBeenCalledWith('Required shopping list elements not found');
    });
  });
});
