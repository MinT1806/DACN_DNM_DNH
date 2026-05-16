import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Headphones, PenTool, Mic, ChevronRight, ChevronLeft,
  CheckCircle, Sparkles, Clock, Target, ArrowRight } from 'lucide-react';
import { aiExerciseAPI } from '../api/aiExerciseApi';

const SKILL_ICONS = {
  READING: <BookOpen size={28} />,
  LISTENING: <Headphones size={28} />,
  WRITING: <PenTool size={28} />,
  SPEAKING: <Mic size={28} />,
};

const SKILL_COLORS = {
  READING: { bg: '#8b5cf622', color: '#8b5cf6', border: '#8b5cf633' },
  LISTENING: { bg: '#3b82f622', color: '#3b82F6', border: '#3b82f633' },
  WRITING: { bg: '#f59e0b22', color: '#f59e0b', border: '#f59e0b33' },
  SPEAKING: { bg: '#22c55e22', color: '#22C55E', border: '#22c55e33' },
};

const LEVEL_COLORS = {
  A1: { bg: '#22C55E22', color: '#22C55E' },
  A2: { bg: '#3B82F622', color: '#3B82F6' },
  B1: { bg: '#8B5CF622', color: '#8B5CF6' },
  B2: { bg: '#F59E0B22', color: '#F59E0B' },
  C1: { bg: '#EF444422', color: '#EF4444' },
};

const STEP_LABELS = ['Chọn kỹ năng', 'Chọn chủ đề', 'Chọn cấp độ', 'Bắt đầu'];

function SkillCard({ skill, selected, onClick }) {
  const colors = SKILL_COLORS[skill.id] || { bg: '#8b5cf622', color: '#8b5cf6', border: '#8b5cf633' };
  const isSelected = selected?.id === skill.id;

  return (
    <div
      onClick={onClick}
      className="clay-card"
      style={{
        padding: 24,
        cursor: 'pointer',
        border: isSelected ? `3px solid ${colors.color}` : '3px solid transparent',
        background: isSelected ? colors.bg : '#fff',
        transition: 'all 0.25s ease',
        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 24, height: 24, borderRadius: '50%',
          background: colors.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={14} color="white" />
        </div>
      )}
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: colors.color, marginBottom: 14,
        boxShadow: `0 4px 12px ${colors.border}`,
      }}>
        {SKILL_ICONS[skill.id]}
      </div>
      <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a202c', marginBottom: 6 }}>
        {skill.label}
      </h3>
      <p style={{ fontSize: '0.82rem', color: '#718096', lineHeight: 1.5 }}>
        {skill.description}
      </p>
    </div>
  );
}

function TopicCard({ topic, selected, onClick }) {
  const isSelected = selected?.id === topic.id;

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 18px',
        borderRadius: 12,
        cursor: 'pointer',
        border: isSelected ? '2px solid #8b5cf6' : '2px solid #e2e8f0',
        background: isSelected ? '#8b5cf611' : '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transition: 'all 0.2s',
        fontWeight: isSelected ? 700 : 600,
        color: isSelected ? '#8b5cf6' : '#4a5568',
        fontSize: '0.9rem',
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>{topic.icon}</span>
      {topic.label}
      {isSelected && <CheckCircle size={14} style={{ marginLeft: 'auto' }} />}
    </div>
  );
}

function LevelCard({ level, selected, onClick }) {
  const colors = LEVEL_COLORS[level.id] || { bg: '#71809622', color: '#718096' };
  const isSelected = selected?.id === level.id;

  return (
    <div
      onClick={onClick}
      style={{
        padding: 16,
        borderRadius: 14,
        cursor: 'pointer',
        border: isSelected ? `2.5px solid ${colors.color}` : '2px solid #e2e8f0',
        background: isSelected ? colors.bg : '#fff',
        transition: 'all 0.2s',
        textAlign: 'center',
      }}
    >
      <div style={{
        fontSize: '1.1rem', fontWeight: 900, color: colors.color, marginBottom: 4,
      }}>
        {level.id}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 500 }}>
        {level.description}
      </div>
    </div>
  );
}

