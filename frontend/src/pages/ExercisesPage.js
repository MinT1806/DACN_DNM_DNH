import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, BookOpen, Play, Clock, Target, Book,
  FileText, Mic, PenTool, Grid3X3, ChevronDown, Filter } from 'lucide-react';

import MultipleChoiceComponent from '../components/exercises/MultipleChoiceComponent';
import FillBlankComponent from '../components/exercises/FillBlankComponent';
import EssayComponent from '../components/exercises/EssayComponent';
import WritingComponent from '../components/exercises/WritingComponent';
import SpeakingComponent from '../components/exercises/SpeakingComponent';
import DragDropComponent from '../components/exercises/DragDropComponent';

const QUESTION_TYPE_LABELS = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  FILL_BLANK: 'Điền từ',
  MATCHING: 'Nối từ',
  ESSAY: 'Tự luận',
  TRANSLATION: 'Dịch câu',
  PRONUNCIATION: 'Phát âm',
  DRAG_DROP: 'Kéo thả',
  WRITING: 'Viết bài',
  SPEAKING: 'Nói',
};

const EXERCISE_TYPE_LABELS = {
  VOCAB_QUIZ: 'Từ vựng',
  GRAMMAR: 'Ngữ pháp',
  LISTENING: 'Nghe',
  READING: 'Đọc',
  WRITING: 'Viết',
  SPEAKING: 'Nói',
  MIXED: 'Hỗn hợp',
  DAILY_CHALLENGE: 'Thử thách hàng ngày',
  DRAG_DROP: 'Kéo thả',
};

const TYPE_ICONS = {
  VOCAB_QUIZ: <Target size={16} />,
  GRAMMAR: <BookOpen size={16} />,
  LISTENING: <BookOpen size={16} />,
  READING: <BookOpen size={16} />,
  WRITING: <PenTool size={16} />,
  SPEAKING: <Mic size={16} />,
  MIXED: <Grid3X3 size={16} />,
  DAILY_CHALLENGE: <Target size={16} />,
  DRAG_DROP: <Grid3X3 size={16} />,
};

const LEVEL_COLORS = { A1: '#22C55E', A2: '#3B82F6', B1: '#8B5CF6', B2: '#F59E0B', C1: '#EF4444', C2: '#6366f1' };

