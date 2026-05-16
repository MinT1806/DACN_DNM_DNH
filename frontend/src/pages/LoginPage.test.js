import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';

jest.mock('../api/api');

import LoginPage from '../pages/LoginPage';

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockClear();
  });

  const renderLoginPage = () => render(<LoginPage />);

  describe('Rendering', () => {
    test('should render login heading', () => {
      renderLoginPage();
      expect(screen.getByText('Chào mừng trở lại!')).toBeInTheDocument();
    });

    test('should render form inputs', () => {
      renderLoginPage();
      expect(screen.getByPlaceholderText('username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    test('should render submit button', () => {
      renderLoginPage();
      expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
    });

    test('should render register link', () => {
      renderLoginPage();
      expect(screen.getByText('Đăng ký miễn phí')).toBeInTheDocument();
    });

    test('should render demo credentials', () => {
      renderLoginPage();
      expect(screen.getByText(/Demo:/)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('should update username on change', () => {
      renderLoginPage();
      const input = screen.getByPlaceholderText('username');
      fireEvent.change(input, { target: { value: 'testuser' } });
      expect(input.value).toBe('testuser');
    });

    test('should update password on change', () => {
      renderLoginPage();
      const input = screen.getByPlaceholderText('••••••••');
      fireEvent.change(input, { target: { value: 'secret123' } });
      expect(input.value).toBe('secret123');
    });

    test('should toggle password visibility', () => {
      renderLoginPage();
      const input = screen.getByPlaceholderText('••••••••');
      expect(input.type).toBe('password');

      const buttons = screen.getAllByRole('button');
      const toggleBtn = buttons.find(btn => !btn.textContent && btn.querySelector('svg'));
      if (toggleBtn) {
        fireEvent.click(toggleBtn);
        expect(input.type).toBe('text');
      }
    });
  });

  describe('Navigation', () => {
    test('should link to register page', () => {
      renderLoginPage();
      const link = screen.getByText('Đăng ký miễn phí');
      expect(link.getAttribute('href')).toBe('/register');
    });
  });
});
