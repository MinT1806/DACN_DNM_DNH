import { useState } from 'react';

const S = {
  container: { padding: '24px', maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', margin: 0 },
  passage: { background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', lineHeight: 1.8, color: '#475569', fontSize: '0.95rem' },
  passageTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#1a202c', marginBottom: 12 },
  questionCard: { background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  questionNum: { fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', marginBottom: 8 },
  questionText: { fontSize: '1rem', fontWeight: 600, color: '#1a202c', lineHeight: 1.5, marginBottom: 12 },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  optionBtn: { padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', textAlign: 'left', fontSize: '0.9rem', color: '#475569', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 },
  optionSelected: { borderColor: '#3b82f6', background: '#eff6ff', color: '#1e40af' },
  optionCorrect: { borderColor: '#10b981', background: '#f0fdf4', color: '#15803d' },
  optionWrong: { borderColor: '#ef4444', background: '#fef2f2', color: '#dc2626' },
  feedbackBox: { padding: '12px 16px', borderRadius: 10, marginTop: 12, fontSize: '0.9rem' },
  feedbackCorrect: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
  feedbackWrong: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' },
};

export default function Reading({ question, answer, onAnswer, showResult, result }) {
  const passage = question.content;
  const options = Array.isArray(question.options) ? question.options
    : typeof question.options === 'object' ? Object.values(question.options) : [];
  const correct = result?.correctAnswer?.toLowerCase?.()?.trim?.();
  const userAns = typeof answer === 'string' ? answer.toLowerCase().trim() : '';

  const getOptionStyle = (optText) => {
    const isSelected = userAns === optText.toLowerCase().trim();
    const isCorrectOpt = correct === optText.toLowerCase().trim();
    if (!showResult) return isSelected ? { ...S.optionBtn, ...S.optionSelected } : S.optionBtn;
    if (isCorrectOpt) return { ...S.optionBtn, ...S.optionCorrect };
    if (isSelected && !isCorrectOpt) return { ...S.optionBtn, ...S.optionWrong };
    return S.optionBtn;
  };

  return (
    <div style={S.container}>
      <div style={S.header}>
        <span style={{ fontSize: '1.5rem' }}>📖</span>
        <h2 style={S.title}>Luyện đọc</h2>
      </div>

      {passage && (
        <div style={S.passage}>
          <div style={S.passageTitle}>📄 Bài đọc</div>
          {passage}
        </div>
      )}

      <div style={S.questionCard}>
        <div style={S.questionNum}>CÂU HỎI</div>
        <div style={S.questionText}>{question.question}</div>

        <div style={S.optionsGrid}>
          {options.map((opt, i) => {
            const optText = typeof opt === 'string' ? opt : opt.text || opt.label || JSON.stringify(opt);
            return (
              <button
                key={i}
                style={getOptionStyle(optText)}
                onClick={() => !showResult && onAnswer(optText)}
                disabled={showResult}
              >
                <span style={{ marginRight: 8, fontWeight: 700 }}>{String.fromCharCode(65 + i)}. </span>
                {optText}
                {showResult && correct === optText.toLowerCase().trim() && ' ✓'}
                {showResult && userAns === optText.toLowerCase().trim() && correct !== optText.toLowerCase().trim() && ' ✗'}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div style={{
            ...S.feedbackBox,
            ...(result?.correct ? S.feedbackCorrect : S.feedbackWrong)
          }}>
            {result?.correct ? '✅ Chính xác!' : `❌ Chưa đúng. Đáp án đúng: ${result?.correctAnswer}`}
            {result?.explanation && <div style={{ marginTop: 4, fontStyle: 'italic' }}>{result.explanation}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
