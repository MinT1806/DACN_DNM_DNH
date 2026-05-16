import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';

jest.mock('../api/api');

import RegisterPage from '../pages/RegisterPage';

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
  });

  const renderRegisterPage = () => render(<RegisterPage />);

  const fillStep1 = () => {
    fireEvent.change(screen.getByPlaceholderText('nguyenvana'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('email@example.com'), {
      target: { value: 'new@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
  };

  const advanceToStep2 = async () => {
    fillStep1();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /tiếp theo/i }));
    });
    await waitFor(() => {
      expect(screen.getByText('Nhóm tuổi của bạn')).toBeInTheDocument();
    });
  };

  describe('Rendering', () => {
    test('should render step 1 heading', () => {
      renderRegisterPage();
      expect(screen.getByText('Tạo tài khoản')).toBeInTheDocument();
    });

    test('should render form inputs', () => {
      renderRegisterPage();
      expect(screen.getByPlaceholderText('nguyenvana')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    test('should render step indicators', () => {
      renderRegisterPage();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    test('should render login link', () => {
      renderRegisterPage();
      expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
    });
  });

  describe('Step 1 Form', () => {
    test('should update form fields on change', () => {
      renderRegisterPage();
      const input = screen.getByPlaceholderText('nguyenvana');
      fireEvent.change(input, { target: { value: 'newuser' } });
      expect(input.value).toBe('newuser');
    });

    test('should advance to step 2 with valid form', async () => {
      renderRegisterPage();
      await advanceToStep2();
    });

    test('should not advance with short password', async () => {
      renderRegisterPage();
      fireEvent.change(screen.getByPlaceholderText('nguyenvana'), {
        target: { value: 'newuser' },
      });
      fireEvent.change(screen.getByPlaceholderText('email@example.com'), {
        target: { value: 'new@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: '123' },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /tiếp theo/i }));
      });

      await waitFor(() => {
        expect(screen.queryByText('Nhóm tuổi của bạn')).not.toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Age Group', () => {
    test('should render age group options', async () => {
      renderRegisterPage();
      await advanceToStep2();
      expect(screen.getByText(/Trẻ em.*6.*12/i)).toBeInTheDocument();
      expect(screen.getByText(/Thanh thiếu niên.*13.*17/i)).toBeInTheDocument();
      expect(screen.getByText(/Người lớn.*18/i)).toBeInTheDocument();
    });

    test('should select age group on click', async () => {
      renderRegisterPage();
      await advanceToStep2();
      fireEvent.click(screen.getByText(/Người lớn.*18/i));
    });

    test('should go back to step 1', async () => {
      renderRegisterPage();
      await advanceToStep2();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /quay lại/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('Tạo tài khoản')).toBeInTheDocument();
      });
    });
  });
});
