import React, { useState } from 'react';
import { CheckCircle, Send } from 'lucide-react';

export default function WritingComponent({ question, value, onChange, showResult, result, onAIGrade }) {
  const [localValue, setLocalValue] = useState(value || '');
  const [wordCount, setWordCount] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);

  const handleChange = (e) => {
    const text = e.target.value;
    setLocalValue(text);
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
    onChange(text);
  };

  const handleAIGrade = async () => {
    if (!localValue.trim() || wordCount < 50) {
      alert('Bài viết cần ít nhất 50 từ để được chấm điểm.');
      return;
    }
    setAiLoading(true);
    try {
      await onAIGrade(question.id, localValue);
    } finally {
      setAiLoading(false);
    }
  };

  const minWords = 100;
  const isShort = wordCount < minWords;

  if (showResult && result) {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{
          padding: 16, borderRadius: 12, background: '#f8fafc',
          border: '2px solid #e2e8f0', marginBottom: 12,
        }}>
          <div style={{ fontWeight: 700, color: '#1a202c', marginBottom: 6, fontSize: '0.88rem' }}>
            Bài viết của bạn ({wordCount} từ):
          </div>
          <div style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
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
              <span style={{ color: '#718096', fontSize: '0.82rem' }}>AI đánh giá chi tiết</span>
            </div>
            {result.aiFeedback && (
              <div style={{ color: '#4a5568', lineHeight: 1.6, fontSize: '0.88rem', marginBottom: 10 }}>
                {result.aiFeedback}
              </div>
            )}
            {result.aiDetails && result.aiDetails.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {result.aiDetails.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', borderRadius: 8, background: '#f8fafc',
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#1a202c', fontSize: '0.82rem' }}>{d.criterion}</span>
                      {d.comment && (
                        <div style={{ color: '#718096', fontSize: '0.78rem', marginTop: 2 }}>{d.comment}</div>
                      )}
                    </div>
                    <span style={{
                      fontWeight: 800, fontSize: '0.88rem',
                      color: d.score >= 7 ? '#22C55E' : d.score >= 5 ? '#f59e0b' : '#ef4444',
                    }}>
                      {d.score}/10
                    </span>
                  </div>
                ))}
              </div>
            )}
            {(result.strengths || result.areasForImprovement || result.suggestions) && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {result.strengths && result.strengths.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 700, color: '#22C55E', fontSize: '0.82rem', marginBottom: 4 }}>Điểm mạnh</div>
                    {result.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: '0.78rem', color: '#4a5568' }}>✓ {s}</div>
                    ))}
                  </div>
                )}
                {(result.areasForImprovement || result.suggestions) && (
                  <div>
                    <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.82rem', marginBottom: 4 }}>Cần cải thiện</div>
                    {(result.areasForImprovement || result.suggestions || []).map((a, i) => (
                      <div key={i} style={{ fontSize: '0.78rem', color: '#4a5568' }}>→ {a}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {result.explanation && (
          <div style={{ padding: 12, borderRadius: 10, background: '#8b5cf611', border: '1px solid #8b5cf633' }}>
            <span style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.82rem' }}>Gợi ý: </span>
            <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>{result.explanation}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        padding: '10px 14px', borderRadius: '10px 10px 0 0',
        background: '#fef3c7', border: '1px solid #fcd34d',
        fontSize: '0.82rem', color: '#92400e', fontWeight: 500,
        marginBottom: 0,
      }}>
        📝 Yêu cầu: Viết ít nhất <strong>{minWords} từ</strong>. Bài viết sẽ được AI đánh giá chi tiết về ngữ pháp, từ vựng, và cấu trúc.
      </div>
      <textarea
        value={localValue}
        onChange={handleChange}
        placeholder={`Viết bài luận của bạn ở đây...\n\nVí dụ:\n- Giới thiệu chủ đề\n- Trình bày ý kiến với các luận điểm\n- Kết luận\n\nYêu cầu: ít nhất ${minWords} từ`}
        style={{
          width: '100%', minHeight: 220, padding: '14px 16px',
          fontSize: '0.95rem', borderRadius: '0 0 12px 12px',
          border: `2px solid ${isShort ? '#ef444433' : '#e2e8f0'}`,
          borderTop: 'none',
          resize: 'vertical', fontFamily: 'inherit', outline: 'none',
          lineHeight: 1.8, transition: 'border-color 0.2s',
          background: '#fff',
        }}
        rows={10}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{
            fontSize: '0.82rem', color: isShort ? '#ef4444' : '#22C55E',
            fontWeight: 600,
          }}>
            {wordCount} / {minWords} từ {isShort ? '(chưa đủ)' : '✓'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
            Tối thiểu: {minWords} từ
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onAIGrade && (
            <button
              onClick={handleAIGrade}
              disabled={aiLoading || wordCount < 50}
              className="clay-btn"
              style={{
                fontSize: '0.82rem', padding: '6px 14px',
                opacity: (aiLoading || wordCount < 50) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {aiLoading ? (
                <>⏳ AI đang phân tích...</>
              ) : (
                <><Send size={13} /> Phân tích AI</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
