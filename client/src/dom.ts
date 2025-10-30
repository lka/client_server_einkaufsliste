/**
 * DOM manipulation utilities for the shopping list.
 */

import { Item } from './api';

/**
 * Render the list of items to the DOM.
 */
export function renderItems(list: Item[]): void {
  const ul = document.getElementById('items');
  if (!ul) {
    console.error('Items list element not found');
    return;
  }

  ul.innerHTML = '';

  if (list.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Keine Artikel';
    ul.appendChild(li);
    return;
  }

  for (const item of list) {
    const li = createItemElement(item);
    ul.appendChild(li);
  }
}

/**
 * Create a list item element for a shopping item.
 */
export function createItemElement(
  item: Item,
  onDelete?: (id: string) => void
): HTMLLIElement {
  const li = document.createElement('li');

  const span = document.createElement('span');
  span.textContent = item.name;

  const btn = document.createElement('button');
  btn.className = 'removeBtn';
  btn.textContent = 'Entfernen';
  btn.dataset.itemId = item.id;
  if (onDelete) {
    btn.addEventListener('click', () => onDelete(item.id));
  }

  li.appendChild(span);
  li.appendChild(btn);

  return li;
}

/**
 * Load the application HTML template into the DOM.
 */
export async function loadAppTemplate(): Promise<boolean> {
  try {
    const response = await fetch('src/app.html');
    if (!response.ok) {
      console.error('Failed to load app template:', response.statusText);
      return false;
    }
    const html = await response.text();
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('App container not found');
      return false;
    }
    appContainer.innerHTML = html;
    return true;
  } catch (error) {
    console.error('Error loading app template:', error);
    return false;
  }
}
