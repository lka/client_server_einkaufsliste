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
  type Department,
} from '../data/api.js';

// Current selected store ID (null = all stores)
let selectedStoreId: number | null = null;

/**
 * Handle edit button click - show department selection dialog
 */
async function handleEditItem(itemId: string): Promise<void> {
  if (!selectedStoreId) {
    alert('Bitte wählen Sie ein Geschäft aus, um eine Abteilung zuzuweisen.');
    return;
  }

  // Fetch departments for the selected store
  const departments = await fetchDepartments(selectedStoreId);

  if (!departments || departments.length === 0) {
    alert('Keine Abteilungen für dieses Geschäft vorhanden.');
    return;
  }

  // Create a simple dialog with department selection
  const departmentId = await showDepartmentSelectionDialog(departments);

  if (departmentId !== null) {
    // Convert item to product with selected department
    const updatedItem = await convertItemToProduct(itemId, departmentId);

    if (updatedItem) {
      // Reload items to reflect changes
      await shoppingListState.loadItems();
      // UI updates automatically via state subscription
    } else {
      alert('Fehler beim Zuweisen der Abteilung.');
    }
  }
}

/**
 * Show print preview dialog
 */
function showPrintPreview(): Promise<boolean> {
  return new Promise((resolve) => {
    const items = shoppingListState.getItems();
    const filteredItems = filterItemsByStore(items);

    if (filteredItems.length === 0) {
      alert('Keine Einträge zum Drucken vorhanden.');
      resolve(false);
      return;
    }

    // Get store name
    const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
    const storeName = selectedStoreId
      ? storeFilter.options[storeFilter.selectedIndex].text
      : 'Alle Geschäfte';

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

    // Header info
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;';

    const headerTitle = document.createElement('h2');
    headerTitle.textContent = storeName;
    headerTitle.style.cssText = 'margin: 0; font-size: 1.2rem;';

    const dateInfo = document.createElement('span');
    dateInfo.textContent = new Date().toLocaleDateString('de-DE');
    dateInfo.style.cssText = 'color: #666; font-size: 0.8rem;';

    header.appendChild(headerTitle);
    header.appendChild(dateInfo);
    previewContent.appendChild(header);

    // Group items by department/store
    const groupedItems = new Map<string, any[]>();
    filteredItems.forEach(item => {
      const key = item.department_name || 'Sonstiges';
      if (!groupedItems.has(key)) {
        groupedItems.set(key, []);
      }
      groupedItems.get(key)!.push(item);
    });

    // Calculate if content fits on one page (estimate ~35 items per page including headers)
    const totalItems = filteredItems.length;
    const departmentCount = groupedItems.size;
    const estimatedLines = totalItems + (departmentCount * 2); // items + department headers
    const fitsOnOnePage = estimatedLines <= 35;

    // Render grouped items on first page
    const itemsArray = Array.from(groupedItems.entries());
    const midPoint = fitsOnOnePage ? itemsArray.length : Math.ceil(itemsArray.length / 2);

    // Create 2-column container for first page items
    const twoColumnContainer = document.createElement('div');
    twoColumnContainer.className = 'two-column-layout';
    twoColumnContainer.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      column-gap: 1rem;
    `;

    // First page items
    itemsArray.slice(0, midPoint).forEach(([departmentName, items]) => {
      const section = document.createElement('div');
      section.style.cssText = 'margin-bottom: 0.5rem; break-inside: avoid;';

      const deptTitle = document.createElement('h4');
      deptTitle.textContent = departmentName;
      deptTitle.style.cssText = 'margin: 0.6rem 0 0.2rem 0; color: #333; font-size: 0.9rem; font-weight: bold;';
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
      // Continue list on back page - header with date
      const backHeader = document.createElement('div');
      backHeader.style.cssText = 'margin-bottom: 1.5rem; border-bottom: 2px solid #333; padding-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;';

      const continueTitle = document.createElement('h2');
      continueTitle.textContent = `${storeName} (Fortsetzung)`;
      continueTitle.style.cssText = 'margin: 0; font-size: 1.2rem;';

      const backDateInfo = document.createElement('span');
      backDateInfo.textContent = new Date().toLocaleDateString('de-DE');
      backDateInfo.style.cssText = 'color: #666; font-size: 0.8rem;';

      backHeader.appendChild(continueTitle);
      backHeader.appendChild(backDateInfo);
      backPage.appendChild(backHeader);

      // Create 2-column container for back page items
      const backTwoColumnContainer = document.createElement('div');
      backTwoColumnContainer.className = 'two-column-layout';
      backTwoColumnContainer.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        column-gap: 1rem;
      `;

      // Render remaining items
      itemsArray.slice(midPoint).forEach(([departmentName, items]) => {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 0.5rem; break-inside: avoid;';

        const deptTitle = document.createElement('h4');
        deptTitle.textContent = departmentName;
        deptTitle.style.cssText = 'margin: 0.6rem 0 0.2rem 0; color: #333; font-size: 0.9rem; font-weight: bold;';
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

    // Add both pages to container
    a4Container.appendChild(previewContent);
    a4Container.appendChild(backPage);
    scrollableArea.appendChild(a4Container);

    // Checkbox for hiding department titles
    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = 'margin-bottom: 0;';

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

    // Update preview when checkbox changes
    hideDeptCheckbox.addEventListener('change', () => {
      const deptTitles = previewContent.querySelectorAll('.department-title');
      deptTitles.forEach(title => {
        if (hideDeptCheckbox.checked) {
          (title as HTMLElement).style.display = 'none';
        } else {
          (title as HTMLElement).style.display = '';
        }
      });
    });

    // Button container (fixed at bottom)
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 1rem; padding: 1.5rem 2rem; border-top: 1px solid #e0e0e0; flex-shrink: 0;';

    // Print button
    const printBtn = document.createElement('button');
    printBtn.textContent = '🖨️ Drucken';
    printBtn.style.cssText = `
      flex: 1;
      padding: 0.75rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    `;
    printBtn.addEventListener('click', () => {
      document.body.removeChild(backdrop);
      // Trigger browser print with the preview content
      const hideDepartments = hideDeptCheckbox.checked;
      const backPageContent = backPage.innerHTML;
      printPreviewContent(previewContent.innerHTML, backPageContent, storeName, hideDepartments);
      resolve(true);
    });
    buttonContainer.appendChild(printBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Abbrechen';
    cancelBtn.style.cssText = `
      flex: 1;
      padding: 0.75rem 1rem;
      background: #999;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    `;
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(backdrop);
      resolve(false);
    });
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
function printPreviewContent(frontContent: string, backContent: string, storeName: string, hideDepartments: boolean = false): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup-Blocker verhindert das Drucken. Bitte erlauben Sie Popups für diese Seite.');
    return;
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

        /* 2-column layout for items */
        .two-column-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          column-gap: 1rem;
        }

        /* Prevent department sections from breaking across columns */
        .two-column-layout > div {
          break-inside: avoid;
          page-break-inside: avoid;
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
          ${frontContent}
        </div>
        <div class="a5-page back">
          ${backContent}
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
 * Show a modal dialog for department selection
 */
function showDepartmentSelectionDialog(
  departments: Department[]
): Promise<number | null> {
  return new Promise((resolve) => {
    // Create dialog backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
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
    dialog.className = 'department-dialog';
    dialog.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Abteilung auswählen';
    title.style.cssText = 'margin-top: 0; margin-bottom: 1rem;';
    dialog.appendChild(title);

    const description = document.createElement('p');
    description.textContent =
      'Wähle eine Abteilung, um dieses Produkt dem Katalog hinzuzufügen:';
    description.style.cssText = 'margin-bottom: 1rem; color: #666;';
    dialog.appendChild(description);

    // Create department list
    const list = document.createElement('div');
    list.style.cssText = 'margin-bottom: 1.5rem; max-height: 300px; overflow-y: auto;';

    departments.forEach((dept) => {
      const btn = document.createElement('button');
      btn.textContent = dept.name;
      btn.className = 'department-option-btn';
      btn.style.cssText = `
        display: block;
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        border: 1px solid #ddd;
        background: white;
        text-align: left;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
      `;

      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#f0f0f0';
        btn.style.borderColor = '#999';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'white';
        btn.style.borderColor = '#ddd';
      });

      btn.addEventListener('click', () => {
        document.body.removeChild(backdrop);
        resolve(dept.id);
      });

      list.appendChild(btn);
    });

    dialog.appendChild(list);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Abbrechen';
    cancelBtn.style.cssText = `
      padding: 0.5rem 1rem;
      background: #999;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
    `;
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(backdrop);
      resolve(null);
    });
    dialog.appendChild(cancelBtn);

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        document.body.removeChild(backdrop);
        resolve(null);
      }
    });
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
    const filteredItems = filterItemsByStore(items);
    renderItems(filteredItems);
  }
}

