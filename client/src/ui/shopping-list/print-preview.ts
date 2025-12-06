/**
 * Shopping list print preview module.
 * Handles the print preview dialog and rendering logic.
 */

import { fetchStores, fetchItems, type Item } from '../../data/api.js';
import { createButton } from '../components/button.js';
import { showError } from '../components/toast.js';
import { printPreviewContent } from '../print-utils.js';
import type { DatePickerInstance } from '../components/datepicker.js';

export interface PrintPreviewOptions {
  items: Item[];
  selectedStoreId: number | null;
  shoppingDatePicker: DatePickerInstance | null;
}

/**
 * Show print preview dialog
 */
export async function showPrintPreview(options: PrintPreviewOptions): Promise<boolean> {
  return new Promise(async (resolve) => {
    const { items, selectedStoreId, shoppingDatePicker } = options;
    const filteredItems = filterItemsByStore(items, selectedStoreId);

    if (filteredItems.length === 0) {
      showError('Keine Einträge zum Drucken vorhanden.');
      resolve(false);
      return;
    }

    // Extract unique shopping dates from items
    const uniqueDates = extractUniqueDates(filteredItems);

    // Default to currently selected date in shopping date picker, or smallest date
    let selectedDate = getInitialSelectedDate(uniqueDates, shoppingDatePicker);

    // Get stores for dropdown (load early to have them available)
    const allStores = await fetchStores();

    // Get initial store name and ID
    const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
    let currentStoreName = selectedStoreId
      ? storeFilter.options[storeFilter.selectedIndex].text
      : 'Alle Geschäfte';
    let currentStoreId: number | null = selectedStoreId;

    // Create dialog structure
    const { backdrop, dialog, previewContent, backPage, hideDeptCheckbox } = createDialogStructure();

    // Function to filter items by selected date
    const filterItemsByDate = (itemsToFilter: Item[], date: string | null): Item[] => {
      if (!date) {
        return itemsToFilter;
      }
      return itemsToFilter.filter(item => item.shopping_date === date);
    };

    // Function to render print preview content for single store
    const renderPrintContent = (itemsToRender: Item[]) => {
      // Clear existing content
      previewContent.innerHTML = '';
      backPage.innerHTML = '';

      // Create header with store and date dropdowns
      const header = createStoreAndDateHeader(
        currentStoreId,
        selectedDate,
        uniqueDates,
        allStores,
        items,
        filterItemsByDate,
        renderPrintContent,
        renderAllStoresContent,
        (newStoreId: number | null, newStoreName: string) => {
          currentStoreId = newStoreId;
          currentStoreName = newStoreName;
        },
        (newDate: string | null) => {
          selectedDate = newDate;
        }
      );
      // Header will be printed with dropdowns replaced by static text
      previewContent.appendChild(header);

      // Group items by department/store with sort_order tracking
      const groupedItems = groupItemsByDepartment(itemsToRender);

      // Calculate if content fits on one page
      const fitsOnOnePage = estimatePageFit(itemsToRender.length, groupedItems.size);

      // Sort departments by sort_order
      const sortedDepartments = Array.from(groupedItems.entries()).sort(
        ([, a], [, b]) => a.sortOrder - b.sortOrder
      );

      const midPoint = fitsOnOnePage ? sortedDepartments.length : Math.ceil(sortedDepartments.length / 2);

      // Render first page
      const twoColumnContainer = createTwoColumnContainer();
      renderDepartmentSections(sortedDepartments.slice(0, midPoint), twoColumnContainer);
      previewContent.appendChild(twoColumnContainer);

      // Render back page
      if (fitsOnOnePage) {
        renderNotesPage(backPage);
      } else {
        renderContinuationPage(
          sortedDepartments.slice(midPoint),
          backPage,
          currentStoreName,
          selectedDate
        );
      }
    };

    // Function to render multi-store content (all stores grouped by store)
    const renderAllStoresContent = async (date: string | null) => {
      // Clear existing content
      previewContent.innerHTML = '';
      backPage.innerHTML = '';

      // Render the multi-store content (no header in content, as it would take up space when printing)
      await renderMultiStoreContent(date, previewContent, backPage, true);
    };

    // Update preview when department titles checkbox changes
    setupDepartmentTitleToggle(hideDeptCheckbox, previewContent, backPage);

    // Initial render with filtered items (by default, use smallest date)
    if (currentStoreId === null) {
      renderAllStoresContent(selectedDate);
    } else {
      const initialFilteredItems = filterItemsByDate(filteredItems, selectedDate);
      renderPrintContent(initialFilteredItems);
    }

    // Add print-specific CSS to hide preview-only elements when printing
    const printStyle = document.createElement('style');
    printStyle.textContent = `
      @media print {
        .print-preview-only {
          display: none !important;
          position: absolute !important;
          visibility: hidden !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    // Add print and cancel buttons
    const buttonContainer = createButtonContainer(
      backdrop,
      previewContent,
      backPage,
      hideDeptCheckbox,
      currentStoreName,
      selectedDate,
      printStyle,
      resolve
    );

    dialog.appendChild(buttonContainer);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        document.body.removeChild(backdrop);
        document.head.removeChild(printStyle);
        resolve(false);
      }
    });
  });
}

/**
 * Filter items by store ID
 */
function filterItemsByStore(items: Item[], storeId: number | null): Item[] {
  if (storeId === null) {
    return items;
  }
  return items.filter(item => item.store_id === storeId);
}

/**
 * Extract unique shopping dates from items
 */
function extractUniqueDates(items: Item[]): string[] {
  const uniqueDates = Array.from(new Set(
    items
      .filter(item => item.shopping_date)
      .map(item => item.shopping_date!)
  )).sort();
  return uniqueDates;
}

/**
 * Get initial selected date from date picker or fallback to smallest date
 */
function getInitialSelectedDate(
  uniqueDates: string[],
  shoppingDatePicker: DatePickerInstance | null
): string | null {
  let selectedDate: string | null = null;
  if (shoppingDatePicker) {
    const dateValue = shoppingDatePicker.getValue();
    if (dateValue) {
      const isoDate = dateToISOString(dateValue);
      selectedDate = uniqueDates.includes(isoDate) ? isoDate : null;
    }
  }
  if (!selectedDate) {
    selectedDate = uniqueDates.length > 0 ? uniqueDates[0] : null;
  }
  return selectedDate;
}

/**
 * Convert Date to ISO string (YYYY-MM-DD)
 */
function dateToISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create the dialog structure
 */
function createDialogStructure() {
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

  a4Container.appendChild(previewContent);
  a4Container.appendChild(backPage);
  scrollableArea.appendChild(a4Container);

  // Checkboxes for options
  const optionsContainer = document.createElement('div');
  optionsContainer.style.cssText = 'margin-bottom: 0; display: flex; gap: 1.5rem; flex-wrap: wrap;';

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

  dialog.appendChild(scrollableArea);

  return { backdrop, dialog, previewContent, backPage, hideDeptCheckbox };
}


/**
 * Render multi-store content
 */
async function renderMultiStoreContent(
  date: string | null,
  previewContent: HTMLElement,
  backPage: HTMLElement,
  clearContent: boolean = true
) {
  const allItems = await fetchItems();
  const itemsToShow = date ? allItems.filter((i: Item) => i.shopping_date === date) : allItems;

  if (itemsToShow.length === 0) {
    if (clearContent) {
      previewContent.innerHTML = '<p>Keine Artikel gefunden.</p>';
      backPage.innerHTML = '<h3>Notizen</h3>';
    }
    return;
  }

  const stores = await fetchStores();

  // Group items by store
  const itemsByStore = groupItemsByStore(itemsToShow);

  // Sort items within each store by department
  sortItemsByDepartment(itemsByStore);

  // Sort stores by sort_order
  const sortedStores = stores
    .filter((store) => itemsByStore.has(store.id))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Build array of store sections with their department sections
  const allStoreSections = buildStoreSections(sortedStores, itemsByStore);

  // Calculate if content fits on one page
  const fitsOnOnePage = estimateMultiStorePageFit(
    itemsToShow.length,
    allStoreSections.filter(s => s.type === 'department').length,
    sortedStores.length
  );

  let midPoint: number;
  if (fitsOnOnePage) {
    midPoint = allStoreSections.length;
  } else {
    // Calculate midpoint based on estimated lines, not section count
    const estimatedLines = allStoreSections.map(section => {
      if (section.type === 'store') {
        return 2; // Store header takes ~2 lines
      } else {
        // Department section - count items
        const deptElement = section.element;
        const items = deptElement.querySelectorAll('li');
        let totalLines = 2; // Department header
        items.forEach(item => {
          const textContent = item.textContent || '';
          totalLines += Math.max(1, Math.ceil(textContent.length / 40));
        });
        return totalLines;
      }
    });

    // Find best split point that balances front and back pages
    let bestMidPoint = Math.ceil(allStoreSections.length / 2);
    let bestImbalance = Infinity;

    for (let i = 1; i < allStoreSections.length; i++) {
      // Don't split right after a store header
      if (i > 0 && allStoreSections[i - 1].type === 'store') {
        continue;
      }

      const frontLines = estimatedLines.slice(0, i).reduce((sum, lines) => sum + lines, 0);
      const backLines = estimatedLines.slice(i).reduce((sum, lines) => sum + lines, 0);
      const imbalance = Math.abs(frontLines - backLines);

      if (imbalance < bestImbalance) {
        bestImbalance = imbalance;
        bestMidPoint = i;
      }
    }

    midPoint = bestMidPoint;
  }

  // Render front page
  const frontColumnContainer = createTwoColumnContainer();
  allStoreSections.slice(0, midPoint).forEach(({ element }) => {
    frontColumnContainer.appendChild(element);
  });

  // Only clear content if requested (to preserve header when called from renderAllStoresContent)
  if (clearContent) {
    previewContent.innerHTML = '';
  }
  previewContent.appendChild(frontColumnContainer);

  // Render back page
  if (clearContent) {
    backPage.innerHTML = '';
  }
  if (fitsOnOnePage) {
    renderNotesPage(backPage);
  } else {
    renderMultiStoreContinuation(allStoreSections.slice(midPoint), backPage, date);
  }
}

/**
 * Group items by department
 */
function groupItemsByDepartment(items: Item[]): Map<string, { items: Item[]; sortOrder: number }> {
  const groupedItems = new Map<string, { items: Item[]; sortOrder: number }>();
  items.forEach(item => {
    const key = item.department_name || 'Sonstiges';
    if (!groupedItems.has(key)) {
      groupedItems.set(key, {
        items: [],
        sortOrder: item.department_sort_order ?? 999,
      });
    }
    groupedItems.get(key)!.items.push(item);
  });
  return groupedItems;
}

/**
 * Group items by store
 */
function groupItemsByStore(items: Item[]): Map<number, Item[]> {
  const itemsByStore = new Map<number, Item[]>();
  items.forEach((item: Item) => {
    if (item.store_id) {
      if (!itemsByStore.has(item.store_id)) {
        itemsByStore.set(item.store_id, []);
      }
      itemsByStore.get(item.store_id)!.push(item);
    }
  });
  return itemsByStore;
}

/**
 * Sort items within each store by department
 */
function sortItemsByDepartment(itemsByStore: Map<number, Item[]>): void {
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
}

/**
 * Build store sections for multi-store view
 */
function buildStoreSections(
  sortedStores: any[],
  itemsByStore: Map<number, Item[]>
): Array<{ type: 'store' | 'department'; element: HTMLElement; store?: string }> {
  const allStoreSections: Array<{ type: 'store' | 'department'; element: HTMLElement; store?: string }> = [];

  sortedStores.forEach((store, index) => {
    const storeItems = itemsByStore.get(store.id)!;

    // Store header
    const storeHeader = document.createElement('h3');
    storeHeader.textContent = store.name;
    const topMargin = index === 0 ? '0' : '0.8rem';
    storeHeader.style.cssText = `margin: ${topMargin} 0 0.3rem 0; color: #000; font-size: 1rem; font-weight: bold; border-bottom: 1px solid #666; padding-bottom: 0.2rem;`;
    allStoreSections.push({ type: 'store', element: storeHeader, store: store.name });

    // Group items by department
    const itemsByDept = groupItemsByDepartment(storeItems);

    // Sort departments by sort_order
    const sortedDepartments = Array.from(itemsByDept.entries()).sort(
      ([, a], [, b]) => a.sortOrder - b.sortOrder
    );

    // Build department sections
    sortedDepartments.forEach(([deptName, { items: deptItems }]) => {
      const deptSection = createDepartmentSection(deptName, deptItems);
      allStoreSections.push({ type: 'department', element: deptSection });
    });
  });

  return allStoreSections;
}

