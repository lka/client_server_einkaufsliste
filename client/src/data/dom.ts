/**
 * DOM manipulation utilities for the shopping list.
 */

import { Item } from './api';

/**
 * Render the list of items to the DOM.
 * Uses DocumentFragment to batch DOM updates and minimize reflows.
 * This optimization reduces layout recalculations from O(n) to O(1).
 */
export function renderItems(list: Item[]): void {
  const ul = document.getElementById('items');
  if (!ul) {
    console.error('Items list element not found');
    return;
  }

  // Clear existing content
  ul.innerHTML = '';

  if (list.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Keine Artikel';
    ul.appendChild(li);
    return;
  }

  // Group items by department
  const departmentGroups = new Map<string, Item[]>();
  const ungroupedItems: Item[] = [];

  for (const item of list) {
    if (item.department_name) {
      const existing = departmentGroups.get(item.department_name) || [];
      existing.push(item);
      departmentGroups.set(item.department_name, existing);
    } else {
      ungroupedItems.push(item);
    }
  }

  // Use DocumentFragment to batch DOM operations
  // This causes only ONE reflow instead of one per item
  const fragment = document.createDocumentFragment();

  // Render each department group
  for (const [deptName, items] of departmentGroups.entries()) {
    const deptSection = createDepartmentSection(deptName, items);
    fragment.appendChild(deptSection);
  }

  // Render ungrouped items if any
  if (ungroupedItems.length > 0) {
    const ungroupedSection = createDepartmentSection('Sonstiges', ungroupedItems);
    fragment.appendChild(ungroupedSection);
  }

  // Single DOM operation - triggers only one reflow
  ul.appendChild(fragment);
}

/**
 * Create a department section with header and items.
 */
function createDepartmentSection(departmentName: string, items: Item[]): HTMLElement {
  const section = document.createElement('li');
  section.className = 'department-section';

  const header = document.createElement('h3');
  header.className = 'department-header';
  header.textContent = departmentName;
  section.appendChild(header);

  const itemsList = document.createElement('ul');
  itemsList.className = 'department-items';

  for (const item of items) {
    const li = createItemElement(item);
    itemsList.appendChild(li);
  }

  section.appendChild(itemsList);
  return section;
}

/**
 * Create a list item element for a shopping item.
 * Uses data attributes for event delegation - no individual click handlers needed.
 * The parent container should handle click events via event delegation.
 */
export function createItemElement(item: Item): HTMLLIElement {
  const li = document.createElement('li');

  const span = document.createElement('span');
  span.textContent = item.name;
  if (item.menge) {
    span.textContent += ` (${item.menge})`;
  }

  const btn = document.createElement('button');
  btn.className = 'removeBtn';
  btn.textContent = 'Entfernen';
  btn.dataset.itemId = item.id;
  // No individual click handler - relies on event delegation from parent

  li.appendChild(span);
  li.appendChild(btn);

  return li;
}

// Template caching: Store loaded templates to avoid redundant fetches
const templateCache: Map<string, string> = new Map();
let isTemplateLoaded = false;

/**
 * Load an HTML template into the DOM with caching.
 * Templates are fetched once and cached for subsequent calls.
 * Once a template is loaded into the DOM, subsequent calls are no-ops.
 */
export async function loadTemplate(templatePath: string): Promise<boolean> {
  try {
    // Check if template is already loaded in DOM
    if (isTemplateLoaded) {
      return true;
    }

    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('App container not found');
      return false;
    }

    let html: string;

    // Check cache first
    if (templateCache.has(templatePath)) {
      html = templateCache.get(templatePath)!;
    } else {
      // Fetch and cache template
      const response = await fetch(templatePath);
      if (!response.ok) {
        console.error('Failed to load template:', response.statusText);
        return false;
      }
      html = await response.text();
      templateCache.set(templatePath, html);
    }

    // Load template into DOM
    appContainer.innerHTML = html;
    isTemplateLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading template:', error);
    return false;
  }
}

/**
 * Load the application HTML template into the DOM.
 */
export async function loadAppTemplate(templateName: string = 'app.html'): Promise<boolean> {
  return loadTemplate(`src/pages/${templateName}`);
}

/**
 * Clear template cache and reset loaded state (mainly for testing).
 * @internal
 */
export function clearTemplateCache(): void {
  templateCache.clear();
  isTemplateLoaded = false;
}
