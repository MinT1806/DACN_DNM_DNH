import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, BookOpen, Sparkles, Target, ChevronRight, CheckCircle, Clock } from 'lucide-react';

export default function RecommendationPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
    fetchWeeklyPlan();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/recommendations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  };

  const fetchWeeklyPlan = async () => {
    try {
      const res = await fetch('/api/recommendations/weekly-plan', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setWeeklyPlan(await res.json());
    } catch {}
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#718096', fontWeight: 600 }}>Đang phân tích...</div>;
  }

  const LEVEL_COLORS = { A1: '#22C55E', A2: '#3B82F6', B1: '#8B5CF6', B2: '#F59E0B', C1: '#EF4444' };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 4 }}>
          🧠 Lộ trình học cá nhân hoá
        </h1>
        <p style={{ color: '#718096', fontWeight: 600 }}>
          Kế hoạch học tập được AI phân tích và đề xuất riêng cho bạn
        </p>
      </div>

      {/* AI Insight */}
      {data?.aiInsight && (
        <div className="clay-card" style={{ padding: 24, marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.08))',
          border: '2px solid rgba(34,197,94,0.2)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Brain size={24} color="#22C55E" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 6 }}>🤖 Phân tích từ AI</div>
              <p style={{ color: '#4a5568', lineHeight: 1.8, fontWeight: 600 }}>{data.aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Skill Analysis */}
      {data?.skillScores && (
        <div className="clay-card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, color: '#1a202c' }}>📊 Phân tích kỹ năng</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {Object.entries(data.skillScores).map(([skill, score]) => {
              const scoreNum = parseFloat(score) || 0;
              const isWeak = scoreNum > 0 && scoreNum < 6;
              return (
                <div key={skill} style={{ padding: 16, borderRadius: 14, background: 'rgba(0,0,0,0.02)', border: `2px solid ${isWeak ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.04)'}` }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#718096', marginBottom: 8, textTransform: 'capitalize' }}>{skill.toLowerCase()}</div>
                  <div style={{ fontWeight: 900, fontSize: '1.5rem', color: isWeak ? '#EF4444' : '#22C55E' }}>{scoreNum}/10</div>
                  <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 6, height: 6, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${scoreNum * 10}%`, height: '100%', background: isWeak ? '#EF4444' : '#22C55E', borderRadius: 6, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
          {data.weakSkills?.length > 0 && (
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '2px solid rgba(239,68,68,0.15)' }}>
              <div style={{ fontWeight: 700, color: '#EF4444', fontSize: '0.9rem', marginBottom: 4 }}>⚠️ Điểm yếu cần cải thiện:</div>
              <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>
                {data.weakSkills.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weekly Plan */}
      {weeklyPlan && (
        <div className="clay-card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, color: '#1a202c' }}>📅 Lịch học tuần này</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {Object.entries(weeklyPlan).map(([day, plan]) => (
              <div key={day} style={{ padding: 16, borderRadius: 14, background: 'rgba(0,0,0,0.02)', border: '2px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} color="#22C55E" />
                  {day}
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', background: '#22C55E22', color: '#22C55E', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                    {plan.focus}
                  </span>
                </div>
                {plan.activities?.map((act, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.85rem', color: '#4a5568', fontWeight: 600 }}>
                    <CheckCircle size={12} color="#22C55E" />
                    {act.type}
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#a0aec0' }}>{act.duration}</span>
                  </div>
                ))}
                {plan.tip && (
                  <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#718096', fontStyle: 'italic', fontWeight: 600 }}>
                    💡 {plan.tip}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Path */}
      {data?.learningPath && (
        <div className="clay-card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, color: '#1a202c' }}>🗺️ Lộ trình học tập</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.learningPath.map((item, i) => (
              <div key={i} style={{
                padding: '16px 20px', borderRadius: 14,
                background: `rgba(${
                  item.type === 'skill_training' ? '139,92,246' :
                  item.type === 'vocabulary' ? '34,197,94' :
                  item.type === 'course' ? '59,130,246' : '236,72,153'
                }, 0.06)`,
                border: `2px solid rgba(${
                  item.type === 'skill_training' ? '139,92,246' :
                  item.type === 'vocabulary' ? '34,197,94' :
                  item.type === 'course' ? '59,130,246' : '236,72,153'
                }, 0.15)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `rgba(${
                    item.type === 'skill_training' ? '139,92,246' :
                    item.type === 'vocabulary' ? '34,197,94' :
                    item.type === 'course' ? '59,130,246' : '236,72,153'
                  }, 0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>#{item.priority}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#1a202c' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>{item.description}</div>
                    <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: 2 }}>⏱️ {item.estimatedTime}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Courses */}
      {data?.recommendedCourses?.length > 0 && (
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, color: '#1a202c' }}>📚 Khóa học được đề xuất</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {data.recommendedCourses.map((course, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 16, background: 'rgba(0,0,0,0.02)', border: '2px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>{course.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: 8, lineHeight: 1.6 }}>{course.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: 600 }}>⭐ {course.rating} • {course.totalLessons} bài</span>
                  <span style={{ fontSize: '0.75rem', background: '#22C55E22', color: '#22C55E', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{course.level}</span>
                </div>
                {course.reason && (
                  <div style={{ fontSize: '0.8rem', color: '#22C55E', fontWeight: 600 }}>→ {course.reason}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
