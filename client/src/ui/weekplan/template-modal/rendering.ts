/**
 * Template items rendering logic
 */

import type { Template } from '../../../data/api/types.js';

/**
 * Render template items list with checkboxes
 */
export function renderTemplateItems(
  template: Template,
  removedItems: Set<string>,
  adjustedQuantities: Map<string, string>
): HTMLUListElement {
  const itemsList = document.createElement('ul');
  itemsList.style.cssText = 'list-style: none; padding: 0; margin: 0;';

  template.items.forEach((item, index) => {
    const li = document.createElement('li');
    const isRemoved = removedItems.has(item.name);

    li.style.cssText = `
      padding: 0.25rem 0.5rem;
      background: ${isRemoved ? '#ffe6e6' : '#f8f9fa'};
      border-radius: 3px;
      margin-bottom: 0.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    `;

    // Left side: checkbox + name
    const leftDiv = document.createElement('div');
    leftDiv.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';

    const checkboxId = `template-item-checkbox-${index}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.name = `templateItem_${index}`;
    checkbox.checked = isRemoved;
    checkbox.style.cssText = 'cursor: pointer; width: 16px; height: 16px;';
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        removedItems.add(item.name);
        li.style.backgroundColor = '#ffe6e6';
        nameSpan.style.textDecoration = 'line-through';
        nameSpan.style.opacity = '0.6';
      } else {
        removedItems.delete(item.name);
        li.style.backgroundColor = '#f8f9fa';
        nameSpan.style.textDecoration = 'none';
        nameSpan.style.opacity = '1';
      }
    });

    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.name;
    nameSpan.style.cssText = `
      font-weight: 500;
      ${isRemoved ? 'text-decoration: line-through; opacity: 0.6;' : ''}
    `;

    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(nameSpan);
    li.appendChild(leftDiv);

    if (item.menge) {
      const mengeSpan = document.createElement('span');
      // Use adjusted quantity if available, otherwise use original
      const displayMenge = adjustedQuantities.get(item.name) || item.menge;
      mengeSpan.textContent = displayMenge;
      mengeSpan.style.cssText = 'color: #666; font-size: 0.85rem; margin-left: 0.5rem;';
      li.appendChild(mengeSpan);
    }

    itemsList.appendChild(li);
  });

  return itemsList;
}
