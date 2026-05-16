import React, { useState } from 'react';
import { Check, Circle, Lock, Clock } from 'lucide-react';

const QuestionNavigator = ({
  questions = [],
  answers = {},
  currentIndex = 0,
  onNavigate = () => {},
  sections = [],
  currentSection = null,
  onSectionChange = () => {},
  disabled = false,
  timeLeft = 0,
}) => {
  const [showSections, setShowSections] = useState(false);

  const getQuestionStatus = (q, index) => {
    const key = q?.index !== undefined ? `q_${q.index}` : `q_${index}`;
    const hasAnswer = answers[key] !== undefined && answers[key] !== '' && answers[key] !== null;
    const isCurrent = index === currentIndex;
    const hasAudio = q?.type === 'SPEAKING' && answers[`${key}_audio`];

    return { hasAnswer, isCurrent, hasAudio };
  };

  const getStatusColor = (status) => {
    if (status.isCurrent) return { bg: '#8b5cf6', text: 'white', border: '#8b5cf6' };
    if (status.hasAudio) return { bg: '#22C55E', text: 'white', border: '#22C55E' };
    if (status.hasAnswer) return { bg: '#22C55E', text: 'white', border: '#22C55E33' };
    return { bg: 'rgba(0,0,0,0.06)', text: '#718096', border: 'transparent' };
  };

  const handleQuestionClick = (index) => {
    if (disabled) return;
    onNavigate(index);
  };

  const handleSectionClick = (section) => {
    if (disabled) return;
    onSectionChange(section);
    setShowSections(false);
  };

  const totalAnswered = Object.values(answers).filter(v => v !== '' && v != null).length;
  const totalQuestions = questions.length;

  return (
    <div className="clay-card" style={{ padding: 16 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1a202c' }}>
          Điều hướng câu hỏi
        </span>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: totalAnswered === totalQuestions ? '#22C55E' : '#718096',
          background: totalAnswered === totalQuestions ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.05)',
          padding: '2px 8px',
          borderRadius: 6,
        }}>
          {totalAnswered}/{totalQuestions}
        </span>
      </div>

      {sections.length > 0 && currentSection && (
        <button
          onClick={() => setShowSections(!showSections)}
          className="clay-btn"
          style={{
            width: '100%',
            marginBottom: 12,
            padding: '8px 12px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            <strong>{currentSection.title}</strong>
            <span style={{ color: '#718096', marginLeft: 6 }}>
              ({currentSection.questionsCount} câu)
            </span>
          </span>
          <span style={{ transform: showSections ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>
      )}

      {showSections && sections.length > 0 && (
        <div style={{
          marginBottom: 12,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)',
        }}>
          {sections.map((section, idx) => {
            const isActive = currentSection?.id === section.id;
            const answeredInSection = section.questions?.filter((q, i) => {
              const key = `q_${q.index !== undefined ? q.index : questions.indexOf(q)}`;
              return answers[key] !== undefined && answers[key] !== '';
            }).length || 0;

            return (
              <button
                key={section.id || idx}
                onClick={() => handleSectionClick(section)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: isActive ? 'rgba(139,92,246,0.1)' : 'white',
                  border: 'none',
                  borderBottom: idx < sections.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isActive ? '#8b5cf6' : '#a0aec0',
                  }} />
                  <span style={{ fontWeight: 700, color: isActive ? '#8b5cf6' : '#4a5568' }}>
                    {section.title}
                  </span>
                </div>
                <span style={{ color: '#718096', fontWeight: 600 }}>
                  {answeredInSection}/{section.questionsCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
        gap: 6,
        marginBottom: 12,
      }}>
        {questions.map((q, idx) => {
          const status = getQuestionStatus(q, idx);
          const colors = getStatusColor(status);

          return (
            <button
              key={idx}
              onClick={() => handleQuestionClick(idx)}
              disabled={disabled}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: colors.bg,
                color: colors.text,
                border: `2px solid ${colors.border}`,
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                opacity: disabled ? 0.6 : 1,
                boxShadow: status.isCurrent ? '0 0 0 3px rgba(139,92,246,0.3)' : 'none',
              }}
            >
              {status.hasAnswer ? (
                status.hasAudio ? <Check size={14} /> : <Check size={14} />
              ) : (
                <span>{idx + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        fontSize: '0.7rem',
        color: '#718096',
        fontWeight: 600,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 4,
            background: '#22C55E',
          }} />
          <span>Đã trả lời</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 4,
            background: 'rgba(139,92,246,0.2)',
            border: '2px solid #8b5cf6',
          }} />
          <span>Hiện tại</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 4,
            background: 'rgba(0,0,0,0.06)',
          }} />
          <span>Chưa trả lời</span>
        </div>
      </div>

      {timeLeft > 0 && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          borderRadius: 8,
          background: timeLeft < 300 ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.75rem',
          fontWeight: 700,
          color: timeLeft < 300 ? '#ef4444' : '#718096',
        }}>
          <Clock size={12} />
          <span>{Math.floor(timeLeft / 60)}p {timeLeft % 60}s còn lại</span>
        </div>
      )}
    </div>
  );
};

export default QuestionNavigator;
