import { useState, useRef, useEffect } from 'react';
import MultipleChoice from './MultipleChoice';
import Essay from './Essay';
import Writing from './Writing';
import Speaking from './Speaking';
import Listening from './Listening';
import Reading from './Reading';
import DragDrop from './DragDrop';

const S = {
  container: { padding: '24px', maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', margin: 0, display: 'flex', alignItems: 'center', gap: 8 },
  exerciseInfo: { fontSize: '0.85rem', color: '#64748b' },
  progress: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b' },
  progressBar: { width: 120, height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' },
  timer: { padding: '6px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600, color: '#334155' },
  timerWarning: { background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' },
  questionCard: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 },
  questionNum: { fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', marginBottom: 8 },
  questionText: { fontSize: '1.1rem', fontWeight: 600, color: '#1a202c', lineHeight: 1.5, marginBottom: 16 },
  passage: { background: '#f8fafc', borderRadius: 10, padding: 16, fontSize: '0.95rem', color: '#475569', lineHeight: 1.7, marginBottom: 16, border: '1px solid #e2e8f0' },
  passageTitle: { fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: 8 },
  fillBlankInput: { width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  navBtns: { display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: { padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  btnSecondary: { padding: '10px 24px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' },
  btnSubmit: { padding: '12px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px #10b98140' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  resultCard: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginTop: 16 },
  resultHeader: { textAlign: 'center', marginBottom: 20 },
  scoreCircle: { width: 100, height: 100, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'white', fontSize: '2rem', fontWeight: 900 },
  resultLabel: { fontSize: '0.85rem', color: '#64748b' },
  resultDetail: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 },
  detailItem: { textAlign: 'center', padding: '12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' },
  detailValue: { fontSize: '1.2rem', fontWeight: 700, color: '#1a202c' },
  detailLabel: { fontSize: '0.75rem', color: '#64748b', marginTop: 2 },
  aiBox: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 16, marginTop: 12 },
  aiBoxTitle: { fontWeight: 700, color: '#1e40af', marginBottom: 8, fontSize: '0.9rem' },
  aiScore: { fontSize: '1.1rem', fontWeight: 700, color: '#1e40af' },
  aiFeedback: { fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 },
  exerciseNav: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  exerciseNavBtn: { padding: '6px 14px', borderRadius: 8, border: '2px solid #e2e8f0', background: 'white', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' },
  exerciseNavBtnActive: { borderColor: '#3b82f6', background: '#eff6ff', color: '#1e40af' },
  exerciseNavBtnDone: { borderColor: '#10b981', background: '#f0fdf4', color: '#15803d' },
};

function getScoreBg(score) {
  if (score === null || score === undefined) return '#64748b';
  if (score >= 8) return 'linear-gradient(135deg, #10b981, #059669)';
  if (score >= 6) return 'linear-gradient(135deg, #f59e0b, #d97706)';
  return 'linear-gradient(135deg, #ef4444, #dc2626)';
}

function getTypeIcon(type) {
  switch (type) {
    case 'MULTIPLE_CHOICE': return '☑️';
    case 'FILL_BLANK': return '✏️';
    case 'ESSAY': return '✍️';
    case 'WRITING': return '📝';
    case 'SPEAKING': return '🎙️';
    case 'LISTENING': return '🎧';
    case 'READING': return '📖';
    case 'DRAG_DROP': return '🧩';
    default: return '📋';
  }
}

export default function ExerciseSection({ exercise, onNext, onComplete, results, grading, onGradeSingle }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [singleGradeQ, setSingleGradeQ] = useState(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (exercise) {
      setCurrentQ(0);
      setAnswers({});
      setShowResult(false);
      setResult(null);
      setSingleGradeQ(null);
      startTimeRef.current = Date.now();
    }
  }, [exercise?.id]);

  const questions = exercise?.questions || [];
  const q = questions[currentQ];
  const totalQuestions = questions.length;
  const progressPct = totalQuestions > 0 ? ((currentQ + 1) / totalQuestions) * 100 : 0;

  const handleAnswer = (val) => {
    const qId = q?.id;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleGradeSingle = async () => {
    if (!q || grading) return;
    setSingleGradeQ(q.id);
    await onGradeSingle(q.id, answers[q.id] || '');
  };

  const handleSubmit = () => {
    setShowResult(true);
    const questionResults = questions.map((question, i) => {
      const answer = answers[question.id];
      return { questionId: question.id, userAnswer: answer };
    });
    setResult({ questionResults });
  };

  const handleNext = () => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
      setShowResult(false);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setShowResult(false);
    }
  };

  if (!exercise || questions.length === 0) {
    return (
      <div style={S.container}>
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📝</div>
          <p>Không có bài tập nào cho phần này.</p>
        </div>
      </div>
    );
  }

  const qType = q?.type;
  const showGradeBtn = qType === 'ESSAY' || qType === 'WRITING' || qType === 'SPEAKING';
  const currentResult = results?.questionResults?.find(r => r.questionId === q?.id);
  const currentAnswer = answers[q?.id];

  const getQuestionComponent = () => {
    const showForAll = showResult || singleGradeQ === q?.id;
    const r = showForAll ? (results?.questionResults?.find(x => x.questionId === q?.id) || singleGradeQ === q?.id ? results?.questionResults?.[0] : null) : null;
    const mergedResult = r || (singleGradeQ === q?.id ? currentResult : null);

    switch (qType) {
      case 'MULTIPLE_CHOICE':
      case 'FILL_BLANK':
        return <MultipleChoice question={q} answer={currentAnswer} onAnswer={handleAnswer} showResult={showResult} result={mergedResult} grading={singleGradeQ === q?.id && grading} />;
      case 'ESSAY':
        return <Essay question={q} answer={currentAnswer} onAnswer={handleAnswer} result={mergedResult} grading={singleGradeQ === q?.id && grading} onGrade={handleGradeSingle} />;
      case 'WRITING':
        return <Writing question={q} answer={currentAnswer} onAnswer={handleAnswer} result={mergedResult} grading={singleGradeQ === q?.id && grading} onGrade={handleGradeSingle} />;
      case 'SPEAKING':
      case 'PRONUNCIATION':
        return <Speaking question={q} answer={currentAnswer} onAnswer={handleAnswer} result={mergedResult} grading={singleGradeQ === q?.id && grading} onGrade={handleGradeSingle} />;
      case 'LISTENING_CONTENT':
        return <Listening question={q} answer={currentAnswer} onAnswer={handleAnswer} showResult={showResult} result={mergedResult} />;
      case 'READING_PASSAGE':
        return <Reading question={q} answer={currentAnswer} onAnswer={handleAnswer} showResult={showResult} result={mergedResult} />;
      case 'DRAG_DROP':
      case 'MATCHING':
        return <DragDrop question={q} answer={currentAnswer} onAnswer={handleAnswer} showResult={showResult} result={mergedResult} />;
      default:
        return <MultipleChoice question={q} answer={currentAnswer} onAnswer={handleAnswer} showResult={showResult} result={mergedResult} />;
    }
  };

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h2 style={S.title}>
          <span>{getTypeIcon(exercise.type)}</span>
          {exercise.title}
        </h2>
        <div style={S.progress}>
          <span>Câu {currentQ + 1}/{totalQuestions}</span>
          <div style={S.progressBar}>
            <div style={{ ...S.progressFill, width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {totalQuestions > 1 && (
        <div style={S.exerciseNav}>
          {questions.map((question, i) => {
            const answered = !!answers[question.id];
            const isActive = i === currentQ;
            const isDone = showResult && answered;
            return (
              <button
                key={question.id}
                style={{
                  ...S.exerciseNavBtn,
                  ...(isActive ? S.exerciseNavBtnActive : {}),
                  ...(isDone ? S.exerciseNavBtnDone : {}),
                }}
                onClick={() => { setCurrentQ(i); setShowResult(false); }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      )}

      {!showGradeBtn && !showResult && (
        <div style={S.questionCard}>
          <div style={S.questionNum}>CÂU HỎI {currentQ + 1} / {totalQuestions}</div>
          <div style={S.questionText}>{q?.question}</div>
        </div>
      )}

      {qType === 'FILL_BLANK' && !showGradeBtn && (
        <div style={{ ...S.questionCard, padding: 20 }}>
          {q?.content && <div style={S.passage}><div style={S.passageTitle}>Bài đọc</div>{q.content}</div>}
          <div style={S.questionText}>{q?.question}</div>
          <input
            type="text"
            style={S.fillBlankInput}
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Nhập câu trả lời..."
            disabled={showResult}
          />
          {showResult && currentResult && (
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: currentResult.correct ? '#f0fdf4' : '#fef2f2', color: currentResult.correct ? '#15803d' : '#dc2626', fontWeight: 600 }}>
              {currentResult.correct ? '✅ Đúng!' : `❌ Sai. Đáp án: ${currentResult.correctAnswer}`}
            </div>
          )}
        </div>
      )}

      {getQuestionComponent()}

      {results && showResult && !results.aiGrading && (
        <div style={S.resultCard}>
          <div style={S.resultHeader}>
            <div style={{ ...S.scoreCircle, background: getScoreBg(results.score) }}>
              {results.score.toFixed(1)}
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>/10</span>
            </div>
            <div style={S.resultLabel}>Kết quả bài tập</div>
          </div>

          <div style={S.resultDetail}>
            <div style={S.detailItem}>
              <div style={S.detailValue}>{results.correctAnswers}/{results.totalQuestions}</div>
              <div style={S.detailLabel}>Đúng</div>
            </div>
            <div style={S.detailItem}>
              <div style={S.detailValue}>{results.xpEarned} XP</div>
              <div style={S.detailLabel}>Điểm thưởng</div>
            </div>
            <div style={S.detailItem}>
              <div style={S.detailValue}>{results.completed ? '✅' : '❌'}</div>
              <div style={S.detailLabel}>Hoàn thành</div>
            </div>
          </div>
        </div>
      )}

      {results?.aiGrading && (
        <div style={S.aiBox}>
          <div style={S.aiBoxTitle}>🤖 Kết quả chấm bằng AI</div>
          <div style={S.aiScore}>Điểm trung bình: {results.aiGrading.score}/10</div>
          <div style={S.aiFeedback}>{results.aiGrading.summary}</div>
        </div>
      )}

      <div style={S.navBtns}>
        {currentQ > 0 && <button style={S.btnSecondary} onClick={handlePrev}>← Câu trước</button>}
        {!showResult && currentQ === totalQuestions - 1 && (
          <button style={S.btnSubmit} onClick={handleSubmit} disabled={!answers[q?.id]}>
            Nộp bài
          </button>
        )}
        {showResult && currentQ < totalQuestions - 1 && (
          <button style={S.btnPrimary} onClick={handleNext}>Câu tiếp theo →</button>
        )}
        {showResult && currentQ === totalQuestions - 1 && onComplete && (
          <button style={S.btnPrimary} onClick={onComplete}>
            Hoàn thành & Tiếp tục →
          </button>
        )}
      </div>
    </div>
  );
}
