/**
 * Weekplan UI Module
 * Manages the weekly planning view with navigation and day columns
 */

import { getWeekplanEntries, createWeekplanEntry, deleteWeekplanEntry, getWeekplanSuggestions, WeekplanEntry, fetchTemplates, updateWeekplanEntryDeltas, WeekplanDeltas, DeltaItem } from '../data/api.js';
import { onWeekplanAdded, onWeekplanDeleted, broadcastWeekplanAdd, broadcastWeekplanDelete } from '../data/websocket.js';
import { printWeekplan } from './print-utils.js';
import { Autocomplete } from './components/autocomplete.js';
import { Modal } from './components/modal.js';

// Store entries by date and meal
const entriesStore: Map<string, Map<string, WeekplanEntry[]>> = new Map();

/**
 * Get the ISO week number for a given date
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get Monday of the week for a given date
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

/**
 * Format date as DD.MM.
 */
function formatShortDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.`;
}

/**
 * Current week offset (0 = current week, -1 = previous week, +1 = next week)
 */
let weekOffset = 0;

/**
 * Format date as YYYY-MM-DD for API
 */
function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Render the week display and update day columns
 */
async function renderWeek(): Promise<void> {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (weekOffset * 7));

  const monday = getMonday(targetDate);
  const weekNumber = getISOWeek(monday);
  const year = monday.getFullYear();

  // Calculate date range for the week
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    dates.push(day);
  }

  const startDateStr = formatShortDate(dates[0]);
  const endDateStr = formatShortDate(dates[6]);

  // Update week display
  const weekDisplay = document.getElementById('weekDisplay');
  if (weekDisplay) {
    weekDisplay.textContent = `KW ${weekNumber} · ${startDateStr} - ${endDateStr}${year}`;
  }

  // Load entries for this week
  const weekStartISO = formatISODate(monday);
  try {
    const entries = await getWeekplanEntries(weekStartISO);

    // Clear and rebuild entries store
    entriesStore.clear();
    for (const entry of entries) {
      if (!entriesStore.has(entry.date)) {
        entriesStore.set(entry.date, new Map());
      }
      const dateMap = entriesStore.get(entry.date)!;
      if (!dateMap.has(entry.meal)) {
        dateMap.set(entry.meal, []);
      }
      dateMap.get(entry.meal)!.push(entry);
    }
  } catch (error) {
    console.error('Failed to load weekplan entries:', error);
  }

  // Update day columns
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const todayStr = formatShortDate(today);

  dayNames.forEach((dayName, index) => {
    const dayColumn = document.querySelector(`.day-column[data-day="${dayName}"]`);
    if (dayColumn) {
      const dayHeader = dayColumn.querySelector('.day-header');
      const dateSpan = dayColumn.querySelector('.day-date');
      if (dateSpan) {
        const currentDateStr = formatShortDate(dates[index]);
        dateSpan.textContent = currentDateStr;

        // Add 'today' class if this is today's date
        if (dayHeader) {
          if (currentDateStr === todayStr) {
            dayHeader.classList.add('today');
          } else {
            dayHeader.classList.remove('today');
          }
        }
      }

      // Render entries for each meal section
      const dateISO = formatISODate(dates[index]);
      const meals = ['morning', 'lunch', 'dinner'];
      meals.forEach(meal => {
        const mealSection = dayColumn.querySelector(`.meal-section[data-meal="${meal}"]`);
        if (mealSection) {
          const mealContent = mealSection.querySelector('.meal-content');
          if (mealContent) {
            // Clear existing entries
            mealContent.querySelectorAll('.meal-item').forEach(item => item.remove());

            // Add entries from store
            const dateEntries = entriesStore.get(dateISO);
            if (dateEntries) {
              const mealEntries = dateEntries.get(meal);
              if (mealEntries) {
                mealEntries.forEach(entry => {
                  addMealItemToDOM(mealContent, entry.text, entry.id!);
                });
              }
            }
          }
        }
      });
    }
  });
}

/**
 * Navigate to previous week
 */
function navigateToPreviousWeek(): void {
  weekOffset--;
  renderWeek();
}

/**
 * Navigate to next week
 */
function navigateToNextWeek(): void {
  weekOffset++;
  renderWeek();
}

/**
 * Handle print weekplan button click
 */
function handlePrintWeekplan(): void {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + (weekOffset * 7));

  const monday = getMonday(targetDate);
  const weekNumber = getISOWeek(monday);
  const year = monday.getFullYear();

  // Calculate date range for the week
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    dates.push(day);
  }

  // Build entries map for printing - always include all 7 days
  const printEntries = new Map<string, Map<string, Array<{ id: number; text: string }>>>();

  for (let i = 0; i < 7; i++) {
    const dateISO = formatISODate(dates[i]);
    const dateEntries = entriesStore.get(dateISO);
    const dayPrintEntries = new Map<string, Array<{ id: number; text: string }>>();

    ['morning', 'lunch', 'dinner'].forEach(meal => {
      const mealEntries = dateEntries?.get(meal);
      if (mealEntries && mealEntries.length > 0) {
        dayPrintEntries.set(meal, mealEntries.map(e => ({ id: e.id!, text: e.text })));
      }
    });

    // Always add the date to the map, even if there are no entries
    printEntries.set(dateISO, dayPrintEntries);
  }

  // Call print function
  printWeekplan(weekNumber, year, printEntries);
}

/**
 * Handle adding a meal entry
 */
async function handleAddMealEntry(event: Event): Promise<void> {
  const button = event.target as HTMLButtonElement;
  const mealSection = button.closest('.meal-section');
  const mealContent = mealSection?.querySelector('.meal-content');
  const dayColumn = button.closest('.day-column');

  if (!mealContent || !mealSection || !dayColumn) return;

  const meal = mealSection.getAttribute('data-meal');
  const dayName = dayColumn.getAttribute('data-day');

  if (!meal || !dayName) return;

  // Check if there's already an input field
  const existingInput = mealContent.querySelector('.meal-input') as HTMLInputElement;
  if (existingInput) {
    // If there's content, save it first, then create a new input
    if (existingInput.value.trim()) {
      const textToSave = existingInput.value.trim();
      const existingWrapper = existingInput.closest('div');

      // Disable the input to prevent double-submission
      existingInput.disabled = true;

      // Calculate full date from displayed date
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + (weekOffset * 7));
      const monday = getMonday(targetDate);

      const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(dayName);
      const date = new Date(monday);
      date.setDate(monday.getDate() + dayIndex);
      const dateISO = formatISODate(date);

      try {
        const entry = await createWeekplanEntry({
          date: dateISO,
          meal: meal,
          text: textToSave
        });

        // Add to store
        if (!entriesStore.has(dateISO)) {
          entriesStore.set(dateISO, new Map());
        }
        const dateMap = entriesStore.get(dateISO)!;
        if (!dateMap.has(meal)) {
          dateMap.set(meal, []);
        }
        dateMap.get(meal)!.push(entry);

        // Add to DOM
        addMealItemToDOM(mealContent, entry.text, entry.id!);

        // Remove the existing input wrapper
        if (existingWrapper) {
          existingWrapper.remove();
        }

        // Broadcast to other users via WebSocket
        broadcastWeekplanAdd(entry);

        // Continue to create a new input below
      } catch (error) {
        console.error('Failed to create entry:', error);
        existingInput.disabled = false;
        alert('Fehler beim Speichern des Eintrags');
        return; // Don't create a new input if save failed
      }
    } else {
      // Empty input, just focus it
      existingInput.focus();
      return;
    }
  }

  // Create wrapper for input and autocomplete
  const inputWrapper = document.createElement('div');
  inputWrapper.style.cssText = `
    position: relative;
    margin-bottom: 0.5rem;
  `;

  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'meal-input';
  input.placeholder = 'Eintrag hinzufügen...';
  input.style.cssText = `
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
  `;

  inputWrapper.appendChild(input);

  // Function to save the entry
  const saveEntry = async (text: string) => {
    if (!text.trim()) return;

    input.disabled = true;

    // Calculate full date from displayed date
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (weekOffset * 7));
    const monday = getMonday(targetDate);

    const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(dayName);
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex);
    const dateISO = formatISODate(date);

    try {
      const entry = await createWeekplanEntry({
        date: dateISO,
        meal: meal,
        text: text.trim()
      });

      // Add to store
      if (!entriesStore.has(dateISO)) {
        entriesStore.set(dateISO, new Map());
      }
      const dateMap = entriesStore.get(dateISO)!;
      if (!dateMap.has(meal)) {
        dateMap.set(meal, []);
      }
      dateMap.get(meal)!.push(entry);

      // Add to DOM
      addMealItemToDOM(mealContent, entry.text, entry.id!);
      autocomplete.destroy();
      inputWrapper.remove();

      // Broadcast to other users via WebSocket
      broadcastWeekplanAdd(entry);
    } catch (error) {
      console.error('Failed to create entry:', error);
      input.disabled = false;
      alert('Fehler beim Speichern des Eintrags');
    }
  };

  // Initialize Autocomplete for entry suggestions
  const autocomplete = new Autocomplete({
    input,
    onSearch: async (query: string) => {
      const suggestions = await getWeekplanSuggestions(query, 5);
      return suggestions.map(text => ({
        id: text,
        label: text,
        data: text,
      }));
    },
    onSelect: (suggestion) => {
      // Save entry immediately when suggestion is selected
      saveEntry(suggestion.label);
    },
    debounceMs: 300,
    minChars: 2,
    maxSuggestions: 5,
  });

  // Add entry on Enter key
  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      await saveEntry(input.value);
    } else if (e.key === 'Escape') {
      autocomplete.destroy();
      inputWrapper.remove();
    }
  });

  // Remove input on blur if empty
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!input.value.trim()) {
        autocomplete.destroy();
        inputWrapper.remove();
      }
    }, 200);
  });

  mealContent.insertBefore(inputWrapper, mealContent.firstChild);
  input.focus();
}

/**
 * Show template details in a modal with delta management
 */
async function showTemplateDetails(templateName: string, entryId: number): Promise<void> {
  try {
    // Fetch all templates and find matching one
    const templates = await fetchTemplates();
    const template = templates.find(t => t.name.toLowerCase() === templateName.toLowerCase());

    if (!template) {
      return; // Not a template, do nothing
    }

    // Get current entry to load existing deltas
    let currentEntry: WeekplanEntry | undefined;
    for (const dateMap of entriesStore.values()) {
      for (const entries of dateMap.values()) {
        currentEntry = entries.find(e => e.id === entryId);
        if (currentEntry) break;
      }
      if (currentEntry) break;
    }

    // Initialize deltas from current entry or create new
    const currentDeltas: WeekplanDeltas = currentEntry?.deltas || {
      removed_items: [],
      added_items: []
    };

    // Build content with scrollable template items section
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'display: flex; flex-direction: column; max-height: 500px;';

    // Scrollable section for template items
    const scrollableSection = document.createElement('div');
    scrollableSection.style.cssText = 'flex: 1; overflow-y: auto; padding-bottom: 0.5rem;';

    if (template.description) {
      const description = document.createElement('p');
      description.textContent = template.description;
      description.style.cssText = 'color: #666; margin-bottom: 0.5rem; font-style: italic; font-size: 0.9rem;';
      scrollableSection.appendChild(description);
    }

    // Track which items are removed (checked = removed)
    const removedItems = new Set<string>(currentDeltas.removed_items);

    // Store adjusted quantities for template items
    const adjustedQuantities = new Map<string, string>();

    // Helper function to adjust a quantity by a factor
    const adjustQuantityByFactor = (originalMenge: string, factor: number): string => {
      if (isNaN(factor) || factor <= 0) return originalMenge;

      // Extract numeric value and unit from menge (e.g., "2 kg" -> 2 and "kg")
      const mengeMatch = originalMenge.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
      if (!mengeMatch) return originalMenge;

      let value = parseFloat(mengeMatch[1].replace(',', '.'));
      const unit = mengeMatch[2];

      // Apply factor
      value *= factor;

      // Format the result
      const formattedValue = value % 1 === 0 ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '');
      return unit ? `${formattedValue} ${unit}` : formattedValue;
    };

    const renderTemplateItems = () => {
      const itemsList = document.createElement('ul');
      itemsList.style.cssText = 'list-style: none; padding: 0; margin: 0;';

      template.items.forEach(item => {
        const li = document.createElement('li');
        const isRemoved = removedItems.has(item.name);

        li.style.cssText = `
          padding: 0.25rem 0.5rem;
          background: ${isRemoved ? '#ffe6e6' : '#f8f9fa'};
          border-radius: 3px;
          margin-bottom: 0.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        `;

        // Left side: checkbox + name
        const leftDiv = document.createElement('div');
        leftDiv.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isRemoved;
        checkbox.style.cssText = 'cursor: pointer; width: 16px; height: 16px;';
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            removedItems.add(item.name);
            li.style.backgroundColor = '#ffe6e6';
            nameSpan.style.textDecoration = 'line-through';
            nameSpan.style.opacity = '0.6';
          } else {
            removedItems.delete(item.name);
            li.style.backgroundColor = '#f8f9fa';
            nameSpan.style.textDecoration = 'none';
            nameSpan.style.opacity = '1';
          }
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;
        nameSpan.style.cssText = `
          font-weight: 500;
          ${isRemoved ? 'text-decoration: line-through; opacity: 0.6;' : ''}
        `;

        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(nameSpan);
        li.appendChild(leftDiv);

        if (item.menge) {
          const mengeSpan = document.createElement('span');
          // Use adjusted quantity if available, otherwise use original
          const displayMenge = adjustedQuantities.get(item.name) || item.menge;
          mengeSpan.textContent = displayMenge;
          mengeSpan.style.cssText = 'color: #666; font-size: 0.85rem; margin-left: 0.5rem;';
          li.appendChild(mengeSpan);
        }

        itemsList.appendChild(li);
      });

      return itemsList;
    };

    // Use template's person_count as the original value
    const originalPersonCount = template.person_count;
    let adjustedPersonCount: number | null = currentDeltas.person_count || null;

    // If person_count is set in deltas, apply the adjustment automatically
    if (adjustedPersonCount !== null) {
      const factor = adjustedPersonCount / originalPersonCount;
      template.items.forEach(item => {
        if (item.menge) {
          const adjusted = adjustQuantityByFactor(item.menge, factor);
          adjustedQuantities.set(item.name, adjusted);
        }
      });
    }

    if (template.items.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.textContent = 'Keine Items in dieser Vorlage.';
      emptyMsg.style.cssText = 'color: #999;';
      scrollableSection.appendChild(emptyMsg);
    } else {
      // Quantity adjustment section based on person count
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
      adjustInput.value = String(adjustedPersonCount !== null ? adjustedPersonCount : originalPersonCount);
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

        // Store the adjusted person count
        adjustedPersonCount = targetPersonCount;

        // Calculate the factor based on person count
        const factor = targetPersonCount / originalPersonCount;

        // Apply adjustment to all items with quantities
        template.items.forEach(item => {
          if (item.menge) {
            const adjusted = adjustQuantityByFactor(item.menge, factor);
            adjustedQuantities.set(item.name, adjusted);
          }
        });

        // Re-render the list
        const oldList = scrollableSection.querySelector('ul');
        if (oldList) {
          const newList = renderTemplateItems();
          scrollableSection.replaceChild(newList, oldList);
        }

        adjustInput.value = '';
      });

      adjustForm.appendChild(adjustInput);
      adjustForm.appendChild(adjustBtn);
      adjustSection.appendChild(adjustLabel);
      adjustSection.appendChild(adjustForm);

      scrollableSection.appendChild(adjustSection);
      scrollableSection.appendChild(renderTemplateItems());
    }

    // Track added items
    const addedItems = new Map<string, DeltaItem>(
      currentDeltas.added_items.map(item => [item.name, item])
    );

    // Container for added items list (in scrollable section)
    const addedItemsList = document.createElement('div');
    addedItemsList.style.cssText = 'margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e0e0e0;';

    const renderAddedItems = () => {
      addedItemsList.innerHTML = '';

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
            padding: 0.25rem 0.5rem;
            background: #e8f5e9;
            border-radius: 3px;
            margin-bottom: 0.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.9rem;
          `;

          const leftDiv = document.createElement('div');
          leftDiv.style.cssText = 'display: flex; align-items: center; gap: 0.5rem;';

          const nameSpan = document.createElement('span');
          nameSpan.textContent = name;
          nameSpan.style.cssText = 'font-weight: 500; color: #2e7d32;';
          leftDiv.appendChild(nameSpan);

          if (item.menge) {
            const mengeSpan = document.createElement('span');
            mengeSpan.textContent = item.menge;
            mengeSpan.style.cssText = 'color: #666; font-size: 0.85rem;';
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
            addedItems.delete(name);
            renderAddedItems();
          });
          li.appendChild(removeBtn);

          list.appendChild(li);
        });

        addedItemsList.appendChild(list);
      }
    };

    renderAddedItems();
    scrollableSection.appendChild(addedItemsList);

    contentDiv.appendChild(scrollableSection);

    // Fixed section for adding new items (always visible at bottom)
    const addItemSection = document.createElement('div');
    addItemSection.style.cssText = `
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
      background: white;
    `;

    // Input form for adding items
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
    addBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const menge = mengeInput.value.trim();

      if (!name) {
        nameInput.focus();
        return;
      }

      // Check if item already in template
      const isInTemplate = template.items.some(item =>
        item.name.toLowerCase() === name.toLowerCase()
      );
      if (isInTemplate) {
        alert('Dieser Artikel ist bereits in der Vorlage enthalten. Nutze die Checkbox zum Aktivieren/Deaktivieren.');
        nameInput.value = '';
        nameInput.focus();
        return;
      }

      addedItems.set(name, { name, menge: menge || undefined });
      renderAddedItems();
      nameInput.value = '';
      mengeInput.value = '';
      nameInput.focus();
    });

    addForm.appendChild(nameGroup);
    addForm.appendChild(mengeGroup);
    addForm.appendChild(addBtn);
    addItemSection.appendChild(addForm);

    // Add save button to the fixed section
    const saveButtonDiv = document.createElement('div');
    saveButtonDiv.style.cssText = 'margin-top: 0.75rem; display: flex; justify-content: flex-end;';

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Änderungen speichern';
    saveButton.style.cssText = `
      background: #4a90e2;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    `;
    saveButton.addEventListener('mouseover', () => {
      saveButton.style.backgroundColor = '#357abd';
    });
    saveButton.addEventListener('mouseout', () => {
      saveButton.style.backgroundColor = '#4a90e2';
    });

    // Collect checkbox states from DOM
    const collectCheckboxStates = () => {
      removedItems.clear();
      const checkboxes = contentDiv.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((cb, index) => {
        const checkbox = cb as HTMLInputElement;
        if (checkbox.checked && template.items[index]) {
          removedItems.add(template.items[index].name);
        }
      });
    };

    saveButton.addEventListener('click', async () => {
      try {
        saveButton.disabled = true;
        saveButton.textContent = 'Speichere...';

        collectCheckboxStates();

        // Collect only manually added items (not adjusted template items)
        const allAddedItems = new Map(addedItems);

        const newDeltas: WeekplanDeltas = {
          removed_items: Array.from(removedItems),
          added_items: Array.from(allAddedItems.values()),
          person_count: adjustedPersonCount !== null ? adjustedPersonCount : undefined
        };

        // When person_count is saved, the backend can calculate adjusted quantities
        // from the original template items using: adjusted = original * (person_count / template.person_count)

        await updateWeekplanEntryDeltas(entryId, newDeltas);

        // Update local store
        if (currentEntry) {
          currentEntry.deltas = newDeltas;
        }

        saveButton.textContent = '✓ Gespeichert';
        saveButton.style.backgroundColor = '#5cb85c';

        setTimeout(() => {
          modal.close();
        }, 500);
      } catch (error) {
        console.error('Failed to save deltas:', error);
        saveButton.disabled = false;
        saveButton.textContent = 'Fehler - Nochmal versuchen';
        saveButton.style.backgroundColor = '#d9534f';
        setTimeout(() => {
          saveButton.textContent = 'Änderungen speichern';
          saveButton.style.backgroundColor = '#4a90e2';
        }, 2000);
      }
    });

    saveButtonDiv.appendChild(saveButton);
    addItemSection.appendChild(saveButtonDiv);

    contentDiv.appendChild(addItemSection);

    // Create and show modal
    const modal = new Modal({
      title: `📋 ${template.name}`,
      content: contentDiv,
      size: 'medium'
    });

    modal.open();
  } catch (error) {
    console.error('Failed to load template details:', error);
  }
}

