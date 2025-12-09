/**
 * Shopping list print preview module.
 * Handles the print preview dialog and rendering logic.
 */

import { fetchStores, type Item } from '../../data/api.js';
import { createButton } from '../components/button.js';
import { showError } from '../components/toast.js';
import { printPreviewContent } from '../print-utils/index.js';
import type { DatePickerInstance } from '../components/datepicker.js';
import { createPrintDialog, createPrintStyles } from './print-dialog.js';
import { renderSingleStoreContent, renderMultiStoreContent } from './print-rendering.js';
import { createStoreAndDateControls, setupDepartmentTitleToggle } from './print-controls.js';
import {
  filterItemsByStore,
  filterItemsByDate,
  extractUniqueDates,
  getInitialSelectedDate
} from './print-helpers.js';

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

    // Get stores for dropdown
    const allStores = await fetchStores();

    // Get initial store name and ID
    const storeFilter = document.getElementById('storeFilter') as HTMLSelectElement;
    let currentStoreName = selectedStoreId
      ? storeFilter.options[storeFilter.selectedIndex].text
      : 'Alle Geschäfte';
    let currentStoreId: number | null = selectedStoreId;

    // Create dialog structure
    const { backdrop, dialog, previewContent, backPage, hideDeptCheckbox, previewStyle, controlsContainer } = createPrintDialog();

    // Render functions
    const renderSingleStore = (itemsToRender: Item[]) => {
      renderSingleStoreContent(itemsToRender, currentStoreName, previewContent, backPage);
    };

    const renderMultiStore = async (date: string | null) => {
      await renderMultiStoreContent(date, previewContent, backPage);
    };

    // Create controls header
    const controlsHeader = createStoreAndDateControls(
      currentStoreId,
      selectedDate,
      uniqueDates,
      allStores,
      items,
      {
        onStoreChange: (newStoreId: number | null, newStoreName: string) => {
          currentStoreId = newStoreId;
          currentStoreName = newStoreName;
        },
        onDateChange: (newDate: string | null) => {
          selectedDate = newDate;
        },
        filterItemsByDate,
        renderSingleStore,
        renderMultiStore
      }
    );

    // Add controls to container
    controlsContainer.innerHTML = '';
    controlsContainer.appendChild(controlsHeader);

    // Setup department title toggle
    setupDepartmentTitleToggle(hideDeptCheckbox, previewContent, backPage);

    // Initial render
    if (currentStoreId === null) {
      renderMultiStore(selectedDate);
    } else {
      const initialFilteredItems = filterItemsByDate(filteredItems, selectedDate);
      renderSingleStore(initialFilteredItems);
    }

    // Add print styles
    const printStyle = createPrintStyles();
    document.head.appendChild(printStyle);

    // Add buttons
    const buttonContainer = createButtonContainer(
      backdrop,
      previewContent,
      hideDeptCheckbox,
      currentStoreName,
      selectedDate,
      printStyle,
      previewStyle,
      resolve
    );

    dialog.appendChild(buttonContainer);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        cleanup(backdrop, printStyle, previewStyle);
        resolve(false);
      }
    });
  });
}

/**
 * Create button container with print and cancel buttons
 */
function createButtonContainer(
  backdrop: HTMLElement,
  previewContent: HTMLElement,
  hideDeptCheckbox: HTMLInputElement,
  currentStoreName: string,
  selectedDate: string | null,
  printStyle: HTMLStyleElement,
  previewStyle: HTMLStyleElement,
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

      cleanup(backdrop, printStyle, previewStyle);
      printPreviewContent(frontPageContent, currentStoreName, hideDepartments, selectedDate);
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
      cleanup(backdrop, printStyle, previewStyle);
      resolve(false);
    }
  });
  cancelBtn.style.flex = '1';
  buttonContainer.appendChild(cancelBtn);

  return buttonContainer;
}

/**
 * Cleanup function to remove dialog and styles
 */
function cleanup(
  backdrop: HTMLElement,
  printStyle: HTMLStyleElement,
  previewStyle: HTMLStyleElement
): void {
  document.body.removeChild(backdrop);
  document.head.removeChild(printStyle);
  document.head.removeChild(previewStyle);
}
