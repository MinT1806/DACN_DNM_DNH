import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testAPI } from '../api/api';
import { toast } from 'react-toastify';
import {
  Clock, AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  Send, BookOpen, Brain, Target, Award, Eye
} from 'lucide-react';

const SKILL_COLORS = {
  GRAMMAR: '#22C55E', VOCAB_QUIZ: '#3b82f6',
  WRITING: '#a855f7', SPEAKING: '#f59e0b',
  READING: '#8b5cf6', LISTENING: '#06b6d4',
  MIXED: '#6366f1', DAILY_CHALLENGE: '#ef4444',
  WEEKLY_TEST: '#8b5cf6', MIDTERM: '#f59e0b',
  FINAL: '#ef4444', PLACEMENT: '#22C55E',
};

const LEVEL_COLORS = { A1: '#22C55E', A2: '#3b82f6', B1: '#f59e0b', B2: '#8b5cf6', C1: '#ef4444', C2: '#6366f1' };

export default function TestPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTest, setLoadingTest] = useState(false);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);
  const hasAutoStarted = useRef(false);
  const selectedRef = useRef(null);
  const sessionRef = useRef(null);
  const answersRef = useRef({});
  const submittingRef = useRef(false);

  useEffect(() => {
    loadTests();
  }, [filterLevel, filterType]);

  useEffect(() => {
    if (testId && !hasAutoStarted.current && !loading && tests.length > 0) {
      const found = tests.find(t => String(t.id) === String(testId));
      if (found) {
        hasAutoStarted.current = true;
        handleStartTest(found);
      }
    }
    if (!testId) {
      hasAutoStarted.current = false;
    }
  }, [testId, tests, loading]);

  // Timer: re-runs only when test starts/stops, refs ensure stable values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!session?.timed) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [session?.timed]);

  const loadTests = () => {
    setLoading(true);
    testAPI.getAll({ type: filterType || null, level: filterLevel || null })
      .then(r => setTests(r.data || []))
      .catch(() => toast.error('Không thể tải danh sách bài kiểm tra'))
      .finally(() => setLoading(false));
  };

  const handleStartTest = async (test) => {
    setLoadingTest(true);
    try {
      const r = await testAPI.start(test.id);
      const sessionData = r.data;
      setSelected(test);
      setSession(sessionData);
      setQuestions(sessionData.questions || []);
      setAnswers({});
      setSelectedOption({});
      selectedRef.current = test;
      sessionRef.current = sessionData;
      answersRef.current = {};
      if (sessionData.timed) {
        setTimeLeft((sessionData.duration || 30) * 60);
      }
    } catch {
      toast.error('Không thể bắt đầu bài kiểm tra');
    } finally {
      setLoadingTest(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    toast.warning('Hết giờ! Đang nộp bài...');
    clearInterval(timerRef.current);
    try {
      const r = await testAPI.submit(selectedRef.current.id, sessionRef.current.sessionId, answersRef.current);
      try { sessionStorage.setItem('exam_result_' + r.data.resultId, JSON.stringify(r.data)); } catch (e) { /* ignore */ }
      navigate('/exam-result/' + r.data.resultId, { state: { result: r.data } });
    } catch {
      toast.error('Lỗi nộp bài. Vui lòng thử lại.');
      submittingRef.current = false;
    }
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((_, i) => !answersRef.current['q_' + i]).length;
    if (unanswered > 0) {
      const ok = window.confirm('Bạn còn ' + unanswered + ' câu chưa trả lời. Nộp bài ngay?');
      if (!ok) return;
    }
    setShowConfirm(false);
    setSubmitting(true);
    submittingRef.current = true;
    clearInterval(timerRef.current);
    try {
      const r = await testAPI.submit(selectedRef.current.id, sessionRef.current.sessionId, answersRef.current);
      try { sessionStorage.setItem('exam_result_' + r.data.resultId, JSON.stringify(r.data)); } catch (e) { /* ignore */ }
      navigate('/exam-result/' + r.data.resultId, { state: { result: r.data } });
    } catch {
      toast.error('Lỗi nộp bài. Vui lòng thử lại.');
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    const newSelected = { ...selectedOption, [qIdx]: optIdx };
    const newAnswers = { ...answersRef.current, ['q_' + qIdx]: String(optIdx) };
    setSelectedOption(newSelected);
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  const answeredCount = Object.values(answersRef.current).filter(v => v !== '').length;

  const timerColor = session && session.timed && timeLeft < 300 ? '#ef4444' : session && session.timed && timeLeft < 600 ? '#f59e0b' : '#22C55E';
  const timerBg = session && session.timed && timeLeft < 300 ? 'rgba(239,68,68,0.1)' : session && session.timed && timeLeft < 600 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)';

  // Test detail view
  if (selected && session) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div className="clay-card" style={{
          padding: '16px 24px', marginBottom: 20, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          border: session.timed ? '2px solid ' + timerColor : '2px solid transparent',
        }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1a202c', margin: 0 }}>{selected.title}</h2>
            <p style={{ color: '#718096', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
              {answeredCount}/{questions.length} câu đã trả lời
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {session.timed && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 12,
                background: timerBg, color: timerColor,
                fontWeight: 900, fontSize: '1.3rem', fontFamily: 'monospace',
              }}>
                <Clock size={20} /> {formatTime(timeLeft)}
              </div>
            )}
            <button className="clay-btn clay-btn-primary" onClick={() => setShowConfirm(true)} style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
              <Send size={16} style={{ marginRight: 6 }} /> Nộp bài
            </button>
          </div>
        </div>

        {/* Questions */}
        <div className="clay-card" style={{ padding: 24 }}>
          {questions.map((q, idx) => {
            const answered = answersRef.current['q_' + idx];
            const isAnswered = answered !== undefined && answered !== '';
            return (
              <div key={idx} style={{
                marginBottom: 28, padding: '20px 24px', borderRadius: 16,
                background: isAnswered ? 'rgba(34,197,94,0.04)' : 'rgba(0,0,0,0.02)',
                border: '2px solid ' + (isAnswered ? 'rgba(34,197,94,0.15)' : 'rgba(0,0,0,0.05)'),
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                  <span style={{
                    minWidth: 28, height: 28, borderRadius: 8,
                    background: isAnswered ? '#22C55E' : 'rgba(0,0,0,0.08)',
                    color: 'white', fontWeight: 900, fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{idx + 1}</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a202c', lineHeight: 1.6 }}>{q.question}</div>
                </div>
                {q.options && q.options.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginLeft: 38 }}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOption[idx] === optIdx;
                      const skillColor = SKILL_COLORS[selected.type] || '#3b82f6';
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionSelect(idx, optIdx)}
                          style={{
                            padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                            fontWeight: 600, fontSize: '0.85rem',
                            background: isSelected ? 'linear-gradient(135deg, ' + skillColor + ', ' + skillColor + '99)' : 'rgba(255,255,255,0.8)',
                            color: isSelected ? 'white' : '#4a5568',
                            border: '2px solid ' + (isSelected ? skillColor : 'rgba(0,0,0,0.08)'),
                            cursor: 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          <span style={{ fontWeight: 900, marginRight: 6 }}>{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom nav bar */}
        <div className="clay-card" style={{
          padding: '16px 24px', marginTop: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => window.scrollTo({ top: idx * 300 + 100, behavior: 'smooth' })}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: answersRef.current['q_' + idx] ? '#22C55E' : 'rgba(0,0,0,0.06)',
                  color: answersRef.current['q_' + idx] ? 'white' : '#718096',
                  border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem',
                  transition: 'all 0.2s',
                }}
              >{idx + 1}</button>
            ))}
          </div>
          <button className="clay-btn clay-btn-primary" onClick={() => setShowConfirm(true)}>
            <Send size={14} style={{ marginRight: 6 }} /> Nộp bài ({answeredCount}/{questions.length})
          </button>
        </div>

        {/* Confirm modal */}
        {showConfirm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <div className="clay-card" style={{ padding: 32, maxWidth: 420, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <AlertCircle size={28} color="#f59e0b" />
                <h3 style={{ fontWeight: 900, color: '#1a202c', margin: 0 }}>Xác nhận nộp bài</h3>
              </div>
              <p style={{ color: '#4a5568', fontWeight: 600, marginBottom: 8, lineHeight: 1.7 }}>
                Bạn đã trả lời <strong>{answeredCount}/{questions.length}</strong> câu.
                {questions.length - answeredCount > 0 && (
                  <span style={{ color: '#ef4444' }}> Còn <strong>{questions.length - answeredCount}</strong> câu chưa trả lời.</span>
                )}
              </p>
              <p style={{ color: '#718096', fontWeight: 600, fontSize: '0.85rem', marginBottom: 24 }}>
                Bạn không thể thay đổi câu trả lời sau khi nộp bài.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="clay-btn" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>
                  Tiếp tục làm bài
                </button>
                <button className="clay-btn clay-btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>
                  Nộp bài
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Test list view
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#1a202c', marginBottom: 8 }}>
          <BookOpen size={28} style={{ marginRight: 10, verticalAlign: 'middle', color: '#8b5cf6' }} />
          Bài Kiểm Tra
        </h1>
        <p style={{ color: '#718096', fontWeight: 600 }}>
          Làm bài kiểm tra với giới hạn thời gian, theo dõi tiến độ và xếp hạng
        </p>
      </div>

      {/* Filters */}
      <div className="clay-card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <select className="clay-input" style={{ minWidth: 130 }} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
          <option value="">Tất cả Level</option>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="clay-input" style={{ minWidth: 160 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tất cả loại</option>
          <option value="VOCAB_QUIZ">Từ vựng</option>
          <option value="GRAMMAR">Ngữ pháp</option>
          <option value="READING">Đọc hiểu</option>
          <option value="LISTENING">Nghe</option>
          <option value="WRITING">Viết</option>
          <option value="SPEAKING">Nói</option>
          <option value="WEEKLY_TEST">Kiểm tra tuần</option>
          <option value="MIDTERM">Giữa kỳ</option>
          <option value="FINAL">Cuối kỳ</option>
          <option value="PLACEMENT">Xếp lớp</option>
        </select>
        <button className="clay-btn" onClick={() => { setFilterLevel(''); setFilterType(''); }}>
          Reset
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096', fontWeight: 700 }}>
          Đang tải bài kiểm tra...
        </div>
      ) : tests.length === 0 ? (
        <div className="clay-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📝</div>
          <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Không tìm thấy bài kiểm tra</div>
          <p style={{ color: '#718096', fontWeight: 600 }}>Thử thay đổi bộ lọc hoặc quay lại sau</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {tests.map(test => (
            <div key={test.id} className="clay-card" style={{ padding: 24, border: '2px solid transparent', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 8,
                  background: (SKILL_COLORS[test.type] || '#8b5cf6') + '22',
                  color: SKILL_COLORS[test.type] || '#8b5cf6',
                  fontWeight: 800, fontSize: '0.75rem',
                }}>
                  {(test.type || '').replace(/_/g, ' ')}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: 8,
                  background: (LEVEL_COLORS[test.level] || '#718096') + '22',
                  color: LEVEL_COLORS[test.level] || '#718096',
                  fontWeight: 800, fontSize: '0.75rem',
                }}>{test.level}</span>
                {test.timed && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                    fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Clock size={12} /> {test.duration} phút
                  </span>
                )}
                {test.completed && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 8,
                    background: 'rgba(34,197,94,0.15)', color: '#16a34a',
                    fontWeight: 800, fontSize: '0.75rem',
                  }}>
                    Hoàn thành: {test.userScore}/10
                  </span>
                )}
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a202c', marginBottom: 8 }}>{test.title}</h3>
              <p style={{ color: '#718096', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>
                {test.description}
              </p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                  <Clock size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {test.duration} phút
                </span>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                  <Target size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {test.totalQuestions} câu
                </span>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                  <Award size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Đạt: {test.passingScore}/{test.maxScore}
                </span>
              </div>
              <button
                className="clay-btn clay-btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleStartTest(test)}
                disabled={loadingTest}
              >
                {loadingTest ? 'Đang tải...' : test.completed ? 'Làm lại' : 'Bắt đầu'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
