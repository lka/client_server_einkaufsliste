/**
 * Toast Notification Component
 * Non-blocking notification system for user feedback
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number; // in milliseconds, 0 for persistent
  position?: ToastPosition;
  dismissible?: boolean;
  onClose?: () => void;
}

class ToastManager {
  private container: HTMLDivElement | null = null;
  private toasts: Map<string, HTMLDivElement> = new Map();
  private position: ToastPosition = 'top-right';

  /**
   * Initialize the toast container
   */
  private initContainer(position: ToastPosition): void {
    if (this.container && this.position !== position) {
      // Remove old container if position changed
      this.container.remove();
      this.container = null;
    }

    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = `toast-container toast-${position}`;
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);
      this.position = position;
    }
  }

  /**
   * Show a toast notification
   */
  show(options: ToastOptions): string {
    const {
      message,
      type = 'info',
      duration = 3000,
      position = 'top-right',
      dismissible = true,
      onClose,
    } = options;

    this.initContainer(position);

    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast = this.createToast(id, message, type, dismissible, onClose);

    this.toasts.set(id, toast);
    this.container!.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-visible'), 10);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  /**
   * Create a toast element
   */
  private createToast(
    id: string,
    message: string,
    type: ToastType,
    dismissible: boolean,
    onClose?: () => void
  ): HTMLDivElement {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    // Icon
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.innerHTML = this.getIcon(type);
    toast.appendChild(icon);

    // Message
    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    toast.appendChild(messageEl);

    // Dismiss button
    if (dismissible) {
      const dismissBtn = document.createElement('button');
      dismissBtn.type = 'button';
      dismissBtn.className = 'toast-dismiss';
      dismissBtn.innerHTML = '×';
      dismissBtn.setAttribute('aria-label', 'Close notification');
      dismissBtn.addEventListener('click', () => {
        this.dismiss(id);
        if (onClose) onClose();
      });
      toast.appendChild(dismissBtn);
    }

    return toast;
  }

  /**
   * Get icon for toast type
   */
  private getIcon(type: ToastType): string {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type];
  }

  /**
   * Dismiss a toast
   */
  dismiss(id: string): void {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hiding');

    setTimeout(() => {
      toast.remove();
      this.toasts.delete(id);

      // Remove container if no toasts left
      if (this.toasts.size === 0 && this.container) {
        this.container.remove();
        this.container = null;
      }
    }, 300);
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    Array.from(this.toasts.keys()).forEach((id) => this.dismiss(id));
  }
}

// Singleton instance
const toastManager = new ToastManager();

/**
 * Show a success toast
 */
export function showSuccess(message: string, duration = 3000): string {
  return toastManager.show({ message, type: 'success', duration });
}

/**
 * Show an error toast
 */
export function showError(message: string, duration = 5000): string {
  return toastManager.show({ message, type: 'error', duration });
}

/**
 * Show a warning toast
 */
export function showWarning(message: string, duration = 4000): string {
  return toastManager.show({ message, type: 'warning', duration });
}

/**
 * Show an info toast
 */
export function showInfo(message: string, duration = 3000): string {
  return toastManager.show({ message, type: 'info', duration });
}

/**
 * Show a custom toast
 */
export function showToast(options: ToastOptions): string {
  return toastManager.show(options);
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(id: string): void {
  toastManager.dismiss(id);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts(): void {
  toastManager.dismissAll();
}

/**
 * Inject toast styles into the document
 */
export function injectToastStyles(): void {
  if (document.getElementById('toast-styles')) return;

  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    /* Toast Container */
    .toast-container {
      position: fixed;
      z-index: 10000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
    }

    .toast-top-left {
      top: 1rem;
      left: 1rem;
    }

    .toast-top-center {
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
    }

    .toast-top-right {
      top: 1rem;
      right: 1rem;
    }

    .toast-bottom-left {
      bottom: 1rem;
      left: 1rem;
    }

    .toast-bottom-center {
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
    }

    .toast-bottom-right {
      bottom: 1rem;
      right: 1rem;
    }

    /* Toast */
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      opacity: 0;
      transform: translateY(-20px);
      transition: opacity 0.3s, transform 0.3s;
      border-left: 4px solid;
    }

    .toast-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .toast-hiding {
      opacity: 0;
      transform: translateY(-20px);
    }

    /* Toast Types */
    .toast-success {
      border-left-color: #28a745;
    }

    .toast-success .toast-icon {
      color: #28a745;
    }

    .toast-error {
      border-left-color: #dc3545;
    }

    .toast-error .toast-icon {
      color: #dc3545;
    }

    .toast-warning {
      border-left-color: #ffc107;
    }

    .toast-warning .toast-icon {
      color: #ffc107;
    }

    .toast-info {
      border-left-color: #17a2b8;
    }

    .toast-info .toast-icon {
      color: #17a2b8;
    }

    /* Toast Icon */
    .toast-icon {
      font-size: 1.25rem;
      font-weight: bold;
      flex-shrink: 0;
    }

    /* Toast Message */
    .toast-message {
      flex: 1;
      color: #333;
      font-size: 0.9375rem;
      line-height: 1.4;
    }

    /* Toast Dismiss Button */
    .toast-dismiss {
      flex-shrink: 0;
      background: transparent;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }

    .toast-dismiss:hover {
      color: #666;
    }

    .toast-dismiss:focus {
      outline: none;
      color: #333;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .toast-container {
        left: 0.5rem !important;
        right: 0.5rem !important;
        max-width: calc(100% - 1rem);
      }

      .toast-top-center,
      .toast-bottom-center {
        transform: none;
      }

      .toast {
        min-width: 0;
      }
    }
  `;

  document.head.appendChild(style);
}