/**
 * Create department section element
 */
function createDepartmentSection(deptName: string, items: Item[]): HTMLElement {
  const deptSection = document.createElement('div');
  deptSection.className = 'department-section';
  deptSection.style.cssText = 'margin-bottom: 0.5rem; break-inside: auto;';

  const deptTitle = document.createElement('h4');
  deptTitle.textContent = deptName;
  deptTitle.style.cssText = 'margin: 0.6rem 0 0.2rem 0; color: #333; font-size: 0.9rem; font-weight: bold;';
  deptTitle.className = 'department-title';
  deptSection.appendChild(deptTitle);

  const itemList = document.createElement('ul');
  itemList.style.cssText = 'margin: 0; padding-left: 0; list-style: none;';

  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name, 'de'));

  sortedItems.forEach(item => {
    const li = document.createElement('li');
    li.style.cssText = 'margin-bottom: 0.1rem; line-height: 1.15; font-size: 0.85rem;';
    li.textContent = item.menge ? `${item.name} (${item.menge})` : item.name;
    itemList.appendChild(li);
  });

  deptSection.appendChild(itemList);
  return deptSection;
}

/**
 * Create two-column container
 */
function createTwoColumnContainer(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'two-column-layout';
  container.style.cssText = `
    column-count: 2;
    column-gap: 1rem;
  `;
  return container;
}

