/**
 * Convert CSS 4-column layout to actual four side-by-side divs for Safari/iOS compatibility
 * Safari ignores CSS column-count during printing, so we need to manually split the content into 4 columns
 */
export function convertToFourColumns(htmlContent: string): string {
  // Create a temporary DOM to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Find all multi-column-print-content containers
  const multiColumnLayouts = tempDiv.querySelectorAll('.multi-column-print-content');

  multiColumnLayouts.forEach((layout) => {
    // Remove CSS column properties from the layout element to prevent double-columning
    if (layout instanceof HTMLElement) {
      layout.style.columnCount = '';
      layout.style.columnGap = '';
      layout.style.columns = '';
      layout.className = 'four-column-manual-layout'; // Change class for manual layout
    }

    // Get ALL direct children (including store headers and department sections)
    const allChildren = Array.from(layout.children);

    if (allChildren.length === 0) return;

    // Build a flat list of elements with their line estimates
    interface ElementWithLines {
      element: HTMLElement;
      lines: number;
      isDepartmentHeader: boolean;
      isStoreHeader: boolean;
      isPrintPreviewOnly: boolean;
      departmentName?: string;
      storeName?: string;
    }

    const flatElements: ElementWithLines[] = [];

    allChildren.forEach(child => {
      const childEl = child as HTMLElement;

      // Check if this is a print-preview-only element (should be skipped when printing)
      const isPrintPreviewOnly = childEl.classList.contains('print-preview-only');

      // Check if this is a department section
      const isDepartmentSection = childEl.classList.contains('department-section');
      // Check if this is a store header (h3 element)
      const isStoreHeader = childEl.tagName === 'H3' && !isPrintPreviewOnly;

      if (isDepartmentSection) {
        // Extract department header and items separately
        const header = childEl.querySelector('h3, h4');
        const itemList = childEl.querySelector('ul');

        if (header) {
          const departmentName = header.textContent || '';

          // Add department header as separate element
          const headerClone = header.cloneNode(true) as HTMLElement;
          flatElements.push({
            element: headerClone,
            lines: 2, // Header takes ~2 lines
            isDepartmentHeader: true,
            isStoreHeader: false,
            isPrintPreviewOnly: false,
            departmentName: departmentName
          });

          // Add each item as separate element
          if (itemList) {
            const items = itemList.querySelectorAll('li');
            items.forEach(item => {
              const itemClone = item.cloneNode(true) as HTMLElement;

              // Estimate lines based on text length
              // Assume ~30 characters per line in a narrow column (4 columns = narrower than 2)
              const textContent = item.textContent || '';
              const estimatedLines = Math.max(1, Math.ceil(textContent.length / 28));

              flatElements.push({
                element: itemClone,
                lines: estimatedLines,
                isDepartmentHeader: false,
                isStoreHeader: false,
                isPrintPreviewOnly: false,
                departmentName: departmentName
              });
            });
          }
        }
      } else if (isStoreHeader) {
        // Store header - track for better splitting
        const storeName = childEl.textContent || '';
        flatElements.push({
          element: childEl.cloneNode(true) as HTMLElement,
          lines: 2, // Store header takes ~2 lines
          isDepartmentHeader: false,
          isStoreHeader: true,
          isPrintPreviewOnly: false,
          storeName: storeName
        });
      } else if (!isPrintPreviewOnly) {
        // Other element (skip print-preview-only elements)
        flatElements.push({
          element: childEl.cloneNode(true) as HTMLElement,
          lines: 1,
          isDepartmentHeader: false,
          isStoreHeader: false,
          isPrintPreviewOnly: false
        });
      }
    });

    // Calculate total lines
    // const totalLines = flatElements.reduce((sum, el) => sum + el.lines, 0);
    const linesPerColumn = 36; // Math.ceil(totalLines / 4);

    // Split into 4 columns, respecting header rules
    const columns: ElementWithLines[][] = [[], [], [], []];
    let currentColumn = 0;
    let currentColumnLines = 0;

    flatElements.forEach((el) => {
      // Don't split departments: if adding this element would overflow,
      // and it's not the first element in the column, move to next column
      if (currentColumnLines > 0 && currentColumnLines + el.lines > linesPerColumn && currentColumn < 3) {
        // Move to next column, but only if it makes sense
        // (don't move if current column is still very empty)
        if (currentColumnLines > linesPerColumn * 0.3) {
          currentColumn++;
          currentColumnLines = 0;
        }
      }

      // Add element to current column
      columns[currentColumn].push(el);
      currentColumnLines += el.lines;
    });

    // Rebuild department sections from flat elements for each column
    function rebuildDepartmentSections(elements: ElementWithLines[]): HTMLElement {
      const column = document.createElement('div');
      column.className = 'manual-column';
      column.style.cssText = 'flex: 1; min-width: 0;'; // flex: 1 to distribute space evenly

      let currentDepartment: HTMLElement | null = null;
      let currentDepartmentList: HTMLElement | null = null;
      let currentDepartmentName: string | null = null;

      elements.forEach(({ element, isDepartmentHeader, isStoreHeader, departmentName }) => {
        if (isStoreHeader) {
          // Store header - add directly to column and reset department tracking
          column.appendChild(element);
          currentDepartment = null;
          currentDepartmentList = null;
          currentDepartmentName = null;
        } else if (isDepartmentHeader) {
          // Start new department section
          currentDepartment = document.createElement('div');
          currentDepartment.className = 'department-section';
          currentDepartment.style.cssText = 'margin-bottom: 0.4rem; break-inside: avoid;';

          currentDepartment.appendChild(element);

          // Create empty ul for items
          currentDepartmentList = document.createElement('ul');
          currentDepartmentList.style.cssText = 'margin: 0; padding-left: 0; list-style: none;';
          currentDepartment.appendChild(currentDepartmentList);

          column.appendChild(currentDepartment);
          currentDepartmentName = departmentName || null;
        } else if (element.tagName === 'LI') {
          // Item belongs to current or previous department
          if (currentDepartmentList && departmentName === currentDepartmentName) {
            // Add to current department
            currentDepartmentList.appendChild(element);
          } else {
            // Item from a split department - create continuation
            if (!currentDepartment || departmentName !== currentDepartmentName) {
              // Create new department section for continuation
              currentDepartment = document.createElement('div');
              currentDepartment.className = 'department-section';
              currentDepartment.style.cssText = 'margin-bottom: 0.4rem; break-inside: avoid;';

              // Add department header
              const continueHeader = document.createElement('h4');
              continueHeader.textContent = departmentName || '';
              continueHeader.style.cssText = 'margin: 0.6rem 0 0.2rem 0; color: #333; font-size: 0.9rem; font-weight: bold;';
              continueHeader.className = 'department-title';
              currentDepartment.appendChild(continueHeader);

              // Create ul for items
              currentDepartmentList = document.createElement('ul');
              currentDepartmentList.style.cssText = 'margin: 0; padding-left: 0; list-style: none;';
              currentDepartment.appendChild(currentDepartmentList);

              column.appendChild(currentDepartment);
              currentDepartmentName = departmentName || null;
            }

            if (currentDepartmentList) {
              currentDepartmentList.appendChild(element);
            }
          }
        } else {
          // Store header or other element
          column.appendChild(element);
          currentDepartment = null;
          currentDepartmentList = null;
          currentDepartmentName = null;
        }
      });

      return column;
    }

    // Create 4 column divs
    const column1 = rebuildDepartmentSections(columns[0]);
    const column2 = rebuildDepartmentSections(columns[1]);
    const column3 = rebuildDepartmentSections(columns[2]);
    const column4 = rebuildDepartmentSections(columns[3]);

    // Clear the layout first, then append columns in a flex container
    layout.innerHTML = '';

    // Create a flex container for the 4 columns
    const flexContainer = document.createElement('div');
    flexContainer.style.cssText = 'display: flex; gap: 1cm; width: 100%;';

    flexContainer.appendChild(column1);
    flexContainer.appendChild(column2);
    flexContainer.appendChild(column3);
    flexContainer.appendChild(column4);

    layout.appendChild(flexContainer);
  });

  return tempDiv.innerHTML;
}
