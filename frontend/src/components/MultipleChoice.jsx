import { useState } from 'react';

const S = {
  container: { padding: '24px', maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', margin: 0 },
  progress: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, fontSize: '0.85rem', color: '#64748b' },
  progressBar: { flex: 1, height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', transition: 'width 0.3s ease' },
  exerciseCard: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 },
  questionText: { fontSize: '1.05rem', fontWeight: 600, color: '#1a202c', lineHeight: 1.5, marginBottom: 16 },
  passage: { background: '#f8fafc', borderRadius: 10, padding: 16, fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, marginBottom: 16, border: '1px solid #e2e8f0' },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  optionBtn: { padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', textAlign: 'left', fontSize: '0.95rem', color: '#475569', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 },
  optionSelected: { borderColor: '#3b82f6', background: '#eff6ff', color: '#1e40af' },
  optionCorrect: { borderColor: '#10b981', background: '#f0fdf4', color: '#15803d' },
  optionWrong: { borderColor: '#ef4444', background: '#fef2f2', color: '#dc2626' },
  feedbackBox: { padding: '12px 16px', borderRadius: 10, marginTop: 16, fontSize: '0.9rem', lineHeight: 1.5 },
  feedbackCorrect: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
  feedbackWrong: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' },
  feedbackAi: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' },
  explanation: { marginTop: 8, fontStyle: 'italic', fontSize: '0.85rem', opacity: 0.8 },
  navBtns: { display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' },
  btnPrimary: { padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  btnSecondary: { padding: '10px 24px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' },
  btnSubmit: { padding: '12px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px #10b98140' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  gradingLoader: { display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.9rem', marginTop: 12 },
  answerDisplay: { background: '#f8fafc', borderRadius: 8, padding: '12px 16px', fontSize: '0.9rem', color: '#475569', marginTop: 8, border: '1px solid #e2e8f0' },
  scoreDisplay: { fontSize: '1.5rem', fontWeight: 900, textAlign: 'center', marginBottom: 8 },
  scoreLabel: { fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginBottom: 16 },
};

function getOptionStyle(selected, isCorrect, showResult, isSelected) {
  if (!showResult) {
    return isSelected ? { ...S.optionBtn, ...S.optionSelected } : S.optionBtn;
  }
  if (isCorrect) return { ...S.optionBtn, ...S.optionCorrect };
  if (isSelected && !isCorrect) return { ...S.optionBtn, ...S.optionWrong };
  return S.optionBtn;
}

export default function MultipleChoice({ question, answer, onAnswer, showResult, result, grading }) {
  const options = Array.isArray(question.options) ? question.options
    : typeof question.options === 'object' ? Object.values(question.options) : [];

  const correct = result?.correctAnswer?.toLowerCase?.()?.trim?.();
  const userAns = typeof answer === 'string' ? answer.toLowerCase().trim() : '';

  const aiScore = result?.aiScore;
  const aiFeedback = result?.aiFeedback;
  const aiDetails = result?.aiDetails;

  return (
    <div style={S.container}>
      {question.content && (
        <div style={S.passage}>{question.content}</div>
      )}
      <div style={S.questionText}>{question.question}</div>

      <div style={S.optionsGrid}>
        {options.map((opt, i) => {
          const optText = typeof opt === 'string' ? opt : opt.text || opt.label || JSON.stringify(opt);
          const isSelected = userAns === optText.toLowerCase().trim();
          const isCorrectOpt = correct === optText.toLowerCase().trim();
          return (
            <button
              key={i}
              style={getOptionStyle(answer, result?.correctAnswer, showResult, isSelected)}
              onClick={() => !showResult && onAnswer(optText)}
              disabled={showResult}
            >
              <span style={{ marginRight: 8, fontWeight: 700 }}>{String.fromCharCode(65 + i)}. </span>
              {optText}
              {showResult && isCorrectOpt && ' ✓'}
              {showResult && isSelected && !isCorrectOpt && ' ✗'}
            </button>
          );
        })}
      </div>

      {showResult && aiScore !== undefined && (
        <div style={{ ...S.feedbackBox, ...S.feedbackAi }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            AI Score: {aiScore}/10
          </div>
          {aiFeedback && <p style={{ margin: '0 0 8px' }}>{aiFeedback}</p>}
          {aiDetails && aiDetails.length > 0 && aiDetails.map((d, i) => (
            <div key={i} style={{ fontSize: '0.85rem', marginBottom: 4 }}>
              <strong>{d.criterion}:</strong> {d.score}/10 - {d.comment}
            </div>
          ))}
        </div>
      )}

      {showResult && result?.explanation && (
        <div style={{ ...S.explanation, marginTop: 12 }}>
          💡 {result.explanation}
        </div>
      )}

      {grading && (
        <div style={S.gradingLoader}>
          <span>🤖</span> AI đang chấm điểm...
        </div>
      )}
    </div>
  );
}
