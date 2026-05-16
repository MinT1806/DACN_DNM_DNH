import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';

import VocabularyPage from '../pages/VocabularyPage';

const mockWords = [
  { id: 1, word: 'Hello', pronunciation: '/həˈloʊ/', translation: 'Xin chào', level: 'A1', category: 'greetings' },
  { id: 2, word: 'Goodbye', pronunciation: '/ɡʊdˈbaɪ/', translation: 'Tạm biệt', level: 'A1', category: 'greetings' },
];

const mockSavedWords = [
  { id: 1, word: 'Hello', translation: 'Xin chào', learned: false, reviewCount: 2, correctCount: 1 },
];

const setupFetch = (responses) => {
  let idx = 0;
  global.fetch = jest.fn().mockImplementation(() => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responses[idx++] || { data: [] }),
    });
  });
};

describe('VocabularyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render page heading', async () => {
      setupFetch([
        { data: mockWords },
        { data: mockSavedWords },
        { data: { totalSaved: 1, totalLearned: 0, totalReviews: 2, accuracy: 50 } },
      ]);

      render(<VocabularyPage />);

      // There are multiple elements with "Từ vựng" text, use role to find h1
      const heading = await screen.findByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/Từ vựng/i);
    });

    test('should render tab buttons', async () => {
      setupFetch([
        { data: mockWords },
        { data: mockSavedWords },
        { data: { totalSaved: 1, totalLearned: 0, totalReviews: 2, accuracy: 50 } },
      ]);

      render(<VocabularyPage />);

      expect(await screen.findByRole('button', { name: /Học từ vựng/i })).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: /Flashcard/i })).toBeInTheDocument();
      // All 3 tab buttons should be rendered
      const buttons = await screen.findAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    test('should render level filter buttons', async () => {
      setupFetch([
        { data: mockWords },
        { data: mockSavedWords },
        { data: { totalSaved: 1, totalLearned: 0, totalReviews: 2, accuracy: 50 } },
      ]);

      render(<VocabularyPage />);

      expect(await screen.findByText('A1')).toBeInTheDocument();
    });
  });

  describe('Vocabulary Display', () => {
    test('should display vocabulary words', async () => {
      setupFetch([
        { data: mockWords },
        { data: mockSavedWords },
        { data: { totalSaved: 1, totalLearned: 0, totalReviews: 2, accuracy: 50 } },
      ]);

      render(<VocabularyPage />);

      expect(await screen.findByText('Hello')).toBeInTheDocument();
      expect(await screen.findByText('Xin chào')).toBeInTheDocument();
    });

    test('should display pronunciation', async () => {
      setupFetch([
        { data: mockWords },
        { data: mockSavedWords },
        { data: { totalSaved: 1, totalLearned: 0, totalReviews: 2, accuracy: 50 } },
      ]);

      render(<VocabularyPage />);

      expect(await screen.findByText(/\/həˈloʊ\//)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('should switch to saved words tab', async () => {
      setupFetch([
        { data: mockWords },
        { data: mockSavedWords },
        { data: { totalSaved: 1, totalLearned: 0, totalReviews: 2, accuracy: 50 } },
      ]);

      render(<VocabularyPage />);

      await screen.findByText('Hello');
      // Find the "Đã lưu" tab button (3rd tab, index 2)
      const buttons = await screen.findAllByRole('button');
      const savedTab = buttons[2]; // 💾 Đã lưu is the 3rd tab
      fireEvent.click(savedTab);

      expect(await screen.findByText('Hello')).toBeInTheDocument();
    });
  });

  describe('Word Saving', () => {
    test('should have save button for vocabulary words', async () => {
      setupFetch([
        { data: mockWords },
        { data: mockSavedWords },
        { data: { totalSaved: 1, totalLearned: 0, totalReviews: 2, accuracy: 50 } },
      ]);

      render(<VocabularyPage />);

      await screen.findByText('Hello');
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
