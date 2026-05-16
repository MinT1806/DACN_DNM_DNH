import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storyAPI } from '../api/api';

const COLORS = {
  bg: '#0f172a',
  card: '#1e293b',
  accent: '#38bdf8',
  gold: '#fbbf24',
  success: '#22c55e',
  error: '#ef4444',
  text: '#f1f5f9',
  muted: '#94a3b8',
};

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ height: 8, background: '#334155', borderRadius: 99, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color || '#38bdf8', borderRadius: 99, transition: 'width 0.5s ease' }} />
    </div>
  );
}

export default function StoryModePage() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [currentStory, setCurrentStory] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (storyId) {
      loadStory();
    } else {
      loadAllStories();
    }
  }, [storyId]);

  const loadAllStories = async () => {
    setLoading(true);
    try {
      const res = await storyAPI.getAll();
      if (res.data.success) {
        setStories(res.data.data || []);
      }
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const loadStory = async () => {
    setLoading(true);
    setError(null);
    setSelectedAnswer(null);
    setFeedback(null);
    try {
      const res = await storyAPI.getById(Number(storyId));
      if (res.data.success) {
        const data = res.data.data;
        setCurrentStory(data);
        setCurrentStep(data.currentStep || 0);
        setCompleted(data.completed || false);
        if (data.completed) {
          setScore(data.score);
        }
      } else {
        setError(res.data.message || 'Story not found');
      }
    } catch {
      setError('Cannot load story');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (option) => {
    if (selectedAnswer || submitting) return;
    setSelectedAnswer(option);
    setSubmitting(true);

    try {
      const res = await storyAPI.submitAnswer(Number(storyId), currentStep + 1, option);
      if (res.data.success) {
        const data = res.data.data;
        setFeedback({
          correct: data.correct,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          isLastStep: data.isLastStep,
          score: data.score,
          correctCount: data.correctCount,
          totalSteps: data.totalSteps,
        });

        if (data.isLastStep) {
          setTimeout(() => {
            setCompleted(true);
            setScore(data.score);
            setCurrentStory((prev) => ({ ...prev, completed: true, score: data.score }));
          }, 2000);
        }
      }
    } catch {
      setSelectedAnswer(null);
      setFeedback(null);
    } finally {
      setSubmitting(false);
    }
  };

  const goNextStep = () => {
    if (feedback?.isLastStep) {
      setCompleted(true);
      setScore(feedback.score);
      return;
    }
    setCurrentStep((s) => s + 1);
    setSelectedAnswer(null);
    setFeedback(null);
  };

  const restartStory = () => {
    navigate('/stories');
  };

  const currentStepData = currentStory?.steps?.[currentStep];
  const steps = currentStory?.steps || [];
  const options = currentStepData?.options || [];

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📖</div>
        <div style={{ color: '#94a3b8', fontSize: '1.1rem', fontWeight: 600 }}>Loading story...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>📖</div>
        <h2 style={{ color: '#f1f5f9', marginBottom: 8 }}>Error</h2>
        <p style={{ color: '#94a3b8', marginBottom: 20 }}>{error}</p>
        <button onClick={() => navigate('/stories')} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#38bdf8', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}>
          Back to Stories
        </button>
      </div>
    );
  }

  // ── Story List View ────────────────────────────────────────────
  if (!storyId) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 8px' }}>
            📖 Story Mode
          </h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Learn English through interactive stories</p>
        </div>

        {stories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: '#1e293b', borderRadius: 20 }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>📚</div>
            <h3 style={{ color: '#f1f5f9', marginBottom: 8 }}>No stories available</h3>
            <p style={{ color: '#94a3b8' }}>Check back later for new stories!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {stories.map((story) => (
              <div
                key={story.id}
                style={{ background: '#1e293b', borderRadius: 16, overflow: 'hidden', border: '1px solid #334155', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ height: 120, background: `linear-gradient(135deg, ${getStoryColor(story.level)}, ${getStoryColor(story.level)}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                  📖
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, background: '#334155', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                      {story.level || 'A1'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{story.estimatedMinutes} min</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>• {story.totalSteps} steps</span>
                  </div>
                  <h3 style={{ color: '#f1f5f9', margin: '0 0 8px', fontSize: '1.1rem' }}>{story.title}</h3>
                  <p style={{ color: '#94a3b8', margin: '0 0 16px', fontSize: '0.85rem', lineHeight: 1.4 }}>{story.description}</p>
                  <Link
                    to={`/stories/${story.id}`}
                    style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 10, background: '#38bdf8', color: '#0f172a', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}
                  >
                    Start Reading →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Story Reading View ─────────────────────────────────────────
  if (completed || score !== null) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '5rem', marginBottom: 24 }}>
          {score >= 80 ? '🏆' : score >= 50 ? '👏' : '💪'}
        </div>
        <h1 style={{ color: '#f1f5f9', fontSize: '2rem', marginBottom: 8 }}>
          {score >= 80 ? 'Excellent!' : score >= 50 ? 'Good Job!' : 'Keep Practicing!'}
        </h1>
        <div style={{ fontSize: '3rem', fontWeight: 900, color: score >= 80 ? '#fbbf24' : score >= 50 ? '#38bdf8' : '#f97316', marginBottom: 24 }}>
          {score}%
        </div>
        <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid #334155' }}>
          <h3 style={{ color: '#f1f5f9', margin: '0 0 16px' }}>Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left' }}>
            <div style={{ background: '#0f172a', borderRadius: 12, padding: 12 }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Correct</div>
              <div style={{ color: '#22c55e', fontSize: '1.5rem', fontWeight: 700 }}>
                {currentStory?.correctCount ?? feedback?.correctCount ?? 0}
              </div>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 12, padding: 12 }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Total</div>
              <div style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 700 }}>
                {steps.length}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/stories" style={{ padding: '12px 24px', borderRadius: 12, background: '#334155', color: '#f1f5f9', textDecoration: 'none', fontWeight: 700 }}>
            All Stories
          </Link>
          <button onClick={loadStory} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#38bdf8', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}>
            Read Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Link to="/stories" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            ← All Stories
          </Link>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 800, color: '#f1f5f9' }}>
            {currentStory?.title}
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Step {currentStep + 1} of {steps.length}</div>
          <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem' }}>
            {currentStory?.correctCount || 0} correct
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <ProgressBar value={currentStep + 1} max={steps.length} color="#38bdf8" />
      </div>

      {/* Story Content */}
      {currentStepData && (
        <div style={{ background: '#1e293b', borderRadius: 20, overflow: 'hidden', marginBottom: 20, border: '1px solid #334155' }}>
          {currentStepData.imageUrl && (
            <img src={currentStepData.imageUrl} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />
          )}
          <div style={{ padding: 28 }}>
            <div style={{ fontSize: '1rem', color: '#e2e8f0', lineHeight: 1.8, marginBottom: currentStepData.question ? 20 : 0 }}>
              {currentStepData.content}
            </div>

            {currentStepData.question && (
              <div style={{ background: '#0f172a', borderRadius: 12, padding: 16 }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>
                  ❓ {currentStepData.question}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {options.map((opt, i) => {
                    const label = ['A', 'B', 'C'][i];
                    const isSelected = selectedAnswer === label;
                    const isCorrect = feedback?.correctAnswer === label;
                    const isWrong = isSelected && feedback && !feedback.correct;
                    const bg = isCorrect ? '#22c55e18' : isWrong ? '#ef444418' : isSelected ? '#38bdf818' : '#1e293b';
                    const border = isCorrect ? '#22c55e' : isWrong ? '#ef4444' : isSelected ? '#38bdf8' : '#334155';

                    return (
                      <button
                        key={i}
                        onClick={() => !feedback && handleAnswer(label)}
                        disabled={!!feedback}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 12,
                          background: bg,
                          border: `2px solid ${border}`,
                          color: '#f1f5f9',
                          textAlign: 'left',
                          cursor: feedback ? 'default' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ width: 28, height: 28, borderRadius: '50%', background: isSelected ? border : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>
                          {label}
                        </span>
                        {opt}
                        {isCorrect && <span style={{ marginLeft: 'auto', color: '#22c55e' }}>✓</span>}
                        {isWrong && <span style={{ marginLeft: 'auto', color: '#ef4444' }}>✗</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div style={{ background: feedback.correct ? '#22c55e18' : '#ef444418', border: `1px solid ${feedback.correct ? '#22c55e' : '#ef4444'}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>{feedback.correct ? '✅' : '❌'}</span>
            <span style={{ fontWeight: 700, color: feedback.correct ? '#22c55e' : '#ef4444', fontSize: '1rem' }}>
              {feedback.correct ? 'Correct!' : 'Incorrect'}
            </span>
          </div>
          {!feedback.correct && (
            <div style={{ color: '#f1f5f9', marginBottom: 8 }}>
              Correct answer: <strong style={{ color: '#22c55e' }}>{feedback.correctAnswer}</strong>
            </div>
          )}
          {feedback.explanation && (
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
              💡 {feedback.explanation}
            </div>
          )}
          <button
            onClick={goNextStep}
            style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none', background: '#38bdf8', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}
          >
            {feedback.isLastStep ? 'See Results' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}

function getStoryColor(level) {
  const map = { A1: '#22c55e', A2: '#10b981', B1: '#38bdf8', B2: '#8b5cf6', C1: '#f97316', C2: '#ef4444' };
  return map[level] || '#38bdf8';
}
