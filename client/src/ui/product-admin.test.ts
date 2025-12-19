/**
 * Tests for product-admin module
 */

import { initProductAdmin } from './product-admin';
import * as api from '../data/api';
import * as toast from './components/toast.js';

// Helper to flush all promises with fake timers
const flushPromises = async () => {
  jest.advanceTimersByTime(0);
  await Promise.resolve();
};

// Mock the API module
jest.mock('../data/api');

// Mock the toast module
jest.mock('./components/toast.js', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
  injectToastStyles: jest.fn(),
}));

// Mock the components
let mockModalContent: HTMLElement | null = null;

jest.mock('./components/modal.js', () => ({
  Modal: jest.fn().mockImplementation((options) => {
    // Store the modal content element for later button extraction
    mockModalContent = options.content;

    return {
      open: jest.fn(),
      close: jest.fn(),
      setContent: jest.fn(),
    };
  }),
}));

jest.mock('./components/button.js', () => ({
  createButton: jest.fn((options) => {
    const btn = document.createElement('button');
    btn.textContent = options.label;
    if (options.onClick) {
      btn.addEventListener('click', options.onClick);
    }
    return btn;
  }),
}));

// Track state subscriptions for cleanup
const mockUnsubscribers: Array<() => void> = [];

// Import the actual state to wrap its subscribe method
import { productAdminState } from '../state/product-admin-state.js';

// Wrap the subscribe method to track unsubscribers
const originalSubscribe = productAdminState.subscribe.bind(productAdminState);
productAdminState.subscribe = jest.fn((listener) => {
  const unsubscribe = originalSubscribe(listener);
  // Track the unsubscribe function so we can call it in afterEach
  mockUnsubscribers.push(unsubscribe);
  return unsubscribe;
});

