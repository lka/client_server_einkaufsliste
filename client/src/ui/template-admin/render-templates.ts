import {
  fetchTemplates,
  deleteTemplate,
  type Template,
  type TemplateItem,
} from '../../data/api.js';

import { updateSaveButtonState } from './create-form-buttons.js';
import { showError, showSuccess } from '../components/toast.js';
import { templateAdminState } from '../../state/template-admin-state.js';

// Current editing state
export let editingTemplateId: number | null = null;
export let currentItems: TemplateItem[] = [];

// Store all templates for filtering (kept for backwards compatibility with existing code)
export let allTemplates: Template[] = [];

/**
 * Load and render templates from API.
 */
export async function loadTemplates(): Promise<void> {
  await templateAdminState.loadTemplates();
  const state = templateAdminState.getState();
  allTemplates = state.templates as Template[];
  renderTemplates(allTemplates);
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
          <p class="template-person-count">👥 ${template.person_count} ${template.person_count === 1 ? 'Person' : 'Personen'}</p>
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
export function renderTemplateItems(): void {
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
 * Filter templates based on search query.
 */
export function filterTemplates(query: string): void {
  // Use state-based filtering
  templateAdminState.setFilterQuery(query);
  const state = templateAdminState.getState();

  // Update local allTemplates for backwards compatibility
  allTemplates = state.templates as Template[];

  // Render filtered results
  renderTemplates(state.filteredTemplates);
}

/**
 * Reset the template form to its initial state.
 */
export function resetForm(): void {
  editingTemplateId = null;
  currentItems = [];

  const nameInput = document.getElementById('templateNameInput') as HTMLInputElement;
  const descriptionInput = document.getElementById('templateDescriptionInput') as HTMLTextAreaElement;
  const personCountInput = document.getElementById('templatePersonCountInput') as HTMLInputElement;
  const itemNameInput = document.getElementById('itemNameInput') as HTMLInputElement;
  const itemMengeInput = document.getElementById('itemMengeInput') as HTMLInputElement;
  const formTitle = document.getElementById('formTitle');

  if (nameInput) nameInput.value = '';
  if (descriptionInput) descriptionInput.value = '';
  if (personCountInput) personCountInput.value = '2';
  if (itemNameInput) itemNameInput.value = '';
  if (itemMengeInput) itemMengeInput.value = '';
  if (formTitle) formTitle.textContent = 'Neue Vorlage erstellen';

  renderTemplateItems();
}

/**
 * Handle editing a template.
 */
export async function handleEditTemplate(templateId: number): Promise<void> {
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
  const personCountInput = document.getElementById('templatePersonCountInput') as HTMLInputElement;
  const formTitle = document.getElementById('formTitle');

  if (nameInput) nameInput.value = template.name;
  if (descriptionInput) descriptionInput.value = template.description || '';
  if (personCountInput) personCountInput.value = String(template.person_count);
  if (formTitle) formTitle.textContent = 'Vorlage bearbeiten';

  // Render items
  renderTemplateItems();

  // Scroll to form
  const formSection = document.querySelector('.template-form-section');
  formSection?.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Handle deleting a template.
 */
export async function handleDeleteTemplate(templateId: number): Promise<void> {
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
 * Handle removing an item from the current template form.
 */
export function handleRemoveItem(index: number): void {
  currentItems.splice(index, 1);
  renderTemplateItems();
}

