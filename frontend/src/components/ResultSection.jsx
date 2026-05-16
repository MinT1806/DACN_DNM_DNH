import { useState } from 'react';

const S = {
  container: { padding: '24px', maxWidth: 800, margin: '0 auto' },
  card: { background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center' },
  scoreCircle: { width: 140, height: 140, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white' },
  scoreValue: { fontSize: '3rem', fontWeight: 900, lineHeight: 1 },
  scoreMax: { fontSize: '1rem', fontWeight: 600, opacity: 0.8 },
  title: { fontSize: '1.5rem', fontWeight: 900, color: '#1a202c', marginBottom: 8 },
  subtitle: { fontSize: '0.95rem', color: '#64748b', marginBottom: 24 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  statItem: { padding: '12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' },
  statValue: { fontSize: '1.3rem', fontWeight: 700, color: '#1a202c' },
  statLabel: { fontSize: '0.75rem', color: '#64748b', marginTop: 2 },
  aiBox: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' },
  aiTitle: { fontWeight: 700, color: '#1e40af', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
  aiScore: { fontSize: '1.2rem', fontWeight: 700, color: '#1e40af', marginBottom: 8 },
  aiFeedback: { fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 },
  questionResults: { textAlign: 'left', marginBottom: 24 },
  qrTitle: { fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: 12 },
  qrItem: { padding: '12px 16px', borderRadius: 10, marginBottom: 8, border: '1px solid #e2e8f0' },
  qrCorrect: { background: '#f0fdf4', borderColor: '#bbf7d0' },
  qrWrong: { background: '#fef2f2', borderColor: '#fecaca' },
  qrAi: { background: '#eff6ff', borderColor: '#bfdbfe' },
  qrQuestion: { fontSize: '0.9rem', color: '#475569', marginBottom: 4 },
  qrAnswers: { fontSize: '0.85rem', color: '#64748b' },
  navBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: { padding: '12px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' },
  btnSuccess: { background: 'linear-gradient(135deg, #10b981, #059669)' },
  btnSecondary: { padding: '12px 32px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, marginBottom: 8 },
  badgePass: { background: '#f0fdf4', color: '#15803d' },
  badgeFail: { background: '#fef2f2', color: '#dc2626' },
  encouragement: { fontSize: '1.1rem', fontWeight: 600, marginTop: 8, marginBottom: 16 },
};

function getScoreBg(score) {
  if (score === null || score === undefined) return '#64748b';
  if (score >= 8) return 'linear-gradient(135deg, #10b981, #059669)';
  if (score >= 6) return 'linear-gradient(135deg, #f59e0b, #d97706)';
  return 'linear-gradient(135deg, #ef4444, #dc2626)';
}

function getEncouragement(score) {
  if (score >= 9) return '🌟 Xuất sắc! Bạn nắm vững bài học này!';
  if (score >= 8) return '🎉 Tốt lắm! Hãy tiếp tục phát huy!';
  if (score >= 6) return '👍 Khá tốt! Cần ôn tập thêm một chút.';
  if (score >= 5) return '💪 Cố gắng hơn nữa nhé!';
  return '📚 Hãy học lại bài và thử lại nhé!';
}

export default function ResultSection({ result, isTest, onNext, onRetry, onBack }) {
  if (!result) {
    return (
      <div style={S.container}>
        <div style={{ ...S.card, textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
          <p style={{ color: '#64748b' }}>Không có kết quả để hiển thị.</p>
        </div>
      </div>
    );
  }

  const score = result.score;
  const passed = result.passed;
  const aiGrading = result.aiGrading;
  const questionResults = result.questionResults || [];

  const correctCount = questionResults.filter(r => r.correct === true).length;
  const aiGradedCount = questionResults.filter(r => r.aiScore !== undefined).length;
  const wrongCount = questionResults.filter(r => r.correct === false).length;

  const formatTime = (s) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={S.container}>
      <div style={S.card}>
        <div style={S.scoreCircle, { background: getScoreBg(score) }}>
          <span style={S.scoreValue}>{score?.toFixed?.(1) || score}</span>
          <span style={S.scoreMax}>/10</span>
        </div>

        <div style={{ ...S.badge, ...(passed ? S.badgePass : S.badgeFail) }}>
          {isTest ? (passed ? '✅ ĐẠT' : '❌ CHƯA ĐẠT') : '📊 KẾT QUẢ'}
        </div>

        <h2 style={S.title}>
          {isTest ? (passed ? 'Chúc mừng bạn!' : 'Chưa đạt điểm đạt!') : 'Hoàn thành bài tập!'}
        </h2>
        <div style={S.encouragement}>{getEncouragement(score)}</div>
        <div style={S.subtitle}>
          {isTest && result.passingScore && `Điểm đạt: ${result.passingScore}/10`}
          {isTest && result.maxScore && ` | Tối đa: ${result.maxScore}`}
        </div>

        <div style={S.stats}>
          <div style={S.statItem}>
            <div style={S.statValue}>{correctCount}/{result.totalQuestions}</div>
            <div style={S.statLabel}>Câu đúng</div>
          </div>
          {wrongCount > 0 && (
            <div style={S.statItem}>
              <div style={{ ...S.statValue, color: '#dc2626' }}>{wrongCount}</div>
              <div style={S.statLabel}>Câu sai</div>
            </div>
          )}
          <div style={S.statItem}>
            <div style={S.statValue}>{result.xpEarned} XP</div>
            <div style={S.statLabel}>Điểm thưởng</div>
          </div>
          <div style={S.statItem}>
            <div style={S.statValue}>{formatTime(result.timeSpentSeconds)}</div>
            <div style={S.statLabel}>Thời gian</div>
          </div>
        </div>

        {aiGrading && (
          <div style={S.aiBox}>
            <div style={S.aiTitle}>
              🤖 Kết quả chấm bằng AI
            </div>
            <div style={S.aiScore}>
              Điểm trung bình AI: {aiGrading.score}/10
            </div>
            <div style={S.aiFeedback}>{aiGrading.summary}</div>
          </div>
        )}

        {questionResults.length > 0 && (
          <div style={S.questionResults}>
            <div style={S.qrTitle}>📋 Chi tiết từng câu</div>
            {questionResults.map((r, i) => (
              <div
                key={i}
                style={{
                  ...S.qrItem,
                  ...(r.correct === true ? S.qrCorrect : r.correct === false ? S.qrWrong : S.qrAi),
                }}
              >
                <div style={S.qrQuestion}>
                  <strong>Câu {i + 1}:</strong> {r.question?.substring?.(0, 80)}
                  {r.question?.length > 80 ? '...' : ''}
                </div>
                <div style={S.qrAnswers}>
                  {r.correct !== null && (
                    <span>
                      {r.correct ? '✅ Đúng' : `❌ Sai`} | Đáp án: {r.correctAnswer}
                      {r.correct === false && ` | Bạn: ${r.userAnswer || '(trống)'}`}
                    </span>
                  )}
                  {r.aiScore !== undefined && (
                    <span> | 🤖 AI: {r.aiScore}/10</span>
                  )}
                </div>
                {r.aiFeedback && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                    💬 {r.aiFeedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={S.navBtns}>
          {onBack && <button style={S.btnSecondary} onClick={onBack}>← Quay lại</button>}
          {onRetry && <button style={S.btnSecondary} onClick={onRetry}>🔄 Làm lại</button>}
          {onNext && <button style={{ ...S.btnPrimary, ...S.btnSuccess }} onClick={onNext}>→ Tiếp tục</button>}
        </div>
      </div>
    </div>
  );
}
