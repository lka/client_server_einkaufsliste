/**
 * Layout helpers for modal content (scrollable body, fixed bottom form).
 */

/**
 * Create a scrollable section for modal content
 */
export function createScrollableSection(): HTMLDivElement {
  const scrollableSection = document.createElement('div');
  scrollableSection.style.cssText = `
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin-bottom: 0.5rem;
    padding-right: 0.5rem;
  `;
  return scrollableSection;
}

/**
 * Create a fixed section for forms at the bottom of modals
 */
export function createFixedFormSection(): HTMLDivElement {
  const fixedSection = document.createElement('div');
  fixedSection.style.cssText = `
    flex-shrink: 0;
    padding-top: 0.2rem;
    border-top: 1px solid #e0e0e0;
    background: white;
  `;
  return fixedSection;
}
