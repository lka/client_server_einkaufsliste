/**
 * Print dialog creation and management
 */

export interface DialogElements {
  backdrop: HTMLElement;
  dialog: HTMLElement;
  previewContent: HTMLElement;
  backPage: HTMLElement;
  hideDeptCheckbox: HTMLInputElement;
  previewStyle: HTMLStyleElement;
  controlsContainer: HTMLElement;
}

/**
 * Create the print preview dialog structure
 */
export function createPrintDialog(): DialogElements {
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

  // Title
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

  // Controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.style.cssText = `
    margin-bottom: 1rem;
    padding: 1rem;
    background: #f0f0f0;
    border-radius: 4px;
    display: flex;
    gap: 1.5rem;
    align-items: center;
    flex-wrap: wrap;
  `;
  scrollableArea.appendChild(controlsContainer);

  // A4 Container
  const a4Container = document.createElement('div');
  a4Container.style.cssText = `
    background: #f9f9f9;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  `;

  // Preview content
  const previewContent = document.createElement('div');
  previewContent.className = 'print-preview-content';
  previewContent.style.cssText = `
    background: white;
    padding: 1cm;
    border: 1px solid #999;
    max-width: 297mm;
    height: 190mm;
    box-sizing: border-box;
    font-size: 0.85rem;
    overflow: auto;
  `;

  // Preview styles
  const previewStyle = document.createElement('style');
  previewStyle.textContent = `
    .print-preview-content .multi-column-print-content {
      column-count: 4 !important;
      column-gap: 1cm !important;
      column-fill: auto !important;
      column-rule: 1px solid #e0e0e0 !important;
      height: 100% !important;
      max-height: 100% !important;
    }

    .print-preview-content .department-section {
      margin-bottom: 0.4rem;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .print-preview-content h3 {
      margin: 0 0 0.3rem 0;
      color: #000;
      font-size: 1rem;
      font-weight: bold;
      border-bottom: 1px solid #666;
      padding-bottom: 0.2rem;
      break-after: avoid;
      page-break-after: avoid;
    }

    .print-preview-content h4.department-title {
      margin: 0.6rem 0 0.2rem 0;
      color: #333;
      font-size: 0.9rem;
      font-weight: bold;
      break-after: avoid;
      page-break-after: avoid;
    }

    .print-preview-content ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }

    .print-preview-content li {
      margin-bottom: 0.15rem;
      line-height: 1.25;
      font-size: 0.85rem;
    }
  `;
  document.head.appendChild(previewStyle);

  // Hidden back page
  const backPage = document.createElement('div');
  backPage.style.cssText = 'display: none;';

  a4Container.appendChild(previewContent);
  scrollableArea.appendChild(a4Container);

  // Options container with checkbox
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

  return { backdrop, dialog, previewContent, backPage, hideDeptCheckbox, previewStyle, controlsContainer };
}

/**
 * Create print styles for A4 landscape
 */
export function createPrintStyles(): HTMLStyleElement {
  const printStyle = document.createElement('style');
  printStyle.textContent = `
    @media print {
      @page {
        size: A4 landscape;
        margin: 1cm;
      }

      body {
        margin: 0;
        padding: 0;
      }

      .print-preview-only {
        display: none !important;
        position: absolute !important;
        visibility: hidden !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .print-preview-backdrop,
      .print-preview-dialog {
        display: none !important;
      }

      .print-preview-content {
        max-width: 100% !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .multi-column-print-content {
        column-count: 4 !important;
        column-gap: 1cm !important;
        column-fill: auto !important;
        column-rule: none !important;
      }

      .multi-column-print-content::after {
        content: '';
        display: block;
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #ddd;
        transform: translateX(-50%);
      }

      h3 {
        page-break-after: avoid;
        break-after: avoid;
      }

      .department-section {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  `;
  return printStyle;
}
