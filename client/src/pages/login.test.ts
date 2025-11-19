/**
 * Tests for login page controller.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { initLoginPage } from './login.js';
import * as auth from '../data/auth.js';

// Mock the auth module
jest.mock('../data/auth.js');

// Mock window.location
delete (window as any).location;
(window as any).location = { href: '' };

describe('Login Page Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).location.href = '';

    // Setup DOM with login and register forms
    document.body.innerHTML = `
      <div>
        <div id="loginForm" class="auth-form" style="display:block;">
          <input id="loginUsername" type="text" />
          <input id="loginPassword" type="password" />
          <button id="loginBtn">Login</button>
          <div id="loginError"></div>
          <a href="#" id="showRegister">Register</a>
        </div>
        <div id="registerForm" class="auth-form" style="display:none;">
          <input id="registerUsername" type="text" />
          <input id="registerEmail" type="email" />
          <input id="registerPassword" type="password" />
          <button id="registerBtn">Register</button>
          <div id="registerError"></div>
          <a href="#" id="showLogin">Login</a>
        </div>
      </div>
    `;

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should redirect to /app if already authenticated', () => {
    jest.spyOn(auth, 'isAuthenticated').mockReturnValue(true);

    initLoginPage();

    expect((window as any).location.href).toBe('/app');
  });

  it('should initialize without redirecting if not authenticated', () => {
    jest.spyOn(auth, 'isAuthenticated').mockReturnValue(false);

    initLoginPage();

    expect((window as any).location.href).toBe('');
    expect(console.log).toHaveBeenCalledWith('Initializing login page...');
  });

  describe('Form Toggle', () => {
    beforeEach(() => {
      jest.spyOn(auth, 'isAuthenticated').mockReturnValue(false);
    });

    it('should toggle to register form', () => {
      initLoginPage();

      const showRegisterLink = document.getElementById('showRegister')!;
      const loginForm = document.getElementById('loginForm')!;
      const registerForm = document.getElementById('registerForm')!;

      showRegisterLink.click();

      expect(loginForm.style.display).toBe('none');
      expect(registerForm.style.display).toBe('block');
    });

    it('should toggle back to login form', () => {
      initLoginPage();

      const showRegisterLink = document.getElementById('showRegister')!;
      const showLoginLink = document.getElementById('showLogin')!;
      const loginForm = document.getElementById('loginForm')!;
      const registerForm = document.getElementById('registerForm')!;

      // Toggle to register
      showRegisterLink.click();
      expect(registerForm.style.display).toBe('block');

      // Toggle back to login
      showLoginLink.click();
      expect(loginForm.style.display).toBe('block');
      expect(registerForm.style.display).toBe('none');
    });

    it('should clear errors when toggling forms', () => {
      initLoginPage();

      const loginError = document.getElementById('loginError')!;
      const registerError = document.getElementById('registerError')!;
      const showRegisterLink = document.getElementById('showRegister')!;

      loginError.textContent = 'Some error';
      registerError.textContent = 'Some error';

      showRegisterLink.click();

      expect(loginError.textContent).toBe('');
      expect(registerError.textContent).toBe('');
    });
  });

  describe('Login', () => {
    beforeEach(() => {
      jest.spyOn(auth, 'isAuthenticated').mockReturnValue(false);
    });

    it('should login successfully', async () => {
      jest.spyOn(auth, 'login').mockResolvedValue(1800); // 30 minutes in seconds

      initLoginPage();

      const usernameInput = document.getElementById('loginUsername') as HTMLInputElement;
      const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;
      const loginBtn = document.getElementById('loginBtn')!;

      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';

      loginBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect((window as any).location.href).toBe('/app');
    });

    it('should show error on login failure', async () => {
      jest.spyOn(auth, 'login').mockResolvedValue(null);

      initLoginPage();

      const usernameInput = document.getElementById('loginUsername') as HTMLInputElement;
      const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;
      const loginBtn = document.getElementById('loginBtn')!;
      const loginError = document.getElementById('loginError')!;

      usernameInput.value = 'testuser';
      passwordInput.value = 'wrongpassword';

      loginBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.login).toHaveBeenCalled();
      expect((window as any).location.href).toBe('');
      expect(loginError.textContent).toBe('Ungültiger Benutzername oder Passwort');
      expect(loginError.style.color).toBe('red');
    });

    it('should show error when fields are empty', async () => {
      jest.spyOn(auth, 'login').mockResolvedValue(null);

      initLoginPage();

      const loginBtn = document.getElementById('loginBtn')!;
      const loginError = document.getElementById('loginError')!;

      loginBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.login).not.toHaveBeenCalled();
      expect(loginError.textContent).toBe('Bitte alle Felder ausfüllen');
    });

    it('should trim whitespace from username', async () => {
      jest.spyOn(auth, 'login').mockResolvedValue(1800); // 30 minutes in seconds

      initLoginPage();

      const usernameInput = document.getElementById('loginUsername') as HTMLInputElement;
      const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;
      const loginBtn = document.getElementById('loginBtn')!;

      usernameInput.value = '  testuser  ';
      passwordInput.value = 'password';

      loginBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password',
      });
    });
  });

  describe('Registration', () => {
    beforeEach(() => {
      jest.spyOn(auth, 'isAuthenticated').mockReturnValue(false);
    });

    it('should register successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        is_active: true,
        is_approved: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
      };
      jest.spyOn(auth, 'register').mockResolvedValue(mockUser);

      initLoginPage();

      const usernameInput = document.getElementById('registerUsername') as HTMLInputElement;
      const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
      const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;
      const registerBtn = document.getElementById('registerBtn')!;

      usernameInput.value = 'newuser';
      emailInput.value = 'new@example.com';
      passwordInput.value = 'password123';

      registerBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });

      // Should switch to login form and show success
      const loginForm = document.getElementById('loginForm')!;
      const registerForm = document.getElementById('registerForm')!;
      const loginError = document.getElementById('loginError')!;

      expect(loginForm.style.display).toBe('block');
      expect(registerForm.style.display).toBe('none');
      expect(loginError.textContent).toBe('Registrierung erfolgreich! Bitte anmelden.');
      expect(loginError.style.color).toBe('green');
    });

    it('should show error on registration failure', async () => {
      jest.spyOn(auth, 'register').mockResolvedValue(null);

      initLoginPage();

      const usernameInput = document.getElementById('registerUsername') as HTMLInputElement;
      const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
      const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;
      const registerBtn = document.getElementById('registerBtn')!;
      const registerError = document.getElementById('registerError')!;

      usernameInput.value = 'existing';
      emailInput.value = 'test@example.com';
      passwordInput.value = 'password';

      registerBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.register).toHaveBeenCalled();
      expect(registerError.textContent).toBe(
        'Registrierung fehlgeschlagen. Siehe Konsole für Details.'
      );
    });

    it('should validate all fields are filled', async () => {
      initLoginPage();

      const registerBtn = document.getElementById('registerBtn')!;
      const registerError = document.getElementById('registerError')!;

      registerBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.register).not.toHaveBeenCalled();
      expect(registerError.textContent).toBe('Bitte alle Felder ausfüllen');
    });

    it('should validate password minimum length', async () => {
      initLoginPage();

      const usernameInput = document.getElementById('registerUsername') as HTMLInputElement;
      const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
      const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;
      const registerBtn = document.getElementById('registerBtn')!;
      const registerError = document.getElementById('registerError')!;

      usernameInput.value = 'user';
      emailInput.value = 'user@example.com';
      passwordInput.value = '12345'; // Too short

      registerBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.register).not.toHaveBeenCalled();
      expect(registerError.textContent).toBe('Passwort muss mindestens 6 Zeichen lang sein');
    });

    it('should validate password maximum length', async () => {
      initLoginPage();

      const usernameInput = document.getElementById('registerUsername') as HTMLInputElement;
      const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
      const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;
      const registerBtn = document.getElementById('registerBtn')!;
      const registerError = document.getElementById('registerError')!;

      usernameInput.value = 'user';
      emailInput.value = 'user@example.com';
      passwordInput.value = 'a'.repeat(73); // Too long

      registerBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.register).not.toHaveBeenCalled();
      expect(registerError.textContent).toBe('Passwort darf maximal 72 Zeichen lang sein');
    });

    it('should trim whitespace from inputs', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        is_active: true,
        is_approved: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
      };
      jest.spyOn(auth, 'register').mockResolvedValue(mockUser);

      initLoginPage();

      const usernameInput = document.getElementById('registerUsername') as HTMLInputElement;
      const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
      const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;
      const registerBtn = document.getElementById('registerBtn')!;

      usernameInput.value = '  newuser  ';
      emailInput.value = '  new@example.com  ';
      passwordInput.value = 'password123';

      registerBtn.click();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
    });
  });

  describe('Enter Key Handling', () => {
    beforeEach(() => {
      jest.spyOn(auth, 'isAuthenticated').mockReturnValue(false);
    });

    it('should submit login form on Enter key', async () => {
      jest.spyOn(auth, 'login').mockResolvedValue(1800); // 30 minutes in seconds

      initLoginPage();

      const usernameInput = document.getElementById('loginUsername') as HTMLInputElement;
      const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;

      usernameInput.value = 'testuser';
      passwordInput.value = 'password123';

      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      passwordInput.dispatchEvent(enterEvent);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.login).toHaveBeenCalled();
    });

    it('should submit register form on Enter key', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        is_active: true,
        is_approved: true,
        is_admin: false,
        created_at: '2024-01-01T00:00:00Z',
      };
      jest.spyOn(auth, 'register').mockResolvedValue(mockUser);

      initLoginPage();

      // Switch to register form
      const showRegisterLink = document.getElementById('showRegister')!;
      showRegisterLink.click();

      const usernameInput = document.getElementById('registerUsername') as HTMLInputElement;
      const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
      const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;

      usernameInput.value = 'newuser';
      emailInput.value = 'new@example.com';
      passwordInput.value = 'password123';

      const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
      passwordInput.dispatchEvent(enterEvent);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(auth.register).toHaveBeenCalled();
    });
  });
});
