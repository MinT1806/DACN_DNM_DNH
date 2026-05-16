import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { testAPI, testManagementAPI } from '../api/api';
import { toast } from 'react-toastify';
import {
  Clock, AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  Send, BookOpen, Brain, Target, Award, Eye, Mic, FileText, List,
  ArrowLeft, Lock, Play, Pause
} from 'lucide-react';
import Timer from '../components/exercises/Timer';
import QuestionNavigator from '../components/exercises/QuestionNavigator';
import WritingEditor from '../components/exercises/WritingEditor';
import SpeakingRecorder from '../components/exercises/SpeakingRecorder';

const SKILL_COLORS = {
  GRAMMAR: '#22C55E', VOCABULARY: '#3b82f6',
  WRITING: '#a855f7', SPEAKING: '#f59e0b',
  READING: '#8b5cf6', LISTENING: '#06b6d4',
  MIXED: '#6366f1', DAILY_CHALLENGE: '#ef4444',
  INFO: '#718096',
};

const SECTION_ICONS = {
  INFO: <BookOpen size={16} />,
  VOCABULARY: <Brain size={16} />,
  GRAMMAR: <Target size={16} />,
  READING: <FileText size={16} />,
  LISTENING: <Play size={16} />,
  WRITING: <FileText size={16} />,
  SPEAKING: <Mic size={16} />,
  MIXED: <List size={16} />,
};

const LEVEL_COLORS = { A1: '#22C55E', A2: '#3b82f6', B1: '#f59e0b', B2: '#8b5cf6', C1: '#ef4444', C2: '#6366f1' };

