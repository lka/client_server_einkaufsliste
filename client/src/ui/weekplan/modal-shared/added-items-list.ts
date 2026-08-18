/**
 * Rendering for the "additional items" list in modals.
 */

import type { DeltaItem } from '../types.js';
import { createButton } from '../../components/index.js';

/**
 * Create a list of added items with remove buttons
 */
export function createAddedItemsList(
  addedItems: Map<string, DeltaItem>,
  onRemove: (name: string) => void
): HTMLDivElement {
  const addedItemsList = document.createElement('div');
  addedItemsList.style.cssText = 'margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;';

  if (addedItems.size === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'Keine zusätzlichen Artikel';
    emptyMsg.style.cssText = 'color: #999; font-size: 0.85rem; font-style: italic; margin: 0;';
    addedItemsList.appendChild(emptyMsg);
  } else {
    const list = document.createElement('ul');
    list.style.cssText = 'list-style: none; padding: 0; margin: 0; background: #e8f5e9; border-radius: 4px; padding: 0.5rem;';

    addedItems.forEach((item, name) => {
      const li = document.createElement('li');
      li.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.4rem 0;
        border-bottom: 1px solid #f0f0f0;
      `;

      const leftDiv = document.createElement('div');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;
      nameSpan.style.cssText = 'font-size: 0.9rem;';
      leftDiv.appendChild(nameSpan);

      if (item.menge) {
        const mengeSpan = document.createElement('span');
        mengeSpan.textContent = ` (${item.menge})`;
        mengeSpan.style.cssText = 'color: #666; font-size: 0.85rem; margin-left: 0.25rem;';
        leftDiv.appendChild(mengeSpan);
      }

      li.appendChild(leftDiv);

      // Create remove button using component library
      const removeBtn = createButton({
        label: '×',
        variant: 'danger',
        size: 'small',
        ariaLabel: `${name} entfernen`,
        onClick: () => onRemove(name)
      });

      // Override styles for compact inline display
      removeBtn.style.cssText = `
        background: none;
        border: none;
        color: #d32f2f;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0 0.25rem;
        line-height: 1;
        min-width: auto;
      `;
      removeBtn.addEventListener('mouseenter', () => {
        removeBtn.style.color = '#9a0007';
      });
      removeBtn.addEventListener('mouseleave', () => {
        removeBtn.style.color = '#d32f2f';
      });

      li.appendChild(removeBtn);

      list.appendChild(li);
    });

    addedItemsList.appendChild(list);
  }

  return addedItemsList;
}