/**
 * Filter items by selected store.
 */
function filterItemsByStore(items: any[]): any[] {
  if (selectedStoreId === null) {
    return items; // Show all items
  }
  return items.filter(item => item.store_id === selectedStoreId);
}

/**
 * Initialize shopping list event handlers.
 */
export function initShoppingListUI(): void {
  const input = document.getElementById('itemInput') as HTMLInputElement;
  const mengeInput = document.getElementById('mengeInput') as HTMLInputElement;
  const addBtn = document.getElementById('addBtn') as HTMLButtonElement;
  const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
  const clearStoreBtn = document.getElementById('clearStoreBtn') as HTMLButtonElement;
  const itemsList = document.getElementById('items');

  if (!input || !mengeInput || !addBtn) {
    console.error('Required shopping list elements not found');
    return;
  }

  // Subscribe to state changes for automatic UI updates
  shoppingListState.subscribe((items) => {
    const filteredItems = filterItemsByStore(items);
    renderItems(filteredItems);
  });

  // Load stores into filter (this will also set the default selection)
  loadStoreFilter();

  // Store filter change handler
  if (storeFilter) {
    storeFilter.addEventListener('change', () => {
      const value = storeFilter.value;
      selectedStoreId = value ? parseInt(value, 10) : null;

      // Re-render with filtered items
      const items = shoppingListState.getItems();
      const filteredItems = filterItemsByStore(items);
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
    const item = await shoppingListState.addItem(val, menge, selectedStoreId || undefined);
    if (item) {
      input.value = '';
      mengeInput.value = '';
      // UI updates automatically via state subscription
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

  // Clear store items button handler
  if (clearStoreBtn) {
    clearStoreBtn.addEventListener('click', async () => {
      // Only allow clearing if a specific store is selected
      if (selectedStoreId === null) {
        alert('Bitte wählen Sie ein spezifisches Geschäft aus, um dessen Liste zu leeren.');
        return;
      }

      // Get store name for confirmation
      const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
      const storeName = storeFilter.options[storeFilter.selectedIndex].text;

      // Confirm deletion
      const confirmed = confirm(
        `Möchten Sie wirklich alle Einträge für "${storeName}" löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
      );

      if (!confirmed) {
        return;
      }

      // Disable button during deletion
      clearStoreBtn.disabled = true;

      const success = await shoppingListState.deleteStoreItems(selectedStoreId);

      // Re-enable button
      clearStoreBtn.disabled = false;

      if (!success) {
        alert('Fehler beim Löschen der Einträge.');
      }
      // UI updates automatically via state subscription on success
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
