import { useState, useEffect, useRef } from 'react';
import MultipleChoice from './MultipleChoice';
import Essay from './Essay';
import Writing from './Writing';
import Speaking from './Speaking';
import Listening from './Listening';
import Reading from './Reading';
import DragDrop from './DragDrop';

const S = {
  container: { padding: '24px', maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  timerBox: { display: 'flex', alignItems: 'center', gap: 8 },
  timer: { padding: '8px 16px', borderRadius: 10, fontSize: '1.1rem', fontFamily: 'monospace', fontWeight: 700 },
  timerNormal: { background: '#f8fafc', border: '2px solid #e2e8f0', color: '#334155' },
  timerWarning: { background: '#fef2f2', border: '2px solid #ef4444', color: '#dc2626', animation: 'pulse 1s infinite' },
  timerCritical: { background: '#dc2626', border: '2px solid #dc2626', color: 'white', animation: 'pulse 0.5s infinite' },
  progress: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b' },
  progressBar: { width: 150, height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' },
  questionCard: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 },
  questionNum: { fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', marginBottom: 8 },
  questionText: { fontSize: '1.1rem', fontWeight: 600, color: '#1a202c', lineHeight: 1.5, marginBottom: 16 },
  passage: { background: '#f8fafc', borderRadius: 10, padding: 16, fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, marginBottom: 16, border: '1px solid #e2e8f0' },
  fillBlankInput: { width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' },
  navBtns: { display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: { padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  btnSecondary: { padding: '10px 24px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' },
  btnSubmit: { padding: '12px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px #10b98140' },
  btnWarning: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 12px #f59e0b40' },
  infoBox: { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', borderRadius: 16, padding: 24, color: 'white', textAlign: 'center', marginBottom: 20 },
  infoTitle: { fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 },
  infoText: { fontSize: '0.95rem', opacity: 0.9, marginBottom: 4 },
  infoStats: { display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' },
  infoStat: { textAlign: 'center' },
  infoStatVal: { fontSize: '1.2rem', fontWeight: 700 },
  infoStatLabel: { fontSize: '0.75rem', opacity: 0.8 },
  questionNav: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  qNavBtn: { width: 36, height: 36, borderRadius: 8, border: '2px solid #e2e8f0', background: 'white', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' },
  qNavBtnActive: { borderColor: '#3b82f6', background: '#eff6ff', color: '#1e40af' },
  qNavBtnAnswered: { borderColor: '#10b981', background: '#f0fdf4', color: '#15803d' },
};

function getTimerStyle(seconds) {
  if (seconds <= 60) return { ...S.timer, ...S.timerCritical };
  if (seconds <= 300) return { ...S.timer, ...S.timerWarning };
  return { ...S.timer, ...S.timerNormal };
}

function getTypeIcon(type) {
  const icons = {
    MULTIPLE_CHOICE: '☑️', FILL_BLANK: '✏️', ESSAY: '✍️',
    WRITING: '📝', SPEAKING: '🎙️', LISTENING_CONTENT: '🎧',
    READING_PASSAGE: '📖', DRAG_DROP: '🧩', MATCHING: '🔗',
  };
  return icons[type] || '📋';
}

export default function TestSection({ test, questions, session, timeLeft, onStart, onSubmit, onSetAnswer }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (session) {
      setCurrentQ(0);
      setAnswers({});
      startTimeRef.current = Date.now();
    }
  }, [session?.sessionId]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
    if (onSetAnswer) onSetAnswer(qId, val);
  };

  const handleSubmit = () => {
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    await onSubmit(answers);
    setSubmitting(false);
  };

  if (!session) {
    return (
      <div style={S.container}>
        <div style={S.infoBox}>
          <div style={S.infoTitle}>{test?.title || 'Bài kiểm tra'}</div>
          {test?.description && <div style={S.infoText}>{test.description}</div>}
          <div style={S.infoStats}>
            <div style={S.infoStat}>
              <div style={S.infoStatVal}>{questions.length}</div>
              <div style={S.infoStatLabel}>Câu hỏi</div>
            </div>
            <div style={S.infoStat}>
              <div style={S.infoStatVal}>{test?.durationMinutes || 30} phút</div>
              <div style={S.infoStatLabel}>Thời gian</div>
            </div>
            <div style={S.infoStat}>
              <div style={S.infoStatVal}>{test?.passingScore || 6}/10</div>
              <div style={S.infoStatLabel}>Đạt điểm</div>
            </div>
          </div>
          <button style={{ ...S.btnSubmit, marginTop: 20 }} onClick={onStart}>
            Bắt đầu làm bài
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const getQuestionComponent = () => {
    const qType = q?.type;
    const currentAnswer = answers[q.id];

    switch (qType) {
      case 'MULTIPLE_CHOICE':
      case 'FILL_BLANK':
        return <MultipleChoice question={q} answer={currentAnswer} onAnswer={(val) => handleAnswer(q.id, val)} showResult={false} />;
      case 'ESSAY':
        return <Essay question={q} answer={currentAnswer} onAnswer={(val) => handleAnswer(q.id, val)} />;
      case 'WRITING':
        return <Writing question={q} answer={currentAnswer} onAnswer={(val) => handleAnswer(q.id, val)} />;
      case 'SPEAKING':
      case 'PRONUNCIATION':
        return <Speaking question={q} answer={currentAnswer} onAnswer={(val) => handleAnswer(q.id, val)} />;
      case 'LISTENING_CONTENT':
        return <Listening question={q} answer={currentAnswer} onAnswer={(val) => handleAnswer(q.id, val)} />;
      case 'READING_PASSAGE':
        return <Reading question={q} answer={currentAnswer} onAnswer={(val) => handleAnswer(q.id, val)} />;
      case 'DRAG_DROP':
      case 'MATCHING':
        return <DragDrop question={q} answer={currentAnswer} onAnswer={(val) => handleAnswer(q.id, val)} />;
      default:
        return <MultipleChoice question={q} answer={currentAnswer} onAnswer={(val) => handleAnswer(q.id, val)} />;
    }
  };

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h2 style={S.title}>
          <span>{getTypeIcon(q?.type)}</span>
          {test?.title || 'Bài kiểm tra'}
        </h2>
        <div style={S.timerBox}>
          <span style={getTimerStyle(timeLeft)}>⏱ {formatTime(timeLeft)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, fontSize: '0.85rem', color: '#64748b' }}>
        <span>Tiến độ: {answeredCount}/{totalQuestions} đã trả lời</span>
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: `${progressPct}%` }} />
        </div>
      </div>

      <div style={S.questionNav}>
        {questions.map((question, i) => {
          const answered = !!answers[question.id];
          return (
            <button
              key={question.id}
              style={{
                ...S.qNavBtn,
                ...(i === currentQ ? S.qNavBtnActive : {}),
                ...(answered && i !== currentQ ? S.qNavBtnAnswered : {}),
              }}
              onClick={() => setCurrentQ(i)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div style={S.questionCard}>
        <div style={S.questionNum}>
          Câu {currentQ + 1} / {totalQuestions}
          {q?.points > 1 && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#64748b' }}>({q.points} điểm)</span>}
        </div>
        <div style={S.questionText}>{q?.question}</div>
        {q?.type === 'FILL_BLANK' && q?.content && (
          <div style={S.passage}>{q.content}</div>
        )}
      </div>

      {getQuestionComponent()}

      <div style={S.navBtns}>
        {currentQ > 0 && (
          <button style={S.btnSecondary} onClick={() => setCurrentQ(currentQ - 1)}>
            ← Câu trước
          </button>
        )}
        {currentQ < totalQuestions - 1 ? (
          <button style={S.btnPrimary} onClick={() => setCurrentQ(currentQ + 1)}>
            Câu tiếp theo →
          </button>
        ) : (
          <button
            style={{ ...S.btnSubmit, ...(answeredCount < totalQuestions ? S.btnWarning : {}) }}
            onClick={handleSubmit}
          >
            {submitting ? 'Đang nộp...' : (answeredCount < totalQuestions ? `Nộp (${answeredCount}/${totalQuestions})` : 'Nộp bài')}
          </button>
        )}
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 400, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📝</div>
            <h3 style={{ margin: '0 0 12px', color: '#1a202c' }}>Nộp bài kiểm tra?</h3>
            <p style={{ color: '#64748b', marginBottom: 8 }}>
              Bạn đã trả lời <strong>{answeredCount}/{totalQuestions}</strong> câu.
            </p>
            {answeredCount < totalQuestions && (
              <p style={{ color: '#f59e0b', marginBottom: 12, fontSize: '0.9rem' }}>
                Còn {totalQuestions - answeredCount} câu chưa trả lời.
              </p>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button style={S.btnSecondary} onClick={() => setShowConfirm(false)}>
                Quay lại
              </button>
              <button
                style={{ ...S.btnSubmit, ...(submitting ? { opacity: 0.5 } : {}) }}
                onClick={confirmSubmit}
                disabled={submitting}
              >
                {submitting ? 'Đang nộp...' : 'Xác nhận nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
