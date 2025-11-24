/**
 * Shopping list UI module.
 * Handles all UI interactions for the shopping list feature.
 */

import { shoppingListState } from '../state/shopping-list-state.js';
import { renderItems } from '../data/dom.js';
import {
  fetchStores,
  fetchDepartments,
  convertItemToProduct,
  deleteItemsBeforeDate,
  fetchTemplates,
  getProductSuggestions,
  fetchItems,
  type Department,
  type ProductSuggestion,
  type Item,
} from '../data/api.js';
import { Modal } from './components/modal.js';
import { createButton } from './components/button.js';
import { showError, showSuccess } from './components/toast.js';
import { createDatePicker, type DatePickerInstance } from './components/datepicker.js';
import { Autocomplete } from './components/autocomplete.js';

// Current selected store ID (null = all stores)
let selectedStoreId: number | null = null;

/**
 * Get the currently selected store ID.
 * @returns The selected store ID or null if no store is selected
 */
export function getSelectedStoreId(): number | null {
  return selectedStoreId;
}

// DatePicker instance for shopping date selection
let shoppingDatePicker: DatePickerInstance | null = null;

// Current selected shopping date for filtering (ISO format YYYY-MM-DD)
let selectedShoppingDate: string | null = null;

/**
 * Handle edit button click - show department selection dialog
 */
async function handleEditItem(itemId: string): Promise<void> {
  if (!selectedStoreId) {
    showError('Bitte wählen Sie ein Geschäft aus, um eine Abteilung zuzuweisen.');
    return;
  }

  // Fetch departments for the selected store
  const departments = await fetchDepartments(selectedStoreId);

  if (!departments || departments.length === 0) {
    showError('Keine Abteilungen für dieses Geschäft vorhanden.');
    return;
  }

  // Create a simple dialog with department selection
  const departmentId = await showDepartmentSelectionDialog(departments);

  if (departmentId !== null) {
    // Convert item to product with selected department
    const updatedItem = await convertItemToProduct(itemId, departmentId);

    if (updatedItem) {
      // Reload all items since convert-to-product updates all items with the same name
      await shoppingListState.loadItems();
      // UI updates automatically via state subscription
      showSuccess('Produkt erfolgreich zugewiesen');
    } else {
      showError('Fehler beim Zuweisen der Abteilung.');
    }
  }
}

/**
 * Show print preview dialog
 */
