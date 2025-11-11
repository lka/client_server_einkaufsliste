/**
 * Reusable Loading/Spinner component.
 *
 * Provides consistent loading indicators across the application.
 */

export type SpinnerSize = 'small' | 'medium' | 'large';
export type SpinnerVariant = 'primary' | 'secondary' | 'light';

export interface SpinnerOptions {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  centered?: boolean;
  fullPage?: boolean;
  className?: string;
}

/**
 * Create a spinner element.
 */
export function createSpinner(options: SpinnerOptions = {}): HTMLDivElement {
  const {
    size = 'medium',
    variant = 'primary',
    label,
    centered = false,
    fullPage = false,
    className = '',
  } = options;

  const container = document.createElement('div');
  container.className = `spinner-container ${centered ? 'spinner-centered' : ''} ${fullPage ? 'spinner-fullpage' : ''} ${className}`.trim();
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  const spinner = document.createElement('div');
  spinner.className = `spinner spinner-${size} spinner-${variant}`;

  container.appendChild(spinner);

  if (label) {
    const labelEl = document.createElement('span');
    labelEl.className = 'spinner-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  // Hidden text for screen readers
  const srText = document.createElement('span');
  srText.className = 'sr-only';
  srText.textContent = label || 'Loading...';
  container.appendChild(srText);

  return container;
}

/**
 * Show a full-page loading overlay.
 */
export function showLoadingOverlay(label: string = 'Loading...'): () => void {
  const overlay = createSpinner({
    size: 'large',
    variant: 'light',
    label,
    fullPage: true,
  });

  overlay.id = 'loading-overlay';
  document.body.appendChild(overlay);

  // Return function to remove overlay
  return () => {
    overlay.remove();
  };
}

/**
 * Create a skeleton loader (placeholder for content).
 */
export function createSkeleton(options: {
  width?: string;
  height?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
} = {}): HTMLDivElement {
  const {
    width = '100%',
    height = '1rem',
    variant = 'rectangular',
    className = '',
  } = options;

  const skeleton = document.createElement('div');
  skeleton.className = `skeleton skeleton-${variant} ${className}`.trim();
  skeleton.style.width = width;
  skeleton.style.height = height;
  skeleton.setAttribute('aria-busy', 'true');
  skeleton.setAttribute('aria-label', 'Loading content');

  return skeleton;
}

/**
 * Add loading styles to the document.
 * Call this once when the app initializes.
 */
export function injectLoadingStyles(): void {
  if (document.getElementById('component-loading-styles')) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = 'component-loading-styles';
  style.textContent = `
    /* Spinner Container */
    .spinner-container {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .spinner-centered {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      padding: 2rem;
    }

    .spinner-fullpage {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* Spinner */
    .spinner {
      border-radius: 50%;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-top-color: currentColor;
      animation: spinner-spin 0.8s linear infinite;
    }

    .spinner-small {
      width: 1.5rem;
      height: 1.5rem;
      border-width: 2px;
    }

    .spinner-medium {
      width: 2.5rem;
      height: 2.5rem;
      border-width: 3px;
    }

    .spinner-large {
      width: 4rem;
      height: 4rem;
      border-width: 4px;
    }

    /* Spinner Variants */
    .spinner-primary {
      color: #007bff;
    }

    .spinner-secondary {
      color: #6c757d;
    }

    .spinner-light {
      color: white;
      border-color: rgba(255, 255, 255, 0.3);
    }

    /* Spinner Animation */
    @keyframes spinner-spin {
      to { transform: rotate(360deg); }
    }

    /* Spinner Label */
    .spinner-label {
      font-size: 0.875rem;
      color: #666;
    }

    .spinner-fullpage .spinner-label {
      color: white;
      font-size: 1rem;
    }

    /* Screen Reader Only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    /* Skeleton Loader */
    .skeleton {
      background: linear-gradient(
        90deg,
        #f0f0f0 25%,
        #e0e0e0 50%,
        #f0f0f0 75%
      );
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
      border-radius: 4px;
    }

    .skeleton-text {
      height: 1rem;
      margin-bottom: 0.5rem;
    }

    .skeleton-circular {
      border-radius: 50%;
    }

    .skeleton-rectangular {
      /* Default rectangular shape */
    }

    @keyframes skeleton-loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `;

  document.head.appendChild(style);
}