function StepProgress({ currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
      {STEP_LABELS.map((label, idx) => {
        const isActive = idx === currentStep;
        const isDone = idx < currentStep;
        return (
          <React.Fragment key={idx}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: isDone ? '#22C55E' : isActive ? '#8b5cf6' : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDone || isActive ? 'white' : '#a0aec0',
                fontWeight: 800, fontSize: '0.82rem',
                transition: 'all 0.3s',
                boxShadow: isActive ? '0 0 0 4px #8b5cf622' : 'none',
              }}>
                {isDone ? <CheckCircle size={18} /> : idx + 1}
              </div>
              <span style={{
                fontSize: '0.72rem', fontWeight: 600,
                color: isActive ? '#8b5cf6' : isDone ? '#22C55E' : '#a0aec0',
                maxWidth: 80, textAlign: 'center',
              }}>
                {label}
              </span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div style={{
                width: 40, height: 2, marginBottom: 22,
                background: isDone ? '#22C55E' : '#e2e8f0',
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Mock data (fallback when API fails) ───────────────────────────────────────
const MOCK_SKILLS = [
  { id: 'READING', label: 'Đọc hiểu', icon: 'book', description: 'Đọc đoạn văn và trả lời câu hỏi' },
  { id: 'LISTENING', label: 'Nghe hiểu', icon: 'headphones', description: 'Nghe audio và trả lời câu hỏi' },
  { id: 'WRITING', label: 'Viết bài', icon: 'pen', description: 'Viết bài luận với phản hồi AI' },
  { id: 'SPEAKING', label: 'Nói tiếng Anh', icon: 'mic', description: 'Ghi âm và nhận phản hồi AI' },
];

const MOCK_LEVELS = [
  { id: 'A1', label: 'A1 - Beginner', description: 'Người mới bắt đầu' },
  { id: 'A2', label: 'A2 - Elementary', description: 'Sơ cấp' },
  { id: 'B1', label: 'B1 - Intermediate', description: 'Trung cấp' },
  { id: 'B2', label: 'B2 - Upper Intermediate', description: 'Trung cấp cao' },
  { id: 'C1', label: 'C1 - Advanced', description: 'Nâng cao' },
];

const MOCK_TOPICS = {
  READING: [
    { id: 'travel', label: 'Du lịch', icon: '✈️' },
    { id: 'business', label: 'Kinh doanh', icon: '💼' },
    { id: 'daily-life', label: 'Đời thường', icon: '🏠' },
    { id: 'technology', label: 'Công nghệ', icon: '💻' },
    { id: 'health', label: 'Sức khỏe', icon: '🏥' },
    { id: 'education', label: 'Giáo dục', icon: '🎓' },
    { id: 'environment', label: 'Môi trường', icon: '🌍' },
    { id: 'entertainment', label: 'Giải trí', icon: '🎬' },
    { id: 'science', label: 'Khoa học', icon: '🔬' },
    { id: 'sports', label: 'Thể thao', icon: '⚽' },
  ],
  LISTENING: [
    { id: 'travel', label: 'Du lịch', icon: '✈️' },
    { id: 'business', label: 'Kinh doanh', icon: '💼' },
    { id: 'daily-life', label: 'Đời thường', icon: '🏠' },
    { id: 'technology', label: 'Công nghệ', icon: '💻' },
    { id: 'news', label: 'Tin tức', icon: '📰' },
    { id: 'interview', label: 'Phỏng vấn', icon: '🎤' },
    { id: 'lecture', label: 'Bài giảng', icon: '🎓' },
    { id: 'podcast', label: 'Podcast', icon: '🎧' },
  ],
  WRITING: [
    { id: 'opinion', label: 'Trình bày ý kiến', icon: '💡' },
    { id: 'descriptive', label: 'Miêu tả', icon: '📝' },
    { id: 'formal-letter', label: 'Thư formal', icon: '✉️' },
    { id: 'essay', label: 'Essay', icon: '📄' },
    { id: 'email', label: 'Email', icon: '📧' },
  ],
  SPEAKING: [
    { id: 'introduction', label: 'Giới thiệu bản thân', icon: '👋' },
    { id: 'opinion', label: 'Trình bày ý kiến', icon: '💬' },
    { id: 'describe-situation', label: 'Mô tả tình huống', icon: '🗣️' },
    { id: 'roleplay', label: 'Đóng vai', icon: '🎭' },
    { id: 'summarize', label: 'Tóm tắt', icon: '📋' },
  ],
};

// ─── Main Component ──────────────────────────────────────────────────────────────
export default function SkillSelectionPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Load skills and levels on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [skillsRes, levelsRes] = await Promise.all([
        aiExerciseAPI.getSkills(),
        aiExerciseAPI.getLevels(),
      ]);
      if (skillsRes.data?.success) {
        // API returned data
        if (skillsRes.data.data && Array.isArray(skillsRes.data.data.skills)) {
          // skills wrapped in {skills: [...]}
          setSkills(skillsRes.data.data.skills);
        } else if (Array.isArray(skillsRes.data.data)) {
          // skills directly as array
          setSkills(skillsRes.data.data);
        } else {
          setSkills(MOCK_SKILLS);
        }
      } else {
        setSkills(MOCK_SKILLS);
      }
      if (levelsRes.data?.success) {
        if (levelsRes.data.data && Array.isArray(levelsRes.data.data.levels)) {
          setLevels(levelsRes.data.data.levels);
        } else if (Array.isArray(levelsRes.data.data)) {
          setLevels(levelsRes.data.data);
        } else {
          setLevels(MOCK_LEVELS);
        }
      } else {
        setLevels(MOCK_LEVELS);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setSkills(MOCK_SKILLS);
      setLevels(MOCK_LEVELS);
    }
    setLoading(false);
  };

  // Local state for skills/levels (initialized from mock)
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [levels, setLevels] = useState(MOCK_LEVELS);

  const handleSkillSelect = async (skill) => {
    setSelectedSkill(skill);
    setSelectedTopic(null);
    setLoadingTopics(true);
    setError(null);

    try {
      const res = await aiExerciseAPI.getTopics(skill.id);
      if (res.data?.success && res.data?.data?.topics) {
        setTopics(res.data.data.topics);
      } else if (res.data?.success && Array.isArray(res.data.data)) {
        setTopics(res.data.data);
      } else {
        // Fallback to mock topics
        setTopics(MOCK_TOPICS[skill.id] || []);
      }
    } catch (err) {
      console.error('Failed to load topics:', err);
      // Always fallback to mock topics on error
      setTopics(MOCK_TOPICS[skill.id] || []);
    }
    setLoadingTopics(false);
  };

  const handleNext = () => {
    if (step === 0 && selectedSkill) {
      setStep(1);
    } else if (step === 1 && selectedTopic) {
      setStep(2);
    } else if (step === 2 && selectedLevel) {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await aiExerciseAPI.generateExercise({
        skill: selectedSkill.id,
        topic: selectedTopic.id,
        level: selectedLevel.id,
      });
      if (res.data?.success && res.data?.data?.exerciseId) {
        navigate(`/ai-exercise/${selectedSkill.id.toLowerCase()}?exerciseId=${res.data.data.exerciseId}&skill=${selectedSkill.id}&topic=${selectedTopic.id}&level=${selectedLevel.id}`);
      } else {
        setError('Không thể tạo bài tập. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Failed to generate exercise:', err);
      const msg = err.response?.data?.message || err.message || 'Không thể tạo bài tập. Vui lòng thử lại.';
      setError(msg);
    }
    setGenerating(false);
  };

  const canProceed = () => {
    if (step === 0) return !!selectedSkill;
    if (step === 1) return !!selectedTopic;
    if (step === 2) return !!selectedLevel;
    return false;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', border: '4px solid #e2e8f0',
            borderTopColor: '#8b5cf6', animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#718096', fontWeight: 600 }}>Đang tải...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <Sparkles size={22} color="#8b5cf6" />
          <h1 style={{ fontWeight: 900, fontSize: '1.6rem', color: '#1a202c' }}>
            Luyện tập AI
          </h1>
          <Sparkles size={22} color="#8b5cf6" />
        </div>
        <p style={{ color: '#718096', fontSize: '0.9rem', fontWeight: 500 }}>
          Chọn kỹ năng, chủ đề và cấp độ phù hợp với bạn
        </p>
      </div>

      {/* Step Progress */}
      <StepProgress currentStep={step} />

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 12, marginBottom: 20,
          background: '#fef2f2', border: '2px solid #ef4444',
          color: '#ef4444', fontWeight: 600, fontSize: '0.88rem',
          textAlign: 'center',
        }}>
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Step 0: Skills */}
      {step === 0 && (
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a202c', marginBottom: 20, textAlign: 'center' }}>
            Bạn muốn luyện kỹ năng nào?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
          }}>
            {skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                selected={selectedSkill}
                onClick={() => handleSkillSelect(skill)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Topics */}
      {step === 1 && (
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a202c', marginBottom: 8, textAlign: 'center' }}>
            Chọn chủ đề cho <span style={{ color: SKILL_COLORS[selectedSkill?.id]?.color }}>
              {selectedSkill?.label}
            </span>
          </h2>
          <p style={{ textAlign: 'center', color: '#718096', fontSize: '0.82rem', marginBottom: 24 }}>
            {loadingTopics ? 'Đang tải chủ đề...' : `Có ${topics.length} chủ đề khả dụng`}
          </p>

          {loadingTopics ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0',
                borderTopColor: '#8b5cf6', animation: 'spin 0.8s linear infinite',
                margin: '0 auto',
              }} />
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 10,
            }}>
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  selected={selectedTopic}
                  onClick={() => setSelectedTopic(topic)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Levels */}
      {step === 2 && (
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a202c', marginBottom: 8, textAlign: 'center' }}>
            Chọn cấp độ của bạn
          </h2>
          <p style={{ textAlign: 'center', color: '#718096', fontSize: '0.82rem', marginBottom: 24 }}>
            {selectedTopic?.label} • {selectedSkill?.label}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 12,
          }}>
            {levels.map((level) => (
              <LevelCard
                key={level.id}
                level={level}
                selected={selectedLevel}
                onClick={() => setSelectedLevel(level)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Ready */}
      {step === 3 && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            {SKILL_ICONS[selectedSkill?.id]}
          </div>
          <h2 style={{ fontWeight: 900, fontSize: '1.3rem', color: '#1a202c', marginBottom: 12 }}>
            Sẵn sàng bắt đầu!
          </h2>
          <div style={{
            display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <span style={{
              padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
              background: SKILL_COLORS[selectedSkill?.id]?.bg,
              color: SKILL_COLORS[selectedSkill?.id]?.color,
            }}>
              {selectedSkill?.label}
            </span>
            <span style={{
              padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
              background: '#f59e0b22', color: '#f59e0b',
            }}>
              {selectedTopic?.label}
            </span>
            <span style={{
              padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
              background: LEVEL_COLORS[selectedLevel?.id]?.bg || '#71809622',
              color: LEVEL_COLORS[selectedLevel?.id]?.color || '#718096',
            }}>
              Cấp {selectedLevel?.id}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 32, paddingTop: 24,
      }}>
        <button
          onClick={handleBack}
          className="clay-btn"
          disabled={step === 0}
          style={{
            opacity: step === 0 ? 0.4 : 1,
            padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <ChevronLeft size={18} />
          Quay lại
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed() || generating}
          className="clay-btn clay-btn-primary"
          style={{
            opacity: canProceed() ? 1 : 0.5,
            padding: '10px 28px',
            fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {generating ? (
            <>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white', animation: 'spin 0.8s linear infinite',
              }} />
              Đang tạo bài...
            </>
          ) : step < 3 ? (
            <>Tiếp tục <ChevronRight size={18} /></>
          ) : (
            <><Sparkles size={16} /> Bắt đầu luyện tập</>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