async function showPrintPreview(): Promise<boolean> {
  return new Promise(async (resolve) => {
    const items = shoppingListState.getItems();
    const filteredItems = filterItems(items);

    if (filteredItems.length === 0) {
      showError('Keine Einträge zum Drucken vorhanden.');
      resolve(false);
      return;
    }

    // Extract unique shopping dates from items
    const uniqueDates = Array.from(new Set(
      filteredItems
        .filter(item => item.shopping_date)
        .map(item => item.shopping_date)
    )).sort(); // Sort dates in ascending order

    // Default to currently selected date in shopping date picker, or smallest date
    let selectedDate: string | null = null;
    if (shoppingDatePicker) {
      const dateValue = shoppingDatePicker.getValue();
      if (dateValue) {
        // Convert to ISO format (YYYY-MM-DD)
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        const isoDate = `${year}-${month}-${day}`;
        // Only use it if it's in the list of available dates
        selectedDate = uniqueDates.includes(isoDate) ? isoDate : null;
      }
    }
    // Fallback to smallest date if no valid date from picker
    if (!selectedDate) {
      selectedDate = uniqueDates.length > 0 ? uniqueDates[0] : null;
    }

    // Get stores for dropdown
    const allStores = await fetchStores();

    // Get initial store name and ID
    const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
    let currentStoreName = selectedStoreId
      ? storeFilter.options[storeFilter.selectedIndex].text
      : 'Alle Geschäfte';
    let currentStoreId: number | null = selectedStoreId;

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop print-preview-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'print-preview-dialog';
    dialog.style.cssText = `
      background: white;
      border-radius: 8px;
      max-width: 900px;
      width: 90%;
      max-height: 85vh;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
    `;

    // Title (fixed at top)
    const title = document.createElement('h3');
    title.textContent = 'Druckvorschau (DIN A4 Querformat → falten zu A5 Heft)';
    title.style.cssText = 'margin: 0; padding: 1.5rem 2rem; border-bottom: 1px solid #e0e0e0; flex-shrink: 0;';
    dialog.appendChild(title);

    // Scrollable content area
    const scrollableArea = document.createElement('div');
    scrollableArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem 2rem;
    `;

    // A4 Landscape Preview Container
    const a4Container = document.createElement('div');
    a4Container.style.cssText = `
      background: #f9f9f9;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      display: flex;
      gap: 2px;
      justify-content: center;
    `;

    // Left A5 page (Front - Shopping List)
    const previewContent = document.createElement('div');
    previewContent.className = 'print-preview-content a5-preview-page';
    previewContent.style.cssText = `
      background: white;
      padding: 10mm;
      border: 1px solid #999;
      width: 148.5mm;
      min-height: 200mm;
      box-sizing: border-box;
      font-size: 0.85rem;
    `;

    // Right A5 page (Back - Notes or continuation of list)
    const backPage = document.createElement('div');
    backPage.className = 'a5-preview-page back-page';
    backPage.style.cssText = `
      background: white;
      padding: 10mm;
      border: 1px solid #999;
      border-left: 2px dashed #999;
      width: 148.5mm;
      min-height: 200mm;
      box-sizing: border-box;
      font-size: 0.85rem;
    `;

    // Function to filter items by selected date
    const filterItemsByDate = (itemsToFilter: any[], date: string | null): any[] => {
      if (!date) {
        return itemsToFilter;
      }
      return itemsToFilter.filter(item => item.shopping_date === date);
    };

    // Function to render print preview content
    const renderPrintContent = (itemsToRender: any[]) => {
      // Clear existing content
      previewContent.innerHTML = '';
      backPage.innerHTML = '';

      // Header info
      const header = document.createElement('div');
      header.style.cssText = 'margin-bottom: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;';

      // Store dropdown
      const storeDropdown = document.createElement('select');
      storeDropdown.style.cssText = 'font-size: 1.2rem; font-weight: bold; padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';

      // Add "Alle Geschäfte" option
      const allStoresOption = document.createElement('option');
      allStoresOption.value = '';
      allStoresOption.textContent = 'Alle Geschäfte';
      storeDropdown.appendChild(allStoresOption);

      // Add store options
      allStores.forEach(store => {
        const option = document.createElement('option');
        option.value = store.id.toString();
        option.textContent = store.name;
        storeDropdown.appendChild(option);
      });

      // Set default to current store
      if (currentStoreId) {
        storeDropdown.value = currentStoreId.toString();
      }

      // Date dropdown
      const dateDropdown = document.createElement('select');
      dateDropdown.style.cssText = 'color: #666; font-size: 0.8rem; padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;';

      // Add "Alle Daten" option
      const allDatesOption = document.createElement('option');
      allDatesOption.value = '';
      allDatesOption.textContent = 'Alle Daten';
      dateDropdown.appendChild(allDatesOption);

      // Add date options
      uniqueDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        // Format date as DD.MM.YYYY for display
        const dateObj = new Date(date + 'T00:00:00');
        option.textContent = dateObj.toLocaleDateString('de-DE');
        dateDropdown.appendChild(option);
      });

      // Set default to smallest date
      if (selectedDate) {
        dateDropdown.value = selectedDate;
      }

      // Handle store selection change
      storeDropdown.addEventListener('change', async () => {
        const newStoreId = storeDropdown.value ? parseInt(storeDropdown.value) : null;
        currentStoreId = newStoreId;
        currentStoreName = newStoreId
          ? allStores.find(s => s.id === newStoreId)?.name || 'Alle Geschäfte'
          : 'Alle Geschäfte';

        if (currentStoreId === null) {
          // Show all stores
          await renderAllStoresContent(selectedDate);
        } else {
          // Filter items by selected store
          const allItems = shoppingListState.getItems();
          const storeFilteredItems = allItems.filter(item => item.store_id === currentStoreId);
          const dateFilteredItems = filterItemsByDate(storeFilteredItems, selectedDate);
          renderPrintContent(dateFilteredItems);
        }
      });

      // Handle date selection change
      dateDropdown.addEventListener('change', async () => {
        selectedDate = dateDropdown.value || null;
        if (currentStoreId === null) {
          await renderAllStoresContent(selectedDate);
        } else {
          const allItems = shoppingListState.getItems();
          const storeFilteredItems = allItems.filter(item => item.store_id === currentStoreId);
          const dateFilteredItems = filterItemsByDate(storeFilteredItems, selectedDate);
          renderPrintContent(dateFilteredItems);
        }
      });

      header.appendChild(storeDropdown);
      header.appendChild(dateDropdown);
      previewContent.appendChild(header);

      // Group items by department/store with sort_order tracking
      const groupedItems = new Map<string, { items: any[]; sortOrder: number }>();
      itemsToRender.forEach(item => {
        const key = item.department_name || 'Sonstiges';
        if (!groupedItems.has(key)) {
          groupedItems.set(key, {
            items: [],
            sortOrder: item.department_sort_order ?? 999, // Default high value for undefined sort_order
          });
        }
        groupedItems.get(key)!.items.push(item);
      });

      // Calculate if content fits on one page (estimate ~70 lines total for 2 columns = ~35 per column)
      const totalItems = itemsToRender.length;
      const departmentCount = groupedItems.size;
      const estimatedLines = totalItems + (departmentCount * 2); // items + department headers
      const fitsOnOnePage = estimatedLines <= 70; // 2 columns with ~35 lines each

      // Sort departments by sort_order before rendering
      const sortedDepartments = Array.from(groupedItems.entries()).sort(
        ([, a], [, b]) => a.sortOrder - b.sortOrder
      );

      // Render grouped items on first page
      const itemsArray = sortedDepartments;
      const midPoint = fitsOnOnePage ? itemsArray.length : Math.ceil(itemsArray.length / 2);

      // Create column container for first page items (flowing layout)
      const twoColumnContainer = document.createElement('div');
      twoColumnContainer.className = 'two-column-layout';
      twoColumnContainer.style.cssText = `
        column-count: 2;
        column-gap: 1rem;
      `;

      // First page items
      itemsArray.slice(0, midPoint).forEach(([departmentName, { items }], idx) => {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 0.5rem; break-inside: avoid;';

        const deptTitle = document.createElement('h4');
        deptTitle.textContent = departmentName;
        // First department has no top margin
        const topMargin = idx === 0 ? '0' : '0.6rem';
        deptTitle.style.cssText = `margin: ${topMargin} 0 0.2rem 0; color: #333; font-size: 0.9rem; font-weight: bold;`;
        deptTitle.className = 'department-title';
        section.appendChild(deptTitle);

        const itemList = document.createElement('ul');
        itemList.style.cssText = 'margin: 0; padding-left: 0; list-style: none;';

        items.forEach(item => {
          const li = document.createElement('li');
          li.style.cssText = 'margin-bottom: 0.1rem; line-height: 1.15; font-size: 0.85rem;';
          li.textContent = item.menge ? `${item.name} (${item.menge})` : item.name;
          itemList.appendChild(li);
        });

        section.appendChild(itemList);
        twoColumnContainer.appendChild(section);
      });

      previewContent.appendChild(twoColumnContainer);

      // Render back page
      if (fitsOnOnePage) {
        // Show notes section if content fits on one page
        const notesTitle = document.createElement('h2');
        notesTitle.textContent = 'Notizen';
        notesTitle.style.cssText = 'margin: 0 0 1rem 0; font-size: 1.2rem;';
        backPage.appendChild(notesTitle);

        const notesLines = document.createElement('div');
        notesLines.style.cssText = 'margin-top: 1rem;';
        for (let i = 0; i < 20; i++) {
          const line = document.createElement('div');
          line.style.cssText = 'border-bottom: 1px solid #ddd; height: 1.2rem; margin-bottom: 0.3rem;';
          notesLines.appendChild(line);
        }
        backPage.appendChild(notesLines);
      } else {
        // Continue list on back page - header with same date dropdown
        const backHeader = document.createElement('div');
        backHeader.style.cssText = 'margin-bottom: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;';

        const continueTitle = document.createElement('h2');
        continueTitle.textContent = `${currentStoreName} (Fortsetzung)`;
        continueTitle.style.cssText = 'margin: 0; font-size: 1.2rem;';

        const backDateInfo = document.createElement('span');
        backDateInfo.textContent = selectedDate
          ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE')
          : 'Alle Daten';
        backDateInfo.style.cssText = 'color: #666; font-size: 0.8rem;';

        backHeader.appendChild(continueTitle);
        backHeader.appendChild(backDateInfo);
        backPage.appendChild(backHeader);

        // Create column container for back page items (flowing layout)
        const backTwoColumnContainer = document.createElement('div');
        backTwoColumnContainer.className = 'two-column-layout';
        backTwoColumnContainer.style.cssText = `
          column-count: 2;
          column-gap: 1rem;
        `;

        // Render remaining items
        itemsArray.slice(midPoint).forEach(([departmentName, { items }], idx) => {
          const section = document.createElement('div');
          section.style.cssText = 'margin-bottom: 0.5rem; break-inside: avoid;';

          const deptTitle = document.createElement('h4');
          deptTitle.textContent = departmentName;
          // First department on back page has no top margin
          const topMargin = idx === 0 ? '0' : '0.6rem';
          deptTitle.style.cssText = `margin: ${topMargin} 0 0.2rem 0; color: #333; font-size: 0.9rem; font-weight: bold;`;
          deptTitle.className = 'department-title';
          section.appendChild(deptTitle);

          const itemList = document.createElement('ul');
          itemList.style.cssText = 'margin: 0; padding-left: 0; list-style: none;';

          items.forEach(item => {
            const li = document.createElement('li');
            li.style.cssText = 'margin-bottom: 0.1rem; line-height: 1.15; font-size: 0.85rem;';
            li.textContent = item.menge ? `${item.name} (${item.menge})` : item.name;
            itemList.appendChild(li);
          });

          section.appendChild(itemList);
          backTwoColumnContainer.appendChild(section);
        });

        backPage.appendChild(backTwoColumnContainer);
      }
    };

    // Add both pages to container
    a4Container.appendChild(previewContent);
    a4Container.appendChild(backPage);
    scrollableArea.appendChild(a4Container);

    // Checkboxes for options
    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = 'margin-bottom: 0; display: flex; gap: 1.5rem; flex-wrap: wrap;';

    // Checkbox for hiding department titles
    const checkboxLabel = document.createElement('label');
    checkboxLabel.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; cursor: pointer;';

    const hideDeptCheckbox = document.createElement('input');
    hideDeptCheckbox.type = 'checkbox';
    hideDeptCheckbox.id = 'hideDepartmentsCheckbox';
    hideDeptCheckbox.style.cssText = 'cursor: pointer;';

    const labelText = document.createElement('span');
    labelText.textContent = 'Abteilungsüberschriften ausblenden';
    labelText.style.cssText = 'font-size: 0.9rem;';

    checkboxLabel.appendChild(hideDeptCheckbox);
    checkboxLabel.appendChild(labelText);
    optionsContainer.appendChild(checkboxLabel);
    scrollableArea.appendChild(optionsContainer);

    // Add scrollable area to dialog
    dialog.appendChild(scrollableArea);

    // Function to render multi-store content (all stores grouped by store)
    const renderAllStoresContent = async (date: string | null) => {
      // Fetch ALL items from API (not filtered by store)
      const allItems = await fetchItems();
      const itemsToShow = date ? allItems.filter((i: Item) => i.shopping_date === date) : allItems;

      if (itemsToShow.length === 0) {
        previewContent.innerHTML = '<p>Keine Artikel gefunden.</p>';
        backPage.innerHTML = '<h3>Notizen</h3>';
        return;
      }

      const stores = await fetchStores();

      // Group items by store
      const itemsByStore = new Map<number, Item[]>();
      itemsToShow.forEach((item: Item) => {
        if (item.store_id) {
          if (!itemsByStore.has(item.store_id)) {
            itemsByStore.set(item.store_id, []);
          }
          itemsByStore.get(item.store_id)!.push(item);
        }
      });

      // Sort items within each store by department
      itemsByStore.forEach((storeItems) => {
        storeItems.sort((a, b) => {
          const deptA = a.department_sort_order ?? 999;
          const deptB = b.department_sort_order ?? 999;
          if (deptA !== deptB) {
            return deptA - deptB;
          }
          return (a.name || '').localeCompare(b.name || '');
        });
      });

      // Sort stores by sort_order
      const sortedStores = stores
        .filter((store) => itemsByStore.has(store.id))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      // Build array of store sections with their department sections
      const allStoreSections: Array<{ type: 'store' | 'department'; element: HTMLElement; store?: string }> = [];

      sortedStores.forEach((store, index) => {
        const storeItems = itemsByStore.get(store.id)!;

        // Store header (not wrapped in section, so it can flow)
        const storeHeader = document.createElement('h3');
        storeHeader.textContent = store.name;
        // First store header has no top margin
        const topMargin = index === 0 ? '0' : '0.8rem';
        storeHeader.style.cssText = `margin: ${topMargin} 0 0.3rem 0; color: #000; font-size: 1rem; font-weight: bold; border-bottom: 1px solid #666; padding-bottom: 0.2rem;`;
        allStoreSections.push({ type: 'store', element: storeHeader, store: store.name });

        // Group items by department with sort order
        const itemsByDept = new Map<string, { items: Item[]; sortOrder: number }>();
        storeItems.forEach((item) => {
          const deptName = item.department_name || 'Sonstiges';
          if (!itemsByDept.has(deptName)) {
            itemsByDept.set(deptName, {
              items: [],
              sortOrder: item.department_sort_order ?? 999,
            });
          }
          itemsByDept.get(deptName)!.items.push(item);
        });

        // Sort departments by sort_order
        const sortedDepartments = Array.from(itemsByDept.entries()).sort(
          ([, a], [, b]) => a.sortOrder - b.sortOrder
        );

        // Build department sections
        sortedDepartments.forEach(([deptName, { items: deptItems }]) => {
          const deptSection = document.createElement('div');
          deptSection.style.cssText = 'margin-bottom: 0.5rem; break-inside: avoid;';

          const deptTitle = document.createElement('h4');
          deptTitle.textContent = deptName;
          deptTitle.style.cssText = 'margin: 0.6rem 0 0.2rem 0; color: #333; font-size: 0.9rem; font-weight: bold;';
          deptTitle.className = 'department-title';
          deptSection.appendChild(deptTitle);

          const itemList = document.createElement('ul');
          itemList.style.cssText = 'margin: 0; padding-left: 0; list-style: none;';

          deptItems.forEach((item) => {
            const li = document.createElement('li');
            li.style.cssText = 'margin-bottom: 0.1rem; line-height: 1.15; font-size: 0.85rem;';
            li.textContent = item.menge ? `${item.name} (${item.menge})` : item.name;
            itemList.appendChild(li);
          });

          deptSection.appendChild(itemList);
          allStoreSections.push({ type: 'department', element: deptSection });
        });
      });

      // Calculate if content fits on one page (estimate ~70 lines total for 2 columns = ~35 per column)
      const totalItems = itemsToShow.length;
      const departmentCount = allStoreSections.filter(s => s.type === 'department').length;
      const storeCount = sortedStores.length;
      const estimatedLines = totalItems + (departmentCount * 2) + (storeCount * 2); // items + dept headers + store headers
      const fitsOnOnePage = estimatedLines <= 70;

      // Determine split point
      const midPoint = fitsOnOnePage ? allStoreSections.length : Math.ceil(allStoreSections.length / 2);

      // Create two-column container for front page
      const frontColumnContainer = document.createElement('div');
      frontColumnContainer.className = 'two-column-layout';
      frontColumnContainer.style.cssText = `
        column-count: 2;
        column-gap: 1rem;
      `;

      // Add first half to front page
      allStoreSections.slice(0, midPoint).forEach(({ element }) => {
        frontColumnContainer.appendChild(element);
      });

      // Render front page
      previewContent.innerHTML = '';
      previewContent.appendChild(frontColumnContainer);

      // Render back page
      backPage.innerHTML = '';

      if (fitsOnOnePage) {
        // Show notes section if content fits on one page
        const notesTitle = document.createElement('h2');
        notesTitle.textContent = 'Notizen';
        notesTitle.style.cssText = 'margin: 0 0 1rem 0; font-size: 1.2rem;';
        backPage.appendChild(notesTitle);

        const notesLines = document.createElement('div');
        notesLines.style.cssText = 'margin-top: 1rem;';
        for (let i = 0; i < 20; i++) {
          const line = document.createElement('div');
          line.style.cssText = 'border-bottom: 1px solid #ddd; height: 1.2rem; margin-bottom: 0.3rem;';
          notesLines.appendChild(line);
        }
        backPage.appendChild(notesLines);
      } else {
        // Continue list on back page
        const backHeader = document.createElement('div');
        backHeader.style.cssText = 'margin-bottom: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;';

        const continueTitle = document.createElement('h2');
        continueTitle.textContent = 'Alle Geschäfte (Fortsetzung)';
        continueTitle.style.cssText = 'margin: 0; font-size: 1.2rem;';

        const backDateInfo = document.createElement('span');
        backDateInfo.textContent = date
          ? new Date(date + 'T00:00:00').toLocaleDateString('de-DE')
          : 'Alle Daten';
        backDateInfo.style.cssText = 'color: #666; font-size: 0.8rem;';

        backHeader.appendChild(continueTitle);
        backHeader.appendChild(backDateInfo);
        backPage.appendChild(backHeader);

        // Create two-column container for back page
        const backColumnContainer = document.createElement('div');
        backColumnContainer.className = 'two-column-layout';
        backColumnContainer.style.cssText = `
          column-count: 2;
          column-gap: 1rem;
        `;

        // Add second half to back page
        allStoreSections.slice(midPoint).forEach(({ element, type }, idx) => {
          // Remove top margin from first store header on back page
          if (idx === 0 && type === 'store') {
            const h3 = element as HTMLHeadingElement;
            h3.style.marginTop = '0';
          }
          backColumnContainer.appendChild(element);
        });

        backPage.appendChild(backColumnContainer);
      }
    };

    // Update preview when department titles checkbox changes
    hideDeptCheckbox.addEventListener('change', () => {
      const frontDeptTitles = previewContent.querySelectorAll('.department-title');
      const backDeptTitles = backPage.querySelectorAll('.department-title');

      frontDeptTitles.forEach(title => {
        if (hideDeptCheckbox.checked) {
          (title as HTMLElement).style.display = 'none';
        } else {
          (title as HTMLElement).style.display = '';
        }
      });

      backDeptTitles.forEach(title => {
        if (hideDeptCheckbox.checked) {
          (title as HTMLElement).style.display = 'none';
        } else {
          (title as HTMLElement).style.display = '';
        }
      });
    });

    // Initial render with filtered items (by default, use smallest date)
    // If no store selected (currentStoreId is null), render multi-store view
    if (currentStoreId === null) {
      renderAllStoresContent(selectedDate);
    } else {
      const initialFilteredItems = filterItemsByDate(filteredItems, selectedDate);
      renderPrintContent(initialFilteredItems);
    }

    // Button container (fixed at bottom)
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 1rem; padding: 1.5rem 2rem; border-top: 1px solid #e0e0e0; flex-shrink: 0;';

    // Print button
    const printBtn = createButton({
      label: '🖨️ Drucken',
      variant: 'primary',
      onClick: () => {
        document.body.removeChild(backdrop);
        // Trigger browser print with the preview content
        const hideDepartments = hideDeptCheckbox.checked;
        const backPageContent = backPage.innerHTML;
        const titleForPrint = currentStoreName;
        // Pass the selected date for printing
        printPreviewContent(previewContent.innerHTML, backPageContent, titleForPrint, hideDepartments, selectedDate);
        resolve(true);
      }
    });
    printBtn.style.flex = '1';
    buttonContainer.appendChild(printBtn);

    // Cancel button
    const cancelBtn = createButton({
      label: '❌ Abbrechen',
      variant: 'secondary',
      ariaLabel: 'Abbrechen',
      onClick: () => {
        document.body.removeChild(backdrop);
        resolve(false);
      }
    });
    cancelBtn.style.flex = '1';
    buttonContainer.appendChild(cancelBtn);

    dialog.appendChild(buttonContainer);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        document.body.removeChild(backdrop);
        resolve(false);
      }
    });
  });
}