/**
 * Add a meal item to the DOM
 */
function addMealItemToDOM(container: Element, text: string, entryId: number): void {
  const item = document.createElement('div');
  item.className = 'meal-item';
  item.dataset.entryId = String(entryId);
  item.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.6rem;
    background: white;
    border-radius: 4px;
    margin-bottom: 0.3rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `;

  const span = document.createElement('span');
  span.textContent = text;
  span.style.cssText = `
    flex: 1;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    transition: all 0.2s;
    user-select: none;
  `;

  // Make text clickable to show template details
  span.addEventListener('click', async (e) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault(); // Prevent default action
    await showTemplateDetails(text, entryId);
  });

  span.addEventListener('mouseover', () => {
    span.style.backgroundColor = '#e8f4fd';
    span.style.textDecoration = 'underline';
    span.style.color = '#0066cc';
  });

  span.addEventListener('mouseout', () => {
    span.style.backgroundColor = 'transparent';
    span.style.textDecoration = 'none';
    span.style.color = 'inherit';
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️';
  deleteBtn.className = 'delete-meal-item';
  deleteBtn.style.cssText = `
    background: transparent;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.2s;
    filter: grayscale(100%);
  `;
  deleteBtn.addEventListener('mouseover', () => {
    deleteBtn.style.opacity = '1';
    deleteBtn.style.filter = 'grayscale(0%)';
  });
  deleteBtn.addEventListener('mouseout', () => {
    deleteBtn.style.opacity = '0.6';
    deleteBtn.style.filter = 'grayscale(100%)';
  });
  deleteBtn.addEventListener('click', async () => {
    deleteBtn.disabled = true;
    try {
      await deleteWeekplanEntry(entryId);

      // Remove from store
      for (const dateMap of entriesStore.values()) {
        for (const entries of dateMap.values()) {
          const index = entries.findIndex(e => e.id === entryId);
          if (index !== -1) {
            entries.splice(index, 1);
            break;
          }
        }
      }

      // Remove from DOM
      item.remove();

      // Broadcast to other users via WebSocket
      broadcastWeekplanDelete(entryId);
    } catch (error) {
      console.error('Failed to delete entry:', error);
      deleteBtn.disabled = false;
      alert('Fehler beim Löschen des Eintrags');
    }
  });

  item.appendChild(span);
  item.appendChild(deleteBtn);
  container.appendChild(item);
}

/**
 * Handle incoming WebSocket event for weekplan entry added
 */
function handleWeekplanAdded(data: WeekplanEntry): void {
  // Add to store
  if (!entriesStore.has(data.date)) {
    entriesStore.set(data.date, new Map());
  }
  const dateMap = entriesStore.get(data.date)!;
  if (!dateMap.has(data.meal)) {
    dateMap.set(data.meal, []);
  }
  dateMap.get(data.meal)!.push(data);

  // Find the correct meal section and add to DOM
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Calculate which day of the week this date is
  const entryDate = new Date(data.date);
  const dayOfWeek = entryDate.getDay();
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to index 6
  const dayName = dayNames[dayIndex];

  const dayColumn = document.querySelector(`.day-column[data-day="${dayName}"]`);
  if (dayColumn) {
    const mealSection = dayColumn.querySelector(`.meal-section[data-meal="${data.meal}"]`);
    if (mealSection) {
      const mealContent = mealSection.querySelector('.meal-content');
      if (mealContent) {
        addMealItemToDOM(mealContent, data.text, data.id!);
      }
    }
  }
}

/**
 * Handle incoming WebSocket event for weekplan entry deleted
 */
function handleWeekplanDeleted(data: { id: number }): void {
  // Remove from store
  for (const dateMap of entriesStore.values()) {
    for (const entries of dateMap.values()) {
      const index = entries.findIndex(e => e.id === data.id);
      if (index !== -1) {
        entries.splice(index, 1);
        break;
      }
    }
  }

  // Remove from DOM
  const item = document.querySelector(`.meal-item[data-entry-id="${data.id}"]`);
  if (item) {
    item.remove();
  }
}

/**
 * Initialize weekplan UI
 */
export function initWeekplan(): void {
  // Render current week
  renderWeek();

  // Attach event listeners for navigation
  const prevWeekBtn = document.getElementById('prevWeekBtn');
  const nextWeekBtn = document.getElementById('nextWeekBtn');
  const printWeekBtn = document.getElementById('printWeekBtn');

  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', navigateToPreviousWeek);
  }

  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', navigateToNextWeek);
  }

  if (printWeekBtn) {
    printWeekBtn.addEventListener('click', handlePrintWeekplan);
  }

  // Attach event listeners for add meal buttons
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('add-meal-btn')) {
      handleAddMealEntry(event);
    }
  });

  // Subscribe to WebSocket events
  onWeekplanAdded((data: any) => {
    handleWeekplanAdded(data);
  });

  onWeekplanDeleted((data: { id: number }) => {
    handleWeekplanDeleted(data);
  });
}
