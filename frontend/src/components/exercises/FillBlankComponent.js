import React, { useState, useRef } from 'react';

export default function FillBlankComponent({ question, value, onChange, showResult, result }) {
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const text = e.target.value;
    setLocalValue(text);
    onChange(text);
  };

  const handleHintClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (showResult && result) {
    const isCorrect = result.correct;
    const userAnswer = result.userAnswer || '';
    const correctAnswer = result.correctAnswer || '';

    // Highlight differences
    const getHighlightedText = (user, correct) => {
      const u = user.trim().toLowerCase();
      const c = correct.trim().toLowerCase();
      if (u === c) return <span style={{ color: '#22C55E', fontWeight: 700 }}>{user}</span>;
      return (
        <>
          <span style={{ textDecoration: 'line-through', color: '#ef4444' }}>{user}</span>
          {' → '}
          <span style={{ color: '#22C55E', fontWeight: 700 }}>{correct}</span>
        </>
      );
    };

    return (
      <div style={{ marginTop: 12 }}>
        <div style={{
          padding: 16, borderRadius: 12, background: isCorrect ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${isCorrect ? '#22C55E33' : '#ef444433'}`,
        }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{
              fontSize: '0.82rem', fontWeight: 700,
              color: isCorrect ? '#22C55E' : '#ef4444',
            }}>
              {isCorrect ? '✓ Đúng!' : '✗ Chưa đúng'}
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#4a5568', lineHeight: 1.7 }}>
            <span style={{ fontWeight: 600 }}>Câu trả lời của bạn: </span>
            {getHighlightedText(userAnswer, correctAnswer)}
          </div>
        </div>

        {result.explanation && (
          <div style={{
            marginTop: 8, padding: 12, borderRadius: 10,
            background: '#8b5cf611', border: '1px solid #8b5cf633',
          }}>
            <span style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.82rem' }}>💡 Gợi ý: </span>
            <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>{result.explanation}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder="Nhập đáp án..."
          className="clay-input"
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '0.95rem',
            borderRadius: 12,
          }}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