// ─── Exercise Listing View ─────────────────────────────────────────────────────
function ExerciseListing({ onStartExercise }) {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchExercises();
    fetchHistory();
  }, [filterType, filterLevel]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterLevel) params.append('level', filterLevel);
      if (filterSkill) params.append('skill', filterSkill);

      const res = await fetch(`/api/exercises/v2?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExercises(Array.isArray(data.data) ? data.data : []);
      }
    } catch {}
    setLoading(false);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/exercises/v2/results', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data.data) ? data.data : []);
      }
    } catch {}
  };

  const getBestScore = (exerciseId) => {
    const results = history.filter(r => r.exerciseId === exerciseId);
    if (results.length === 0) return null;
    return Math.max(...results.map(r => r.score || 0));
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: '#1a202c', marginBottom: 4 }}>
          📝 Bài tập
        </h1>
        <p style={{ color: '#718096', fontSize: '0.88rem', fontWeight: 500 }}>
          Chọn loại bài tập để luyện tập
        </p>
      </div>

      {/* Filters */}
      <div className="clay-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Filter size={16} color="#718096" />
          <span style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.88rem' }}>Bộ lọc</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select
            className="clay-input"
            style={{ minWidth: 140 }}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">Tất cả loại</option>
            {Object.entries(EXERCISE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            className="clay-input"
            style={{ minWidth: 120 }}
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
          >
            <option value="">Tất cả cấp độ</option>
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <button
            className="clay-btn"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            onClick={() => { setFilterType(''); setFilterLevel(''); }}
          >
            Xóa lọc
          </button>
        </div>
      </div>

      {/* Exercise Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#718096', fontWeight: 600 }}>
          Đang tải bài tập...
        </div>
      ) : exercises.length === 0 ? (
        <div className="clay-card" style={{ padding: 60, textAlign: 'center' }}>
          <BookOpen size={48} color="#a0aec0" style={{ marginBottom: 12 }} />
          <p style={{ color: '#718096', fontWeight: 600, fontSize: '0.95rem' }}>
            Chưa có bài tập nào
          </p>
          <p style={{ color: '#a0aec0', fontSize: '0.82rem', marginTop: 8 }}>
            {filterType || filterLevel
              ? 'Thử thay đổi bộ lọc'
              : 'Liên hệ giáo viên để tạo bài tập'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {exercises.map(ex => {
            const bestScore = getBestScore(ex.id);
            return (
              <div key={ex.id} className="clay-card" style={{ padding: 20, cursor: 'pointer' }}
                onClick={() => onStartExercise(ex.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: '#8b5cf622',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#8b5cf6', flexShrink: 0,
                    }}>
                      {TYPE_ICONS[ex.type] || <FileText size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.95rem', lineHeight: 1.3 }}>
                        {ex.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#a0aec0', fontWeight: 600 }}>
                        {EXERCISE_TYPE_LABELS[ex.type] || ex.type}
                      </div>
                    </div>
                  </div>
                  {ex.level && (
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                      background: (LEVEL_COLORS[ex.level] || '#718096') + '22',
                      color: LEVEL_COLORS[ex.level] || '#718096',
                    }}>
                      {ex.level}
                    </span>
                  )}
                </div>

                {ex.description && (
                  <p style={{ fontSize: '0.82rem', color: '#718096', marginBottom: 12, lineHeight: 1.5 }}>
                    {ex.description.length > 80 ? ex.description.substring(0, 80) + '...' : ex.description}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {ex.duration && (
                      <span style={{ fontSize: '0.78rem', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {ex.duration} phút
                      </span>
                    )}
                    {ex.questionCount && (
                      <span style={{ fontSize: '0.78rem', color: '#a0aec0' }}>
                        {ex.questionCount} câu
                      </span>
                    )}
                  </div>
                  {bestScore != null ? (
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 800,
                      color: bestScore >= 8 ? '#22C55E' : bestScore >= 5 ? '#f59e0b' : '#ef4444',
                    }}>
                      Cao nhất: {bestScore}/10
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#a0aec0' }}>Chưa làm</span>
                  )}
                </div>

                <button className="clay-btn clay-btn-primary" style={{ width: '100%', marginTop: 14, padding: '8px 0' }}>
                  <Play size={14} /> {bestScore != null ? 'Làm lại' : 'Bắt đầu'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick access to exercise creation */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <p style={{ fontSize: '0.82rem', color: '#a0aec0', marginBottom: 8 }}>
          Là giáo viên hoặc quản trị viên?
        </p>
        <button
          className="clay-btn"
          style={{ fontSize: '0.82rem', padding: '8px 20px' }}
          onClick={() => navigate('/teacher')}
        >
          <FileText size={14} /> Tạo bài tập mới
        </button>
      </div>
    </div>
  );
}

// ─── Question Type Badges Helper ──────────────────────────────────────────────
function getQuestionTypes(questions) {
  const types = [...new Set((questions || []).map(q => q.type).filter(Boolean))];
  return types.map(t => QUESTION_TYPE_LABELS[t] || t);
}

// ─── Exercise Taking View (existing logic) ────────────────────────────────────
function ExerciseTakingView({ exerciseId, navigateBack }) {
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [aiGrading, setAiGrading] = useState(null);
  const timerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    fetchExercise();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [exerciseId]);

  useEffect(() => {
    if (exercise?.duration && !submitted) setTimeLeft(exercise.duration * 60);
  }, [exercise]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted]);

  useEffect(() => {
    if (!exercise?.questions) return;
    const count = Object.values(answers).filter(v => v !== '' && v != null && v !== '{}').length;
    setAnsweredCount(count);
  }, [answers, exercise]);

  const fetchExercise = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exercises/v2/${exerciseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const ex = data.data || data;
        setExercise(ex);
        const init = {};
        (ex.questions || []).forEach(q => { init['q_' + q.id] = ''; });
        setAnswers(init);
      }
    } catch {}
    setLoading(false);
  };

  const handleAnswerChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, ['q_' + qId]: value }));
  };

  const handleAIGrade = async (questionId, answerText) => {
    try {
      const res = await fetch(`/api/exercises/v2/${exerciseId}/grade-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ questionId, answer: answerText })
      });
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch {}
    return null;
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exercises/v2/${exerciseId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(answers),
      });
      if (res.ok) {
        const data = await res.json();
        const r = data.data || data;
        setResult(r);
        setAiGrading(r.aiGrading);
        setSubmitted(true);
      }
    } catch {}
    setSubmitting(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#718096', fontWeight: 600 }}>
        Đang tải bài tập...
      </div>
    );
  }

  if (!exercise) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, textAlign: 'center' }}>
        <div className="clay-card" style={{ padding: 40 }}>
          <p style={{ color: '#ef4444', fontWeight: 600 }}>Không tìm thấy bài tập</p>
          <button className="clay-btn clay-btn-primary" style={{ marginTop: 16 }}
            onClick={navigateBack}>← Quay lại danh sách</button>
        </div>
      </div>
    );
  }

  const questions = exercise.questions || [];

  // ─── Result View ────────────────────────────────────────────────────────────
  if (submitted && result) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        <div className="clay-card" style={{ padding: 32, marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12,
            color: (result.score || 0) >= 8 ? '#22C55E' : (result.score || 0) >= 5 ? '#f59e0b' : '#ef4444' }}>
            {(result.score || 0) >= 8 ? '🎉' : (result.score || 0) >= 5 ? '👍' : '💪'}
          </div>
          <h2 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1a202c', marginBottom: 8 }}>
            Điểm số: {result.score}/10
          </h2>
          <p style={{ color: '#718096', fontWeight: 600 }}>
            {result.correctAnswers}/{result.totalQuestions} câu đúng • +{result.xpEarned} XP
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            <button className="clay-btn clay-btn-primary" onClick={navigateBack}>
              ← Danh sách bài tập
            </button>
          </div>
        </div>

        {/* AI Summary */}
        {aiGrading && (
          <div className="clay-card" style={{ padding: 24, marginBottom: 24, border: '2px solid #8b5cf633',
            background: 'linear-gradient(135deg, #8b5cf611, #8b5cf605)' }}>
            <h3 style={{ fontWeight: 800, color: '#8b5cf6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              🤖 Đánh giá từ AI
            </h3>
            {aiGrading.summary && (
              <p style={{ color: '#4a5568', fontWeight: 600, marginBottom: 10 }}>{aiGrading.summary}</p>
            )}
            {aiGrading.details && aiGrading.details.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aiGrading.details.map((d, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.88rem', marginBottom: 4 }}>
                      Câu {i + 1}: {d.question?.substring(0, 60)}{d.question?.length > 60 ? '...' : ''}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#718096', fontSize: '0.82rem' }}>{d.feedback}</span>
                      <span style={{ fontWeight: 900, fontSize: '0.88rem',
                        color: (d.score || 0) >= 7 ? '#22C55E' : (d.score || 0) >= 5 ? '#f59e0b' : '#ef4444' }}>
                        {d.score}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Question Results */}
        <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 16 }}>📝 Chi tiết kết quả</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(result.questionResults || []).map((qr, idx) => (
            <div key={idx} className="clay-card" style={{ padding: 20,
              borderLeft: `4px solid ${qr.correct === true ? '#22C55E' : qr.correct === false ? '#ef4444' : '#8b5cf6'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {qr.correct === true ? <CheckCircle size={20} color="#22C55E" style={{ flexShrink: 0, marginTop: 2 }} />
                  : qr.correct === false ? <XCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                    : <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🤖</span>}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.92rem' }}>
                      Câu {idx + 1}: {qr.question}
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6,
                      background: '#8b5cf622', color: '#8b5cf6', fontWeight: 700 }}>
                      {QUESTION_TYPE_LABELS[qr.type] || qr.type}
                    </span>
                  </div>

                  {qr.type === 'MULTIPLE_CHOICE' && (
                    <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                      <span style={{ fontWeight: 600 }}>Đáp án của bạn: </span>
                      <span style={{ color: qr.correct ? '#22C55E' : '#ef4444', fontWeight: 600 }}>
                        {qr.userAnswer || '(trống)'}
                      </span>
                    </div>
                  )}
                  {qr.type === 'FILL_BLANK' && (
                    <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                      <span style={{ fontWeight: 600 }}>Đáp án của bạn: </span>
                      <span style={{ color: qr.correct ? '#22C55E' : '#ef4444', fontWeight: 600 }}>
                        {qr.userAnswer || '(trống)'}
                      </span>
                    </div>
                  )}
                  {(qr.type === 'ESSAY' || qr.type === 'TRANSLATION' || qr.type === 'SPEAKING' || qr.type === 'PRONUNCIATION') && (
                    <>
                      {qr.userAnswer && (
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', marginBottom: 8, fontSize: '0.85rem', color: '#4a5568', fontStyle: 'italic' }}>
                          "{qr.userAnswer}"
                        </div>
                      )}
                      {qr.aiScore != null && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20,
                          background: qr.aiScore >= 7 ? '#22C55E11' : qr.aiScore >= 5 ? '#f59e0b11' : '#ef444411' }}>
                          <span style={{ fontWeight: 900, fontSize: '0.85rem',
                            color: qr.aiScore >= 7 ? '#22C55E' : qr.aiScore >= 5 ? '#f59e0b' : '#ef4444' }}>
                            {qr.aiScore}/10
                          </span>
                          <span style={{ color: '#718096', fontSize: '0.78rem' }}>AI chấm</span>
                        </div>
                      )}
                      {qr.aiFeedback && (
                        <div style={{ fontSize: '0.82rem', color: '#4a5568', marginTop: 4 }}>💬 {qr.aiFeedback}</div>
                      )}
                    </>
                  )}
                  {(qr.type === 'MATCHING' || qr.type === 'DRAG_DROP') && (
                    <div style={{ fontSize: '0.82rem', color: '#718096' }}>
                      Đúng: {qr.correctPlacements || 0}/{qr.totalPlacements || 0} vị trí
                      {' '}({Math.round((qr.correctRatio || 0) * 100)}%)
                    </div>
                  )}
                  {qr.correct === false && qr.correctAnswer && (
                    <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: 4 }}>
                      <span style={{ fontWeight: 600 }}>Đáp án đúng: </span>
                      <span style={{ color: '#22C55E', fontWeight: 600 }}>{qr.correctAnswer}</span>
                    </div>
                  )}
                  {qr.explanation && (
                    <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#8b5cf611', fontSize: '0.82rem', color: '#6b21a8' }}>
                      💡 {qr.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Exercise View ───────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <button onClick={navigateBack} className="clay-btn" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
          ← Quay lại
        </button>
      </div>

      <div className="clay-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1a202c' }}>{exercise.title}</h1>
            <p style={{ color: '#718096', fontSize: '0.82rem', fontWeight: 500 }}>
              {EXERCISE_TYPE_LABELS[exercise.type] || exercise.type} • {exercise.level} • {exercise.duration || 15} phút
              {exercise.questionCount && ` • ${exercise.questionCount} câu`}
            </p>
          </div>
          {timeLeft != null && (
            <div style={{ padding: '8px 16px', borderRadius: 10,
              background: timeLeft < 60 ? '#ef444422' : '#f59e0b22',
              color: timeLeft < 60 ? '#ef4444' : '#f59e0b',
              fontWeight: 900, fontSize: '1.1rem' }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.06)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
            <div style={{ width: `${(answeredCount / questions.length) * 100}%`,
              height: '100%', background: '#22C55E', borderRadius: 6, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
            {answeredCount}/{questions.length} đã trả lời
          </span>
        </div>
      </div>

      {exercise.instructions && (
        <div className="clay-card" style={{ padding: 16, marginBottom: 20, background: '#fef3c7', border: '1px solid #fcd34d' }}>
          <p style={{ color: '#92400e', fontSize: '0.88rem', fontWeight: 500 }}>{exercise.instructions}</p>
        </div>
      )}

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {questions.map((q, idx) => (
          <div key={q.id} className="clay-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ background: '#22C55E22', color: '#22C55E', padding: '3px 12px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 800 }}>
                Câu {idx + 1}
              </span>
              <span style={{ background: '#8b5cf622', color: '#8b5cf6', padding: '3px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>
                {QUESTION_TYPE_LABELS[q.type] || q.type}
              </span>
              {q.points > 1 && (
                <span style={{ background: '#f59e0b22', color: '#f59e0b', padding: '3px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700 }}>
                  {q.points} điểm
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.95rem', color: '#1a202c', fontWeight: 600, marginBottom: 16, lineHeight: 1.7 }}>
              {q.question}
            </div>

            {q.content && (
              <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 16, fontSize: '0.88rem', color: '#4a5568' }}>
                {q.content}
              </div>
            )}

            {q.type === 'MULTIPLE_CHOICE' && (
              <MultipleChoiceComponent question={q} value={answers['q_' + q.id]}
                onChange={(val) => handleAnswerChange(q.id, val)} showResult={false} />
            )}
            {q.type === 'FILL_BLANK' && (
              <FillBlankComponent question={q} value={answers['q_' + q.id]}
                onChange={(val) => handleAnswerChange(q.id, val)} showResult={false} />
            )}
            {(q.type === 'ESSAY' || q.type === 'TRANSLATION') && (
              <EssayComponent question={q} value={answers['q_' + q.id]}
                onChange={(val) => handleAnswerChange(q.id, val)} showResult={false}
                onAIGrade={handleAIGrade} />
            )}
            {q.type === 'WRITING' && (
              <WritingComponent question={q} value={answers['q_' + q.id]}
                onChange={(val) => handleAnswerChange(q.id, val)} showResult={false}
                onAIGrade={handleAIGrade} />
            )}
            {(q.type === 'SPEAKING' || q.type === 'PRONUNCIATION') && (
              <SpeakingComponent question={q} value={answers['q_' + q.id]}
                onChange={(val) => handleAnswerChange(q.id, val)} showResult={false}
                onAIGrade={handleAIGrade} />
            )}
            {(q.type === 'MATCHING' || q.type === 'DRAG_DROP') && (
              <DragDropComponent question={q} value={answers['q_' + q.id]}
                onChange={(val) => handleAnswerChange(q.id, val)} showResult={false} />
            )}
          </div>
        ))}
      </div>

      {/* Submit */}
      <div style={{ textAlign: 'center', marginTop: 28, marginBottom: 40 }}>
        <button className="clay-btn clay-btn-primary" onClick={handleSubmit}
          disabled={submitting} style={{ padding: '14px 40px', fontSize: '1rem' }}>
          {submitting ? '⏳ Đang nộp bài...' : '✓ Nộp bài'}
        </button>
      </div>
    </div>
  );
}

// ─── Main ExercisesPage ───────────────────────────────────────────────────────
export default function ExercisesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exerciseId = searchParams.get('exerciseId');

  const handleStartExercise = (id) => {
    navigate(`/exercises?exerciseId=${id}`);
  };

  const navigateBack = () => {
    navigate('/exercises');
  };

  if (exerciseId) {
    return <ExerciseTakingView exerciseId={exerciseId} navigateBack={navigateBack} />;
  }

  return <ExerciseListing onStartExercise={handleStartExercise} />;
}
