/**
 * Template administration UI component.
 *
 * Provides UI for managing shopping templates (create, edit, delete).
 */

import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type Template,
  type TemplateItem,
} from '../data/api.js';
import { showError, showSuccess } from './components/toast.js';
import { createButton } from './components/button.js';

// Current editing state
let editingTemplateId: number | null = null;
let currentItems: TemplateItem[] = [];

// Button references
let saveBtn: HTMLButtonElement | null = null;
let cancelBtn: HTMLButtonElement | null = null;

/**
 * Initialize the template admin UI.
 */
export function initTemplateAdmin(): void {
  // Create form action buttons
  createFormButtons();

  // Load and render templates
  loadTemplates();

  // Attach event listeners
  attachTemplateAdminListeners();

  // Set initial button state (disabled since no items at start)
  updateSaveButtonState();
}

/**
 * Create form action buttons using the Button component.
 */
function createFormButtons(): void {
  const formActions = document.getElementById('formActions');
  if (!formActions) return;

  // Create save button
  const saveBtnElement = createButton({
    label: '💾 Vorlage speichern',
    variant: 'success',
    onClick: handleSaveTemplate,
  });
  saveBtnElement.id = 'saveTemplateBtn';
  saveBtn = saveBtnElement;
  formActions.appendChild(saveBtnElement);

  // Create cancel button
  const cancelBtnElement = createButton({
    label: '❌ Abbrechen',
    variant: 'secondary',
    onClick: handleCancelEdit,
  });
  cancelBtnElement.id = 'cancelEditBtn';
  cancelBtnElement.style.display = 'none';
  cancelBtn = cancelBtnElement;
  formActions.appendChild(cancelBtnElement);
}

/**
 * Load and render templates from API.
 */
async function loadTemplates(): Promise<void> {
  const templates = await fetchTemplates();
  renderTemplates(templates);
}

/**
 * Render templates list.
 */