/**
 * Render department sections into container
 */
function renderDepartmentSections(
  departments: Array<[string, { items: Item[]; sortOrder: number }]>,
  container: HTMLElement
): void {
  departments.forEach(([departmentName, { items }], idx) => {
    const section = document.createElement('div');
    section.className = 'department-section';
    section.style.cssText = 'margin-bottom: 0.5rem; break-inside: auto;';

    const deptTitle = document.createElement('h4');
    deptTitle.textContent = departmentName;
    const topMargin = idx === 0 ? '0' : '0.6rem';
    deptTitle.style.cssText = `margin: ${topMargin} 0 0.2rem 0; color: #333; font-size: 0.9rem; font-weight: bold;`;
    deptTitle.className = 'department-title';
    section.appendChild(deptTitle);

    const itemList = document.createElement('ul');
    itemList.style.cssText = 'margin: 0; padding-left: 0; list-style: none;';

    const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name, 'de'));

    sortedItems.forEach(item => {
      const li = document.createElement('li');
      li.style.cssText = 'margin-bottom: 0.1rem; line-height: 1.15; font-size: 0.85rem;';
      li.textContent = item.menge ? `${item.name} (${item.menge})` : item.name;
      itemList.appendChild(li);
    });

    section.appendChild(itemList);
    container.appendChild(section);
  });
}

