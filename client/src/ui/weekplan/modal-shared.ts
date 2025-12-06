/**
 * Shared modal UI components for weekplan modals
 * Used by both template-modal and recipe-modal
 */

import type { DeltaItem } from './types.js';

/**
 * Create a quantity adjustment section for templates/recipes
 */
export function createQuantityAdjustmentSection(
  originalPersonCount: number,
  currentPersonCount: number | null,
  onAdjust: (newPersonCount: number) => void
): HTMLDivElement {
  const adjustSection = document.createElement('div');
  adjustSection.style.cssText = 'margin-bottom: 0.75rem; padding: 0.5rem; background: #fff9e6; border-radius: 4px;';

  const adjustLabel = document.createElement('label');
  adjustLabel.textContent = `Mengen anpassen (Vorlage für ${originalPersonCount} Personen):`;
  adjustLabel.style.cssText = 'display: block; font-size: 0.85rem; margin-bottom: 0.25rem; color: #666; font-weight: 500;';

  const adjustForm = document.createElement('div');
  adjustForm.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';

  const adjustInput = document.createElement('input');
  adjustInput.type = 'number';
  adjustInput.min = '1';
  adjustInput.step = '1';
  adjustInput.placeholder = 'Anzahl Personen';
  adjustInput.value = String(currentPersonCount !== null ? currentPersonCount : originalPersonCount);
  adjustInput.style.cssText = `
    width: 120px;
    padding: 0.4rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  `;

  const adjustBtn = document.createElement('button');
  adjustBtn.textContent = 'Anpassen';
  adjustBtn.style.cssText = `
    background: #ff9800;
    color: white;
    border: none;
    padding: 0.4rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  `;

  adjustBtn.addEventListener('mouseover', () => {
    adjustBtn.style.backgroundColor = '#f57c00';
  });

  adjustBtn.addEventListener('mouseout', () => {
    adjustBtn.style.backgroundColor = '#ff9800';
  });

  adjustBtn.addEventListener('click', () => {
    const targetPersonCount = parseInt(adjustInput.value.trim());
    if (!targetPersonCount || targetPersonCount < 1) {
      alert('Bitte gültige Personenanzahl eingeben (mindestens 1)');
      return;
    }
    onAdjust(targetPersonCount);
    adjustInput.value = '';
  });

  adjustForm.appendChild(adjustInput);
  adjustForm.appendChild(adjustBtn);
  adjustSection.appendChild(adjustLabel);
  adjustSection.appendChild(adjustForm);

  return adjustSection;
}

/**
 * Create an "add item" form for modals
 */
export function createAddItemForm(
  onAddItem: (name: string, menge?: string) => void,
  existingItems?: string[]
): HTMLDivElement {
  const addForm = document.createElement('div');
  addForm.style.cssText = 'display: flex; gap: 0.5rem; align-items: flex-end;';

  const nameGroup = document.createElement('div');
  nameGroup.style.cssText = 'flex: 1;';

  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Artikel';
  nameLabel.style.cssText = 'display: block; font-size: 0.85rem; margin-bottom: 0.25rem; color: #666;';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Artikelname';
  nameInput.style.cssText = `
    width: 100%;
    padding: 0.4rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  `;

  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);

  const mengeGroup = document.createElement('div');
  mengeGroup.style.cssText = 'width: 100px;';

  const mengeLabel = document.createElement('label');
  mengeLabel.textContent = 'Menge';
  mengeLabel.style.cssText = 'display: block; font-size: 0.85rem; margin-bottom: 0.25rem; color: #666;';

  const mengeInput = document.createElement('input');
  mengeInput.type = 'text';
  mengeInput.placeholder = 'z.B. 2 kg';
  mengeInput.style.cssText = `
    width: 100%;
    padding: 0.4rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  `;

  mengeGroup.appendChild(mengeLabel);
  mengeGroup.appendChild(mengeInput);

  const addBtn = document.createElement('button');
  addBtn.textContent = '+';
  addBtn.style.cssText = `
    background: #4caf50;
    color: white;
    border: none;
    padding: 0.4rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: bold;
    transition: background-color 0.2s;
  `;

  addBtn.addEventListener('mouseover', () => {
    addBtn.style.backgroundColor = '#45a049';
  });

  addBtn.addEventListener('mouseout', () => {
    addBtn.style.backgroundColor = '#4caf50';
  });

  const handleAdd = () => {
    const name = nameInput.value.trim();
    const menge = mengeInput.value.trim();

    if (!name) {
      nameInput.focus();
      return;
    }

    // Check if item already exists
    if (existingItems) {
      const isExisting = existingItems.some(item =>
        item.toLowerCase() === name.toLowerCase()
      );
      if (isExisting) {
        alert('Dieser Artikel ist bereits in der Liste enthalten.');
        nameInput.value = '';
        nameInput.focus();
        return;
      }
    }

    onAddItem(name, menge || undefined);
    nameInput.value = '';
    mengeInput.value = '';
    nameInput.focus();
  };

  addBtn.addEventListener('click', handleAdd);

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  });

  mengeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  });

  addForm.appendChild(nameGroup);
  addForm.appendChild(mengeGroup);
  addForm.appendChild(addBtn);

  return addForm;
}

/**
 * Create a list of added items with remove buttons
 */
export function createAddedItemsList(
  addedItems: Map<string, DeltaItem>,
  onRemove: (name: string) => void
): HTMLDivElement {
  const addedItemsList = document.createElement('div');
  addedItemsList.style.cssText = 'margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;';

  const heading = document.createElement('h4');
  heading.textContent = 'Hinzugefügte Artikel';
  heading.style.cssText = 'margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #666; font-weight: 600;';
  addedItemsList.appendChild(heading);

  if (addedItems.size === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = 'Keine zusätzlichen Artikel';
    emptyMsg.style.cssText = 'color: #999; font-size: 0.85rem; font-style: italic; margin: 0;';
    addedItemsList.appendChild(emptyMsg);
  } else {
    const list = document.createElement('ul');
    list.style.cssText = 'list-style: none; padding: 0; margin: 0;';

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

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.style.cssText = `
        background: none;
        border: none;
        color: #d32f2f;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0 0.25rem;
        line-height: 1;
      `;
      removeBtn.addEventListener('click', () => {
        onRemove(name);
      });
      li.appendChild(removeBtn);

      list.appendChild(li);
    });

    addedItemsList.appendChild(list);
  }

  return addedItemsList;
}

/**
 * Create a scrollable section for modal content
 */
export function createScrollableSection(): HTMLDivElement {
  const scrollableSection = document.createElement('div');
  scrollableSection.style.cssText = `
    max-height: 60vh;
    overflow-y: auto;
    margin-bottom: 1rem;
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
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
    background: white;
  `;
  return fixedSection;
}
