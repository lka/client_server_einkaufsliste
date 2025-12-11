/**
 * Dropdown styles injection.
 */

/**
 * Inject dropdown styles into the document.
 */
export function injectDropdownStyles(): void {
  if (document.getElementById('dropdown-styles')) return;

  const style = document.createElement('style');
  style.id = 'dropdown-styles';
  style.textContent = `
    /* Dropdown Container */
    .dropdown-container {
      position: relative;
      width: 100%;
    }

    /* Native Select */
    .dropdown-select {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      font-size: 1rem;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .dropdown-select:hover {
      border-color: #999;
    }

    .dropdown-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .dropdown-select:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Searchable Dropdown */
    .dropdown-searchable {
      position: relative;
      width: 100%;
    }

    .dropdown-trigger {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      text-align: left;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: border-color 0.2s;
    }

    .dropdown-trigger:hover {
      border-color: #999;
    }

    .dropdown-trigger:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .dropdown-trigger:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .dropdown-selected-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-arrow {
      margin-left: 0.5rem;
      font-size: 0.75rem;
      transition: transform 0.2s;
    }

    .dropdown-open .dropdown-arrow {
      transform: rotate(180deg);
    }

    .dropdown-panel {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-height: 300px;
      overflow: hidden;
    }

    .dropdown-search {
      width: 100%;
      padding: 0.5rem;
      border: none;
      border-bottom: 1px solid #ddd;
      font-size: 0.875rem;
    }

    .dropdown-search:focus {
      outline: none;
      border-bottom-color: #007bff;
    }

    .dropdown-options {
      max-height: 250px;
      overflow-y: auto;
    }

    .dropdown-option {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: none;
      background: white;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s;
      display: block;
    }

    .dropdown-option:hover {
      background: #f5f5f5;
    }

    .dropdown-option-selected {
      background: #e7f3ff;
      font-weight: 500;
    }

    .dropdown-option:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .dropdown-no-results {
      padding: 1rem;
      text-align: center;
      color: #666;
      font-size: 0.875rem;
    }

    .dropdown-disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  `;

  document.head.appendChild(style);
}