function renderTemplates(templates: readonly Template[]): void {
  const container = document.getElementById('templatesList');
  if (!container) return;

  if (templates.length === 0) {
    container.innerHTML = '<div class="no-templates">Keine Templates vorhanden.</div>';
    return;
  }

  const html = templates
    .map(
      (template) => `
    <div class="template-item" data-template-id="${template.id}">
      <div class="template-header">
        <div class="template-info">
          <h3>${template.name}</h3>
          ${template.description ? `<p class="template-description">${template.description}</p>` : ''}
        </div>
        <div class="template-controls">
          <button class="edit-template-btn" data-template-id="${template.id}" title="Bearbeiten">
            ✏️
          </button>
          <button class="delete-template-btn" data-template-id="${template.id}" title="Löschen">
            🗑️
          </button>
        </div>
      </div>

      <div class="template-items-display">
        <h4>Artikel (${template.items.length})</h4>
        <ul>
          ${template.items
            .map(
              (item) => `
            <li>
              <span class="item-name">${item.name}${item.menge ? ` (${item.menge})` : ''}</span>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    </div>
  `
    )
    .join('');

  container.innerHTML = html;
}

/**
 * Render template items list in the form.
 */
function renderTemplateItems(): void {
  const container = document.getElementById('templateItemsList');
  if (!container) return;

  if (currentItems.length === 0) {
    container.innerHTML = '<div class="no-items">Keine Artikel hinzugefügt.</div>';
  } else {
    const html = currentItems
      .map(
        (item, index) => `
      <div class="template-item-row" data-index="${index}">
        <span class="item-name">${item.name}</span>
        ${item.menge ? `<span class="item-menge">${item.menge}</span>` : '<span class="item-menge">-</span>'}
        <button class="remove-item-btn" data-index="${index}" title="Entfernen">🗑️</button>
      </div>
    `
      )
      .join('');

    container.innerHTML = html;
  }

  // Update save button state
  updateSaveButtonState();
}

/**
 * Update the save button enabled/disabled state based on current items.
 */
function updateSaveButtonState(): void {
  if (!saveBtn) return;

  // Disable button if no items added
  saveBtn.disabled = currentItems.length === 0;
}

/**
 * Attach event listeners to template admin UI elements.
 */
function attachTemplateAdminListeners(): void {
  // Add item button
  const addItemBtn = document.getElementById('addItemBtn');
  addItemBtn?.addEventListener('click', handleAddItem);

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
}

/**
 * Handle adding an item to the current template form.
 */
function handleAddItem(): void {
  const nameInput = document.getElementById('itemNameInput') as HTMLInputElement;
  const mengeInput = document.getElementById('itemMengeInput') as HTMLInputElement;

  if (!nameInput || !mengeInput) return;

  const name = nameInput.value.trim();
  if (!name) {
    showError('Bitte geben Sie einen Artikel-Namen ein.');
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

/**
 * Handle removing an item from the current template form.
 */
function handleRemoveItem(index: number): void {
  currentItems.splice(index, 1);
  renderTemplateItems();
}

/**
 * Handle saving a template (create or update).
 */
async function handleSaveTemplate(): Promise<void> {
  const nameInput = document.getElementById('templateNameInput') as HTMLInputElement;
  const descriptionInput = document.getElementById('templateDescriptionInput') as HTMLTextAreaElement;

  if (!nameInput || !descriptionInput) return;

  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim() || undefined;

  // Validation
  if (!name) {
    showError('Bitte geben Sie einen Template-Namen ein.');
    return;
  }

  if (currentItems.length === 0) {
    showError('Bitte fügen Sie mindestens einen Artikel hinzu.');
    return;
  }

  // Save template
  let success = false;
  if (editingTemplateId !== null) {
    // Update existing template
    const result = await updateTemplate(editingTemplateId, name, description, currentItems);
    success = result !== null;
    if (success) {
      showSuccess('Template aktualisiert!');
    }
  } else {
    // Create new template
    const result = await createTemplate(name, description, currentItems);
    success = result !== null;
    if (success) {
      showSuccess('Template erstellt!');
    }
  }

  if (success) {
    // Reset form
    resetForm();

    // Reload templates
    await loadTemplates();
  }
}

/**
 * Handle editing a template.
 */
async function handleEditTemplate(templateId: number): Promise<void> {
  const templates = await fetchTemplates();
  const template = templates.find((t) => t.id === templateId);

  if (!template) {
    showError('Template nicht gefunden.');
    return;
  }

  // Set editing state
  editingTemplateId = templateId;
  currentItems = [...template.items];

  // Fill form
  const nameInput = document.getElementById('templateNameInput') as HTMLInputElement;
  const descriptionInput = document.getElementById('templateDescriptionInput') as HTMLTextAreaElement;
  const formTitle = document.getElementById('formTitle');

  if (nameInput) nameInput.value = template.name;
  if (descriptionInput) descriptionInput.value = template.description || '';
  if (formTitle) formTitle.textContent = 'Template bearbeiten';
  if (cancelBtn) cancelBtn.style.display = 'inline-block';

  // Render items
  renderTemplateItems();

  // Scroll to form
  const formSection = document.querySelector('.template-form-section');
  formSection?.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Handle deleting a template.
 */
async function handleDeleteTemplate(templateId: number): Promise<void> {
  const templates = await fetchTemplates();
  const template = templates.find((t) => t.id === templateId);

  if (!template) {
    showError('Template nicht gefunden.');
    return;
  }

  const confirmed = confirm(`Template "${template.name}" wirklich löschen?`);
  if (!confirmed) return;

  const success = await deleteTemplate(templateId);
  if (success) {
    showSuccess('Template gelöscht!');

    // If we're editing this template, reset form
    if (editingTemplateId === templateId) {
      resetForm();
    }

    // Reload templates
    await loadTemplates();
  }
}

/**
 * Handle canceling edit mode.
 */
function handleCancelEdit(): void {
  resetForm();
}

/**
 * Reset the template form to its initial state.
 */
function resetForm(): void {
  editingTemplateId = null;
  currentItems = [];

  const nameInput = document.getElementById('templateNameInput') as HTMLInputElement;
  const descriptionInput = document.getElementById('templateDescriptionInput') as HTMLTextAreaElement;
  const itemNameInput = document.getElementById('itemNameInput') as HTMLInputElement;
  const itemMengeInput = document.getElementById('itemMengeInput') as HTMLInputElement;
  const formTitle = document.getElementById('formTitle');

  if (nameInput) nameInput.value = '';
  if (descriptionInput) descriptionInput.value = '';
  if (itemNameInput) itemNameInput.value = '';
  if (itemMengeInput) itemMengeInput.value = '';
  if (formTitle) formTitle.textContent = 'Neues Template erstellen';
  if (cancelBtn) cancelBtn.style.display = 'none';

  renderTemplateItems();
}
