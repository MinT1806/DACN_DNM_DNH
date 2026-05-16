import { useState, useRef } from 'react';

const S = {
  container: { padding: '24px', maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', margin: 0 },
  instructions: { background: '#f8fafc', borderRadius: 10, padding: 12, fontSize: '0.9rem', color: '#64748b', marginBottom: 16, border: '1px solid #e2e8f0' },
  textarea: { width: '100%', minHeight: 200, padding: 16, borderRadius: 12, border: '2px solid #e2e8f0', fontSize: '1rem', lineHeight: 1.7, fontFamily: 'inherit', resize: 'vertical', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
  wordCount: { textAlign: 'right', fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 },
  btnGrade: { padding: '12px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px #8b5cf640', marginTop: 16 },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  gradingBox: { marginTop: 20, padding: 20, borderRadius: 16, background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
  gradingHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  scoreCircle: { width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 },
  scoreLabel: { fontSize: '0.85rem', color: '#64748b', marginTop: 4 },
  feedbackTitle: { fontWeight: 700, color: '#1a202c', marginBottom: 8 },
  feedbackText: { color: '#475569', lineHeight: 1.6, fontSize: '0.95rem' },
  detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 },
  detailCard: { padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' },
  detailLabel: { fontSize: '0.75rem', color: '#64748b', marginBottom: 2 },
  detailScore: { fontSize: '1.1rem', fontWeight: 700, color: '#1a202c' },
  detailComment: { fontSize: '0.8rem', color: '#64748b', marginTop: 2 },
  strengthBox: { marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' },
  weaknessBox: { marginTop: 8, padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' },
  listTitle: { fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, color: '#64748b' },
  listItem: { fontSize: '0.85rem', color: '#475569', marginLeft: 12 },
};

export default function Essay({ question, answer, onAnswer, result, grading, onGrade }) {
  const [text, setText] = useState(answer || '');
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minWords = 10;

  const aiScore = result?.aiScore;
  const aiFeedback = result?.aiFeedback;
  const aiDetails = result?.aiDetails || [];
  const strengths = result?.strengths || result?.extra?.('strengths') || [];
  const weaknesses = result?.areasForImprovement || result?.extra?.('areasForImprovement') || [];

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return '#64748b';
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={S.container}>
      <div style={S.header}>
        <span style={{ fontSize: '1.5rem' }}>✍️</span>
        <h2 style={S.title}>Viết bài luận</h2>
      </div>

      {question.content && (
        <div style={S.instructions}>
          <strong>📋 Yêu cầu:</strong> {question.content}
        </div>
      )}

      <div style={S.questionText || { fontSize: '1rem', fontWeight: 600, color: '#1a202c', marginBottom: 12 }}>
        {question.question}
      </div>

      <textarea
        style={S.textarea}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onAnswer(e.target.value);
        }}
        placeholder="Bắt đầu viết bài luận của bạn ở đây..."
        disabled={result !== null}
      />
      <div style={S.wordCount}>
        {wordCount} từ {wordCount < minWords && `(tối thiểu ${minWords} từ)`}
      </div>

      {!result && (
        <button
          style={{ ...S.btnGrade, ...((wordCount < minWords || grading) ? S.btnDisabled : {}) }}
          onClick={onGrade}
          disabled={wordCount < minWords || grading}
        >
          {grading ? '🤖 Đang chấm bài...' : '🤖 Chấm bài bằng AI'}
        </button>
      )}

      {grading && (
        <div style={{ ...S.gradingBox, opacity: 0.7 }}>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🤖</div>
            <div style={{ color: '#64748b' }}>AI đang phân tích bài viết của bạn...</div>
          </div>
        </div>
      )}

      {result && (
        <div style={S.gradingBox}>
          <div style={S.gradingHeader}>
            <div style={{ ...S.scoreCircle, background: `linear-gradient(135deg, ${getScoreColor(aiScore)}, ${getScoreColor(aiScore)}aa)` }}>
              {aiScore != null ? aiScore.toFixed(1) : '?'}
            </div>
            <div>
              <div style={S.feedbackTitle}>Kết quả chấm bài</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Thang điểm: 0 - 10</div>
            </div>
          </div>

          {aiFeedback && (
            <div style={{ marginBottom: 16 }}>
              <div style={S.feedbackTitle}>Nhận xét</div>
              <p style={S.feedbackText}>{aiFeedback}</p>
            </div>
          )}

          {aiDetails.length > 0 && (
            <div style={S.detailsGrid}>
              {aiDetails.map((d, i) => (
                <div key={i} style={S.detailCard}>
                  <div style={S.detailLabel}>{d.criterion}</div>
                  <div style={S.detailScore}>{d.score}/10</div>
                  <div style={S.detailComment}>{d.comment}</div>
                </div>
              ))}
            </div>
          )}

          {strengths.length > 0 && (
            <div style={S.strengthBox}>
              <div style={S.listTitle}>✅ Điểm mạnh</div>
              {strengths.map((s, i) => (
                <div key={i} style={S.listItem}>• {s}</div>
              ))}
            </div>
          )}

          {weaknesses.length > 0 && (
            <div style={S.weaknessBox}>
              <div style={S.listTitle}>⚠️ Cần cải thiện</div>
              {weaknesses.map((w, i) => (
                <div key={i} style={S.listItem}>• {w}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