describe('Product Admin', () => {
  let container: HTMLElement;

  beforeEach(() => {
    mockModalContent = null;

    // Setup DOM
    document.body.innerHTML = '<div id="product-admin-container"></div>';
    container = document.getElementById('product-admin-container')!;

    // Reset mocks
    jest.clearAllMocks();

    // Use fake timers for faster tests
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clean up state subscriptions
    mockUnsubscribers.forEach(unsub => unsub());
    mockUnsubscribers.length = 0;

    // Clean up timers
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('initProductAdmin', () => {
    it('should load stores and render UI', async () => {
      const mockStores = [
        { id: 1, name: 'Store 1', location: 'Location 1' },
        { id: 2, name: 'Store 2', location: 'Location 2' },
      ];

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);

      await initProductAdmin();

      expect(api.fetchStores).toHaveBeenCalled();
      expect(container.innerHTML).toContain('Produkte verwalten');
      expect(container.innerHTML).toContain('Store 1');
      expect(container.innerHTML).toContain('Store 2');
    });

    it('should render empty state when no store is selected', async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue([]);

      await initProductAdmin();

      expect(container.innerHTML).toContain('Bitte Geschäft auswählen');
      expect(container.innerHTML).not.toContain('Neues Produkt erstellen');
    });

    it('should load departments and products when store is selected', async () => {
      const mockStores = [{ id: 1, name: 'Store 1', location: '' }];
      const mockDepartments = [
        { id: 1, name: 'Dept 1', store_id: 1, sort_order: 0 },
        { id: 2, name: 'Dept 2', store_id: 1, sort_order: 1 },
      ];
      const mockProducts = [
        { id: 1, name: 'Product 1', store_id: 1, department_id: 1, fresh: false },
        { id: 2, name: 'Product 2', store_id: 1, department_id: 1, fresh: true },
      ];

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(mockProducts);

      await initProductAdmin();

      const select = container.querySelector('#storeSelect') as HTMLSelectElement;
      expect(select).toBeTruthy();

      // Select a store
      select.value = '1';
      select.dispatchEvent(new Event('change'));

      // Wait for async operations
      jest.runAllTimers();
      await flushPromises();

      expect(api.fetchDepartments).toHaveBeenCalledWith(1);
      expect(api.fetchStoreProducts).toHaveBeenCalledWith(1);
      expect(container.innerHTML).toContain('Neues Produkt erstellen');
      expect(container.innerHTML).toContain('Product 1');
      expect(container.innerHTML).toContain('Product 2');
      expect(container.innerHTML).toContain('Frisch');
    });
  });

  describe('Product Creation', () => {
    beforeEach(async () => {
      const mockStores = [{ id: 1, name: 'Store 1', location: '' }];
      const mockDepartments = [{ id: 1, name: 'Dept 1', store_id: 1, sort_order: 0 }];
      const mockProducts: api.Product[] = [];

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(mockProducts);

      await initProductAdmin();
      jest.runAllTimers();
      await flushPromises();

      const select = container.querySelector('#storeSelect') as HTMLSelectElement;
      select.value = '1';
      select.dispatchEvent(new Event('change'));
      jest.runAllTimers();
      await flushPromises();
    });

    it('should create a new product', async () => {
      const newProduct = { id: 3, name: 'New Product', store_id: 1, department_id: 1, fresh: true };
      (api.createProduct as jest.MockedFunction<typeof api.createProduct>).mockResolvedValue(newProduct);
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue([newProduct]);

      const nameInput = container.querySelector('#productName') as HTMLInputElement;
      const deptSelect = container.querySelector('#departmentSelect') as HTMLSelectElement;
      const freshCheckbox = container.querySelector('#productFresh') as HTMLInputElement;
      const saveBtn = container.querySelector('#saveProductBtn') as HTMLButtonElement;

      nameInput.value = 'New Product';
      deptSelect.value = '1';
      freshCheckbox.checked = true;
      saveBtn.click();

      jest.runAllTimers();
      await flushPromises();

      expect(api.createProduct).toHaveBeenCalledWith('New Product', 1, 1, true);
      expect(api.fetchStoreProducts).toHaveBeenCalledWith(1);
    });

    it('should not create product without name', async () => {
      const saveBtn = container.querySelector('#saveProductBtn') as HTMLButtonElement;
      saveBtn.click();

      jest.runAllTimers();
      await flushPromises();

      expect(toast.showError).toHaveBeenCalledWith('Bitte Produktname eingeben');
      expect(api.createProduct).not.toHaveBeenCalled();
    });

    it('should not create product without department', async () => {
      const nameInput = container.querySelector('#productName') as HTMLInputElement;
      const saveBtn = container.querySelector('#saveProductBtn') as HTMLButtonElement;

      nameInput.value = 'Test Product';
      saveBtn.click();

      jest.runAllTimers();
      await flushPromises();

      expect(toast.showError).toHaveBeenCalledWith('Bitte Abteilung auswählen');
      expect(api.createProduct).not.toHaveBeenCalled();
    });
  });

  describe('Product Editing', () => {
    beforeEach(async () => {
      const mockStores = [{ id: 1, name: 'Store 1', location: '' }];
      const mockDepartments = [{ id: 1, name: 'Dept 1', store_id: 1, sort_order: 0 }];
      const mockProducts = [
        { id: 1, name: 'Product 1', store_id: 1, department_id: 1, fresh: false },
      ];

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(mockProducts);

      await initProductAdmin();
      jest.runAllTimers();
      await flushPromises();

      const select = container.querySelector('#storeSelect') as HTMLSelectElement;
      select.value = '1';
      select.dispatchEvent(new Event('change'));
      jest.runAllTimers();
      await flushPromises();
    });

    it('should enter edit mode when edit button is clicked', async () => {
      const editBtn = container.querySelector('.btn-edit') as HTMLButtonElement;
      editBtn.click();

      jest.runAllTimers();
      await flushPromises();

      expect(container.innerHTML).toContain('Produkt bearbeiten');
      expect(container.innerHTML).toContain('Abbrechen');
      const nameInput = container.querySelector('#productName') as HTMLInputElement;
      expect(nameInput.value).toBe('Product 1');
    });

    it('should update product when save is clicked in edit mode', async () => {
      const updatedProduct = { id: 1, name: 'Updated Product', store_id: 1, department_id: 1, fresh: true };
      (api.updateProduct as jest.MockedFunction<typeof api.updateProduct>).mockResolvedValue(updatedProduct);
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue([updatedProduct]);

      // Enter edit mode
      const editBtn = container.querySelector('.btn-edit') as HTMLButtonElement;
      editBtn.click();
      jest.runAllTimers();
      await flushPromises();

      // Update product
      const nameInput = container.querySelector('#productName') as HTMLInputElement;
      const freshCheckbox = container.querySelector('#productFresh') as HTMLInputElement;
      const saveBtn = container.querySelector('#saveProductBtn') as HTMLButtonElement;

      nameInput.value = 'Updated Product';
      freshCheckbox.checked = true;
      saveBtn.click();

      jest.runAllTimers();
      await flushPromises();

      expect(api.updateProduct).toHaveBeenCalledWith(1, {
        name: 'Updated Product',
        departmentId: 1,
        fresh: true,
      });
    });

    it('should cancel edit mode when cancel button is clicked', async () => {
      // Enter edit mode
      const editBtn = container.querySelector('.btn-edit') as HTMLButtonElement;
      editBtn.click();
      jest.runAllTimers();
      await flushPromises();

      // Cancel edit
      const cancelBtn = container.querySelector('#cancelEditBtn') as HTMLButtonElement;
      cancelBtn.click();
      jest.runAllTimers();
      await flushPromises();

      expect(container.innerHTML).not.toContain('Produkt bearbeiten');
      expect(container.innerHTML).toContain('Neues Produkt erstellen');
    });
  });

  describe('Product Deletion', () => {
    beforeEach(async () => {
      const mockStores = [{ id: 1, name: 'Store 1', location: '' }];
      const mockDepartments = [{ id: 1, name: 'Dept 1', store_id: 1, sort_order: 0 }];
      const mockProducts = [
        { id: 1, name: 'Product 1', store_id: 1, department_id: 1, fresh: false },
      ];

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(mockProducts);

      await initProductAdmin();
      jest.runAllTimers();
      await flushPromises();

      const select = container.querySelector('#storeSelect') as HTMLSelectElement;
      select.value = '1';
      select.dispatchEvent(new Event('change'));
      jest.runAllTimers();
      await flushPromises();
    });

    it('should delete product when confirmed', async () => {
      (api.deleteProduct as jest.MockedFunction<typeof api.deleteProduct>).mockResolvedValue(true);
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue([]);

      const deleteBtn = container.querySelector('.btn-delete') as HTMLButtonElement;
      deleteBtn.click();

      jest.runAllTimers();
      await flushPromises();

      // Extract buttons from the modal content after they've been added
      if (mockModalContent) {
        const buttons = mockModalContent.querySelectorAll('button');
        const confirmBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Löschen'));
        if (confirmBtn) {
          (confirmBtn as HTMLButtonElement).click();
          jest.runAllTimers();
          await flushPromises();
        }
      }

      expect(api.deleteProduct).toHaveBeenCalledWith(1);
      expect(api.fetchStoreProducts).toHaveBeenCalledWith(1);
    });

    it('should not delete product when cancelled', async () => {
      const deleteBtn = container.querySelector('.btn-delete') as HTMLButtonElement;
      deleteBtn.click();

      jest.runAllTimers();
      await flushPromises();

      // Extract buttons from the modal content after they've been added
      if (mockModalContent) {
        const buttons = mockModalContent.querySelectorAll('button');
        const cancelBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Abbrechen'));
        if (cancelBtn) {
          (cancelBtn as HTMLButtonElement).click();
          jest.runAllTimers();
          await flushPromises();
        }
      }

      expect(api.deleteProduct).not.toHaveBeenCalled();
    });

    it('should show toast.showError when deletion fails', async () => {
      (api.deleteProduct as jest.MockedFunction<typeof api.deleteProduct>).mockResolvedValue(false);

      const deleteBtn = container.querySelector('.btn-delete') as HTMLButtonElement;
      deleteBtn.click();

      jest.runAllTimers();
      await flushPromises();

      // Extract buttons from the modal content after they've been added
      if (mockModalContent) {
        const buttons = mockModalContent.querySelectorAll('button');
        const confirmBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Löschen'));
        if (confirmBtn) {
          (confirmBtn as HTMLButtonElement).click();
          jest.runAllTimers();
          await flushPromises();
        }
      }

      expect(toast.showError).toHaveBeenCalledWith('Fehler beim Löschen des Produkts');
    });
  });

  describe('Product List Display', () => {
    it('should group products by department', async () => {
      const mockStores = [{ id: 1, name: 'Store 1', location: '' }];
      const mockDepartments = [
        { id: 1, name: 'Dept 1', store_id: 1, sort_order: 0 },
        { id: 2, name: 'Dept 2', store_id: 1, sort_order: 1 },
      ];
      const mockProducts = [
        { id: 1, name: 'Product A', store_id: 1, department_id: 1, fresh: false },
        { id: 2, name: 'Product B', store_id: 1, department_id: 2, fresh: false },
        { id: 3, name: 'Product C', store_id: 1, department_id: 1, fresh: true },
      ];

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(mockProducts);

      await initProductAdmin();

      const select = container.querySelector('#storeSelect') as HTMLSelectElement;
      select.value = '1';
      select.dispatchEvent(new Event('change'));
      jest.runAllTimers();
      await flushPromises();

      // Check that departments are rendered as headers
      expect(container.innerHTML).toContain('Dept 1');
      expect(container.innerHTML).toContain('Dept 2');

      // Check that products are rendered
      expect(container.innerHTML).toContain('Product A');
      expect(container.innerHTML).toContain('Product B');
      expect(container.innerHTML).toContain('Product C');
    });

    it('should show no products message when list is empty', async () => {
      const mockStores = [{ id: 1, name: 'Store 1', location: '' }];
      const mockDepartments = [{ id: 1, name: 'Dept 1', store_id: 1, sort_order: 0 }];
      const mockProducts: api.Product[] = [];

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(mockProducts);

      await initProductAdmin();

      const select = container.querySelector('#storeSelect') as HTMLSelectElement;
      select.value = '1';
      select.dispatchEvent(new Event('change'));
      jest.runAllTimers();
      await flushPromises();

      expect(container.innerHTML).toContain('Keine Produkte vorhanden');
    });

    it('should display fresh badge for fresh products', async () => {
      const mockStores = [{ id: 1, name: 'Store 1', location: '' }];
      const mockDepartments = [{ id: 1, name: 'Dept 1', store_id: 1, sort_order: 0 }];
      const mockProducts = [
        { id: 1, name: 'Fresh Product', store_id: 1, department_id: 1, fresh: true },
        { id: 2, name: 'Regular Product', store_id: 1, department_id: 1, fresh: false },
      ];

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);
      (api.fetchStoreProducts as jest.MockedFunction<typeof api.fetchStoreProducts>).mockResolvedValue(mockProducts);

      await initProductAdmin();

      const select = container.querySelector('#storeSelect') as HTMLSelectElement;
      select.value = '1';
      select.dispatchEvent(new Event('change'));
      jest.runAllTimers();
      await flushPromises();

      const freshBadges = container.querySelectorAll('.product-badge.fresh');
      expect(freshBadges.length).toBe(1);
      expect(container.innerHTML).toContain('🌿 Frisch');
    });
  });
});
