/**
 * Button component tests.
 */

import { createButton, updateButton } from './button.js';

describe('Button Component', () => {
  describe('createButton', () => {
    it('should create a button with label', () => {
      const button = createButton({ label: 'Click me' });

      expect(button.tagName).toBe('BUTTON');
      expect(button.textContent).toContain('Click me');
    });

    it('should apply primary variant by default', () => {
      const button = createButton({ label: 'Test' });

      expect(button.className).toContain('btn-primary');
    });

    it('should apply specified variant', () => {
      const button = createButton({ label: 'Test', variant: 'danger' });

      expect(button.className).toContain('btn-danger');
    });

    it('should apply specified size', () => {
      const button = createButton({ label: 'Test', size: 'large' });

      expect(button.className).toContain('btn-large');
    });

    it('should set disabled state', () => {
      const button = createButton({ label: 'Test', disabled: true });

      expect(button.disabled).toBe(true);
    });

    it('should set loading state', () => {
      const button = createButton({ label: 'Test', loading: true });

      expect(button.disabled).toBe(true);
      expect(button.querySelector('.btn-spinner')).toBeTruthy();
    });

    it('should include icon when provided', () => {
      const button = createButton({ label: 'Test', icon: '✓' });

      const icon = button.querySelector('.btn-icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe('✓');
    });

    it('should set aria-label when provided', () => {
      const button = createButton({ label: 'Test', ariaLabel: 'Test button' });

      expect(button.getAttribute('aria-label')).toBe('Test button');
    });

    it('should apply custom className', () => {
      const button = createButton({ label: 'Test', className: 'custom-class' });

      expect(button.className).toContain('custom-class');
    });

    it('should call onClick handler when clicked', async () => {
      const onClick = jest.fn().mockResolvedValue(undefined);
      const button = createButton({ label: 'Test', onClick });

      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should disable button during async onClick', async () => {
      let resolveClick: () => void;
      const clickPromise = new Promise<void>(resolve => {
        resolveClick = resolve;
      });

      const button = createButton({
        label: 'Test',
        onClick: () => clickPromise,
      });

      expect(button.disabled).toBe(false);

      button.click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(button.disabled).toBe(true);

      resolveClick!();
      await clickPromise;
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(button.disabled).toBe(false);
    });

    it('should not call onClick if disabled', () => {
      const onClick = jest.fn();
      const button = createButton({ label: 'Test', onClick, disabled: true });

      button.click();

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should escape HTML in label', () => {
      const button = createButton({ label: '<script>alert("xss")</script>' });

      expect(button.innerHTML).not.toContain('<script>');
      expect(button.textContent).toContain('<script>');
    });
  });

  describe('updateButton', () => {
    it('should update button label', () => {
      const button = createButton({ label: 'Original' });

      updateButton(button, { label: 'Updated' });

      expect(button.textContent).toContain('Updated');
    });

    it('should update disabled state', () => {
      const button = createButton({ label: 'Test' });

      expect(button.disabled).toBe(false);

      updateButton(button, { disabled: true });

      expect(button.disabled).toBe(true);
    });

    it('should add loading state', () => {
      const button = createButton({ label: 'Test' });

      expect(button.querySelector('.btn-spinner')).toBeFalsy();

      updateButton(button, { loading: true });

      expect(button.disabled).toBe(true);
      expect(button.querySelector('.btn-spinner')).toBeTruthy();
    });

    it('should remove loading state', () => {
      const button = createButton({ label: 'Test', loading: true });

      expect(button.querySelector('.btn-spinner')).toBeTruthy();

      updateButton(button, { loading: false });

      expect(button.disabled).toBe(false);
      expect(button.querySelector('.btn-spinner')).toBeFalsy();
    });
  });
});