/**
 * Print preview content using browser print dialog
 */
function printPreviewContent(frontContent: string, backContent: string, storeName: string, hideDepartments: boolean = false, selectedDate: string | null = null): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showError('Popup-Blocker verhindert das Drucken. Bitte erlauben Sie Popups für diese Seite.');
    return;
  }

  // Replace dropdowns with static text in the content
  let processedFrontContent = frontContent;
  let processedBackContent = backContent;

  // First, replace store dropdown with static store name
  processedFrontContent = processedFrontContent.replace(
    /<select[^>]*>[\s\S]*?<\/select>/,
    `<span style="font-size: 1.2rem; font-weight: bold;">${storeName}</span>`
  );

  // Then, replace date dropdown with static date
  if (selectedDate) {
    // Format date for display
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('de-DE');

    processedFrontContent = processedFrontContent.replace(
      /<select[^>]*>[\s\S]*?<\/select>/,
      `<span style="color: #666; font-size: 0.8rem;">${formattedDate}</span>`
    );
    processedBackContent = processedBackContent.replace(
      /<span[^>]*>(\d{2}\.\d{2}\.\d{4}|Alle Daten)<\/span>/,
      `<span style="color: #666; font-size: 0.8rem;">${formattedDate}</span>`
    );
  } else {
    // If no date selected, show "Alle Daten"
    processedFrontContent = processedFrontContent.replace(
      /<select[^>]*>[\s\S]*?<\/select>/,
      '<span style="color: #666; font-size: 0.8rem;">Alle Daten</span>'
    );
  }

  const bodyClass = hideDepartments ? ' class="hide-departments"' : '';

  const printDocument = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>${storeName}</title>
      <style>
        /* DIN A4 landscape with two A5 pages side by side */
        @page {
          size: A4 landscape;
          margin: 0;
        }

        body {
          font-family: Arial, sans-serif;
          line-height: 1.1;
          color: #333;
          margin: 0;
          padding: 0;
        }

        /* Container for the two A5 pages */
        .print-container {
          display: flex;
          width: 297mm; /* A4 landscape width */
          height: 210mm; /* A4 landscape height */
        }

        /* Each A5 page (half of A4 landscape) */
        .a5-page {
          width: 148.5mm; /* Half of A4 landscape width */
          height: 210mm;
          padding: 10mm;
          box-sizing: border-box;
          page-break-inside: avoid;
        }

        /* Left page (front) */
        .a5-page.front {
          border-right: 1px dashed #ccc; /* Fold line indicator */
        }

        /* Right page (back) */
        .a5-page.back {
          /* Empty for now, can be used for additional info */
        }

        h2 {
          margin: 0 0 0.3rem 0;
          font-size: 1.2rem;
        }

        p {
          margin: 0 0 0.5rem 0;
          font-size: 0.8rem;
        }

        h4.department-title {
          margin: 0.6rem 0 0.2rem 0;
          color: #333;
          font-size: 0.9rem;
          font-weight: bold;
        }

        ul {
          margin: 0;
          padding-left: 0;
          list-style: none;
        }

        li {
          margin-bottom: 0.1rem;
          line-height: 1.15;
          font-size: 0.85rem;
        }

        .print-preview-content {
          padding: 0;
          background: white;
          border: none;
        }

        /* 2-column layout for items (flowing, space-efficient) */
        .two-column-layout {
          column-count: 2;
          column-gap: 1rem;
        }

        /* Prevent department sections from breaking across columns */
        .two-column-layout > div {
          break-inside: avoid;
          page-break-inside: avoid;
          display: inline-block;
          width: 100%;
          margin-bottom: 0.5rem;
        }

        /* Hide department titles when requested */
        .hide-departments h4.department-title {
          display: none;
        }
        .hide-departments div[style*="margin-bottom: 0.5rem"] {
          margin-bottom: 0.3rem;
        }

        /* Remove dashed line for actual printing */
        @media print {
          .a5-page.front {
            border-right: none;
          }
        }
      </style>
    </head>
    <body${bodyClass}>
      <div class="print-container">
        <div class="a5-page front">
          ${processedFrontContent}
        </div>
        <div class="a5-page back">
          ${processedBackContent}
        </div>
      </div>
    </body>
    </html>
  `;

  // Use document.write for print window (standard practice for printing)
  printWindow.document.open();
  // @ts-ignore - document.write is deprecated in general but acceptable for print windows
  printWindow.document.write(printDocument);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Close after printing (user can cancel)
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };
}

/**
 * Show multi-store print preview with date selection
 */

/**
 * Show a modal dialog for department selection
 */
function showDepartmentSelectionDialog(
  departments: Department[]
): Promise<number | null> {
  return new Promise((resolve) => {
    // Create modal content
    const modalContent = document.createElement('div');

    const description = document.createElement('p');
    description.textContent =
      'Wähle eine Abteilung, um dieses Produkt dem Katalog hinzuzufügen:';
    description.style.cssText = 'margin-bottom: 1rem; color: #666;';
    modalContent.appendChild(description);

    // Create department list
    const list = document.createElement('div');
    list.style.cssText = 'margin-bottom: 1.5rem; max-height: 300px; overflow-y: auto;';

    departments.forEach((dept) => {
      const btn = createButton({
        label: dept.name,
        variant: 'secondary',
        onClick: () => {
          modal.close();
          resolve(dept.id);
        },
      });
      btn.style.cssText = `
        display: block;
        width: 100%;
        margin-bottom: 0.5rem;
        text-align: left;
      `;
      list.appendChild(btn);
    });

    modalContent.appendChild(list);

    // Create cancel button
    const cancelBtn = createButton({
      label: '❌ Abbrechen',
      variant: 'secondary',
      onClick: () => {
        modal.close();
        resolve(null);
      },
    });
    cancelBtn.style.width = '100%';
    modalContent.appendChild(cancelBtn);

    // Create and open modal
    const modal = new Modal({
      title: 'Abteilung auswählen',
      content: modalContent,
      size: 'small',
      closeOnBackdropClick: true,
      closeOnEscape: true,
      onClose: () => resolve(null),
    });

    modal.open();
  });
}

/**
 * Show a modal dialog for selecting a date to delete items before
 */
export function showDeleteByDateDialog(): Promise<void> {
  return new Promise((resolve) => {
    // Create modal content
    const modalContent = document.createElement('div');

    // Get store name for display
    const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
    const storeName = selectedStoreId
      ? storeFilter.options[storeFilter.selectedIndex]?.text || 'Ausgewähltes Geschäft'
      : 'alle Geschäfte';

    const description = document.createElement('p');
    description.textContent =
      `Wählen Sie ein Datum. Alle Items für ${storeName} mit einem Einkaufsdatum vor diesem Datum werden gelöscht:`;
    description.style.cssText = 'margin-bottom: 1rem; color: #666;';
    modalContent.appendChild(description);

    // Create DatePicker container
    const datePickerContainer = document.createElement('div');
    datePickerContainer.style.cssText = 'margin-bottom: 1.5rem; overflow: visible; position: relative; z-index: 100;';

    const datePicker = createDatePicker({
      placeholder: 'Datum auswählen',
      format: 'dd.MM.yyyy',
      value: new Date(),
    });
    datePickerContainer.appendChild(datePicker.container);
    modalContent.appendChild(datePickerContainer);

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 0.5rem;';

    // Create delete button
    const deleteBtn = createButton({
      label: '🗑️ Löschen',
      variant: 'primary',
      onClick: async () => {
        const selectedDate = datePicker.getValue();
        if (!selectedDate) {
          showError('Bitte wählen Sie ein Datum aus.');
          return;
        }

        // Convert to ISO format (YYYY-MM-DD) using local time, not UTC
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const isoDate = `${year}-${month}-${day}`;

        // Confirm deletion
        const confirmed = confirm(
          `Möchten Sie wirklich alle Items mit Einkaufsdatum vor dem ${selectedDate.toLocaleDateString('de-DE')} löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
        );

        if (!confirmed) {
          return;
        }

        modal.close();

        // Delete items (pass selectedStoreId if a store is selected)
        const deletedCount = await deleteItemsBeforeDate(
          isoDate,
          selectedStoreId || undefined
        );

        if (deletedCount > 0) {
          showSuccess(`${deletedCount} Items erfolgreich gelöscht.`);
          // Reload items to reflect changes
          await shoppingListState.loadItems();
        } else {
          showError('Keine Items gefunden oder Fehler beim Löschen.');
        }

        resolve();
      },
    });
    deleteBtn.style.flex = '1';
    buttonContainer.appendChild(deleteBtn);

    // Create cancel button
    const cancelBtn = createButton({
      label: '❌ Abbrechen',
      variant: 'secondary',
      onClick: () => {
        modal.close();
        resolve();
      },
    });
    cancelBtn.style.flex = '1';
    buttonContainer.appendChild(cancelBtn);

    modalContent.appendChild(buttonContainer);

    // Create and open modal
    const modal = new Modal({
      title: 'Items vor Datum löschen',
      content: modalContent,
      size: 'medium',
      closeOnBackdropClick: true,
      closeOnEscape: true,
      onClose: () => resolve(),
    });

    modal.open();

    // After modal is opened, adjust positioning and overflow for DatePicker
    setTimeout(() => {
      const modalContentEl = document.querySelector('.modal-content') as HTMLElement;
      const modalDialogEl = document.querySelector('.modal-dialog') as HTMLElement;
      if (modalContentEl) {
        modalContentEl.style.overflow = 'visible';
        modalContentEl.style.minHeight = '350px';

        // Add click handler to close DatePicker calendar when clicking elsewhere in modal
        modalContentEl.addEventListener('click', (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          // Check if click is outside the DatePicker container and calendar
          const datePickerContainerEl = modalContentEl.querySelector('.datepicker-container');
          const calendar = document.querySelector('.datepicker-calendar');

          if (datePickerContainerEl && calendar &&
              !datePickerContainerEl.contains(target) &&
              !calendar.contains(target)) {
            // Simulate clicking outside by dispatching a click event to document body
            // This triggers the DatePicker's own handleClickOutside handler
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            document.body.dispatchEvent(clickEvent);
          }
        });
      }
      if (modalDialogEl) {
        // Position modal higher on the screen to make room for DatePicker calendar
        modalDialogEl.style.top = '30%';
        modalDialogEl.style.transform = 'translate(-50%, -30%) scale(1)';
      }
    }, 50);
  });
}

