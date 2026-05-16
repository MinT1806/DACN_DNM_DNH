import React from 'react';
import { render, screen, fireEvent, waitFor, findByText } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';

jest.mock('../api/api');

import CoursesPage from '../pages/CoursesPage';

describe('CoursesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
    const api = require('../api/api');
    Object.values(api).forEach(v => {
      if (typeof v === 'function') v.mockReset();
    });
  });

  const renderCoursesPage = () => render(<CoursesPage />);

  const mockCourses = [
    {
      id: 1,
      title: 'English for Beginners',
      description: 'Start your English journey with essential vocabulary.',
      level: 'A1',
      instructor: 'Ms. Sarah',
      totalLessons: 24,
      enrolledCount: 1250,
      rating: 4.8,
    },
    {
      id: 2,
      title: 'Elementary English',
      description: 'Build confidence with everyday conversations.',
      level: 'A2',
      instructor: 'Mr. David',
      totalLessons: 32,
      enrolledCount: 980,
      rating: 4.7,
    },
  ];

  describe('Rendering', () => {
    test('should render page title', async () => {
      const api = require('../api/api');
      api.courseAPI.getAll.mockResolvedValue({ data: [] });

      renderCoursesPage();

      const heading = await screen.findByText(/Khóa học/i);
      expect(heading).toBeInTheDocument();
    });

    test('should render course cards when API returns data', async () => {
      const api = require('../api/api');
      api.courseAPI.getAll.mockResolvedValue({ data: mockCourses });

      renderCoursesPage();

      expect(await screen.findByText('English for Beginners')).toBeInTheDocument();
      expect(await screen.findByText('Elementary English')).toBeInTheDocument();
    });

    test('should display course description', async () => {
      const api = require('../api/api');
      api.courseAPI.getAll.mockResolvedValue({ data: mockCourses });

      renderCoursesPage();

      expect(await screen.findByText(/Start your English/i)).toBeInTheDocument();
    });

    test('should display instructor name', async () => {
      const api = require('../api/api');
      api.courseAPI.getAll.mockResolvedValue({ data: mockCourses });

      renderCoursesPage();

      expect(await screen.findByText(/Ms. Sarah/i)).toBeInTheDocument();
    });

    test('should display enrolled count', async () => {
      const api = require('../api/api');
      api.courseAPI.getAll.mockResolvedValue({ data: mockCourses });

      renderCoursesPage();

      expect(await screen.findByText(/1,250/)).toBeInTheDocument();
    });

    test('should display rating', async () => {
      const api = require('../api/api');
      api.courseAPI.getAll.mockResolvedValue({ data: mockCourses });

      renderCoursesPage();

      expect(await screen.findByText('4.8')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('should filter courses by level', async () => {
      const api = require('../api/api');
      api.courseAPI.getAll.mockResolvedValue({ data: mockCourses });

      renderCoursesPage();

      expect(await screen.findByText('English for Beginners')).toBeInTheDocument();

      const a1Button = screen.getByRole('button', { name: /🌱 A1/i });
      fireEvent.click(a1Button);

      expect(await screen.findByText('English for Beginners')).toBeInTheDocument();
      expect(screen.queryByText('Elementary English')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('should render page with no courses', async () => {
      const api = require('../api/api');
      api.courseAPI.getAll.mockResolvedValue({ data: [] });

      renderCoursesPage();

      const heading = await screen.findByText(/Khóa học/i);
      expect(heading).toBeInTheDocument();
    });
  });
});
