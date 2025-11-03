/**
 * Login and registration page controller.
 */

import { login, register, isAuthenticated } from '../data/auth.js';

/**
 * Initialize login page functionality.
 */
export function initLoginPage(): void {
  console.log('Initializing login page...');

  // Redirect to main app if already authenticated
  if (isAuthenticated()) {
    console.log('Already authenticated, redirecting to /app');
    window.location.href = '/app';
    return;
  }

  console.log('Not authenticated, setting up login forms');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegisterLink = document.getElementById('showRegister');
  const showLoginLink = document.getElementById('showLogin');

  console.log('Login form:', loginForm);
  console.log('Register form:', registerForm);
  console.log('Show register link:', showRegisterLink);
  console.log('Show login link:', showLoginLink);

  // Toggle between login and register forms
  showRegisterLink?.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm!.style.display = 'none';
    registerForm!.style.display = 'block';
    clearErrors();
  });

  showLoginLink?.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm!.style.display = 'none';
    loginForm!.style.display = 'block';
    clearErrors();
  });

  // Login button handler
  document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const username = (document.getElementById('loginUsername') as HTMLInputElement).value.trim();
    const password = (document.getElementById('loginPassword') as HTMLInputElement).value;

    if (!username || !password) {
      showError('loginError', 'Bitte alle Felder ausfüllen');
      return;
    }

    const success = await login({ username, password });
    if (success) {
      window.location.href = '/app';
    } else {
      showError('loginError', 'Ungültiger Benutzername oder Passwort');
    }
  });

  // Register button handler
  document.getElementById('registerBtn')?.addEventListener('click', async () => {
    const username = (document.getElementById('registerUsername') as HTMLInputElement).value.trim();
    const email = (document.getElementById('registerEmail') as HTMLInputElement).value.trim();
    const password = (document.getElementById('registerPassword') as HTMLInputElement).value;

    if (!username || !email || !password) {
      showError('registerError', 'Bitte alle Felder ausfüllen');
      return;
    }

    if (password.length < 6) {
      showError('registerError', 'Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (password.length > 72) {
      showError('registerError', 'Passwort darf maximal 72 Zeichen lang sein');
      return;
    }

    console.log('Attempting registration with:', { username, email });
    const user = await register({ username, email, password });
    console.log('Registration result:', user);
    if (user) {
      // Registration successful, switch to login form
      registerForm!.style.display = 'none';
      loginForm!.style.display = 'block';
      clearErrors();
      showSuccess('Registrierung erfolgreich! Bitte anmelden.');
    } else {
      showError('registerError', 'Registrierung fehlgeschlagen. Siehe Konsole für Details.');
    }
  });

  // Allow Enter key to submit forms
  const inputs = document.querySelectorAll('input');
  inputs.forEach((input) => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const form = input.closest('.auth-form');
        if (form?.id === 'loginForm') {
          document.getElementById('loginBtn')?.click();
        } else {
          document.getElementById('registerBtn')?.click();
        }
      }
    });
  });
}

function showError(elementId: string, message: string): void {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.color = 'red';
  }
}

function showSuccess(message: string): void {
  const errorElement = document.getElementById('loginError');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.color = 'green';
  }
}

function clearErrors(): void {
  document.getElementById('loginError')!.textContent = '';
  document.getElementById('registerError')!.textContent = '';
}