/**
 * Render notes page
 */
function renderNotesPage(backPage: HTMLElement): void {
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
}

/**
 * Render continuation page
 */
function renderContinuationPage(
  departments: Array<[string, { items: Item[]; sortOrder: number }]>,
  backPage: HTMLElement,
  storeName: string,
  selectedDate: string | null
): void {
  const backHeader = document.createElement('div');
  backHeader.style.cssText = 'margin-bottom: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;';

  const continueTitle = document.createElement('h2');
  continueTitle.textContent = `${storeName} (Fortsetzung)`;
  continueTitle.style.cssText = 'margin: 0; font-size: 1.2rem;';

  const backDateInfo = document.createElement('span');
  backDateInfo.textContent = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE')
    : 'Alle Daten';
  backDateInfo.style.cssText = 'color: #666; font-size: 0.8rem;';

  backHeader.appendChild(continueTitle);
  backHeader.appendChild(backDateInfo);
  backPage.appendChild(backHeader);

  const backTwoColumnContainer = createTwoColumnContainer();
  renderDepartmentSections(departments, backTwoColumnContainer);
  backPage.appendChild(backTwoColumnContainer);
}

/**
 * Render multi-store continuation page
 */
function renderMultiStoreContinuation(
  sections: Array<{ type: 'store' | 'department'; element: HTMLElement }>,
  backPage: HTMLElement,
  date: string | null
): void {
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

  const backColumnContainer = createTwoColumnContainer();
  sections.forEach(({ element, type }, idx) => {
    if (idx === 0 && type === 'store') {
      const h3 = element as HTMLHeadingElement;
      h3.style.marginTop = '0';
    }
    backColumnContainer.appendChild(element);
  });

  backPage.appendChild(backColumnContainer);
}

/**
 * Estimate if content fits on one page
 */
function estimatePageFit(itemCount: number, departmentCount: number): boolean {
  const estimatedLines = itemCount + (departmentCount * 2);
  return estimatedLines <= 70;
}

/**
 * Estimate if multi-store content fits on one page
 */
function estimateMultiStorePageFit(itemCount: number, departmentCount: number, storeCount: number): boolean {
  const estimatedLines = itemCount + (departmentCount * 2) + (storeCount * 2);
  return estimatedLines <= 70;
}


/**
 * Create store and date header with dropdowns
 */
