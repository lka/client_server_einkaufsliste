/**
 * "Add item" form for modals, with support for loading an existing
 * ingredient/item into the form to edit its quantity.
 */

import { createInput, createButton } from '../../components/index.js';

/**
 * Create an "add item" form for modals
 */
export function createAddItemForm(
  onAddItem: (name: string, menge?: string) => void
): { form: HTMLDivElement; tryAddPending: () => void; selectForEdit: (name: string, menge: string) => void } {
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

  // Tracks whether the form currently holds an existing ingredient loaded
  // via selectForEdit(), so tryAddPending() can commit it even without a
  // menge (the ingredient may not have had a quantity to begin with) and
  // so the form can show a visual "editing" affordance.
  let isEditingExisting = false;

  const setEditingStyle = (active: boolean) => {
    addForm.style.borderLeft = active ? '3px solid #4a90e2' : '';
    addForm.style.paddingLeft = active ? '0.5rem' : '0';
    addForm.style.backgroundColor = active ? '#eef5fc' : '';
  };

  const clearEditingState = () => {
    isEditingExisting = false;
    setEditingStyle(false);
  };

  const selectForEdit = (name: string, menge: string) => {
    nameInputGroup.input.value = name;
    mengeInputGroup.input.value = menge;
    isEditingExisting = true;
    setEditingStyle(true);
    mengeInputGroup.input.focus();
    mengeInputGroup.input.select();
  };

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
    clearEditingState();
    nameInputGroup.input.focus();
  };

  const tryAddPending = () => {
    const name = nameInputGroup.input.value.trim();
    const menge = mengeInputGroup.input.value.trim();
    if (name && (menge || isEditingExisting)) {
      onAddItem(name, menge || undefined);
      nameInputGroup.input.value = '';
      mengeInputGroup.input.value = '';
      clearEditingState();
    }
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

  return { form: addForm, tryAddPending, selectForEdit };
}
