/**
 * Reusable Button component.
 *
 * Provides consistent button styling and behavior across the application.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonOptions {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  onClick?: () => void | Promise<void>;
  className?: string;
  ariaLabel?: string;
}

/**
 * Create a styled button element.
 */
export function createButton(options: ButtonOptions): HTMLButtonElement {
  const {
    label,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    onClick,
    className = '',
    ariaLabel,
  } = options;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn btn-${variant} btn-${size} ${className}`.trim();
  button.disabled = disabled || loading;

  if (ariaLabel) {
    button.setAttribute('aria-label', ariaLabel);
  }

  // Build button content
  const contentParts: string[] = [];

  if (loading) {
    contentParts.push('<span class="btn-spinner"></span>');
  } else if (icon) {
    contentParts.push(`<span class="btn-icon">${icon}</span>`);
  }

  contentParts.push(`<span class="btn-label">${escapeHtml(label)}</span>`);

  button.innerHTML = contentParts.join(' ');

  // Attach click handler
  if (onClick) {
    button.addEventListener('click', async () => {
      if (button.disabled) return;

      // Disable button during async operation
      const wasDisabled = button.disabled;
      button.disabled = true;

      try {
        await onClick();
      } finally {
        if (!wasDisabled) {
          button.disabled = false;
        }
      }
    });
  }

  return button;
}

/**
 * Update button state (loading, disabled, label).
 */
export function updateButton(
  button: HTMLButtonElement,
  updates: Partial<Pick<ButtonOptions, 'label' | 'disabled' | 'loading'>>
): void {
  if (updates.disabled !== undefined) {
    button.disabled = updates.disabled;
  }

  if (updates.loading !== undefined) {
    button.disabled = updates.loading;
    const spinner = button.querySelector('.btn-spinner');

    if (updates.loading && !spinner) {
      const spinnerEl = document.createElement('span');
      spinnerEl.className = 'btn-spinner';
      button.insertBefore(spinnerEl, button.firstChild);
    } else if (!updates.loading && spinner) {
      spinner.remove();
    }
  }

  if (updates.label) {
    const labelEl = button.querySelector('.btn-label');
    if (labelEl) {
      labelEl.textContent = updates.label;
    }
  }
}

/**
 * Escape HTML to prevent XSS.
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Add button styles to the document.
 * Call this once when the app initializes.
 */
export function injectButtonStyles(): void {
  if (document.getElementById('component-button-styles')) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = 'component-button-styles';
  style.textContent = `
    /* Button Base */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      line-height: 1;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Button Sizes */
    .btn-small {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-medium {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }

    .btn-large {
      padding: 1rem 2rem;
      font-size: 1.125rem;
    }

    /* Button Variants */
    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #545b62;
    }

    .btn-danger {
      background: #d32f2f;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #9a0007;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #218838;
    }

    /* Button Spinner */
    .btn-spinner {
      width: 1em;
      height: 1em;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: btn-spin 0.6s linear infinite;
    }

    @keyframes btn-spin {
      to { transform: rotate(360deg); }
    }

    /* Button Icon */
    .btn-icon {
      display: inline-flex;
      align-items: center;
    }
  `;

  document.head.appendChild(style);
}