/**
 * Load and display all items from state.
 */
export async function loadItems(): Promise<void> {
  await shoppingListState.loadItems();
  // Rendering is handled by state subscription
}

/**
 * Load stores into the filter dropdown.
 */
async function loadStoreFilter(): Promise<void> {
  const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
  if (!storeFilter) return;

  const stores = await fetchStores();

  // Clear existing options except first (Alle Geschäfte)
  while (storeFilter.options.length > 1) {
    storeFilter.remove(1);
  }

  // Add store options
  stores.forEach(store => {
    const option = document.createElement('option');
    option.value = store.id.toString();
    option.textContent = store.name;
    storeFilter.appendChild(option);
  });

  // Select first store by default if stores exist
  if (stores.length > 0) {
    storeFilter.value = stores[0].id.toString();
    selectedStoreId = stores[0].id;
    // Trigger re-render with filtered items
    const items = shoppingListState.getItems();
    const filteredItems = filterItems(items);
    renderItems(filteredItems);
  }
}

/**
 * Filter items by selected store and shopping date.
 */
function filterItems(items: any[]): any[] {
  let filtered = items;

  // Filter by store
  if (selectedStoreId !== null) {
    filtered = filtered.filter(item => item.store_id === selectedStoreId);
  }

  // Filter by shopping date
  if (selectedShoppingDate !== null) {
    filtered = filtered.filter(item => item.shopping_date === selectedShoppingDate);
  }

  return filtered;
}

