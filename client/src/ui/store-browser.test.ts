/**
 * Tests for store-browser UI module.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import {
  initStoreBrowser,
  toggleStoreBrowser,
  showStoreBrowser,
  hideStoreBrowser,
} from './store-browser.js';
import { storeState } from '../state/store-state.js';
import { shoppingListState } from '../state/shopping-list-state.js';
import type { Store, Department, Product } from '../data/api.js';

// Mock the modules
jest.mock('../state/store-state.js');
jest.mock('../state/shopping-list-state.js');

describe('Store Browser UI', () => {
  let mockContainer: HTMLDivElement;
  let consoleWarnSpy: any;
  let mockSubscribeCallback: () => void;

  const mockStores: Store[] = [
    { id: 1, name: 'Rewe', location: 'Berlin' },
    { id: 2, name: 'Edeka', location: 'Hamburg' },
  ];

  const mockDepartments: Department[] = [
    { id: 1, name: 'Obst & Gemüse', store_id: 1, sort_order: 1 },
    { id: 2, name: 'Brot & Backwaren', store_id: 1, sort_order: 2 },
  ];

  const mockProducts: Product[] = [
    { id: 1, name: 'Äpfel', store_id: 1, department_id: 1, fresh: true },
    { id: 2, name: 'Bananen', store_id: 1, department_id: 1, fresh: true },
    { id: 3, name: 'Brot', store_id: 1, department_id: 2, fresh: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup DOM
    document.body.innerHTML = `
      <div id="store-browser"></div>
    `;

    mockContainer = document.getElementById('store-browser') as HTMLDivElement;

    // Spy on console.warn
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock storeState.subscribe to capture callback
    (storeState.subscribe as jest.MockedFunction<typeof storeState.subscribe>).mockImplementation(
      (callback: () => void) => {
        mockSubscribeCallback = callback;
        return () => {}; // Unsubscribe function
      }
    );

    // Mock storeState methods
    (storeState.getState as jest.MockedFunction<typeof storeState.getState>).mockReturnValue({
      stores: [],
      departments: [],
      products: [],
      selectedStore: null,
      selectedDepartment: null,
      isLoading: false,
      error: null,
    });
    (storeState.loadStores as jest.MockedFunction<typeof storeState.loadStores>).mockResolvedValue(
      undefined as any
    );
    (storeState.selectStore as jest.MockedFunction<typeof storeState.selectStore>).mockResolvedValue(
      undefined as any
    );
    (storeState.selectDepartment as jest.MockedFunction<typeof storeState.selectDepartment>).mockReturnValue(
      undefined as any
    );
    (storeState.clearSelection as jest.MockedFunction<typeof storeState.clearSelection>).mockReturnValue(
      undefined as any
    );

    // Mock shoppingListState methods
    (shoppingListState.addItem as jest.MockedFunction<typeof shoppingListState.addItem>).mockResolvedValue({
      id: '123',
      name: 'Test',
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('initStoreBrowser', () => {
    it('should warn if container not found', () => {
      document.body.innerHTML = '';

      initStoreBrowser();

      expect(consoleWarnSpy).toHaveBeenCalledWith('Store browser container not found');
    });

    it('should subscribe to store state changes', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: [],
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      expect(storeState.subscribe).toHaveBeenCalled();
    });

    it('should load stores on initialization', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: [],
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      expect(storeState.loadStores).toHaveBeenCalled();
    });

    it('should render store browser on initialization', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      expect(mockContainer.innerHTML).toContain('Produktkatalog');
      expect(mockContainer.innerHTML).toContain('Geschäft auswählen');
    });
  });

  describe('renderStoreBrowser', () => {
    it('should render store selection dropdown with stores', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      expect(mockContainer.innerHTML).toContain('Rewe');
      expect(mockContainer.innerHTML).toContain('Edeka');
      expect(mockContainer.innerHTML).toContain('-- Geschäft wählen --');
    });

    it('should disable store select when no stores available', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: [],
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const select = mockContainer.querySelector('#store-select') as HTMLSelectElement;
      expect(select).toBeDefined();
      expect(select?.disabled).toBe(true);
    });

    it('should mark selected store in dropdown', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: [],
        products: [],
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const select = mockContainer.querySelector('#store-select') as HTMLSelectElement;
      expect(select.value).toBe('1');
    });

    it('should render department selection when store is selected', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: [],
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      expect(mockContainer.innerHTML).toContain('Abteilung filtern');
      expect(mockContainer.innerHTML).toContain('Obst &amp; Gemüse');
      expect(mockContainer.innerHTML).toContain('Brot &amp; Backwaren');
      expect(mockContainer.innerHTML).toContain('Alle');
    });

    it('should not render department selection when no store selected', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      expect(mockContainer.innerHTML).not.toContain('Abteilung filtern');
    });

    it('should mark active department pill when department selected', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: [],
        selectedStore: mockStores[0],
        selectedDepartment: mockDepartments[0],
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const activePill = mockContainer.querySelector('.department-pill.active[data-department-id="1"]');
      expect(activePill).not.toBeNull();
    });

    it('should mark "Alle" pill as active when no department selected', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: [],
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const allPill = mockContainer.querySelector('.department-pill.active[data-department-id=""]');
      expect(allPill).not.toBeNull();
    });

    it('should render loading state for products', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: [],
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: true,
        error: null,
      });

      initStoreBrowser();

      expect(mockContainer.innerHTML).toContain('Lade Produkte...');
    });

    it('should render empty products state', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: [],
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      expect(mockContainer.innerHTML).toContain('Keine Produkte gefunden');
    });

    it('should render product list with products', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: mockProducts,
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      expect(mockContainer.innerHTML).toContain('Produkte (3)');
      expect(mockContainer.innerHTML).toContain('Äpfel');
      expect(mockContainer.innerHTML).toContain('Bananen');
      expect(mockContainer.innerHTML).toContain('Brot');
    });

    it('should render fresh indicator for fresh products', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: mockProducts,
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      expect(mockContainer.innerHTML).toContain('🌿 Frisch');
    });

    it('should render add to list buttons for products', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: mockProducts,
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const addButtons = mockContainer.querySelectorAll('.add-product-btn');
      expect(addButtons.length).toBe(3);
    });

    it('should render error message when error exists', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: 'Failed to load stores',
      });

      initStoreBrowser();

      expect(mockContainer.innerHTML).toContain('Failed to load stores');
      expect(mockContainer.innerHTML).toContain('error-message');
    });

    it('should not render products when no store selected', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      expect(mockContainer.innerHTML).not.toContain('Produkte');
    });
  });

  describe('attachStoreBrowserListeners', () => {
    it('should handle store selection change', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const select = mockContainer.querySelector('#store-select') as HTMLSelectElement;
      select.value = '1';
      select.dispatchEvent(new Event('change'));

      expect(storeState.selectStore).toHaveBeenCalledWith(1);
    });

    it('should clear selection when empty store selected', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: [],
        products: [],
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const select = mockContainer.querySelector('#store-select') as HTMLSelectElement;
      select.value = '';
      select.dispatchEvent(new Event('change'));

      expect(storeState.clearSelection).toHaveBeenCalled();
    });

    it('should handle department pill click to select department', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: [],
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const departmentPill = mockContainer.querySelector('[data-department-id="1"]') as HTMLElement;
      departmentPill.click();

      expect(storeState.selectDepartment).toHaveBeenCalledWith(1);
    });

    it('should handle "Alle" pill click to clear department selection', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: [],
        selectedStore: mockStores[0],
        selectedDepartment: mockDepartments[0],
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const allPill = mockContainer.querySelector('[data-department-id=""]') as HTMLElement;
      allPill.click();

      expect(storeState.selectDepartment).toHaveBeenCalledWith(null);
    });

    it('should add product to shopping list when add button clicked', async () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: mockProducts,
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const addButton = mockContainer.querySelector('[data-product-name="Äpfel"]') as HTMLElement;
      addButton.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(shoppingListState.addItem).toHaveBeenCalledWith('Äpfel');
    });

    it('should show visual feedback when product added', async () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: mockProducts,
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const addButton = mockContainer.querySelector('[data-product-name="Äpfel"]') as HTMLElement;

      jest.useFakeTimers();
      addButton.click();

      // Wait for async operation with fake timers
      await Promise.resolve();

      expect(addButton.textContent).toContain('✓ Hinzugefügt');
      expect(addButton.classList.contains('added')).toBe(true);

      jest.advanceTimersByTime(1500);

      expect(addButton.textContent).toContain('+ Zur Liste');
      expect(addButton.classList.contains('added')).toBe(false);

      jest.useRealTimers();
    });

    it('should not add product if product name is empty', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: mockDepartments,
        products: [{ id: 1, name: '', store_id: 1, department_id: 1, fresh: false }],
        selectedStore: mockStores[0],
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const addButton = mockContainer.querySelector('.add-product-btn') as HTMLElement;
      addButton.click();

      expect(shoppingListState.addItem).not.toHaveBeenCalled();
    });
  });

  describe('state subscription callback', () => {
    it('should re-render when state changes', () => {
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: [],
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      initStoreBrowser();

      const initialHTML = mockContainer.innerHTML;

      // Change state
      (storeState.getState as jest.Mock).mockReturnValue({
        stores: mockStores,
        departments: [],
        products: [],
        selectedStore: null,
        selectedDepartment: null,
        isLoading: false,
        error: null,
      });

      // Trigger subscription callback
      mockSubscribeCallback();

      const updatedHTML = mockContainer.innerHTML;

      expect(initialHTML).not.toBe(updatedHTML);
      expect(updatedHTML).toContain('Rewe');
    });
  });

  describe('toggleStoreBrowser', () => {
    it('should toggle hidden class on container', () => {
      expect(mockContainer.classList.contains('hidden')).toBe(false);

      toggleStoreBrowser();

      expect(mockContainer.classList.contains('hidden')).toBe(true);

      toggleStoreBrowser();

      expect(mockContainer.classList.contains('hidden')).toBe(false);
    });

    it('should do nothing if container not found', () => {
      document.body.innerHTML = '';

      expect(() => toggleStoreBrowser()).not.toThrow();
    });
  });

  describe('showStoreBrowser', () => {
    it('should remove hidden class from container', () => {
      mockContainer.classList.add('hidden');

      showStoreBrowser();

      expect(mockContainer.classList.contains('hidden')).toBe(false);
    });

    it('should do nothing if container not found', () => {
      document.body.innerHTML = '';

      expect(() => showStoreBrowser()).not.toThrow();
    });
  });

  describe('hideStoreBrowser', () => {
    it('should add hidden class to container', () => {
      hideStoreBrowser();

      expect(mockContainer.classList.contains('hidden')).toBe(true);
    });

    it('should do nothing if container not found', () => {
      document.body.innerHTML = '';

      expect(() => hideStoreBrowser()).not.toThrow();
    });
  });
});
