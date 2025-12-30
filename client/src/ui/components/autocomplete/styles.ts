/**
 * Autocomplete component styles.
 */

let stylesInjected = false;

export function injectAutocompleteStyles(): void {
  if (stylesInjected) return;

  const styleId = 'autocomplete-styles';
  if (document.getElementById(styleId)) {
    stylesInjected = true;
    return;
  }

  const styles = `
    .autocomplete-suggestions {
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      min-width: 200px;
    }

    .autocomplete-item {
      padding: 10px 15px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .autocomplete-item:hover,
    .autocomplete-item.selected {
      background-color: #f0f0f0;
    }

    .autocomplete-loading {
      padding: 10px 15px;
      color: #666;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .autocomplete-no-results {
      padding: 10px 15px;
      color: #999;
      font-style: italic;
    }

    .spinner-small {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #666;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
  stylesInjected = true;
}
