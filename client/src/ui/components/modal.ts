/**
 * Reusable Modal/Dialog component.
 *
 * Provides consistent modal behavior with backdrop, keyboard support, and focus management.
 */

export interface ModalOptions {
  title: string;
  content: string | HTMLElement;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  onClose?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export class Modal {
  private modalEl: HTMLDivElement;
  private backdropEl: HTMLDivElement;
  private contentContainerEl: HTMLDivElement;
  private options: ModalOptions;
  private isOpen: boolean = false;
  private escapeHandler?: (e: KeyboardEvent) => void;

  constructor(options: ModalOptions) {
    this.options = {
      showCloseButton: true,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      size: 'medium',
      ...options,
    };

    // Create modal elements
    this.backdropEl = this.createBackdrop();
    this.modalEl = this.createModal();
    this.contentContainerEl = this.modalEl.querySelector('.modal-content') as HTMLDivElement;
  }

  /**
   * Create backdrop element.
   */
  private createBackdrop(): HTMLDivElement {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    if (this.options.closeOnBackdropClick) {
      backdrop.addEventListener('click', () => this.close());
    }

    return backdrop;
  }

  /**
   * Create modal element.
   */
  private createModal(): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = `modal-dialog modal-${this.options.size}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');

    // Prevent backdrop click when clicking inside modal
    modal.addEventListener('click', (e) => e.stopPropagation());

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h2');
    title.id = 'modal-title';
    title.className = 'modal-title';
    title.textContent = this.options.title;
    header.appendChild(title);

    if (this.options.showCloseButton) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'modal-close';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close dialog');
      closeBtn.addEventListener('click', () => this.close());
      header.appendChild(closeBtn);
    }

    // Content
    const content = document.createElement('div');
    content.className = 'modal-content';

    if (typeof this.options.content === 'string') {
      content.innerHTML = this.options.content;
    } else {
      content.appendChild(this.options.content);
    }

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(content);

    return modal;
  }

  /**
   * Open the modal.
   */
  open(): void {
    if (this.isOpen) return;

    // Add to DOM
    document.body.appendChild(this.backdropEl);
    document.body.appendChild(this.modalEl);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus modal
    this.modalEl.focus();

    // Setup keyboard handler
    if (this.options.closeOnEscape) {
      this.escapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          this.close();
        }
      };
      document.addEventListener('keydown', this.escapeHandler);
    }

    this.isOpen = true;

    // Trigger animation
    requestAnimationFrame(() => {
      this.backdropEl.classList.add('modal-backdrop-visible');
      this.modalEl.classList.add('modal-dialog-visible');
    });
  }

  /**
   * Close the modal.
   */
  close(): void {
    if (!this.isOpen) return;

    // Remove animation classes
    this.backdropEl.classList.remove('modal-backdrop-visible');
    this.modalEl.classList.remove('modal-dialog-visible');

    // Wait for animation to complete
    setTimeout(() => {
      // Remove from DOM
      this.backdropEl.remove();
      this.modalEl.remove();

      // Restore body scroll
      document.body.style.overflow = '';

      // Remove keyboard handler
      if (this.escapeHandler) {
        document.removeEventListener('keydown', this.escapeHandler);
        this.escapeHandler = undefined;
      }

      this.isOpen = false;

      // Call onClose callback
      if (this.options.onClose) {
        this.options.onClose();
      }
    }, 200); // Match CSS transition duration
  }

  /**
   * Update modal content.
   */
  setContent(content: string | HTMLElement): void {
    this.contentContainerEl.innerHTML = '';

    if (typeof content === 'string') {
      this.contentContainerEl.innerHTML = content;
    } else {
      this.contentContainerEl.appendChild(content);
    }
  }

  /**
   * Update modal title.
   */
  setTitle(title: string): void {
    const titleEl = this.modalEl.querySelector('.modal-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }

  /**
   * Check if modal is open.
   */
  isModalOpen(): boolean {
    return this.isOpen;
  }
}

/**
 * Add modal styles to the document.
 * Call this once when the app initializes.
 */
export function injectModalStyles(): void {
  if (document.getElementById('component-modal-styles')) {
    return; // Already injected
  }

  const style = document.createElement('style');
  style.id = 'component-modal-styles';
  style.textContent = `
    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 1000;
    }

    .modal-backdrop-visible {
      opacity: 1;
    }

    /* Modal Dialog */
    .modal-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      opacity: 0;
      transition: all 0.2s ease;
      z-index: 1001;
    }

    .modal-dialog-visible {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    /* Modal Sizes */
    .modal-small {
      width: 90%;
      max-width: 400px;
    }

    .modal-medium {
      width: 90%;
      max-width: 600px;
    }

    .modal-large {
      width: 90%;
      max-width: 900px;
    }

    /* Modal Header */
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e5e5;
    }

    .modal-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.75rem;
      line-height: 1;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 1.75rem;
      height: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .modal-close:hover {
      background: #f5f5f5;
      color: #333;
    }

    /* Modal Content */
    .modal-content {
      padding: 0.75rem 1rem 1rem 1rem;
      overflow-y: auto;
      flex: 1;
    }
  `;

  document.head.appendChild(style);
}
