/**
 * Reusable Card component.
 *
 * Provides consistent card styling for content containers.
 */

export interface CardOptions {
  title?: string;
  content: string | HTMLElement;
  footer?: string | HTMLElement;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

/**
 * Create a card element.
 */
export function createCard(options: CardOptions): HTMLDivElement {
  const {
    title,
    content,
    footer,
    variant = 'default',
    className = '',
  } = options;

  const card = document.createElement('div');
  card.className = `card card-${variant} ${className}`.trim();

  // Card header (if title provided)
  if (title) {
    const header = document.createElement('div');
    header.className = 'card-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'card-title';
    titleEl.textContent = title;

    header.appendChild(titleEl);
    card.appendChild(header);
  }

  // Card body
  const body = document.createElement('div');
  body.className = 'card-body';

  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }

  card.appendChild(body);

  // Card footer (if provided)
  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'card-footer';

    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else {
      footerEl.appendChild(footer);
    }

    card.appendChild(footerEl);
  }

  return card;
}

/**
 * Update card content.
 */
export function updateCardContent(card: HTMLElement, content: string | HTMLElement): void {
  const body = card.querySelector('.card-body');
  if (!body) return;

  body.innerHTML = '';

  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }
}

/**
 * Update card title.
 */
export function updateCardTitle(card: HTMLElement, title: string): void {
  const titleEl = card.querySelector('.card-title');
  if (titleEl) {
    titleEl.textContent = title;
  }
}

/**
 * Add card styles to the document.
 * Call this once when the app initializes.
 */
export function injectCardStyles(): void {
  if (document.getElementById('component-card-styles')) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = 'component-card-styles';
  style.textContent = `
    /* Card Base */
    .card {
      background: var(--card, white);
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s ease;
    }

    /* Card Variants */
    .card-default {
      border: 1px solid #e5e5e5;
    }

    .card-elevated {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .card-elevated:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .card-outlined {
      border: 2px solid #007bff;
    }

    /* Card Header */
    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e5e5;
      background: #f8f9fa;
    }

    .card-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
    }

    /* Card Body */
    .card-body {
      padding: 1.5rem;
    }

    /* Card Footer */
    .card-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e5e5;
      background: #f8f9fa;
    }
  `;

  document.head.appendChild(style);
}
