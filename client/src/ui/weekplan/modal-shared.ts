/**
 * Shared modal UI components for weekplan modals
 * Used by both template-modal and recipe-modal
 */

import type { DeltaItem } from './types.js';
import { showError, createInput, createButton } from '../components/index.js';


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
  adjustLabel.htmlFor = 'personCountAdjustInput';
  adjustLabel.style.cssText = 'display: block; font-size: 0.85rem; margin-bottom: 0.5rem; color: #666; font-weight: 500;';
  adjustSection.appendChild(adjustLabel);

  const adjustForm = document.createElement('div');
  adjustForm.style.cssText = 'display: flex; gap: 0.5rem; align-items: stretch;';

  // Create input using component library
  const adjustInputGroup = createInput({
    type: 'number',
    id: 'personCountAdjustInput',
    name: 'personCountAdjust',
    placeholder: 'Anzahl Personen',
    value: String(currentPersonCount !== null ? currentPersonCount : originalPersonCount),
    className: 'adjust-input-compact'
  });

  // Set input attributes for number constraints
  adjustInputGroup.input.min = '1';
  adjustInputGroup.input.step = '1';

  // Adjust styling for compact form layout - remove gap and margin, match button height
  adjustInputGroup.container.style.cssText = 'flex: 0 0 120px; margin-bottom: 0; gap: 0; align-items: stretch;';
  // Match input padding to button padding for perfect alignment
  adjustInputGroup.input.style.padding = '0.75rem 1rem';
  adjustInputGroup.input.style.height = 'auto';
  adjustInputGroup.input.style.boxSizing = 'border-box';

  // Create button using component library
  const adjustBtn = createButton({
    label: 'Anpassen',
    variant: 'secondary',
    size: 'medium',
    onClick: () => {
      const targetPersonCount = parseInt(adjustInputGroup.input.value.trim());
      if (!targetPersonCount || targetPersonCount < 1) {
        showError('Bitte gültige Personenanzahl eingeben (mindestens 1)');
        return;
      }
      onAdjust(targetPersonCount);
      adjustInputGroup.input.value = String(targetPersonCount);
    }
  });

  // Override button color to match original orange theme and ensure full height
  adjustBtn.style.backgroundColor = '#ff9800';
  adjustBtn.style.padding = '0.75rem 1rem';
  adjustBtn.style.height = 'auto';
  adjustBtn.style.boxSizing = 'border-box';
  adjustBtn.style.alignSelf = 'stretch';
  adjustBtn.addEventListener('mouseenter', () => {
    adjustBtn.style.backgroundColor = '#f57c00';
  });
  adjustBtn.addEventListener('mouseleave', () => {
    adjustBtn.style.backgroundColor = '#ff9800';
  });

  adjustForm.appendChild(adjustInputGroup.container);
  adjustForm.appendChild(adjustBtn);
  adjustSection.appendChild(adjustForm);

  return adjustSection;
}

/**
 * Create an "add item" form for modals
 */
export function createAddItemForm(
  onAddItem: (name: string, menge?: string) => void
): HTMLDivElement {
  const addForm = document.createElement('div');
  addForm.style.cssText = 'display: flex; gap: 0.5rem; align-items: stretch;';

  // Create name input using component library
  const nameInputGroup = createInput({
    label: 'Artikel',
    type: 'text',
    id: 'addItemNameInput',
    name: 'itemName',
    placeholder: 'Artikelname',
    className: 'add-item-name'
  });

  // Adjust styling for form layout - remove gap and margin, match button height
  nameInputGroup.container.style.cssText = 'flex: 1; margin-bottom: 0; gap: 0; align-items: stretch; position: relative; padding-top: 1.5rem;';
  // Position label absolutely so it doesn't affect container height
  const nameLabel = nameInputGroup.container.querySelector('.input-label') as HTMLElement;
  if (nameLabel) {
    nameLabel.style.position = 'absolute';
    nameLabel.style.top = '0';
    nameLabel.style.left = '0';
  }
  // Match input padding to button padding for perfect alignment
  nameInputGroup.input.style.padding = '0.75rem 1rem';
  nameInputGroup.input.style.height = 'auto';
  nameInputGroup.input.style.boxSizing = 'border-box';

  // Create menge input using component library
  const mengeInputGroup = createInput({
    label: 'Menge',
    type: 'text',
    id: 'addItemMengeInput',
    name: 'itemQuantity',
    placeholder: 'z.B. 2 kg',
    className: 'add-item-menge'
  });

  // Adjust styling for form layout - remove gap and margin, match button height
  mengeInputGroup.container.style.cssText = 'flex: 0 0 150px; margin-bottom: 0; gap: 0; align-items: stretch; position: relative; padding-top: 1.5rem;';
  // Position label absolutely so it doesn't affect container height
  const mengeLabel = mengeInputGroup.container.querySelector('.input-label') as HTMLElement;
  if (mengeLabel) {
    mengeLabel.style.position = 'absolute';
    mengeLabel.style.top = '0';
    mengeLabel.style.left = '0';
  }
  // Match input padding to button padding for perfect alignment
  mengeInputGroup.input.style.padding = '0.75rem 1rem';
  mengeInputGroup.input.style.height = 'auto';
  mengeInputGroup.input.style.boxSizing = 'border-box';

  const handleAdd = () => {
    const name = nameInputGroup.input.value.trim();
    const menge = mengeInputGroup.input.value.trim();

    if (!name) {
      nameInputGroup.input.focus();
      return;
    }

    onAddItem(name, menge || undefined);
    nameInputGroup.input.value = '';
    mengeInputGroup.input.value = '';
    nameInputGroup.input.focus();
  };

  // Create add button using component library
  const addBtn = createButton({
    label: '+',
    variant: 'success',
    size: 'medium',
    onClick: handleAdd
  });

  // Override button color to match original green theme and ensure full height
  // Add margin-top to align with input containers that have padding-top
  addBtn.style.backgroundColor = '#4caf50';
  addBtn.style.padding = '0.75rem 1rem';
  addBtn.style.marginTop = '1.5rem';
  addBtn.style.boxSizing = 'border-box';
  addBtn.addEventListener('mouseenter', () => {
    addBtn.style.backgroundColor = '#45a049';
  });
  addBtn.addEventListener('mouseleave', () => {
    addBtn.style.backgroundColor = '#4caf50';
  });

  // Add Enter key handlers
  nameInputGroup.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  });

  mengeInputGroup.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  });

  addForm.appendChild(nameInputGroup.container);
  addForm.appendChild(mengeInputGroup.container);
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