export default function CompleteTestPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingTest, setLoadingTest] = useState(false);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [tests, setTests] = useState([]);
  const [answers, setAnswers] = useState({});
  const [audioAnswers, setAudioAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState({});
  const [writingContent, setWritingContent] = useState({});
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  const [sectionTimeLeft, setSectionTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNavigator, setShowNavigator] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [inProgressSessions, setInProgressSessions] = useState([]);

  const timerRef = useRef(null);
  const sectionTimerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const answersRef = useRef({});
  const audioAnswersRef = useRef({});
  const writingRef = useRef({});
  const sessionRef = useRef(null);
  const submittingRef = useRef(false);
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    loadTests();
    loadInProgressSessions();
  }, [filterLevel, filterType]);

  useEffect(() => {
    if (testId && !hasAutoStarted.current && !loading && tests.length > 0) {
      const found = tests.find(t => String(t.id) === String(testId));
      if (found) {
        hasAutoStarted.current = true;
        handleStartTest(found);
      }
    }
  }, [testId, tests, loading]);

  const loadTests = () => {
    setLoading(true);
    testAPI.getAll({ type: filterType || null, level: filterLevel || null })
      .then(r => setTests(r.data || []))
      .catch(() => toast.error('Không thể tải danh sách bài kiểm tra'))
      .finally(() => setLoading(false));
  };

  const loadInProgressSessions = async () => {
    try {
      const r = await testManagementAPI.getInProgressSessions();
      setInProgressSessions(r.data || []);
    } catch (e) { /* ignore */ }
  };

  const handleStartTest = async (t) => {
    setLoadingTest(true);
    try {
      const r = await testManagementAPI.start(t.id);
      const data = r.data;

      sessionRef.current = data;
      setSession(data);
      setTest(t);
      setAnswers({});
      setAudioAnswers({});
      setWritingContent({});
      setSelectedOption({});
      answersRef.current = {};
      audioAnswersRef.current = {};
      writingRef.current = {};
      setIsLocked(false);

      if (data.sections && data.sections.length > 0) {
        setSections(data.sections);
        setCurrentSectionIndex(0);
        setQuestions(data.sections[0]?.questions || []);
        if (data.sections[0]?.durationMinutes) {
          setSectionTimeLeft(data.sections[0].durationMinutes * 60);
        }
      } else {
        setSections([]);
        setQuestions(data.questions || []);
        setSectionTimeLeft(0);
      }

      if (data.savedAnswers) {
        setAnswers(data.savedAnswers);
        answersRef.current = data.savedAnswers;
      }

      if (data.timed) {
        setTotalTimeLeft(data.remainingSeconds || data.totalDuration * 60);
        startTimers(data);
      }
    } catch {
      toast.error('Không thể bắt đầu bài kiểm tra');
    } finally {
      setLoadingTest(false);
    }
  };

  const handleResumeSession = async (s) => {
    setLoadingTest(true);
    try {
      const r = await testManagementAPI.resume(s.sessionId);
      const data = r.data;

      sessionRef.current = data;
      setSession(data);

      const foundTest = tests.find(t => t.id === data.testId) || { id: data.testId, title: data.title };
      setTest(foundTest);

      if (data.sections && data.sections.length > 0) {
        setSections(data.sections);
        setCurrentSectionIndex(0);
        setQuestions(data.sections[0]?.questions || []);
      } else {
        setSections([]);
        setQuestions(data.questions || []);
      }

      if (data.savedAnswers) {
        setAnswers(data.savedAnswers);
        answersRef.current = data.savedAnswers;
      }

      setTotalTimeLeft(data.remainingSeconds || 0);
      setIsLocked(false);
      startTimers(data);

    } catch {
      toast.error('Không thể khôi phục bài kiểm tra');
    } finally {
      setLoadingTest(false);
    }
  };

  const startTimers = (data) => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (data.timed) {
      timerRef.current = setInterval(() => {
        setTotalTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    autoSaveRef.current = setInterval(() => {
      handleAutoSave();
    }, 30000);
  };

  const handleAutoSave = useCallback(async () => {
    if (!sessionRef.current?.sessionId || isLocked) return;
    try {
      await testManagementAPI.autoSave(sessionRef.current.sessionId, {
        answers: answersRef.current,
        audioAnswers: audioAnswersRef.current,
        timeSpentSeconds: totalTimeLeft,
        currentQuestionIndex: currentQuestionIndex,
      });
    } catch (e) { /* silent fail */ }
  }, [totalTimeLeft, currentQuestionIndex, isLocked]);

  const handleAutoSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    toast.warning('Hết giờ! Đang nộp bài...');
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);

    try {
      const r = await testManagementAPI.submit(testRef.current.id, {
        sessionId: sessionRef.current.sessionId,
        answers: answersRef.current,
        audioAnswers: audioAnswersRef.current,
        timeSpentSeconds: totalTimeLeft,
      });
      try { sessionStorage.setItem('exam_result_' + r.data.resultId, JSON.stringify(r.data)); } catch (e) {}
      navigate('/exam-result/' + r.data.resultId, { state: { result: r.data } });
    } catch {
      toast.error('Lỗi nộp bài. Vui lòng thử lại.');
      submittingRef.current = false;
    }
  };

  const testRef = useRef(null);

  const handleSubmit = async () => {
    const unanswered = questions.filter((_, i) => !answersRef.current['q_' + i]).length;
    if (unanswered > 0) {
      const ok = window.confirm(`Bạn còn ${unanswered} câu chưa trả lời. Nộp bài ngay?`);
      if (!ok) return;
    }
    setShowConfirm(false);
    setSubmitting(true);
    submittingRef.current = true;
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);

    try {
      const r = await testManagementAPI.submit(testRef.current.id, {
        sessionId: sessionRef.current.sessionId,
        answers: answersRef.current,
        audioAnswers: audioAnswersRef.current,
        timeSpentSeconds: totalTimeLeft,
      });
      try { sessionStorage.setItem('exam_result_' + r.data.resultId, JSON.stringify(r.data)); } catch (e) {}
      navigate('/exam-result/' + r.data.resultId, { state: { result: r.data } });
    } catch {
      toast.error('Lỗi nộp bài. Vui lòng thử lại.');
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    const key = 'q_' + qIdx;
    const newSelected = { ...selectedOption, [qIdx]: optIdx };
    const newAnswers = { ...answersRef.current, [key]: String(optIdx) };
    setSelectedOption(newSelected);
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
  };

  const handleWritingChange = (qIdx, value) => {
    const key = 'q_' + qIdx;
    const newWriting = { ...writingRef.current, [key]: value };
    writingRef.current = newWriting;
    setWritingContent(newWriting);
    const newAnswers = { ...answersRef.current, [key]: value };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
  };

  const handleAudioSave = (qIdx, blob, url) => {
    const key = 'q_' + qIdx;
    const newAudio = { ...audioAnswersRef.current, [key]: url };
    audioAnswersRef.current = newAudio;
    setAudioAnswers(newAudio);
    const newAnswers = { ...answersRef.current, [key + '_audio']: url };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
  };

  const changeSection = (index) => {
    if (index < 0 || index >= sections.length) return;
    setCurrentSectionIndex(index);
    setCurrentQuestionIndex(0);
    setQuestions(sections[index]?.questions || []);
    if (sections[index]?.durationMinutes) {
      setSectionTimeLeft(sections[index].durationMinutes * 60);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  useEffect(() => {
    testRef.current = test;
  }, [test]);

  const answeredCount = Object.values(answersRef.current).filter(v => v !== '' && v != null).length;
  const currentSection = sections[currentSectionIndex] || null;
  const hasSections = sections.length > 0;

  if (testRef.current && session) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <div className="clay-card" style={{
          padding: '16px 24px', marginBottom: 20, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          border: session?.timed && totalTimeLeft < 300 ? '2px solid #ef4444' : '2px solid transparent',
        }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1a202c', margin: 0 }}>
              {testRef.current?.title}
            </h2>
            {hasSections && currentSection && (
              <p style={{ color: '#8b5cf6', fontWeight: 700, fontSize: '0.85rem', margin: '4px 0 0' }}>
                {SECTION_ICONS[currentSection.type]} {currentSection.title}
              </p>
            )}
            <p style={{ color: '#718096', fontWeight: 600, fontSize: '0.85rem', margin: '4px 0 0' }}>
              {answeredCount}/{questions.length} câu đã trả lời
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {session?.timed && (
              <Timer
                totalTimeLeft={totalTimeLeft}
                sectionTimeLeft={sectionTimeLeft}
                totalTime={session?.totalDuration * 60 || 0}
                hasSectionTimer={hasSections}
                sectionName={currentSection?.title}
                compact
              />
            )}
            <button className="clay-btn clay-btn-primary" onClick={() => setShowConfirm(true)}
              style={{ padding: '10px 20px', fontSize: '0.9rem' }} disabled={isLocked}>
              <Send size={16} style={{ marginRight: 6 }} /> Nộp bài
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            {hasSections && (
              <div className="clay-card" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                  {sections.map((section, idx) => (
                    <button
                      key={section.id || idx}
                      onClick={() => changeSection(idx)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: 'none',
                        background: idx === currentSectionIndex
                          ? `linear-gradient(135deg, ${SKILL_COLORS[section.type] || '#8b5cf6'}, ${SKILL_COLORS[section.type] || '#8b5cf6'}99)`
                          : 'rgba(0,0,0,0.05)',
                        color: idx === currentSectionIndex ? 'white' : '#4a5568',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {SECTION_ICONS[section.type]}
                      {section.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentSection?.instructions && (
              <div style={{
                padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                background: 'rgba(139,92,246,0.06)',
                border: '1px solid rgba(139,92,246,0.15)',
                fontSize: '0.85rem', color: '#4a5568',
              }}>
                <strong style={{ color: '#8b5cf6' }}>Hướng dẫn:</strong> {currentSection.instructions}
              </div>
            )}

            <div className="clay-card" style={{ padding: 24 }}>
              {questions.map((q, idx) => {
                const key = 'q_' + idx;
                const answered = answersRef.current[key] !== undefined && answersRef.current[key] !== '';
                const qType = q.type || 'MULTIPLE_CHOICE';

                return (
                  <div key={idx} style={{
                    marginBottom: 28, padding: '20px 24px', borderRadius: 16,
                    background: answered ? 'rgba(34,197,94,0.04)' : 'rgba(0,0,0,0.02)',
                    border: '2px solid ' + (answered ? 'rgba(34,197,94,0.15)' : 'rgba(0,0,0,0.05)'),
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                      <span style={{
                        minWidth: 28, height: 28, borderRadius: 8,
                        background: answered ? '#22C55E' : 'rgba(0,0,0,0.08)',
                        color: 'white', fontWeight: 900, fontSize: '0.8rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{idx + 1}</span>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a202c', lineHeight: 1.6 }}>
                        {q.question}
                      </div>
                    </div>

                    {qType === 'MULTIPLE_CHOICE' && q.options && q.options.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginLeft: 38 }}>
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedOption[idx] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleOptionSelect(idx, optIdx)}
                              style={{
                                padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                                fontWeight: 600, fontSize: '0.85rem',
                                background: isSelected ? `linear-gradient(135deg, ${SKILL_COLORS[currentSection?.type] || '#3b82f6'}99, ${SKILL_COLORS[currentSection?.type] || '#3b82f6'})` : 'rgba(255,255,255,0.8)',
                                color: isSelected ? 'white' : '#4a5568',
                                border: '2px solid ' + (isSelected ? (SKILL_COLORS[currentSection?.type] || '#3b82f6') : 'rgba(0,0,0,0.08)'),
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

                    {qType === 'WRITING' && (
                      <div style={{ marginLeft: 38 }}>
                        <WritingEditor
                          question={q.question}
                          instructions={q.instructions}
                          value={writingRef.current[key] || ''}
                          onChange={(val) => handleWritingChange(idx, val)}
                          onSave={() => handleAutoSave()}
                          maxWords={q.maxWords || 500}
                          minWords={q.minWords || 50}
                          disabled={isLocked}
                          showWordCount
                        />
                      </div>
                    )}

                    {qType === 'SPEAKING' && (
                      <div style={{ marginLeft: 38 }}>
                        <SpeakingRecorder
                          question={q.question}
                          instructions={q.instructions}
                          value={audioAnswersRef.current[key] ? { audioUrl: audioAnswersRef.current[key] } : null}
                          onChange={(val) => handleAudioSave(idx, val?.blob, val?.audioUrl)}
                          onSave={(blob, url) => handleAudioSave(idx, blob, url)}
                          maxDuration={q.maxDuration || 120}
                          minDuration={q.minDuration || 10}
                          disabled={isLocked}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {hasSections && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
                  <button
                    className="clay-btn"
                    onClick={() => changeSection(currentSectionIndex - 1)}
                    disabled={currentSectionIndex === 0}
                    style={{ opacity: currentSectionIndex === 0 ? 0.5 : 1 }}
                  >
                    <ChevronLeft size={16} style={{ marginRight: 4 }} />
                    Phần trước
                  </button>
                  <button
                    className="clay-btn clay-btn-primary"
                    onClick={() => changeSection(currentSectionIndex + 1)}
                    disabled={currentSectionIndex === sections.length - 1}
                    style={{ opacity: currentSectionIndex === sections.length - 1 ? 0.5 : 1 }}
                  >
                    Phần tiếp theo
                    <ChevronRight size={16} style={{ marginLeft: 4 }} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {showNavigator && (
            <div style={{ width: 280, flexShrink: 0 }}>
              <QuestionNavigator
                questions={questions}
                answers={answersRef.current}
                currentIndex={currentQuestionIndex}
                onNavigate={setCurrentQuestionIndex}
                sections={sections}
                currentSection={currentSection}
                onSectionChange={(s) => {
                  const idx = sections.findIndex(sec => sec.id === s.id);
                  if (idx >= 0) changeSection(idx);
                }}
                disabled={isLocked}
                timeLeft={totalTimeLeft}
              />
            </div>
          )}
        </div>

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
                <button className="clay-btn clay-btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Đang nộp...' : 'Nộp bài'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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

      {inProgressSessions.length > 0 && (
        <div className="clay-card" style={{ padding: 20, marginBottom: 24, border: '2px solid #f59e0b33' }}>
          <h3 style={{ fontWeight: 800, color: '#f59e0b', marginBottom: 12, fontSize: '1rem' }}>
            <Clock size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Bài đang làm dở
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inProgressSessions.map(s => (
              <div key={s.sessionId} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.08)',
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a202c' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                    {s.answeredCount}/{s.questionsCount} câu - Còn {Math.floor(s.remainingSeconds / 60)}p {s.remainingSeconds % 60}s
                  </div>
                </div>
                <button className="clay-btn clay-btn-primary" onClick={() => handleResumeSession(s)} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                  Tiếp tục
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
          {tests.map(t => (
            <div key={t.id} className="clay-card" style={{ padding: 24, border: '2px solid transparent', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 8,
                  background: (SKILL_COLORS[t.type] || '#8b5cf6') + '22',
                  color: SKILL_COLORS[t.type] || '#8b5cf6',
                  fontWeight: 800, fontSize: '0.75rem',
                }}>
                  {(t.type || '').replace(/_/g, ' ')}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: 8,
                  background: (LEVEL_COLORS[t.level] || '#718096') + '22',
                  color: LEVEL_COLORS[t.level] || '#718096',
                  fontWeight: 800, fontSize: '0.75rem',
                }}>{t.level}</span>
                {t.timed && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                    fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Clock size={12} /> {t.duration} phút
                  </span>
                )}
                {t.completed && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 8,
                    background: 'rgba(34,197,94,0.15)', color: '#16a34a',
                    fontWeight: 800, fontSize: '0.75rem',
                  }}>
                    Hoàn thành: {t.userScore}/10
                  </span>
                )}
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a202c', marginBottom: 8 }}>{t.title}</h3>
              <p style={{ color: '#718096', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 16 }}>
                {t.description}
              </p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                  <Clock size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t.duration} phút
                </span>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                  <Target size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {t.totalQuestions} câu
                </span>
                <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                  <Award size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Đạt: {t.passingScore}/{t.maxScore}
                </span>
              </div>
              <button
                className="clay-btn clay-btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleStartTest(t)}
                disabled={loadingTest}
              >
                {loadingTest ? 'Đang tải...' : t.completed ? 'Làm lại' : 'Bắt đầu'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
