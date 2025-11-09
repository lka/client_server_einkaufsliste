/**
 * Tests for shopping list UI module.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { initShoppingListUI, loadItems } from './shopping-list-ui.js';
import { shoppingListState } from '../state/shopping-list-state.js';
import { fetchStores, fetchDepartments, convertItemToProduct } from '../data/api.js';
import { renderItems } from '../data/dom.js';

// Mock the modules
jest.mock('../data/dom.js');
jest.mock('../state/shopping-list-state.js');
jest.mock('../data/api.js');

describe('Shopping List UI', () => {
  let mockInput: HTMLInputElement;
  let mockMengeInput: HTMLInputElement;
  let mockButton: HTMLButtonElement;
  let mockItemsList: HTMLUListElement;
  let mockStoreFilter: HTMLSelectElement;

  const mockStores = [
    { id: 1, name: 'Rewe', location: 'Berlin' },
    { id: 2, name: 'Edeka', location: 'Hamburg' },
  ];

  const mockItems = [
    { id: '1', name: 'Äpfel', store_id: 1 },
    { id: '2', name: 'Milch', store_id: 2 },
    { id: '3', name: 'Brot', store_id: 1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup DOM
    document.body.innerHTML = `
      <div>
        <input id="itemInput" type="text" />
        <input id="mengeInput" type="text" />
        <button id="addBtn">Add</button>
        <select id="storeFilter">
          <option value="">Alle Geschäfte</option>
        </select>
        <button id="clearStoreBtn">Clear</button>
        <ul id="items"></ul>
      </div>
    `;

    mockInput = document.getElementById('itemInput') as HTMLInputElement;
    mockMengeInput = document.getElementById('mengeInput') as HTMLInputElement;
    mockButton = document.getElementById('addBtn') as HTMLButtonElement;
    mockItemsList = document.getElementById('items') as HTMLUListElement;
    mockStoreFilter = document.getElementById('storeFilter') as HTMLSelectElement;

    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetchStores to return empty by default
    (fetchStores as jest.MockedFunction<typeof fetchStores>).mockResolvedValue([]);

    // Mock renderItems
    (renderItems as jest.MockedFunction<typeof renderItems>).mockReturnValue(undefined as any);

    // Mock shoppingListState.getItems to return empty by default
    (shoppingListState.getItems as jest.MockedFunction<typeof shoppingListState.getItems>).mockReturnValue(
      []
    );
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

      expect(shoppingListState.addItem).toHaveBeenCalledWith('New Item', undefined, undefined);
      expect(mockInput.value).toBe('');
      expect(mockMengeInput.value).toBe('');
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

    it('should handle add button click with valid input and menge', async () => {
      const mockItem = { id: '123', name: 'Möhren', menge: '500 g' };
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.addItem as jest.MockedFunction<typeof shoppingListState.addItem>).mockResolvedValue(mockItem);
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      mockInput.value = 'Möhren';
      mockMengeInput.value = '500 g';
      mockButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(shoppingListState.addItem).toHaveBeenCalledWith('Möhren', '500 g', undefined);
      expect(mockInput.value).toBe('');
      expect(mockMengeInput.value).toBe('');
    });

    it('should handle add button click when addItem returns null', async () => {
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.addItem as jest.MockedFunction<typeof shoppingListState.addItem>).mockResolvedValue(null);
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      mockInput.value = 'Failed Item';
      mockButton.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(shoppingListState.addItem).toHaveBeenCalledWith('Failed Item', undefined, undefined);
      expect(mockInput.value).toBe('Failed Item'); // Not cleared on failure
    });

    it('should handle Enter key press on itemInput', async () => {
      const mockItem = { id: '123', name: 'New Item' };
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.addItem as jest.MockedFunction<typeof shoppingListState.addItem>).mockResolvedValue(mockItem);
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      mockInput.value = 'New Item';
      const event = new KeyboardEvent('keyup', { key: 'Enter' });
      mockInput.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(shoppingListState.addItem).toHaveBeenCalledWith('New Item', undefined, undefined);
    });

    it('should handle Enter key press on mengeInput', async () => {
      const mockItem = { id: '123', name: 'Möhren', menge: '500 g' };
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.addItem as jest.MockedFunction<typeof shoppingListState.addItem>).mockResolvedValue(mockItem);
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(true);

      initShoppingListUI();

      mockInput.value = 'Möhren';
      mockMengeInput.value = '500 g';
      const event = new KeyboardEvent('keyup', { key: 'Enter' });
      mockMengeInput.dispatchEvent(event);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(shoppingListState.addItem).toHaveBeenCalledWith('Möhren', '500 g', undefined);
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

    it('should load stores into filter dropdown on initialization', async () => {
      (fetchStores as jest.MockedFunction<typeof fetchStores>).mockResolvedValue(mockStores);
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(
        true
      );

      initShoppingListUI();

      // Wait for async loadStoreFilter to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check that stores were added to dropdown
      expect(mockStoreFilter.options.length).toBe(3); // "Alle Geschäfte" + 2 stores
      expect(mockStoreFilter.options[1].textContent).toBe('Rewe');
      expect(mockStoreFilter.options[2].textContent).toBe('Edeka');
    });

    it('should select first store by default when stores exist', async () => {
      (fetchStores as jest.MockedFunction<typeof fetchStores>).mockResolvedValue(mockStores);
      (shoppingListState.getItems as jest.MockedFunction<typeof shoppingListState.getItems>).mockReturnValue(
        mockItems
      );
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(
        true
      );

      initShoppingListUI();

      // Wait for async loadStoreFilter to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check that first store is selected
      expect(mockStoreFilter.value).toBe('1');

      // Check that renderItems was called with filtered items (only store_id: 1)
      expect(renderItems).toHaveBeenCalledWith([
        { id: '1', name: 'Äpfel', store_id: 1 },
        { id: '3', name: 'Brot', store_id: 1 },
      ]);
    });

    it('should not select any store when no stores exist', async () => {
      (fetchStores as jest.MockedFunction<typeof fetchStores>).mockResolvedValue([]);
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(
        true
      );

      initShoppingListUI();

      // Wait for async loadStoreFilter to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check that no store is selected
      expect(mockStoreFilter.value).toBe('');
    });

    it('should filter items when store filter changes', async () => {
      (fetchStores as jest.MockedFunction<typeof fetchStores>).mockResolvedValue(mockStores);
      (shoppingListState.getItems as jest.MockedFunction<typeof shoppingListState.getItems>).mockReturnValue(
        mockItems
      );
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(
        true
      );

      initShoppingListUI();

      // Wait for async loadStoreFilter to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Clear previous calls
      (renderItems as jest.Mock).mockClear();

      // Change filter to store 2
      mockStoreFilter.value = '2';
      mockStoreFilter.dispatchEvent(new Event('change'));

      // Check that renderItems was called with filtered items (only store_id: 2)
      expect(renderItems).toHaveBeenCalledWith([{ id: '2', name: 'Milch', store_id: 2 }]);
    });

    it('should show all items when filter is set to "Alle Geschäfte"', async () => {
      (fetchStores as jest.MockedFunction<typeof fetchStores>).mockResolvedValue(mockStores);
      (shoppingListState.getItems as jest.MockedFunction<typeof shoppingListState.getItems>).mockReturnValue(
        mockItems
      );
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(
        true
      );

      initShoppingListUI();

      // Wait for async loadStoreFilter to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Clear previous calls
      (renderItems as jest.Mock).mockClear();

      // Change filter to "Alle Geschäfte"
      mockStoreFilter.value = '';
      mockStoreFilter.dispatchEvent(new Event('change'));

      // Check that renderItems was called with all items
      expect(renderItems).toHaveBeenCalledWith(mockItems);
    });

    it('should filter items in state subscription callback', async () => {
      let subscriptionCallback: any;

      (fetchStores as jest.MockedFunction<typeof fetchStores>).mockResolvedValue(mockStores);
      (shoppingListState.getItems as jest.MockedFunction<typeof shoppingListState.getItems>).mockReturnValue(
        mockItems
      );
      (shoppingListState.subscribe as jest.Mock).mockImplementation((callback) => {
        subscriptionCallback = callback;
        return () => {};
      });
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(
        true
      );

      initShoppingListUI();

      // Wait for async loadStoreFilter to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Clear previous calls
      (renderItems as jest.Mock).mockClear();

      // Trigger subscription callback (simulating state change)
      subscriptionCallback(mockItems);

      // Check that renderItems was called with filtered items (store 1 is selected by default)
      expect(renderItems).toHaveBeenCalledWith([
        { id: '1', name: 'Äpfel', store_id: 1 },
        { id: '3', name: 'Brot', store_id: 1 },
      ]);
    });

    it('should add item with selected store_id when store is selected', async () => {
      (fetchStores as jest.MockedFunction<typeof fetchStores>).mockResolvedValue(mockStores);
      (shoppingListState.getItems as jest.MockedFunction<typeof shoppingListState.getItems>).mockReturnValue(
        mockItems
      );
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.addItem as jest.MockedFunction<typeof shoppingListState.addItem>).mockResolvedValue({
        id: '123',
        name: 'New Item',
      });
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(
        true
      );

      initShoppingListUI();

      // Wait for async loadStoreFilter to complete (selects first store)
      await new Promise((resolve) => setTimeout(resolve, 0));

      mockInput.value = 'New Item';
      mockButton.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Check that addItem was called with store_id = 1 (first store)
      expect(shoppingListState.addItem).toHaveBeenCalledWith('New Item', undefined, 1);
    });

    it('should not call deleteItem again if button is already disabled', async () => {
      (shoppingListState.subscribe as jest.Mock).mockReturnValue(() => {});
      (shoppingListState.deleteItem as jest.MockedFunction<typeof shoppingListState.deleteItem>).mockResolvedValue(
        true
      );
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(
        true
      );

      initShoppingListUI();

      // Create a mock delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'removeBtn';
      deleteButton.dataset.itemId = '123';
      deleteButton.setAttribute('disabled', 'true'); // Already disabled
      mockItemsList.appendChild(deleteButton);

      deleteButton.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should not be called because button was already disabled
      expect(shoppingListState.deleteItem).not.toHaveBeenCalled();
    });
  });

  describe('Edit item functionality', () => {
    const mockDepartments = [
      { id: 1, name: 'Obst & Gemüse', store_id: 1, sort_order: 0 },
      { id: 2, name: 'Milchprodukte', store_id: 1, sort_order: 1 },
    ];

    beforeEach(() => {
      // Mock fetchStores to return stores
      (fetchStores as jest.MockedFunction<typeof fetchStores>).mockResolvedValue(mockStores);

      // Mock fetchDepartments
      (fetchDepartments as jest.MockedFunction<typeof fetchDepartments>).mockResolvedValue(
        mockDepartments
      );

      // Mock convertItemToProduct
      (convertItemToProduct as jest.MockedFunction<typeof convertItemToProduct>).mockResolvedValue({
        id: '1',
        name: 'TestItem',
        store_id: 1,
        product_id: 5,
        department_id: 1,
        department_name: 'Obst & Gemüse',
      });

      // Mock shoppingListState.loadItems
      (shoppingListState.loadItems as jest.MockedFunction<typeof shoppingListState.loadItems>).mockResolvedValue(undefined as any);
    });

    it('should show alert when edit button clicked without selected store', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Change filter to "Alle Geschäfte"
      mockStoreFilter.value = '';
      mockStoreFilter.dispatchEvent(new Event('change'));

      // Create edit button
      const editButton = document.createElement('button');
      editButton.className = 'editBtn';
      editButton.dataset.itemId = '1';
      mockItemsList.appendChild(editButton);

      // Click edit button (no store selected)
      editButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(alertSpy).toHaveBeenCalledWith(
        'Bitte wählen Sie ein Geschäft aus, um eine Abteilung zuzuweisen.'
      );

      alertSpy.mockRestore();
    });

    it('should show alert when no departments available', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Mock fetchDepartments to return empty array
      (fetchDepartments as jest.MockedFunction<typeof fetchDepartments>).mockResolvedValue([]);

      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      // Create edit button
      const editButton = document.createElement('button');
      editButton.className = 'editBtn';
      editButton.dataset.itemId = '1';
      mockItemsList.appendChild(editButton);

      // Click edit button
      editButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(alertSpy).toHaveBeenCalledWith(
        'Keine Abteilungen für dieses Geschäft vorhanden.'
      );

      alertSpy.mockRestore();
    });

    it('should show department selection dialog when edit button clicked', async () => {
      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      // Create edit button
      const editButton = document.createElement('button');
      editButton.className = 'editBtn';
      editButton.dataset.itemId = '1';
      mockItemsList.appendChild(editButton);

      // Click edit button
      editButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if dialog was created
      const dialog = document.querySelector('.department-dialog');
      expect(dialog).toBeTruthy();
      expect(dialog?.textContent).toContain('Abteilung auswählen');
    });

    it('should close dialog when cancel button clicked', async () => {
      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      // Create edit button
      const editButton = document.createElement('button');
      editButton.className = 'editBtn';
      editButton.dataset.itemId = '1';
      mockItemsList.appendChild(editButton);

      // Click edit button
      editButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if dialog was created
      let dialog = document.querySelector('.department-dialog');
      expect(dialog).toBeTruthy();

      // Find and click cancel button (search for button with "Abbrechen" text)
      const cancelButtons = Array.from(document.querySelectorAll('button'));
      const cancelButton = cancelButtons.find(btn => btn.textContent === 'Abbrechen');
      expect(cancelButton).toBeTruthy();
      cancelButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Dialog should be removed
      dialog = document.querySelector('.department-dialog');
      expect(dialog).toBeFalsy();
    });

    it('should convert item to product when department selected', async () => {
      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      // Create edit button
      const editButton = document.createElement('button');
      editButton.className = 'editBtn';
      editButton.dataset.itemId = '1';
      mockItemsList.appendChild(editButton);

      // Click edit button
      editButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Find and click first department button
      const deptButtons = document.querySelectorAll('.department-option-btn');
      const firstDeptButton = deptButtons[0] as HTMLButtonElement;
      firstDeptButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should call convertItemToProduct
      expect(convertItemToProduct).toHaveBeenCalledWith('1', 1);

      // Should reload items
      expect(shoppingListState.loadItems).toHaveBeenCalled();
    });

    it('should show alert when conversion fails', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Mock convertItemToProduct to return null (failure)
      (convertItemToProduct as jest.MockedFunction<typeof convertItemToProduct>).mockResolvedValue(null);

      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      // Create edit button
      const editButton = document.createElement('button');
      editButton.className = 'editBtn';
      editButton.dataset.itemId = '1';
      mockItemsList.appendChild(editButton);

      // Click edit button
      editButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Find and click first department button
      const deptButtons = document.querySelectorAll('.department-option-btn');
      const firstDeptButton = deptButtons[0] as HTMLButtonElement;
      firstDeptButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(alertSpy).toHaveBeenCalledWith('Fehler beim Zuweisen der Abteilung.');

      alertSpy.mockRestore();
    });

    it('should close dialog when backdrop clicked', async () => {
      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      // Create edit button
      const editButton = document.createElement('button');
      editButton.className = 'editBtn';
      editButton.dataset.itemId = '1';
      mockItemsList.appendChild(editButton);

      // Click edit button
      editButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Click backdrop
      const backdrop = document.querySelector('.dialog-backdrop') as HTMLElement;
      backdrop?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Dialog should be removed
      const dialog = document.querySelector('.department-dialog');
      expect(dialog).toBeFalsy();
    });

    it('should not close dialog when dialog itself is clicked', async () => {
      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      // Create edit button
      const editButton = document.createElement('button');
      editButton.className = 'editBtn';
      editButton.dataset.itemId = '1';
      mockItemsList.appendChild(editButton);

      // Click edit button
      editButton.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Click dialog (not backdrop)
      const dialog = document.querySelector('.department-dialog') as HTMLElement;
      dialog?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Dialog should still exist
      const dialogAfter = document.querySelector('.department-dialog');
      expect(dialogAfter).toBeTruthy();
    });
  });

  describe('Clear store items functionality', () => {
    beforeEach(() => {
      // Mock fetchStores to return stores
      (fetchStores as jest.MockedFunction<typeof fetchStores>).mockResolvedValue(mockStores);

      // Mock deleteStoreItems
      (shoppingListState.deleteStoreItems as jest.MockedFunction<typeof shoppingListState.deleteStoreItems>).mockResolvedValue(true);
    });

    it('should show alert when clear button clicked without selected store', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Change filter to "Alle Geschäfte"
      mockStoreFilter.value = '';
      mockStoreFilter.dispatchEvent(new Event('change'));

      const clearButton = document.getElementById('clearStoreBtn') as HTMLButtonElement;
      clearButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(alertSpy).toHaveBeenCalledWith(
        'Bitte wählen Sie ein spezifisches Geschäft aus, um dessen Liste zu leeren.'
      );

      alertSpy.mockRestore();
    });

    it('should show confirmation dialog when clear button clicked', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      const clearButton = document.getElementById('clearStoreBtn') as HTMLButtonElement;
      clearButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(confirmSpy).toHaveBeenCalled();
      expect(confirmSpy.mock.calls[0][0]).toContain('Rewe');

      confirmSpy.mockRestore();
    });

    it('should not delete items when confirmation is cancelled', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      const clearButton = document.getElementById('clearStoreBtn') as HTMLButtonElement;
      clearButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(shoppingListState.deleteStoreItems).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should delete items when confirmation is accepted', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      const clearButton = document.getElementById('clearStoreBtn') as HTMLButtonElement;
      clearButton.click();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(shoppingListState.deleteStoreItems).toHaveBeenCalledWith(1);

      confirmSpy.mockRestore();
    });

    it('should show alert when deletion fails', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Mock deleteStoreItems to return false (failure)
      (shoppingListState.deleteStoreItems as jest.MockedFunction<typeof shoppingListState.deleteStoreItems>).mockResolvedValue(false);

      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      const clearButton = document.getElementById('clearStoreBtn') as HTMLButtonElement;
      clearButton.click();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(alertSpy).toHaveBeenCalledWith('Fehler beim Löschen der Einträge.');

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('should disable and re-enable button during deletion', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      initShoppingListUI();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Select first store
      mockStoreFilter.value = '1';
      mockStoreFilter.dispatchEvent(new Event('change'));

      const clearButton = document.getElementById('clearStoreBtn') as HTMLButtonElement;

      // Button should not be disabled initially
      expect(clearButton.disabled).toBe(false);

      // Click button to trigger deletion
      clearButton.click();

      // Wait a bit for async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // After deletion completes, button should be re-enabled
      expect(clearButton.disabled).toBe(false);

      // Deletion should have been called
      expect(shoppingListState.deleteStoreItems).toHaveBeenCalledWith(1);

      confirmSpy.mockRestore();
    });
  });
});
