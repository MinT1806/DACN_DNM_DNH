import { useState, useEffect, useRef, useCallback } from 'react';
import { vocabularyAPI } from '../api/api';

export const useInteractiveSubtitle = (audioUrl, subtitles = []) => {
  const [activeWord, setActiveWord] = useState(null);
  const [wordDefinition, setWordDefinition] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [savedWords, setSavedWords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Parse VTT/SRT subtitles into structured format
  const parseSubtitles = useCallback((rawSubtitles) => {
    if (typeof rawSubtitles === 'string') {
      const lines = rawSubtitles.split('\n');
      const parsed = [];
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        if (line.match(/^\d+$/)) {
          const timeLine = lines[++i];
          const textLines = [];
          while (i + 1 < lines.length && lines[++i].trim() !== '') {
            textLines.push(lines[i].trim());
          }
          if (timeLine && textLines.length > 0) {
            parsed.push({ time: timeLine, text: textLines.join(' ') });
          }
        }
        i++;
      }
      return parsed;
    }
    return rawSubtitles;
  }, []);

  const parsedSubtitles = parseSubtitles(subtitles);

  // Extract words from text
  const extractWords = (text) => {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[.,!?;:'"()[\]{}]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 0);
  };

  // Handle word click
  const handleWordClick = async (word, event) => {
    const rect = event.target.getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
    setActiveWord(word);
    setShowPopup(true);
    setIsLoading(true);

    try {
      // Try to get word definition from API
      const response = await vocabularyAPI.search(word);
      if (response.data && response.data.length > 0) {
        const wordData = response.data.find(
          (w) => w.word.toLowerCase() === word.toLowerCase()
        );
        if (wordData) {
          setWordDefinition(wordData);
          setIsLoading(false);
          return;
        }
      }
      // Fallback: basic definition
      setWordDefinition({
        word: word,
        translation: 'Đang tải...',
        pronunciation: '',
        example: '',
      });
    } catch (error) {
      // Word not found - basic info
      setWordDefinition({
        word: word,
        translation: 'Không tìm thấy nghĩa',
        pronunciation: '',
        example: '',
        notFound: true,
      });
    }
    setIsLoading(false);
  };

  // Save word to vocabulary
  const saveWord = async (wordData) => {
    try {
      await vocabularyAPI.addToLearning(wordData.id || wordData.wordId);
      setSavedWords((prev) => [...prev, wordData.word]);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Close popup
  const closePopup = () => {
    setShowPopup(false);
    setActiveWord(null);
    setWordDefinition(null);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.subtitles-popup')) {
        closePopup();
      }
    };
    if (showPopup) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showPopup]);

  return {
    parsedSubtitles,
    activeWord,
    wordDefinition,
    showPopup,
    popupPosition,
    savedWords,
    isLoading,
    handleWordClick,
    saveWord,
    closePopup,
    extractWords,
  };
};

// Interactive Subtitle Component
export const InteractiveSubtitle = ({
  subtitles = [],
  audioUrl,
  showSubtitles = true,
  onWordClick,
}) => {
  const {
    parsedSubtitles,
    activeWord,
    wordDefinition,
    showPopup,
    popupPosition,
    savedWords,
    isLoading,
    handleWordClick,
    saveWord,
    closePopup,
    extractWords,
  } = useInteractiveSubtitle(audioUrl, subtitles);

  if (!showSubtitles || parsedSubtitles.length === 0) return null;

  return (
    <>
      <div className="subtitles-container bg-black/80 rounded-lg p-4 max-w-2xl mx-auto">
        {parsedSubtitles.map((subtitle, idx) => (
          <p key={idx} className="text-white text-lg text-center leading-relaxed">
            {extractWords(subtitle.text).map((word, wordIdx) => (
              <span
                key={wordIdx}
                className={`cursor-pointer hover:bg-blue-500/50 rounded px-0.5 transition-colors ${
                  savedWords.includes(word.toLowerCase()) ? 'bg-green-500/30' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleWordClick(word, e);
                  onWordClick?.(word);
                }}
              >
                {word}{' '}
              </span>
            ))}
          </p>
        ))}
      </div>

      {/* Word Definition Popup */}
      {showPopup && activeWord && (
        <div
          className="subtitles-popup fixed z-50 bg-white rounded-xl shadow-2xl p-4 w-72 border border-gray-200"
          style={{
            left: `${Math.min(popupPosition.x, window.innerWidth - 300)}px`,
            top: `${popupPosition.y + 10}px`,
            transform: 'translateY(-100%)',
          }}
        >
          <button
            onClick={closePopup}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {isLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : wordDefinition ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 capitalize">
                  {wordDefinition.word}
                </h3>
                {wordDefinition.pronunciation && (
                  <span className="text-sm text-gray-500">
                    {wordDefinition.pronunciation}
                  </span>
                )}
              </div>
              <p className="text-blue-600 font-medium">{wordDefinition.translation}</p>
              {wordDefinition.example && (
                <p className="text-sm text-gray-600 italic">"{wordDefinition.example}"</p>
              )}
              {wordDefinition.partOfSpeech && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600">
                  {wordDefinition.partOfSpeech}
                </span>
              )}
              {!wordDefinition.notFound && !savedWords.includes(activeWord?.toLowerCase()) && (
                <button
                  onClick={() => saveWord(wordDefinition)}
                  className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  + Lưu vào từ vựng
                </button>
              )}
              {savedWords.includes(activeWord?.toLowerCase()) && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Đã lưu
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Không tìm thấy nghĩa của từ này.</p>
          )}
        </div>
      )}
    </>
  );
};

export default InteractiveSubtitle;