function createStoreAndDateHeader(
  currentStoreId: number | null,
  selectedDate: string | null,
  uniqueDates: string[],
  allStores: any[],
  allItems: Item[],
  filterItemsByDate: (items: Item[], date: string | null) => Item[],
  renderPrintContent: (items: Item[]) => void,
  renderAllStoresContent: (date: string | null) => Promise<void>,
  onStoreChange: (storeId: number | null, storeName: string) => void,
  onDateChange: (date: string | null) => void
): HTMLElement {
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

  // Set default to selected date
  if (selectedDate) {
    dateDropdown.value = selectedDate;
  }

  // Handle store selection change
  storeDropdown.addEventListener('change', async () => {
    const newStoreId = storeDropdown.value ? parseInt(storeDropdown.value) : null;
    const newStoreName = newStoreId
      ? allStores.find(s => s.id === newStoreId)?.name || 'Alle Geschäfte'
      : 'Alle Geschäfte';

    onStoreChange(newStoreId, newStoreName);

    const currentDate = dateDropdown.value || null;
    if (newStoreId === null) {
      // Show all stores
      await renderAllStoresContent(currentDate);
    } else {
      // Filter items by selected store
      const storeFilteredItems = allItems.filter(item => item.store_id === newStoreId);
      const dateFilteredItems = filterItemsByDate(storeFilteredItems, currentDate);
      renderPrintContent(dateFilteredItems);
    }
  });

  // Handle date selection change
  dateDropdown.addEventListener('change', async () => {
    const newDate = dateDropdown.value || null;
    onDateChange(newDate);

    const currentStoreId = storeDropdown.value ? parseInt(storeDropdown.value) : null;
    if (currentStoreId === null) {
      await renderAllStoresContent(newDate);
    } else {
      const storeFilteredItems = allItems.filter(item => item.store_id === currentStoreId);
      const dateFilteredItems = filterItemsByDate(storeFilteredItems, newDate);
      renderPrintContent(dateFilteredItems);
    }
  });

  header.appendChild(storeDropdown);
  header.appendChild(dateDropdown);
  return header;
}

/**
 * Setup department title toggle
 */
function setupDepartmentTitleToggle(
  checkbox: HTMLInputElement,
  previewContent: HTMLElement,
  backPage: HTMLElement
): void {
  checkbox.addEventListener('change', () => {
    const frontDeptTitles = previewContent.querySelectorAll('.department-title');
    const backDeptTitles = backPage.querySelectorAll('.department-title');

    frontDeptTitles.forEach(title => {
      (title as HTMLElement).style.display = checkbox.checked ? 'none' : '';
    });

    backDeptTitles.forEach(title => {
      (title as HTMLElement).style.display = checkbox.checked ? 'none' : '';
    });
  });
}

/**
 * Create button container with print and cancel buttons
 */
function createButtonContainer(
  backdrop: HTMLElement,
  previewContent: HTMLElement,
  backPage: HTMLElement,
  hideDeptCheckbox: HTMLInputElement,
  currentStoreName: string,
  selectedDate: string | null,
  printStyle: HTMLStyleElement,
  resolve: (value: boolean) => void
): HTMLElement {
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 1rem; padding: 1.5rem 2rem; border-top: 1px solid #e0e0e0; flex-shrink: 0;';

  const printBtn = createButton({
    label: '🖨️ Drucken',
    variant: 'primary',
    onClick: () => {
      const hideDepartments = hideDeptCheckbox.checked;

      // Create a temporary container to manipulate the HTML
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = previewContent.innerHTML;

      // Remove all elements with class 'print-preview-only'
      tempContainer.querySelectorAll('.print-preview-only').forEach(el => el.remove());

      const frontPageContent = tempContainer.innerHTML;
      const backPageContent = backPage.innerHTML;

      document.body.removeChild(backdrop);
      document.head.removeChild(printStyle);
      printPreviewContent(frontPageContent, backPageContent, currentStoreName, hideDepartments, selectedDate);
      resolve(true);
    }
  });
  printBtn.style.flex = '1';
  buttonContainer.appendChild(printBtn);

  const cancelBtn = createButton({
    label: '❌ Abbrechen',
    variant: 'secondary',
    ariaLabel: 'Abbrechen',
    onClick: () => {
      document.body.removeChild(backdrop);
      document.head.removeChild(printStyle);
      resolve(false);
    }
  });
  cancelBtn.style.flex = '1';
  buttonContainer.appendChild(cancelBtn);

  return buttonContainer;
}
