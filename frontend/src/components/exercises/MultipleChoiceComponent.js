import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export default function MultipleChoiceComponent({ question, value, onChange, showResult, result }) {
  const [selected, setSelected] = useState(value || null);

  // Parse options
  let options = [];
  if (question.options) {
    if (Array.isArray(question.options)) {
      options = question.options;
    } else if (typeof question.options === 'string') {
      try { options = JSON.parse(question.options); } catch { options = [question.options]; }
      if (!Array.isArray(options)) options = [options];
    }
  }

  // Ensure options is always an array
  if (!Array.isArray(options)) options = [];

  const handleSelect = (opt) => {
    if (showResult) return;
    setSelected(opt);
    onChange(opt);
  };

  if (showResult && result) {
    const isCorrect = result.correct;
    return (
      <div style={{ marginTop: 12 }}>
        {options.map((opt, i) => {
          const isSelected = result.userAnswer === opt;
          const isRight = result.correctAnswer === opt;
          let bg = 'transparent';
          let border = '2px solid rgba(0,0,0,0.08)';
          let color = '#4a5568';

          if (isRight) {
            bg = '#22C55E11';
            border = '2px solid #22C55E';
            color = '#166534';
          } else if (isSelected && !isRight) {
            bg = '#ef444411';
            border = '2px solid #ef4444';
            color = '#991b1b';
          }

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderRadius: 12, marginBottom: 8, background: bg, border,
              fontWeight: isRight ? 700 : 600, color,
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: isRight ? '#22C55E' : (isSelected ? '#ef4444' : '#e2e8f0'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '0.75rem', flexShrink: 0,
              }}>
                {isRight ? <CheckCircle size={14} /> : (isSelected ? <XCircle size={14} /> : String.fromCharCode(65 + i))}
              </span>
              {opt}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((opt, i) => {
        const isSelected = selected === opt;
        return (
          <label key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem',
            border: `2px solid ${isSelected ? '#22C55E' : 'rgba(0,0,0,0.08)'}`,
            background: isSelected ? 'rgba(34,197,94,0.06)' : 'transparent',
            color: isSelected ? '#166534' : '#1a202c',
            transition: 'all 0.2s',
            userSelect: 'none',
          }}
            onClick={() => handleSelect(opt)}
          >
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background: isSelected ? '#22C55E' : 'rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isSelected ? 'white' : '#718096', fontSize: '0.75rem', fontWeight: 800,
              flexShrink: 0,
            }}>
              {String.fromCharCode(65 + i)}
            </span>
            <input
              type="radio"
              name={'q_' + question.id}
              checked={isSelected}
              onChange={() => handleSelect(opt)}
              style={{ display: 'none' }}
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}
