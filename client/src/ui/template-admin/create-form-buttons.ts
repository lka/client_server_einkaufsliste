import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
} from '../../data/api.js';
import { createButton } from '../components/button.js';
import { showError, showSuccess } from '../components/toast.js';
import { loadTemplates, currentItems, editingTemplateId, resetForm } from './render-templates.js';

let saveBtn: HTMLButtonElement | null = null;

/**
 * Create form action buttons using the Button component.
 */
export function createFormButtons(): void {
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
  formActions.appendChild(cancelBtnElement);
}

/**
 * Handle saving a template (create or update).
 */
async function handleSaveTemplate(): Promise<void> {
  const nameInput = document.getElementById('templateNameInput') as HTMLInputElement;
  const descriptionInput = document.getElementById('templateDescriptionInput') as HTMLTextAreaElement;
  const personCountInput = document.getElementById('templatePersonCountInput') as HTMLInputElement;

  if (!nameInput || !descriptionInput || !personCountInput) return;

  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim() || undefined;
  const personCount = parseInt(personCountInput.value, 10) || 2;

  // Validation
  if (!name) {
    showError('Bitte geben Sie einen Template-Namen ein.');
    return;
  }

  if (currentItems.length === 0) {
    showError('Bitte fügen Sie mindestens einen Artikel hinzu.');
    return;
  }

  // Check if any item in this template has the same name as this template (self-reference)
  const selfReferenceItem = currentItems.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );

  if (selfReferenceItem) {
    showError(
      `Das Template "${name}" enthält einen Artikel mit dem gleichen Namen. ` +
      `Dies würde zu Rekursion führen. Bitte entfernen Sie den Artikel "${selfReferenceItem.name}".`
    );
    return;
  }

  // Check if any item matches another template name
  const templates = await fetchTemplates();
  for (const item of currentItems) {
    const matchingTemplate = templates.find(
      (t) => t.name.toLowerCase() === item.name.toLowerCase() &&
            (editingTemplateId === null || t.id !== editingTemplateId)
    );

    if (matchingTemplate) {
      showError(
        `Der Artikel "${item.name}" entspricht dem Template-Namen "${matchingTemplate.name}". ` +
        `Dies würde zu Rekursion führen. Bitte entfernen Sie diesen Artikel.`
      );
      return;
    }
  }

  // Save template
  let success = false;
  if (editingTemplateId !== null) {
    // Update existing template
    const result = await updateTemplate(editingTemplateId, name, description, personCount, currentItems);
    success = result !== null;
    if (success) {
      showSuccess('Template aktualisiert!');
    }
  } else {
    // Create new template
    const result = await createTemplate(name, description, personCount, currentItems);
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
 * Handle canceling edit mode.
 */
function handleCancelEdit(): void {
  resetForm();
}

/**
 * Update the save button enabled/disabled state based on current items.
 */
export function updateSaveButtonState(): void {
  if (!saveBtn) return;

  // Disable button if no items added
  saveBtn.disabled = currentItems.length === 0;
}

