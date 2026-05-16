import React, { useState, useRef } from 'react';
import { CheckCircle, XCircle, Send } from 'lucide-react';

export default function EssayComponent({ question, value, onChange, showResult, result, onAIGrade }) {
  const [localValue, setLocalValue] = useState(value || '');
  const [wordCount, setWordCount] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    const text = e.target.value;
    setLocalValue(text);
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
    onChange(text);
  };

  const handleAIGrade = async () => {
    if (!localValue.trim() || localValue.trim().length < 10) {
      alert('Bài viết quá ngắn. Vui lòng viết ít nhất 10 ký tự.');
      return;
    }
    setAiLoading(true);
    try {
      await onAIGrade(question.id, localValue);
    } finally {
      setAiLoading(false);
    }
  };

  const minWords = 50;
  const isShort = wordCount < minWords;

  if (showResult && result) {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{
          padding: 16, borderRadius: 12, background: '#f8fafc',
          border: '2px solid #e2e8f0', marginBottom: 12,
        }}>
          <div style={{ fontWeight: 700, color: '#1a202c', marginBottom: 6, fontSize: '0.88rem' }}>
            Bài viết của bạn:
          </div>
          <div style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
            {result.userAnswer || '(trống)'}
          </div>
        </div>

        {result.aiScore != null && (
          <div style={{
            padding: 16, borderRadius: 12,
            background: result.aiScore >= 7 ? '#22C55E11' : result.aiScore >= 5 ? '#f59e0b11' : '#ef444411',
            border: `2px solid ${result.aiScore >= 7 ? '#22C55E33' : result.aiScore >= 5 ? '#f59e0b33' : '#ef444433'}`,
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: '1.5rem', fontWeight: 900,
                color: result.aiScore >= 7 ? '#22C55E' : result.aiScore >= 5 ? '#f59e0b' : '#ef4444',
              }}>
                {result.aiScore.toFixed(1)}/10
              </span>
              <span style={{ color: '#718096', fontSize: '0.82rem' }}>AI đánh giá</span>
            </div>
            {result.aiFeedback && (
              <div style={{ color: '#4a5568', lineHeight: 1.6, fontSize: '0.88rem' }}>
                {result.aiFeedback}
              </div>
            )}
            {result.aiDetails && result.aiDetails.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {result.aiDetails.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#718096', fontSize: '0.82rem' }}>{d.criterion}</span>
                    <span style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.82rem' }}>{d.score}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {result.explanation && (
          <div style={{
            padding: 12, borderRadius: 10, background: '#8b5cf611', border: '1px solid #8b5cf633',
          }}>
            <span style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.82rem' }}>Gợi ý: </span>
            <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>{result.explanation}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          placeholder="Viết câu trả lời của bạn ở đây..."
          style={{
            width: '100%', minHeight: 160, padding: '14px 16px',
            fontSize: '0.95rem', borderRadius: 12,
            border: `2px solid ${isShort ? '#ef444433' : '#e2e8f0'}`,
            resize: 'vertical', fontFamily: 'inherit', outline: 'none',
            lineHeight: 1.7, transition: 'border-color 0.2s',
            background: '#fff',
          }}
          rows={6}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{
          fontSize: '0.8rem', color: isShort ? '#ef4444' : '#718096',
          fontWeight: isShort ? 600 : 500,
        }}>
          {isShort ? `${wordCount}/${minWords} từ (tối thiểu)` : `${wordCount} từ ✓`}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {onAIGrade && (
            <button
              onClick={handleAIGrade}
              disabled={aiLoading || !localValue.trim() || localValue.trim().length < 10}
              className="clay-btn"
              style={{
                fontSize: '0.8rem', padding: '6px 14px',
                opacity: (aiLoading || !localValue.trim() || localValue.trim().length < 10) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {aiLoading ? (
                <>⏳ AI đang chấm...</>
              ) : (
                <><Send size={13} /> Chấm điểm AI</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
