/**
 * Reusable Input component.
 *
 * Provides consistent form input styling with validation states.
 */

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';

export interface InputOptions {
  label?: string;
  placeholder?: string;
  type?: InputType;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  name?: string;
  id?: string;
  className?: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
}

export interface InputGroup {
  container: HTMLDivElement;
  input: HTMLInputElement;
  errorEl?: HTMLSpanElement;
}

// Counter for auto-generated IDs
let inputIdCounter = 0;

/**
 * Create an input field with label and error handling.
 */
export function createInput(options: InputOptions): InputGroup {
  const {
    label,
    placeholder = '',
    type = 'text',
    value = '',
    required = false,
    disabled = false,
    error,
    helpText,
    name,
    id,
    className = '',
    onChange,
    onBlur,
  } = options;

  // Generate unique ID if not provided (needed for label association)
  const inputId = id || `input-${++inputIdCounter}`;

  // Container
  const container = document.createElement('div');
  container.className = `input-group ${className}`.trim();

  // Label
  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'input-label';
    labelEl.textContent = label;

    if (required) {
      const requiredMark = document.createElement('span');
      requiredMark.className = 'input-required';
      requiredMark.textContent = ' *';
      labelEl.appendChild(requiredMark);
    }

    // Always set 'for' attribute to ensure accessibility
    labelEl.setAttribute('for', inputId);

    container.appendChild(labelEl);
  }

  // Input
  const input = document.createElement('input');
  input.type = type;
  input.className = `input-field ${error ? 'input-error' : ''}`.trim();
  input.placeholder = placeholder;
  input.value = value;
  input.disabled = disabled;

  if (required) {
    input.required = true;
  }

  if (name) {
    input.name = name;
  }

  // Always set ID to ensure label association
  input.id = inputId;

  // Event handlers
  if (onChange) {
    input.addEventListener('input', (e) => {
      onChange((e.target as HTMLInputElement).value);
    });
  }

  if (onBlur) {
    input.addEventListener('blur', (e) => {
      onBlur((e.target as HTMLInputElement).value);
    });
  }

  container.appendChild(input);

  // Help text
  if (helpText && !error) {
    const help = document.createElement('span');
    help.className = 'input-help';
    help.textContent = helpText;
    container.appendChild(help);
  }

  // Error message
  let errorEl: HTMLSpanElement | undefined;
  if (error) {
    errorEl = document.createElement('span');
    errorEl.className = 'input-error-text';
    errorEl.textContent = error;
    container.appendChild(errorEl);
  }

  return { container, input, errorEl };
}

/**
 * Set input error state.
 */
export function setInputError(inputGroup: InputGroup, error: string | null): void {
  const { input, container } = inputGroup;

  if (error) {
    input.classList.add('input-error');

    // Add or update error message
    let errorEl = inputGroup.errorEl;
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'input-error-text';
      container.appendChild(errorEl);
      inputGroup.errorEl = errorEl;
    }
    errorEl.textContent = error;

    // Remove help text if present
    const helpText = container.querySelector('.input-help');
    if (helpText) {
      helpText.remove();
    }
  } else {
    input.classList.remove('input-error');

    // Remove error message
    if (inputGroup.errorEl) {
      inputGroup.errorEl.remove();
      inputGroup.errorEl = undefined;
    }
  }
}

/**
 * Set input value.
 */
export function setInputValue(inputGroup: InputGroup, value: string): void {
  inputGroup.input.value = value;
}

/**
 * Get input value.
 */
export function getInputValue(inputGroup: InputGroup): string {
  return inputGroup.input.value;
}

/**
 * Add input styles to the document.
 * Call this once when the app initializes.
 */
export function injectInputStyles(): void {
  if (document.getElementById('component-input-styles')) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = 'component-input-styles';
  style.textContent = `
    /* Input Group */
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    /* Input Label */
    .input-label {
      font-weight: 500;
      font-size: 0.875rem;
      color: #333;
    }

    .input-required {
      color: #d32f2f;
    }

    /* Input Field */
    .input-field {
      padding: 0.75rem 1rem;
      border: 1px solid #d0d0d0;
      border-radius: 6px;
      font-size: 1rem;
      font-family: inherit;
      transition: all 0.2s ease;
      background: white;
    }

    .input-field:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .input-field:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .input-field.input-error {
      border-color: #d32f2f;
    }

    .input-field.input-error:focus {
      box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1);
    }

    /* Help Text */
    .input-help {
      font-size: 0.875rem;
      color: #666;
    }

    /* Error Text */
    .input-error-text {
      font-size: 0.875rem;
      color: #d32f2f;
    }
  `;

  document.head.appendChild(style);
}
