import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dailyAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const STYLES = {
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 900,
    color: '#1a202c',
    margin: 0,
  },
  card: {
    background: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  badge: (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 100,
    fontSize: '0.8rem',
    fontWeight: 700,
    background: color + '18',
    color: color,
    border: `1px solid ${color}30`,
  }),
  sectionCard: (active, color) => ({
    background: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    border: active ? `2px solid ${color}` : '2px solid transparent',
    boxShadow: active ? `0 4px 20px ${color}25` : '0 2px 12px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
  }),
  questionBox: {
    background: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    border: '1px solid #e2e8f0',
  },
  progressBar: (percent, color) => ({
    width: `${percent}%`,
    height: '100%',
    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
    borderRadius: 'inherit',
    transition: 'width 0.6s ease',
  }),
  btn: (primary, disabled, color) => ({
    padding: '14px 32px',
    borderRadius: 14,
    fontSize: '1rem',
    fontWeight: 700,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s',
    background: primary ? `linear-gradient(135deg, ${color}, ${color}dd)` : 'transparent',
    color: primary ? 'white' : '#64748b',
    border: primary ? 'none' : '2px solid #e2e8f0',
    boxShadow: primary ? `0 4px 16px ${color}40` : 'none',
  }),
  streakBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 20px',
    borderRadius: 100,
    fontWeight: 800,
    fontSize: '1rem',
    background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
    color: 'white',
    boxShadow: '0 4px 16px #FF6B3530',
  },
  writingArea: {
    width: '100%',
    minHeight: 160,
    padding: 16,
    borderRadius: 14,
    border: '2px solid #e2e8f0',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  optionBtn: (selected, correct, wrong, disabled) => ({
    width: '100%',
    padding: '14px 20px',
    borderRadius: 14,
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.2s',
    background: correct ? '#22c55e18' : wrong ? '#ef444418' : selected ? '#3b82f618' : 'white',
    border: `2px solid ${correct ? '#22c55e' : wrong ? '#ef4444' : selected ? '#3b82f6' : '#e2e8f0'}`,
    color: correct ? '#16a34a' : wrong ? '#dc2626' : selected ? '#2563eb' : '#334155',
    opacity: disabled && !correct && !wrong && !selected ? 0.7 : 1,
  }),
  rewardCard: {
    background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
    borderRadius: 20,
    padding: 24,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
};

const COLORS = {
  reading: { main: '#8b5cf6', light: '#a78bfa', bg: '#f5f3ff' },
  listening: { main: '#06b6d4', light: '#22d3ee', bg: '#ecfeff' },
  vocabulary: { main: '#f59e0b', light: '#fbbf24', bg: '#fffbeb' },
  writing: { main: '#ec4899', light: '#f472b6', bg: '#fdf2f8' },
  default: { main: '#3b82f6', light: '#60a5fa', bg: '#eff6ff' },
};

export default function DailyChallengePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [sectionScores, setSectionScores] = useState({});
  const [showHint, setShowHint] = useState({});
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    loadChallenge();
    loadWeeklyProgress();
  }, []);

  const loadChallenge = async () => {
    try {
      const res = await dailyAPI.getToday();
      const data = res.data;
      if (data.success && data.data) {
        const challengeData = data.data;
        setChallenge(challengeData);

        // Determine first incomplete section
        const sections = challengeData.sections || {};
        if (!challengeData.alreadyCompleted) {
          const sectionOrder = ['vocabulary', 'reading', 'listening', 'writing'];
          for (const s of sectionOrder) {
            if (sections[s]) {
              setActiveSection(s);
              break;
            }
          }
        }

        // Load section scores if already completed
        if (challengeData.progress?.completed) {
          const scores = {};
          ['reading', 'listening', 'vocabulary', 'writing'].forEach(s => {
            scores[s] = { score: challengeData.progress?.score || 0, submitted: true };
          });
          setSectionScores(scores);
        }
      }
    } catch (err) {
      console.error('Error loading challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyProgress = async () => {
    try {
      const res = await dailyAPI.getWeek();
      if (res.data.success) {
        setWeeklyProgress(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading weekly progress:', err);
    }
  };

  const handleAnswer = (section, qId, value) => {
    setAnswers(prev => {
      const sectionAnswers = prev[section] || {};
      return {
        ...prev,
        [section]: {
          ...sectionAnswers,
          [qId]: value,
        },
      };
    });
  };

  const handleWritingSubmit = async (section) => {
    // Writing is submitted with the main submit
    goToNextSection(section);
  };

  const goToNextSection = (currentSection) => {
    const sectionOrder = ['vocabulary', 'reading', 'listening', 'writing'];
    const idx = sectionOrder.indexOf(currentSection);
    if (idx < sectionOrder.length - 1) {
      const next = sectionOrder[idx + 1];
      const sections = challenge?.sections || {};
      if (sections[next]) {
        setActiveSection(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const goToPrevSection = (currentSection) => {
    const sectionOrder = ['vocabulary', 'reading', 'listening', 'writing'];
    const idx = sectionOrder.indexOf(currentSection);
    if (idx > 0) {
      const prev = sectionOrder[idx - 1];
      const sections = challenge?.sections || {};
      if (sections[prev]) {
        setActiveSection(prev);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const submissionData = {
        challengeId: challenge.challengeId,
        answers: answers,
        startTime: startTimeRef.current,
      };

      const res = await dailyAPI.submit(submissionData);
      if (res.data.success) {
        setResult(res.data.data);
        setShowResult(true);
      }
    } catch (err) {
      console.error('Error submitting challenge:', err);
      alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgress = () => {
    const sections = challenge?.sections || {};
    const sectionOrder = ['vocabulary', 'reading', 'listening', 'writing'];
    let answered = 0;
    let total = 0;

    sectionOrder.forEach(s => {
      if (sections[s]) {
        const questions = sections[s].questions || [];
        total += questions.length;

        questions.forEach(q => {
          if (answers[s]?.[q.id]) answered++;
        });
      }
    });

    return { answered, total, percent: total > 0 ? Math.round((answered / total) * 100) : 0 };
  };

  const getSectionIcon = (type) => {
    const icons = { reading: '📖', listening: '🎧', vocabulary: '📚', writing: '✍️' };
    return icons[type] || '📝';
  };

  const getSectionColor = (type) => COLORS[type] || COLORS.default;

  if (loading) {
    return (
      <div style={STYLES.container}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, animation: 'bounce 1s infinite' }}>🎯</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#64748b' }}>Đang tải thử thách...</div>
        </div>
      </div>
    );
  }

  if (showResult && result) {
    return <ResultPage result={result} challenge={challenge} onBack={() => { loadChallenge(); loadWeeklyProgress(); setShowResult(false); setResult(null); setAnswers({}); }} />;
  }

  if (!challenge) {
    return (
      <div style={STYLES.container}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎯</div>
          <h2 style={{ color: '#1a202c', marginBottom: 8 }}>Không có thử thách hôm nay</h2>
          <p style={{ color: '#64748b' }}>Hãy quay lại vào ngày mai!</p>
        </div>
      </div>
    );
  }

  const sections = challenge.sections || {};
  const progress = getProgress();
  const streak = challenge.streak || {};
  const colors = activeSection ? getSectionColor(activeSection) : COLORS.default;

  // Check if all sections are done
  const isAllDone = Object.keys(sections).every(s => {
    const questions = sections[s]?.questions || [];
    if (questions.length === 0) return true;
    return questions.every(q => answers[s]?.[q.id] !== undefined);
  });

  return (
    <div style={STYLES.container}>
      {/* Header */}
      <div style={STYLES.header}>
        <div>
          <h1 style={STYLES.title}>
            <span style={{ marginRight: 12 }}>🎯</span>
            Daily Challenge
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.95rem', fontWeight: 600 }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' • '}Level {challenge.userLevel || 'A1'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Streak Badge */}
          <div style={STYLES.streakBadge}>
            <span>🔥</span>
            <span>{streak.currentStreak || 0} ngày</span>
            {streak.nextMilestone && (
              <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                • {streak.daysToNextMilestone} ngày tới {streak.nextMilestone}
              </span>
            )}
          </div>

          {/* XP Reward */}
          <div style={STYLES.badge('#f59e0b')}>
            ⭐ +{challenge.xpReward || 50} XP
          </div>

          {/* Difficulty */}
          <div style={STYLES.badge(
            challenge.difficulty === 'HARD' ? '#ef4444' :
            challenge.difficulty === 'MEDIUM' ? '#f59e0b' : '#22c55e'
          )}>
            {challenge.difficulty || 'MEDIUM'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ ...STYLES.card, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>Tiến độ hoàn thành</span>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: colors.main }}>{progress.percent}%</span>
        </div>
        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
          <div style={STYLES.progressBar(progress.percent, colors.main)} />
        </div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 6 }}>
          {progress.answered}/{progress.total} câu đã trả lời
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {['vocabulary', 'reading', 'listening', 'writing'].map(sectionKey => {
          const section = sections[sectionKey];
          if (!section) return null;

          const color = getSectionColor(sectionKey);
          const isActive = activeSection === sectionKey;
          const isDone = section.questions?.every?.(q => answers[sectionKey]?.[q.id]) ||
                         (sectionKey === 'writing' && answers[sectionKey]);

          return (
            <button
              key={sectionKey}
              onClick={() => setActiveSection(sectionKey)}
              style={{
                padding: '10px 18px',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                background: isActive ? color.main : isDone ? color.main + '22' : '#f8fafc',
                color: isActive ? 'white' : isDone ? color.main : '#64748b',
                boxShadow: isActive ? `0 4px 16px ${color.main}40` : 'none',
                transition: 'all 0.2s',
                opacity: challenge.alreadyCompleted ? 0.6 : 1,
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{getSectionIcon(sectionKey)}</span>
              <span>{section.title}</span>
              {isDone && <span style={{ color: '#22c55e', fontWeight: 900 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Already Completed State */}
      {challenge.alreadyCompleted && (
        <div style={{ ...STYLES.card, textAlign: 'center', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '2px solid #22c55e30' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
          <h3 style={{ color: '#166534', marginBottom: 8 }}>Bạn đã hoàn thành thử thách hôm nay!</h3>
          <p style={{ color: '#15803d', marginBottom: 16 }}>
            Điểm số: <strong>{challenge.progress?.score || 0}/10</strong> • XP: <strong>+{challenge.progress?.xpEarned || 0}</strong>
          </p>
          <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
            Hãy quay lại vào ngày mai để nhận thử thách mới!
          </div>
        </div>
      )}

      {/* Section Content */}
      {!challenge.alreadyCompleted && activeSection && sections[activeSection] && (
        <SectionContent
          section={sections[activeSection]}
          sectionKey={activeSection}
          answers={answers}
          onAnswer={handleAnswer}
          onNext={() => goToNextSection(activeSection)}
          onPrev={() => goToPrevSection(activeSection)}
          onSubmitWriting={() => handleWritingSubmit(activeSection)}
          colors={colors}
          disabled={challenge.alreadyCompleted}
          showHint={showHint}
          setShowHint={setShowHint}
        />
      )}

      {/* Submit Button (show when all sections done) */}
      {!challenge.alreadyCompleted && isAllDone && (
        <div style={{ ...STYLES.card, textAlign: 'center', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '2px solid #8b5cf640' }}>
          <h3 style={{ color: '#6d28d9', marginBottom: 8 }}>Bạn đã hoàn thành tất cả các phần!</h3>
          <p style={{ color: '#7c3aed', marginBottom: 16, fontSize: '0.9rem' }}>
            Nhấn nút bên dưới để nộp bài và nhận kết quả
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              ...STYLES.btn(true, submitting, '#8b5cf6'),
              fontSize: '1.1rem',
              padding: '16px 48px',
            }}
          >
            {submitting ? '⏳ Đang chấm điểm...' : '🚀 Nộp bài & Xem kết quả'}
          </button>
        </div>
      )}

      {/* Weekly Progress */}
      <div style={STYLES.card}>
        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a202c', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          📅 Tiến độ tuần này
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {weeklyProgress.map((day, idx) => {
            const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            const isToday = day.isToday;
            const isCompleted = day.completed;
            const isFuture = day.isFuture;

            return (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    marginBottom: 4,
                    background: isFuture ? '#f1f5f9' : isCompleted ? '#22c55e' : isToday ? '#3b82f6' : '#f8fafc',
                    color: isFuture ? '#94a3b8' : isCompleted || isToday ? 'white' : '#64748b',
                    border: isToday ? '3px solid #3b82f6' : 'none',
                    boxShadow: isToday ? '0 0 0 3px #3b82f620' : 'none',
                  }}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isToday ? '#3b82f6' : '#94a3b8' }}>
                  {dayLabels[idx]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// SECTION CONTENT COMPONENT
// ================================================================
function SectionContent({ section, sectionKey, answers, onAnswer, onNext, onPrev, onSubmitWriting, colors, disabled, showHint, setShowHint }) {
  const [recording, setRecording] = useState(false);
  const [transcribed, setTranscribed] = useState('');

  const { isListening, isSupported, transcript, startListening, stopListening, setTranscript } = useSpeechRecognition({
    onResult: (text) => setTranscribed(text),
    onError: (err) => console.error(err),
    lang: 'en-US',
  });

  const handleRecord = () => {
    if (recording) {
      stopListening();
      setRecording(false);
    } else {
      setTranscript('');
      setTranscribed('');
      startListening();
      setRecording(true);
    }
  };

  const handleWritingTextChange = (e) => {
    const text = e.target.value;
    onAnswer(sectionKey, 'text', text);
    if (transcribed) {
      onAnswer(sectionKey, 'transcribed', transcribed);
    }
  };

  useEffect(() => {
    onAnswer(sectionKey, 'transcribed', transcribed);
  }, [transcribed]);

  // Reading Section
  if (sectionKey === 'reading') {
    return (
      <div style={STYLES.sectionCard(true, colors.main)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            📖
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a202c', margin: 0 }}>{section.title}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{section.description}</p>
          </div>
        </div>

        {/* Passage */}
        {section.questions?.[0]?.passage && (
          <div style={{ ...STYLES.questionBox, background: colors.bg, border: `1px solid ${colors.main}30`, marginBottom: 20 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.main, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              📄 Bài đọc
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#334155', margin: 0, fontStyle: 'italic' }}>
              "{section.questions[0].passage}"
            </p>
          </div>
        )}

        {/* Questions */}
        {section.questions?.map((q, idx) => (
          <QuestionCard
            key={q.id}
            q={q}
            idx={idx}
            sectionKey={sectionKey}
            answer={answers[sectionKey]?.[q.id]}
            onAnswer={onAnswer}
            colors={colors}
            disabled={disabled}
            showHint={showHint}
            setShowHint={setShowHint}
          />
        ))}

        <SectionNav onPrev={onPrev} onNext={onNext} />
      </div>
    );
  }

  // Listening Section
  if (sectionKey === 'listening') {
    return (
      <div style={STYLES.sectionCard(true, colors.main)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            🎧
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a202c', margin: 0 }}>{section.title}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{section.description}</p>
          </div>
        </div>

        {/* Audio Script (as transcript reference) */}
        {section.audioScript && (
          <div style={{ ...STYLES.questionBox, background: colors.bg, border: `1px solid ${colors.main}30`, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.main, textTransform: 'uppercase', letterSpacing: 1 }}>🎙️ Nội dung nghe</span>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: '#334155', margin: 0 }}>
              {section.audioScript}
            </p>
          </div>
        )}

        {/* Questions */}
        {section.questions?.map((q, idx) => (
          <QuestionCard
            key={q.id}
            q={q}
            idx={idx}
            sectionKey={sectionKey}
            answer={answers[sectionKey]?.[q.id]}
            onAnswer={onAnswer}
            colors={colors}
            disabled={disabled}
            showHint={showHint}
            setShowHint={setShowHint}
          />
        ))}

        <SectionNav onPrev={onPrev} onNext={onNext} />
      </div>
    );
  }

  // Vocabulary Section
  if (sectionKey === 'vocabulary') {
    return (
      <div style={STYLES.sectionCard(true, colors.main)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            📚
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a202c', margin: 0 }}>{section.title}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{section.description}</p>
          </div>
        </div>

        {/* Questions */}
        {section.questions?.map((q, idx) => (
          <div key={q.id} style={{ ...STYLES.questionBox, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: colors.main }}>Câu {idx + 1}</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>{q.word}</span>
              {q.pronunciation && (
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>{q.pronunciation}</span>
              )}
            </div>
            {q.example && (
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12, fontStyle: 'italic' }}>
                Ví dụ: "{q.example}"
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {q.options?.map((opt, optIdx) => {
                const isSelected = answers[sectionKey]?.[q.id] === opt;
                return (
                  <button
                    key={optIdx}
                    onClick={() => !disabled && onAnswer(sectionKey, q.id, opt)}
                    disabled={disabled}
                    style={{
                      ...STYLES.optionBtn(isSelected, false, false, disabled),
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <SectionNav onPrev={onPrev} onNext={onNext} />
      </div>
    );
  }

  // Writing Section
  if (sectionKey === 'writing') {
    const prompt = section.prompt || {};
    const isSpeaking = section.subtype === 'speaking';

    return (
      <div style={STYLES.sectionCard(true, colors.main)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            {isSpeaking ? '🎤' : '✍️'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a202c', margin: 0 }}>{section.title}</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{section.description}</p>
          </div>
        </div>

        {/* Prompt */}
        <div style={{ ...STYLES.questionBox, background: colors.bg, border: `1px solid ${colors.main}30`, marginBottom: 20 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: colors.main, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            📝 Chủ đề
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>{prompt.title}</h3>
          <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>{prompt.instruction}</p>
        </div>

        {/* Speaking Mode */}
        {isSpeaking && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button
                onClick={handleRecord}
                style={{
                  padding: '12px 24px',
                  borderRadius: 14,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  background: recording ? '#ef4444' : '#22c55e',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: recording ? '0 4px 16px #ef444440' : '0 4px 16px #22c55e40',
                }}
              >
                {recording ? '⏹️ Dừng' : '🎤 Bắt đầu nói'}
              </button>
              {recording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}>Đang ghi âm...</span>
                </div>
              )}
            </div>

            {(transcribed || recording) && (
              <div style={{ ...STYLES.questionBox, background: '#f0fdf4', border: '1px solid #22c55e30' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>
                  📝 Văn bản được nhận diện:
                </div>
                <p style={{ fontSize: '0.95rem', color: '#166534', margin: 0, lineHeight: 1.7 }}>
                  {transcribed || '...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Writing Area */}
        {!isSpeaking && (
          <div style={{ marginBottom: 20 }}>
            <textarea
              value={answers[sectionKey]?.text || ''}
              onChange={handleWritingTextChange}
              placeholder="Viết câu trả lời của bạn vào đây..."
              disabled={disabled}
              style={{
                ...STYLES.writingArea,
                borderColor: answers[sectionKey]?.text ? colors.main + '60' : '#e2e8f0',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Tối thiểu {section.minWords || 50} từ
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {(answers[sectionKey]?.text || '').split(/\s+/).filter(Boolean).length} từ
              </span>
            </div>
          </div>
        )}
        {isSpeaking && (
          <div style={{ marginBottom: 20 }}>
            <textarea
              value={answers[sectionKey]?.text || ''}
              onChange={handleWritingTextChange}
              placeholder="Văn bản sẽ tự động xuất hiện ở đây khi bạn nói..."
              disabled={true}
              style={{ ...STYLES.writingArea, background: '#f8fafc', cursor: 'not-allowed' }}
            />
            {transcribed && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Đã nhận diện từ giọng nói</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {transcribed.split(/\s+/).filter(Boolean).length} từ
                </span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onPrev}
            style={{ ...STYLES.btn(false, false, colors.main), flex: 1 }}
          >
            ← Quay lại
          </button>
          <button
            onClick={onNext}
            style={{ ...STYLES.btn(true, false, colors.main), flex: 2 }}
          >
            Xong ✓
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ================================================================
// QUESTION CARD
// ================================================================
function QuestionCard({ q, idx, sectionKey, answer, onAnswer, colors, disabled, showHint, setShowHint }) {
  const hintKey = `${sectionKey}_${q.id}`;

  return (
    <div style={{ ...STYLES.questionBox, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: colors.main + '18', color: colors.main,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 800, flexShrink: 0
        }}>
          {idx + 1}
        </span>
        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', margin: 0, lineHeight: 1.5 }}>
          {q.question}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 38 }}>
        {q.options?.map((opt, optIdx) => {
          const isSelected = answer === opt;
          return (
            <button
              key={optIdx}
              onClick={() => !disabled && onAnswer(sectionKey, q.id, opt)}
              disabled={disabled}
              style={{
                ...STYLES.optionBtn(isSelected, false, false, disabled),
                justifyContent: 'flex-start',
              }}
            >
              <span style={{ marginRight: 8, opacity: 0.5, fontWeight: 800, minWidth: 20 }}>
                {String.fromCharCode(65 + optIdx)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Hint button */}
      {!disabled && !showHint[hintKey] && (
        <button
          onClick={() => setShowHint(prev => ({ ...prev, [hintKey]: true }))}
          style={{
            marginTop: 10, padding: '6px 14px', borderRadius: 8,
            border: 'none', cursor: 'pointer', fontSize: '0.8rem',
            fontWeight: 600, background: '#f1f5f9', color: '#64748b',
          }}
        >
          💡 Gợi ý
        </button>
      )}
      {showHint[hintKey] && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#fef3c7', border: '1px solid #fbbf24', fontSize: '0.85rem', color: '#92400e' }}>
          💡 {q.explanation || 'Hãy đọc kỹ lại bài đọc để tìm câu trả lời đúng.'}
        </div>
      )}
    </div>
  );
}

// ================================================================
// SECTION NAVIGATION
// ================================================================
function SectionNav({ onPrev, onNext }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
      <button onClick={onPrev} style={{ ...STYLES.btn(false, false, '#3b82f6'), flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        ← Quay lại
      </button>
      <button onClick={onNext} style={{ ...STYLES.btn(true, false, '#3b82f6'), flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        Tiếp theo →
      </button>
    </div>
  );
}

// ================================================================
// RESULT PAGE
// ================================================================
function ResultPage({ result, challenge, onBack }) {
  const totalScore = result.totalScore || 0;
  const passed = result.passed;
  const breakdown = result.breakdown || {};
  const feedback = result.feedback || {};
  const rewards = result.rewards || {};
  const newBadges = result.newBadges || [];

  const getScoreColor = (score) => {
    if (score >= 8) return '#22c55e';
    if (score >= 6) return '#f59e0b';
    if (score >= 4) return '#f97316';
    return '#ef4444';
  };

  const getScoreEmoji = (score) => {
    if (score >= 9) return '🏆';
    if (score >= 8) return '🌟';
    if (score >= 6) return '👍';
    if (score >= 4) return '💪';
    return '📚';
  };

  return (
    <div style={STYLES.container}>
      {/* Hero Result Card */}
      <div style={{
        ...STYLES.rewardCard,
        background: passed
          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
          : 'linear-gradient(135deg, #f59e0b, #d97706)',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: '4rem', marginBottom: 12 }}>{getScoreEmoji(totalScore)}</div>
        <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: 4 }}>
          {totalScore.toFixed(1)}/10
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, opacity: 0.9, marginBottom: 4 }}>
          {passed ? '🎉 Hoàn thành!' : 'Cố gắng hơn!'}
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          {feedback.overall}
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: 100, fontWeight: 800 }}>
            ⭐ +{rewards.xp || 0} XP
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: 100, fontWeight: 800 }}>
            🔥 {rewards.streak || 0} ngày streak
          </div>
        </div>
      </div>

      {/* New Badges */}
      {newBadges.length > 0 && (
        <div style={{ ...STYLES.card, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '2px solid #8b5cf630', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, color: '#6d28d9', marginBottom: 12, fontSize: '1rem' }}>
            🏅 Huy hiệu mới!
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {newBadges.map((badge, idx) => (
              <div key={idx} style={{
                padding: '12px 20px',
                borderRadius: 14,
                background: 'white',
                border: '2px solid',
                borderColor: badge.rarity === 'LEGENDARY' ? '#fbbf24' : badge.rarity === 'EPIC' ? '#a855f7' : badge.rarity === 'RARE' ? '#3b82f6' : '#22c55e',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 4 }}>{badge.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>{badge.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{badge.rarity}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Breakdown */}
      <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a202c', marginBottom: 16 }}>
        📊 Chi tiết từng phần
      </h3>

      {['reading', 'listening', 'vocabulary', 'writing'].map(sectionKey => {
        const section = challenge?.sections?.[sectionKey];
        const sectionResult = breakdown[sectionKey] || {};
        const score = sectionResult.score || 0;
        const color = COLORS[sectionKey]?.main || '#3b82f6';
        const icon = { reading: '📖', listening: '🎧', vocabulary: '📚', writing: '✍️' }[sectionKey];

        if (!section) return null;

        return (
          <div key={sectionKey} style={{ ...STYLES.card, marginBottom: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: '1.5rem' }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{section.title}</div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${score * 10}%`,
                    height: '100%',
                    background: getScoreColor(score),
                    borderRadius: 6,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
              </div>
              <div style={{
                fontWeight: 900,
                fontSize: '1.3rem',
                color: getScoreColor(score),
                minWidth: 50,
                textAlign: 'right',
              }}>
                {score.toFixed(1)}/10
              </div>
            </div>
            {sectionResult.details?.length > 0 && (
              <div style={{ marginLeft: 44 }}>
                {sectionResult.details.slice(0, 5).map((d, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 0',
                    fontSize: '0.85rem',
                    color: d.correct ? '#22c55e' : '#ef4444',
                  }}>
                    <span>{d.correct ? '✓' : '✗'}</span>
                    <span style={{ fontWeight: 600 }}>{d.userAnswer}</span>
                    {!d.correct && <span style={{ color: '#94a3b8' }}>→ {d.correctAnswer}</span>}
                  </div>
                ))}
              </div>
            )}
            {sectionResult.feedback && (
              <div style={{ marginLeft: 44, marginTop: 8, fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                {sectionResult.feedback}
              </div>
            )}
          </div>
        );
      })}

      {/* AI Writing Feedback */}
      {breakdown.writing?.aiDetails?.length > 0 && (
        <div style={{ ...STYLES.card, marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 16, fontSize: '1rem' }}>
            🤖 Phản hồi từ AI
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {breakdown.writing.aiDetails.map((detail, idx) => (
              <div key={idx} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  {detail.criterion}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
                  {detail.comment}
                </div>
              </div>
            ))}
          </div>
          {breakdown.writing.strengths?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>✅ Điểm mạnh:</div>
              {breakdown.writing.strengths.map((s, idx) => (
                <div key={idx} style={{ fontSize: '0.9rem', color: '#166534', paddingLeft: 16, marginBottom: 4 }}>
                  • {s}
                </div>
              ))}
            </div>
          )}
          {breakdown.writing.areasForImprovement?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>📝 Cần cải thiện:</div>
              {breakdown.writing.areasForImprovement.map((a, idx) => (
                <div key={idx} style={{ fontSize: '0.9rem', color: '#92400e', paddingLeft: 16, marginBottom: 4 }}>
                  • {a}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          onClick={onBack}
          style={{ ...STYLES.btn(true, false, '#3b82f6'), flex: 1 }}
        >
          ← Quay về Daily Challenge
        </button>
      </div>
    </div>
  );
}
