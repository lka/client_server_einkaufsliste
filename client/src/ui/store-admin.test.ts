/**
 * Tests for store-admin module
 */

import { initStoreAdmin } from './store-admin';
import * as api from '../data/api';
import * as toast from './components/toast.js';

// Mock the API module
jest.mock('../data/api');

// Mock the toast module
jest.mock('./components/toast.js', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
  injectToastStyles: jest.fn(),
}));

// Mock the components
let mockModalOnClick: (() => void) | null = null;
let mockConfirmOnClick: (() => void) | null = null;

jest.mock('./components/modal.js', () => ({
  Modal: jest.fn().mockImplementation((options: any) => {
    // Extract buttons from content to simulate clicking them
    setTimeout(() => {
      if (options.content && typeof options.content.querySelectorAll === 'function') {
        const buttons = options.content.querySelectorAll('button');
        buttons.forEach((btn: HTMLButtonElement) => {
          if (btn.textContent?.includes('Löschen')) {
            mockConfirmOnClick = () => btn.click();
          } else if (btn.textContent?.includes('Abbrechen')) {
            mockModalOnClick = () => btn.click();
          }
        });
      }
    }, 0);

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

describe('Store Admin', () => {
  let container: HTMLElement;

  beforeEach(() => {
    mockModalOnClick = null;
    mockConfirmOnClick = null;
    // Setup DOM with all required elements
    document.body.innerHTML = `
      <div id="storesList"></div>
      <input id="storeNameInput" />
      <input id="storeLocationInput" />
      <button id="addStoreBtn"></button>
      <button id="backToAppBtn"></button>
    `;
    container = document.getElementById('storesList')!;

    // Reset mocks
    jest.clearAllMocks();

    // Mock window.confirm
    global.confirm = jest.fn(() => true);
  });

  describe('initStoreAdmin', () => {
    it('should load and render stores with departments', async () => {
      const mockStores = [
        { id: 1, name: 'Rewe', location: 'Berlin' },
        { id: 2, name: 'Edeka', location: 'Hamburg' },
      ];

      const mockDepartments1 = [
        { id: 1, name: 'Obst & Gemüse', store_id: 1, sort_order: 0 },
        { id: 2, name: 'Milchprodukte', store_id: 1, sort_order: 1 },
      ];

      const mockDepartments2 = [
        { id: 3, name: 'Backwaren', store_id: 2, sort_order: 0 },
      ];

      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>)
        .mockResolvedValueOnce(mockDepartments1)
        .mockResolvedValueOnce(mockDepartments2);

      initStoreAdmin();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.fetchStores).toHaveBeenCalled();
      expect(api.fetchDepartments).toHaveBeenCalledWith(1);
      expect(api.fetchDepartments).toHaveBeenCalledWith(2);
      expect(container.innerHTML).toContain('Rewe');
      expect(container.innerHTML).toContain('Edeka');
      expect(container.innerHTML).toContain('Obst &amp; Gemüse'); // HTML entity
      expect(container.innerHTML).toContain('Milchprodukte');
    });

    it('should render empty state when no stores exist', async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue([]);

      initStoreAdmin();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.innerHTML).toContain('Keine Geschäfte vorhanden');
    });

    it('should show "Keine Abteilungen" when store has no departments', async () => {
      const mockStores = [{ id: 1, name: 'Empty Store', location: '' }];
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue([]);

      initStoreAdmin();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(container.innerHTML).toContain('Keine Abteilungen');
    });
  });

  describe('Store CRUD operations', () => {
    beforeEach(async () => {
      const mockStores = [{ id: 1, name: 'Test Store', location: 'Test Location' }];
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue([]);
      initStoreAdmin();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should create a new store', async () => {
      const newStore = { id: 2, name: 'New Store', location: 'New Location' };
      (api.createStore as jest.MockedFunction<typeof api.createStore>).mockResolvedValue(newStore);
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue([newStore]);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue([]);

      const nameInput = document.getElementById('storeNameInput') as HTMLInputElement;
      const locationInput = document.getElementById('storeLocationInput') as HTMLInputElement;
      const addBtn = document.getElementById('addStoreBtn') as HTMLButtonElement;

      nameInput.value = 'New Store';
      locationInput.value = 'New Location';
      addBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.createStore).toHaveBeenCalledWith('New Store', 'New Location');
    });

    it('should show toast.showError when creating store without name', async () => {
      const nameInput = document.getElementById('storeNameInput') as HTMLInputElement;
      const addBtn = document.getElementById('addStoreBtn') as HTMLButtonElement;

      nameInput.value = '';
      addBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(toast.showError).toHaveBeenCalledWith('Bitte geben Sie einen Geschäftsnamen ein.');
      expect(api.createStore).not.toHaveBeenCalled();
    });

    it('should show toast.showError when store creation fails', async () => {
      (api.createStore as jest.MockedFunction<typeof api.createStore>).mockResolvedValue(null);

      const nameInput = document.getElementById('storeNameInput') as HTMLInputElement;
      const locationInput = document.getElementById('storeLocationInput') as HTMLInputElement;
      const addBtn = document.getElementById('addStoreBtn') as HTMLButtonElement;

      nameInput.value = 'New Store';
      locationInput.value = 'Location';
      addBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.createStore).toHaveBeenCalledWith('New Store', 'Location');
      expect(toast.showError).toHaveBeenCalledWith('Fehler beim Erstellen des Geschäfts. Existiert es bereits?');
    });

    it('should delete a store', async () => {
      (api.deleteStore as jest.MockedFunction<typeof api.deleteStore>).mockResolvedValue(true);
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue([]);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue([]);

      const deleteBtn = container.querySelector('.delete-store-btn') as HTMLButtonElement;
      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Click the confirm button in the modal
      if (mockConfirmOnClick) {
        mockConfirmOnClick();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(api.deleteStore).toHaveBeenCalledWith(1);
    });

    it('should show toast.showError when store deletion fails', async () => {
      (api.deleteStore as jest.MockedFunction<typeof api.deleteStore>).mockResolvedValue(false);

      const deleteBtn = container.querySelector('.delete-store-btn') as HTMLButtonElement;
      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Click the confirm button in the modal
      if (mockConfirmOnClick) {
        mockConfirmOnClick();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(toast.showError).toHaveBeenCalledWith('Fehler beim Löschen des Geschäfts.');
    });

    it('should not delete store when user cancels confirmation', async () => {
      const deleteBtn = container.querySelector('.delete-store-btn') as HTMLButtonElement;
      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Click the cancel button in the modal
      if (mockModalOnClick) {
        mockModalOnClick();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(api.deleteStore).not.toHaveBeenCalled();
    });
  });

  describe('Department CRUD operations', () => {
    beforeEach(async () => {
      const mockStores = [{ id: 1, name: 'Test Store', location: '' }];
      const mockDepartments = [
        { id: 1, name: 'Dept 1', store_id: 1, sort_order: 0 },
      ];
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);
      initStoreAdmin();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should create a new department', async () => {
      const newDept = { id: 2, name: 'New Dept', store_id: 1, sort_order: 1 };
      (api.createDepartment as jest.MockedFunction<typeof api.createDepartment>).mockResolvedValue(newDept);
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue([{ id: 1, name: 'Test Store', location: '' }]);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue([newDept]);

      const input = container.querySelector('.department-name-input') as HTMLInputElement;
      const addBtn = container.querySelector('.add-department-btn') as HTMLButtonElement;

      input.value = 'New Dept';
      addBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.createDepartment).toHaveBeenCalledWith(1, 'New Dept');
    });

    it('should show toast.showError when creating department without name', async () => {
      const input = container.querySelector('.department-name-input') as HTMLInputElement;
      const addBtn = container.querySelector('.add-department-btn') as HTMLButtonElement;

      input.value = '';
      addBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(toast.showError).toHaveBeenCalledWith('Bitte geben Sie einen Abteilungsnamen ein.');
      expect(api.createDepartment).not.toHaveBeenCalled();
    });

    it('should show toast.showError when department creation fails', async () => {
      (api.createDepartment as jest.MockedFunction<typeof api.createDepartment>).mockResolvedValue(null);

      const input = container.querySelector('.department-name-input') as HTMLInputElement;
      const addBtn = container.querySelector('.add-department-btn') as HTMLButtonElement;

      input.value = 'New Dept';
      addBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(api.createDepartment).toHaveBeenCalledWith(1, 'New Dept');
      expect(toast.showError).toHaveBeenCalledWith('Fehler beim Erstellen der Abteilung.');
    });

    it('should delete a department', async () => {
      (api.deleteDepartment as jest.MockedFunction<typeof api.deleteDepartment>).mockResolvedValue(true);
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue([{ id: 1, name: 'Test Store', location: '' }]);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue([]);

      const deleteBtn = container.querySelector('.delete-department-btn') as HTMLButtonElement;
      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Click the confirm button in the modal
      if (mockConfirmOnClick) {
        mockConfirmOnClick();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(api.deleteDepartment).toHaveBeenCalledWith(1);
    });

    it('should show toast.showError when department deletion fails', async () => {
      (api.deleteDepartment as jest.MockedFunction<typeof api.deleteDepartment>).mockResolvedValue(false);

      const deleteBtn = container.querySelector('.delete-department-btn') as HTMLButtonElement;
      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Click the confirm button in the modal
      if (mockConfirmOnClick) {
        mockConfirmOnClick();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(toast.showError).toHaveBeenCalledWith('Fehler beim Löschen der Abteilung.');
    });

    it('should not delete department when user cancels confirmation', async () => {
      const deleteBtn = container.querySelector('.delete-department-btn') as HTMLButtonElement;
      deleteBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Click the cancel button in the modal
      if (mockModalOnClick) {
        mockModalOnClick();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(api.deleteDepartment).not.toHaveBeenCalled();
    });
  });

  describe('Department Reordering', () => {
    beforeEach(async () => {
      const mockStores = [{ id: 1, name: 'Test Store', location: '' }];
      const mockDepartments = [
        { id: 1, name: 'Dept 1', store_id: 1, sort_order: 0 },
        { id: 2, name: 'Dept 2', store_id: 1, sort_order: 1 },
        { id: 3, name: 'Dept 3', store_id: 1, sort_order: 2 },
      ];
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);
      initStoreAdmin();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should disable up button for first department', () => {
      const deptItems = container.querySelectorAll('.department-item');
      const firstUpBtn = deptItems[0].querySelector('.up-btn') as HTMLButtonElement;

      expect(firstUpBtn.disabled).toBe(true);
    });

    it('should disable down button for last department', () => {
      const deptItems = container.querySelectorAll('.department-item');
      const lastDownBtn = deptItems[deptItems.length - 1].querySelector('.down-btn') as HTMLButtonElement;

      expect(lastDownBtn.disabled).toBe(true);
    });

    it('should enable up and down buttons for middle departments', () => {
      const deptItems = container.querySelectorAll('.department-item');
      const middleUpBtn = deptItems[1].querySelector('.up-btn') as HTMLButtonElement;
      const middleDownBtn = deptItems[1].querySelector('.down-btn') as HTMLButtonElement;

      expect(middleUpBtn.disabled).toBe(false);
      expect(middleDownBtn.disabled).toBe(false);
    });

    it('should reorder department up', async () => {
      (api.updateDepartment as jest.MockedFunction<typeof api.updateDepartment>)
        .mockResolvedValue({ id: 2, name: 'Dept 2', store_id: 1, sort_order: 0 });
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue([{ id: 1, name: 'Test Store', location: '' }]);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue([
        { id: 2, name: 'Dept 2', store_id: 1, sort_order: 0 },
        { id: 1, name: 'Dept 1', store_id: 1, sort_order: 1 },
        { id: 3, name: 'Dept 3', store_id: 1, sort_order: 2 },
      ]);

      const deptItems = container.querySelectorAll('.department-item');
      const secondUpBtn = deptItems[1].querySelector('.up-btn') as HTMLButtonElement;
      secondUpBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Should swap sort_order with previous department
      expect(api.updateDepartment).toHaveBeenCalledWith(2, undefined, 0); // Current dept (id=2) to position 0
      expect(api.updateDepartment).toHaveBeenCalledWith(1, undefined, 1); // Previous dept (id=1) to position 1
    });

    it('should reorder department down', async () => {
      (api.updateDepartment as jest.MockedFunction<typeof api.updateDepartment>)
        .mockResolvedValue({ id: 2, name: 'Dept 2', store_id: 1, sort_order: 2 });
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue([{ id: 1, name: 'Test Store', location: '' }]);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue([
        { id: 1, name: 'Dept 1', store_id: 1, sort_order: 0 },
        { id: 3, name: 'Dept 3', store_id: 1, sort_order: 1 },
        { id: 2, name: 'Dept 2', store_id: 1, sort_order: 2 },
      ]);

      const deptItems = container.querySelectorAll('.department-item');
      const secondDownBtn = deptItems[1].querySelector('.down-btn') as HTMLButtonElement;
      secondDownBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Should swap sort_order with next department
      expect(api.updateDepartment).toHaveBeenCalledWith(2, undefined, 2); // Current dept (id=2) to position 2
      expect(api.updateDepartment).toHaveBeenCalledWith(3, undefined, 1); // Next dept (id=3) to position 1
    });

    it('should show toast.showError when reordering fails', async () => {
      (api.updateDepartment as jest.MockedFunction<typeof api.updateDepartment>).mockResolvedValue(null);

      const deptItems = container.querySelectorAll('.department-item');
      const upBtn = deptItems[1].querySelector('.up-btn') as HTMLButtonElement;
      upBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(toast.showError).toHaveBeenCalledWith('Fehler beim Ändern der Reihenfolge.');
    });

    it('should not reorder if only one department exists', async () => {
      const mockStores = [{ id: 1, name: 'Test Store', location: '' }];
      const mockDepartments = [{ id: 1, name: 'Single Dept', store_id: 1, sort_order: 0 }];
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);

      // Re-initialize with single department
      initStoreAdmin();
      await new Promise(resolve => setTimeout(resolve, 0));

      const deptItems = container.querySelectorAll('.department-item');
      expect(deptItems.length).toBe(1);

      const upBtn = deptItems[0].querySelector('.up-btn') as HTMLButtonElement;
      const downBtn = deptItems[0].querySelector('.down-btn') as HTMLButtonElement;

      expect(upBtn.disabled).toBe(true);
      expect(downBtn.disabled).toBe(true);
    });

    it('should not call API when clicking reorder button on single department', async () => {
      const mockStores = [{ id: 1, name: 'Test Store', location: '' }];
      const mockDepartments = [{ id: 1, name: 'Single Dept', store_id: 1, sort_order: 0 }];
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue(mockStores);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue(mockDepartments);

      // Re-initialize with single department
      initStoreAdmin();
      await new Promise(resolve => setTimeout(resolve, 0));

      const deptItems = container.querySelectorAll('.department-item');
      const upBtn = deptItems[0].querySelector('.up-btn') as HTMLButtonElement;

      // Remove disabled to allow the click to trigger the handler (testing the guard clause)
      upBtn.disabled = false;
      upBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Should not call updateDepartment because allDeptItems.length < 2 (line 246)
      expect(api.updateDepartment).not.toHaveBeenCalled();
    });

    it('should not reorder when department ID not found in DOM list', async () => {
      // Test the edge case where button's department ID doesn't match any item's data-department-id
      // This could happen due to DOM manipulation or race conditions
      const deptItems = container.querySelectorAll('.department-item');
      const secondDeptItem = deptItems[1] as HTMLElement;
      const secondUpBtn = secondDeptItem.querySelector('.up-btn') as HTMLButtonElement;

      // Change the button's departmentId to a non-existent ID
      // but leave the department-item's ID unchanged
      secondUpBtn.dataset.departmentId = '99999';

      secondUpBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Should not call updateDepartment because currentIndex will be -1 (line 255)
      expect(api.updateDepartment).not.toHaveBeenCalled();
    });

    it('should not reorder when swap index is out of bounds (already at first)', async () => {
      // Setup a scenario where the button exists but swap would be out of bounds
      // By manually modifying the DOM, we can test the swapIndex < 0 condition
      const deptItems = container.querySelectorAll('.department-item');
      const firstDeptItem = deptItems[0] as HTMLElement;
      const firstUpBtn = firstDeptItem.querySelector('.up-btn') as HTMLButtonElement;

      // Force enable the button to test the bounds check
      firstUpBtn.disabled = false;
      firstUpBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Should not call updateDepartment because swapIndex would be -1
      expect(api.updateDepartment).not.toHaveBeenCalled();
    });

    it('should not reorder when swap index is out of bounds (already at last)', async () => {
      // Test when trying to move down from the last position
      const deptItems = container.querySelectorAll('.department-item');
      const lastDeptItem = deptItems[deptItems.length - 1] as HTMLElement;
      const lastDownBtn = lastDeptItem.querySelector('.down-btn') as HTMLButtonElement;

      // Force enable the button to test the bounds check
      lastDownBtn.disabled = false;
      lastDownBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Should not call updateDepartment because swapIndex would be >= allDeptItems.length
      expect(api.updateDepartment).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      (api.fetchStores as jest.MockedFunction<typeof api.fetchStores>).mockResolvedValue([]);
      (api.fetchDepartments as jest.MockedFunction<typeof api.fetchDepartments>).mockResolvedValue([]);
      initStoreAdmin();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    it('should navigate back to app when back button is clicked', () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      const backBtn = document.getElementById('backToAppBtn') as HTMLButtonElement;
      backBtn.click();

      expect(window.location.href).toBe('/app');
    });
  });
});
