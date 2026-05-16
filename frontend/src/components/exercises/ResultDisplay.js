import React from 'react';
import { CheckCircle, XCircle, Sparkles, RotateCcw, Home, ChevronDown } from 'lucide-react';

const SKILL_COLORS = {
  READING: '#8B5CF6',
  LISTENING: '#3B82F6',
  WRITING: '#F59E0B',
  SPEAKING: '#22C55E',
};

const SKILL_LABELS = {
  READING: 'Đọc hiểu',
  LISTENING: 'Nghe hiểu',
  WRITING: 'Viết bài',
  SPEAKING: 'Nói tiếng Anh',
};

function ScoreCircle({ score }) {
  const color = score >= 8 ? '#22C55E' : score >= 5 ? '#f59e0b' : '#ef4444';
  const emoji = score >= 8 ? '🎉' : score >= 5 ? '👍' : '💪';

  return (
    <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle
          cx="60" cy="60" r="52"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        <circle
          cx="60" cy="60" r="52"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${(score / 10) * 327} 327`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 900, color }}>
          {score.toFixed(1)}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#a0aec0', fontWeight: 600 }}>/10</div>
      </div>
    </div>
  );
}

function QuestionResultCard({ qr, idx, skill }) {
  const isCorrect = qr.correct === true;
  const isAIGraded = qr.aiScore != null;
  const score = qr.aiScore ?? (isCorrect ? 10 : 0);

  return (
    <div className="clay-card" style={{
      padding: 20,
      borderLeft: `4px solid ${
        isCorrect ? '#22C55E' : isAIGraded
          ? (qr.aiScore >= 7 ? '#22C55E' : qr.aiScore >= 5 ? '#f59e0b' : '#ef4444')
          : '#8b5cf6'
      }`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {isCorrect ? (
          <CheckCircle size={20} color="#22C55E" style={{ flexShrink: 0, marginTop: 2 }} />
        ) : isAIGraded ? (
          <Sparkles size={20} color={score >= 7 ? '#22C55E' : score >= 5 ? '#f59e0b' : '#ef4444'} style={{ flexShrink: 0, marginTop: 2 }} />
        ) : (
          <XCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
        )}

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.92rem' }}>
              Câu {idx + 1}: {qr.question?.length > 60 ? qr.question?.substring(0, 60) + '...' : qr.question}
            </span>
          </div>

          {/* Reading/Listening specific */}
          {(skill === 'READING' || skill === 'LISTENING') && (
            <>
              <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>Đáp án của bạn: </span>
                <span style={{ color: isCorrect ? '#22C55E' : '#ef4444', fontWeight: 600 }}>
                  {qr.userAnswer || '(trống)'}
                </span>
              </div>
              {qr.correct === false && qr.correctAnswer && (
                <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Đáp án đúng: </span>
                  <span style={{ color: '#22C55E', fontWeight: 600 }}>{qr.correctAnswer}</span>
                </div>
              )}
            </>
          )}

          {/* Writing/Speaking specific */}
          {(skill === 'WRITING' || skill === 'SPEAKING') && (
            <>
              {qr.userAnswer && (
                <div style={{
                  padding: '8px 12px', borderRadius: 8, background: '#f8fafc',
                  marginBottom: 8, fontSize: '0.85rem', color: '#4a5568', fontStyle: 'italic',
                }}>
                  "{qr.userAnswer.length > 200 ? qr.userAnswer.substring(0, 200) + '...' : qr.userAnswer}"
                </div>
              )}
              {qr.aiScore != null && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 20,
                  background: qr.aiScore >= 7 ? '#22C55E11' : qr.aiScore >= 5 ? '#f59e0b11' : '#ef444411',
                  marginBottom: 6,
                }}>
                  <span style={{
                    fontWeight: 900, fontSize: '0.85rem',
                    color: qr.aiScore >= 7 ? '#22C55E' : qr.aiScore >= 5 ? '#f59e0b' : '#ef4444',
                  }}>
                    {qr.aiScore.toFixed(1)}/10
                  </span>
                  <span style={{ color: '#718096', fontSize: '0.78rem' }}>AI chấm</span>
                </div>
              )}
            </>
          )}

          {/* AI Feedback */}
          {qr.aiFeedback && (
            <div style={{ fontSize: '0.82rem', color: '#4a5568', marginBottom: 6 }}>
              💬 {qr.aiFeedback}
            </div>
          )}

          {/* AI Details */}
          {qr.aiDetails?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {qr.aiDetails.map((d, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '4px 10px', borderRadius: 8, background: '#f8fafc',
                  fontSize: '0.8rem',
                }}>
                  <span style={{ color: '#718096', fontWeight: 500 }}>{d.criterion}</span>
                  <span style={{ fontWeight: 800, color: '#1a202c' }}>{d.score}/10</span>
                </div>
              ))}
            </div>
          )}

          {/* Pronunciation tips */}
          {qr.pronunciationTips?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.8rem', marginBottom: 4 }}>
                Mẹo phát âm
              </div>
              {qr.pronunciationTips.map((tip, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: '#4a5568', marginBottom: 2 }}>
                  💡 {tip}
                </div>
              ))}
            </div>
          )}

          {/* Explanation */}
          {qr.explanation && (
            <div style={{
              marginTop: 8, padding: '8px 12px', borderRadius: 8,
              background: '#8b5cf611', fontSize: '0.82rem', color: '#6b21a8',
            }}>
              💡 {qr.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultDisplay({ result, skill, topic, level, onBack, onRetry }) {
  const score = result?.score || 0;
  const color = score >= 8 ? '#22C55E' : score >= 5 ? '#f59e0b' : '#ef4444';
  const skillColor = SKILL_COLORS[skill] || '#8b5cf6';
  const correctCount = result?.correctCount ?? 0;
  const totalCount = result?.totalCount ?? result?.questionResults?.length ?? 0;
  const xpEarned = result?.xpEarned ?? 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      {/* Score Card */}
      <div className="clay-card" style={{ padding: 32, marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
          {score >= 8 ? '🎉' : score >= 5 ? '👍' : '💪'}
        </div>

        <ScoreCircle score={score} />

        <h2 style={{ fontWeight: 900, fontSize: '1.3rem', color: '#1a202c', marginTop: 16, marginBottom: 4 }}>
          {score >= 8 ? 'Xuất sắc!' : score >= 5 ? 'Tốt lắm!' : 'Cần cố gắng hơn!'}
        </h2>

        <p style={{ color: '#718096', fontWeight: 600, marginBottom: 4 }}>
          {correctCount}/{totalCount} câu đúng
          {xpEarned > 0 && ` • +${xpEarned} XP`}
        </p>

        {result?.feedback && (
          <p style={{
            color: '#4a5568', fontSize: '0.88rem', marginTop: 8,
            lineHeight: 1.6, maxWidth: 500, margin: '8px auto 0',
          }}>
            {result.feedback}
          </p>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
          <button
            onClick={onRetry}
            className="clay-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={16} />
            Làm lại
          </button>
          <button
            onClick={onBack}
            className="clay-btn clay-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Home size={16} />
            Chọn bài khác
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {result?.suggestions?.length > 0 && (
        <div className="clay-card" style={{ padding: 20, marginBottom: 24, background: '#fef3c7', border: '2px solid #fcd34d' }}>
          <h3 style={{ fontWeight: 800, color: '#92400e', marginBottom: 12, fontSize: '0.95rem' }}>
            💡 Gợi ý cải thiện
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.suggestions.map((s, i) => (
              <div key={i} style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.5 }}>
                → {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Feedback Summary (for Writing/Speaking) */}
      {result?.details?.length > 0 && (
        <div className="clay-card" style={{
          padding: 20, marginBottom: 24,
          background: 'linear-gradient(135deg, #8b5cf611, #8b5cf605)',
          border: '2px solid #8b5cf633',
        }}>
          <h3 style={{ fontWeight: 800, color: '#8b5cf6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            🤖 Đánh giá chi tiết từ AI
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.details.map((d, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 10, background: '#fff',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.88rem', marginBottom: 4 }}>
                  Câu {i + 1}: {d.question?.length > 60 ? d.question?.substring(0, 60) + '...' : d.question}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#718096', fontSize: '0.82rem' }}>{d.feedback}</span>
                  <span style={{
                    fontWeight: 900, fontSize: '0.88rem',
                    color: (d.score || 0) >= 7 ? '#22C55E' : (d.score || 0) >= 5 ? '#f59e0b' : '#ef4444',
                  }}>
                    {d.score}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Results */}
      {result?.questionResults?.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 16 }}>
            📝 Chi tiết kết quả
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {result.questionResults.map((qr, idx) => (
              <QuestionResultCard key={idx} qr={qr} idx={idx} skill={skill} />
            ))}
          </div>
        </div>
      )}

      {/* Overall Feedback */}
      {result?.overallFeedback && (
        <div className="clay-card" style={{
          marginTop: 24, padding: 20, textAlign: 'center',
          background: 'linear-gradient(135deg, #22C55E08, #22C55E03)',
          border: '2px solid #22C55E22',
        }}>
          <p style={{ color: '#166534', fontWeight: 600, fontSize: '0.9rem' }}>
            {result.overallFeedback}
          </p>
        </div>
      )}
    </div>
  );
}