/**
 * Extract unique shopping dates from all items for DatePicker highlighting.
 */
function extractShoppingDates(): Date[] {
  const items = shoppingListState.getItems();
  const uniqueDates = new Set<string>();

  items.forEach(item => {
    if (item.shopping_date) {
      uniqueDates.add(item.shopping_date);
    }
  });

  // Convert ISO date strings to Date objects
  return Array.from(uniqueDates).map(dateStr => {
    const date = new Date(dateStr + 'T00:00:00'); // Ensure local timezone
    return date;
  });
}

/**
 * Initialize shopping list event handlers.
 */
export function initShoppingListUI(): void {
  const input = document.getElementById('itemInput') as HTMLInputElement;
  const mengeInput = document.getElementById('mengeInput') as HTMLInputElement;
  const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
  const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
  const itemsList = document.getElementById('items');
  const shoppingDatePickerContainer = document.getElementById('shoppingDatePicker');

  if (!input || !mengeInput || !addBtn) {
    console.error('Required shopping list elements not found');
    return;
  }

  // Initialize DatePicker for shopping date selection
  if (shoppingDatePickerContainer) {
    // Calculate next Wednesday
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysUntilWednesday = currentDay === 3 ? 7 : (3 - currentDay + 7) % 7; // 3 = Wednesday
    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + (daysUntilWednesday === 0 ? 7 : daysUntilWednesday));

    // Extract unique shopping dates from items
    const shoppingDates = extractShoppingDates();

    shoppingDatePicker = createDatePicker({
      placeholder: 'Einkaufsdatum (optional)',
      format: 'dd.MM.yyyy',
      value: nextWednesday,
      highlightDates: shoppingDates,
      onChange: (date) => {
        // Update selected shopping date for filtering
        if (date) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          selectedShoppingDate = `${year}-${month}-${day}`;
        } else {
          selectedShoppingDate = null;
        }

        // Re-render items with new date filter
        const items = shoppingListState.getItems();
        const filteredItems = filterItems(items);
        renderItems(filteredItems);
      },
    });
    shoppingDatePickerContainer.appendChild(shoppingDatePicker.container);

    // Set initial selectedShoppingDate to match the default DatePicker value
    const year = nextWednesday.getFullYear();
    const month = String(nextWednesday.getMonth() + 1).padStart(2, '0');
    const day = String(nextWednesday.getDate()).padStart(2, '0');
    selectedShoppingDate = `${year}-${month}-${day}`;
  }

  // Initialize Autocomplete for product suggestions
  let autocompleteInstance: Autocomplete | null = null;

  // Function to initialize/re-initialize autocomplete when store changes
  const initializeAutocomplete = () => {
    if (autocompleteInstance) {
      autocompleteInstance.destroy();
      autocompleteInstance = null;
    }

    if (selectedStoreId && input) {
      autocompleteInstance = new Autocomplete({
        input,
        onSearch: async (query: string) => {
          if (!selectedStoreId) {
            return [];
          }
          const suggestions = await getProductSuggestions(selectedStoreId, query, 10);
          return suggestions.map((suggestion: ProductSuggestion) => ({
            id: suggestion.name,
            label: suggestion.name,
            data: suggestion,
          }));
        },
        onSelect: (suggestion) => {
          input.value = suggestion.label;
          mengeInput.focus();
        },
        debounceMs: 300,
        minChars: 2,
        maxSuggestions: 10,
      });
    }
  };

  // Subscribe to state changes for automatic UI updates
  shoppingListState.subscribe((items) => {
    const filteredItems = filterItems(items);
    renderItems(filteredItems);

    // Update DatePicker highlights when items change
    if (shoppingDatePicker) {
      const updatedShoppingDates = extractShoppingDates();
      shoppingDatePicker.setHighlightDates(updatedShoppingDates);
    }
  });

  // Load stores into filter (this will also set the default selection)
  loadStoreFilter().then(() => {
    // Initialize autocomplete after stores are loaded
    initializeAutocomplete();
  });

  // Store filter change handler
  if (storeFilter) {
    storeFilter.addEventListener('change', () => {
      const value = storeFilter.value;
      selectedStoreId = value ? parseInt(value, 10) : null;

      // Re-initialize autocomplete with new store
      initializeAutocomplete();

      // Re-render with filtered items
      const items = shoppingListState.getItems();
      const filteredItems = filterItems(items);
      renderItems(filteredItems);
    });
  }

  // Add button handler
  addBtn.addEventListener('click', async () => {
    const val = input.value.trim();
    if (!val) {
      return;
    }

    const menge = mengeInput.value.trim() || undefined;

    // Get shopping date from DatePicker (format: ISO YYYY-MM-DD)
    let shoppingDate: string | undefined = undefined;
    if (shoppingDatePicker) {
      const dateValue = shoppingDatePicker.getValue();
      if (dateValue) {
        // Convert to ISO format (YYYY-MM-DD) using local time, not UTC
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        shoppingDate = `${year}-${month}-${day}`;
      }
    }

    // Check if input matches a template name
    const templates = await fetchTemplates();
    const matchedTemplate = templates.find(
      (t) => t.name.toLowerCase() === val.toLowerCase()
    );

    if (matchedTemplate) {
      // Template found - insert all template items
      if (!selectedStoreId) {
        showError('Bitte wählen Sie zuerst ein Geschäft aus, um eine Vorlage zu verwenden.');
        return;
      }

      if (!shoppingDate) {
        showError('Bitte wählen Sie ein Datum aus, um eine Vorlage zu verwenden.');
        return;
      }

      // Add all template items
      let successCount = 0;
      for (const templateItem of matchedTemplate.items) {
        const item = await shoppingListState.addItem(
          templateItem.name,
          templateItem.menge,
          selectedStoreId,
          shoppingDate
        );
        if (item) {
          successCount++;
        }
      }

      if (successCount > 0) {
        showSuccess(`${successCount} Artikel aus Vorlage "${matchedTemplate.name}" hinzugefügt!`);
        input.value = '';
        mengeInput.value = '1';
        // Keep the date picker value for next item
        // UI updates automatically via state subscription
      }
    } else {
      // Normal item - add as usual
      const item = await shoppingListState.addItem(val, menge, selectedStoreId || undefined, shoppingDate);
      if (item) {
        input.value = '';
        mengeInput.value = '1';
        // Keep the date picker value for next item
        // UI updates automatically via state subscription
      }
    }
  });

  // Enter key handler for both inputs
  input.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });

  mengeInput.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });

  // Print button handler
  const printBtn = document.getElementById('printBtn') as HTMLButtonElement;
  if (printBtn) {
    printBtn.addEventListener('click', async () => {
      await showPrintPreview();
    });
  }

  // Event delegation for delete and edit buttons - single listener for all operations
  // This is more efficient than attaching individual listeners to each button
  if (itemsList) {
    itemsList.addEventListener('click', async (e: Event) => {
      const target = e.target as HTMLElement;

      // Check if the clicked element is a delete button
      if (target.classList.contains('removeBtn')) {
        const itemId = target.dataset.itemId;
        if (itemId) {
          // Prevent multiple rapid clicks
          if (target.hasAttribute('disabled')) {
            return;
          }

          // Disable button during deletion
          target.setAttribute('disabled', 'true');

          const success = await shoppingListState.deleteItem(itemId);
          if (!success) {
            // Re-enable button if deletion failed
            target.removeAttribute('disabled');
          }
          // UI updates automatically via state subscription on success
        }
      }

      // Check if the clicked element is an edit button
      if (target.classList.contains('editBtn')) {
        const itemId = target.dataset.itemId;
        if (itemId) {
          // Prevent multiple rapid clicks
          if (target.hasAttribute('disabled')) {
            return;
          }

          await handleEditItem(itemId);
        }
      }
    });
  }

  // Initial load
  loadItems();
}
