import {
  fetchTemplates,
  fetchStores,
  getProductSuggestions,
  type ProductSuggestion,
} from '../../data/api.js';

import {
    filterTemplates,
    handleEditTemplate,
    handleDeleteTemplate,
    handleRemoveItem,
    renderTemplateItems,
    currentItems,
    editingTemplateId } from './render-templates.js';

import { showError } from '../components/toast.js';
import { Autocomplete } from '../components/autocomplete.js';

/**
 * Attach event listeners to template admin UI elements.
 */
export function attachTemplateAdminListeners(): void {
  // Add item button
  const addItemBtn = document.getElementById('addItemBtn');
  addItemBtn?.addEventListener('click', handleAddItem);

  // Filter input
  const filterInput = document.getElementById('templatesFilterInput') as HTMLInputElement;
  const clearButton = document.getElementById('templatesFilterClear') as HTMLButtonElement;

  filterInput?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    filterTemplates(target.value);

    // Show/hide clear button based on input value
    if (clearButton) {
      clearButton.style.display = target.value ? 'block' : 'none';
    }
  });

  // Clear button
  clearButton?.addEventListener('click', () => {
    if (filterInput) {
      filterInput.value = '';
      filterTemplates('');
      clearButton.style.display = 'none';
      filterInput.focus();
    }
  });

  // Event delegation for template list
  const templatesList = document.getElementById('templatesList');
  templatesList?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Edit template
    if (target.classList.contains('edit-template-btn')) {
      const templateId = target.dataset.templateId;
      if (templateId) {
        handleEditTemplate(parseInt(templateId, 10));
      }
    }

    // Delete template
    if (target.classList.contains('delete-template-btn')) {
      const templateId = target.dataset.templateId;
      if (templateId) {
        handleDeleteTemplate(parseInt(templateId, 10));
      }
    }
  });

  // Event delegation for template items list
  const templateItemsList = document.getElementById('templateItemsList');
  templateItemsList?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Remove item
    if (target.classList.contains('remove-item-btn')) {
      const index = target.dataset.index;
      if (index !== undefined) {
        handleRemoveItem(parseInt(index, 10));
      }
    }
  });

  // Check template name uniqueness on blur
  const templateNameInput = document.getElementById('templateNameInput') as HTMLInputElement;
  templateNameInput?.addEventListener('blur', () => validateTemplateName(templateNameInput));

  // Enter key support for inputs
  const itemNameInput = document.getElementById('itemNameInput') as HTMLInputElement;
  const itemMengeInput = document.getElementById('itemMengeInput') as HTMLInputElement;

  itemNameInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  });

  itemMengeInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  });

  // Initialize autocomplete for item name input
  if (itemNameInput && itemMengeInput) {
    initializeItemAutocomplete(itemNameInput, itemMengeInput);
  }
}

/**
 * Validate that the template name is not already taken by another template.
 */
async function validateTemplateName(input: HTMLInputElement): Promise<void> {
  const name = input.value.trim();
  if (!name) return;

  const templates = await fetchTemplates();
  const duplicate = templates.find(
    (t) => t.name.toLowerCase() === name.toLowerCase() &&
          (editingTemplateId === null || t.id !== editingTemplateId)
  );

  if (duplicate) {
    showError(`Eine Vorlage mit dem Namen "${duplicate.name}" existiert bereits.`);
  }
}

/**
 * Initialize autocomplete for product name suggestions in template items.
 * Uses the first available store for product suggestions.
 */
async function initializeItemAutocomplete(
  inputElement: HTMLInputElement,
  mengeInputElement: HTMLInputElement
): Promise<void> {
  const stores = await fetchStores();
  if (stores.length === 0) return;
  const storeId = stores[0].id;

  new Autocomplete({
    input: inputElement,
    onSearch: async (query: string) => {
      const suggestions = await getProductSuggestions(storeId, query, 10);
      return suggestions.map((s: ProductSuggestion) => ({
        id: s.name,
        label: s.name,
        data: s,
      }));
    },
    onSelect: (suggestion) => {
      inputElement.value = suggestion.label;
      mengeInputElement.focus();
    },
    debounceMs: 300,
    minChars: 2,
    maxSuggestions: 10,
  });
}

/**
 * Handle adding an item to the current template form.
 */
async function handleAddItem(): Promise<void> {
  const nameInput = document.getElementById('itemNameInput') as HTMLInputElement;
  const mengeInput = document.getElementById('itemMengeInput') as HTMLInputElement;

  if (!nameInput || !mengeInput) return;

  const name = nameInput.value.trim();
  if (!name) {
    showError('Bitte geben Sie einen Artikel-Namen ein.');
    return;
  }

  // Check if the item name matches an existing template name (case-insensitive)
  const templates = await fetchTemplates();
  const matchingTemplate = templates.find(
    (t) => t.name.toLowerCase() === name.toLowerCase()
  );

  if (matchingTemplate) {
    showError(
      `Der Artikel-Name "${name}" entspricht einem Template-Namen. ` +
      `Dies würde zu Rekursion führen. Bitte wählen Sie einen anderen Namen.`
    );
    return;
  }

  const menge = mengeInput.value.trim() || undefined;

  // Add to current items
  currentItems.push({ name, menge });

  // Clear inputs
  nameInput.value = '';
  mengeInput.value = '';
  nameInput.focus();

  // Re-render items list
  renderTemplateItems();
}

