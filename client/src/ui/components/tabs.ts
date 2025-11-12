/**
 * Tabs Component
 * Tab navigation component for organizing content
 */

export interface TabItem {
  id: string;
  label: string;
  content: string | HTMLElement;
  disabled?: boolean;
}

export interface TabsOptions {
  tabs: TabItem[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export class Tabs {
  private container: HTMLDivElement;
  private tabList: HTMLDivElement;
  private contentContainer: HTMLDivElement;
  private tabs: TabItem[];
  private activeTabId: string;
  private onChange?: (tabId: string) => void;

  constructor(options: TabsOptions) {
    this.tabs = options.tabs;
    this.activeTabId = options.activeTab || (this.tabs[0]?.id ?? '');
    this.onChange = options.onChange;

    // Create container
    this.container = document.createElement('div');
    this.container.className = `tabs-container ${options.className || ''}`;

    // Create tab list
    this.tabList = document.createElement('div');
    this.tabList.className = 'tabs-list';
    this.tabList.setAttribute('role', 'tablist');

    // Create content container
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'tabs-content-container';

    this.container.appendChild(this.tabList);
    this.container.appendChild(this.contentContainer);

    this.render();
  }

  /**
   * Get the container element
   */
  getElement(): HTMLDivElement {
    return this.container;
  }

  /**
   * Get the currently active tab ID
   */
  getActiveTab(): string {
    return this.activeTabId;
  }

  /**
   * Set the active tab
   */
  setActiveTab(tabId: string): void {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (!tab || tab.disabled) return;

    this.activeTabId = tabId;
    this.render();

    if (this.onChange) {
      this.onChange(tabId);
    }
  }

  /**
   * Update tabs
   */
  setTabs(tabs: TabItem[]): void {
    this.tabs = tabs;
    if (!this.tabs.find((t) => t.id === this.activeTabId)) {
      this.activeTabId = this.tabs[0]?.id ?? '';
    }
    this.render();
  }

  /**
   * Update a specific tab's content
   */
  updateTabContent(tabId: string, content: string | HTMLElement): void {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (tab) {
      tab.content = content;
      if (tabId === this.activeTabId) {
        this.render();
      }
    }
  }

  /**
   * Enable/disable a tab
   */
  setTabDisabled(tabId: string, disabled: boolean): void {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (tab) {
      tab.disabled = disabled;
      if (disabled && tabId === this.activeTabId) {
        // Switch to first non-disabled tab
        const nextTab = this.tabs.find((t) => !t.disabled);
        if (nextTab) {
          this.setActiveTab(nextTab.id);
        }
      } else {
        this.render();
      }
    }
  }

  /**
   * Render the tabs
   */
  private render(): void {
    // Render tab buttons
    this.tabList.innerHTML = '';
    this.tabs.forEach((tab) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tab-button';
      button.textContent = tab.label;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(tab.id === this.activeTabId));
      button.setAttribute('aria-controls', `tab-panel-${tab.id}`);
      button.id = `tab-${tab.id}`;

      if (tab.disabled) {
        button.disabled = true;
        button.classList.add('tab-disabled');
      }

      if (tab.id === this.activeTabId) {
        button.classList.add('tab-active');
      }

      button.addEventListener('click', () => this.setActiveTab(tab.id));

      this.tabList.appendChild(button);
    });

    // Render active tab content
    this.contentContainer.innerHTML = '';
    const activeTab = this.tabs.find((t) => t.id === this.activeTabId);
    if (activeTab) {
      const panel = document.createElement('div');
      panel.className = 'tab-panel';
      panel.id = `tab-panel-${activeTab.id}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${activeTab.id}`);

      if (typeof activeTab.content === 'string') {
        panel.innerHTML = activeTab.content;
      } else {
        panel.appendChild(activeTab.content);
      }

      this.contentContainer.appendChild(panel);
    }
  }
}

/**
 * Inject tabs styles into the document
 */
export function injectTabsStyles(): void {
  if (document.getElementById('tabs-styles')) return;

  const style = document.createElement('style');
  style.id = 'tabs-styles';
  style.textContent = `
    /* Tabs Container */
    .tabs-container {
      width: 100%;
    }

    /* Tab List */
    .tabs-list {
      display: flex;
      border-bottom: 2px solid #ddd;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    /* Tab Button */
    .tab-button {
      padding: 0.75rem 1.5rem;
      border: none;
      background: transparent;
      color: #666;
      font-size: 1rem;
      cursor: pointer;
      position: relative;
      transition: color 0.2s, background-color 0.2s;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
    }

    .tab-button:hover:not(:disabled) {
      color: #333;
      background: #f5f5f5;
    }

    .tab-button:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .tab-active {
      color: #007bff;
      font-weight: 600;
      border-bottom-color: #007bff;
    }

    .tab-disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Tab Content */
    .tabs-content-container {
      padding: 1.5rem 0;
    }

    .tab-panel {
      animation: fadeIn 0.2s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  document.head.appendChild(style);
}
