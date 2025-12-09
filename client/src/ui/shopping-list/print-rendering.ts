/**
 * Print preview rendering logic
 */

import { fetchItems, fetchStores, type Item } from '../../data/api.js';

/**
 * Group items by department with sort order
 */
export function groupItemsByDepartment(items: Item[]): Map<string, { items: Item[]; sortOrder: number }> {
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
export function groupItemsByStore(items: Item[]): Map<number, Item[]> {
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
export function sortItemsByDepartment(itemsByStore: Map<number, Item[]>): void {
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
 * Create department section element
 */
export function createDepartmentSection(deptName: string, items: Item[]): HTMLElement {
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
 * Create multi-column content container
 */
export function createMultiColumnContainer(): HTMLElement {
  const contentContainer = document.createElement('div');
  contentContainer.className = 'multi-column-print-content';
  contentContainer.style.cssText = `
    column-count: 4;
    column-gap: 1cm;
    column-fill: auto;
  `;
  return contentContainer;
}

/**
 * Create store header element
 */
export function createStoreHeader(storeName: string, isFirstStore: boolean = true): HTMLElement {
  const storeHeader = document.createElement('h3');
  storeHeader.textContent = storeName;
  const topMargin = isFirstStore ? '0' : '0.8rem';
  storeHeader.style.cssText = `margin: ${topMargin} 0 0.3rem 0; color: #000; font-size: 1rem; font-weight: bold; border-bottom: 1px solid #666; padding-bottom: 0.2rem;`;
  return storeHeader;
}

/**
 * Render single store content
 */
export function renderSingleStoreContent(
  items: Item[],
  storeName: string,
  previewContent: HTMLElement,
  backPage: HTMLElement
): void {
  previewContent.innerHTML = '';
  backPage.innerHTML = '';

  const groupedItems = groupItemsByDepartment(items);
  const sortedDepartments = Array.from(groupedItems.entries()).sort(
    ([, a], [, b]) => a.sortOrder - b.sortOrder
  );

  const contentContainer = createMultiColumnContainer();
  const storeHeader = createStoreHeader(storeName);
  contentContainer.appendChild(storeHeader);

  sortedDepartments.forEach(([departmentName, { items }]) => {
    const section = createDepartmentSection(departmentName, items);
    contentContainer.appendChild(section);
  });

  previewContent.appendChild(contentContainer);
  backPage.innerHTML = '<div style="display:none;"></div>';
  backPage.style.display = 'none';
}

/**
 * Render multi-store content
 */
export async function renderMultiStoreContent(
  date: string | null,
  previewContent: HTMLElement,
  backPage: HTMLElement
): Promise<void> {
  const allItems = await fetchItems();
  const itemsToShow = date ? allItems.filter((i: Item) => i.shopping_date === date) : allItems;

  if (itemsToShow.length === 0) {
    previewContent.innerHTML = '<p>Keine Artikel gefunden.</p>';
    backPage.innerHTML = '';
    return;
  }

  const stores = await fetchStores();
  const itemsByStore = groupItemsByStore(itemsToShow);
  sortItemsByDepartment(itemsByStore);

  const sortedStores = stores
    .filter((store) => itemsByStore.has(store.id))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const contentContainer = createMultiColumnContainer();

  sortedStores.forEach((store, index) => {
    const storeItems = itemsByStore.get(store.id)!;
    const storeHeader = createStoreHeader(store.name, index === 0);
    contentContainer.appendChild(storeHeader);

    const itemsByDept = groupItemsByDepartment(storeItems);
    const sortedDepartments = Array.from(itemsByDept.entries()).sort(
      ([, a], [, b]) => a.sortOrder - b.sortOrder
    );

    sortedDepartments.forEach(([deptName, { items: deptItems }]) => {
      const deptSection = createDepartmentSection(deptName, deptItems);
      contentContainer.appendChild(deptSection);
    });
  });

  previewContent.innerHTML = '';
  previewContent.appendChild(contentContainer);
  backPage.innerHTML = '<div style="display:none;"></div>';
  backPage.style.display = 'none';
}
