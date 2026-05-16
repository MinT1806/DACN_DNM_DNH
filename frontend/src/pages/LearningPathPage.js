import React, { useEffect, useState } from 'react';
import { learningPathAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Map, CheckCircle, Circle, ChevronRight, Target, Zap } from 'lucide-react';

const PRIORITY_COLOR = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22C55E' };

export default function LearningPathPage() {
  const { user } = useAuth();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    learningPathAPI.getPath()
      .then(r => setPath(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🗺️</div>
          <div style={{ fontWeight: 700, color: '#718096' }}>Đang tạo lộ trình...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#1a202c', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Map size={28} color="#22C55E" /> Lộ Trình Học
      </h1>
      <p style={{ color: '#718096', fontWeight: 600, marginBottom: 28 }}>
        Lộ trình cá nhân hóa dựa trên trình độ và điểm yếu của bạn
      </p>

      {/* Current level + Next level */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div className="clay-card" style={{
          padding: 28,
          background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(173,216,230,0.1))',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#718096', marginBottom: 8 }}>TRÌNH ĐỘ HIỆN TẠI</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#22C55E', marginBottom: 4 }}>
            {path?.currentLevel || user?.level}
          </div>
          {path?.ageGroup && (
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#718096' }}>
              Nhóm tuổi: {path.ageGroup}
            </div>
          )}
          {path?.estimatedWeeks && (
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', marginTop: 8 }}>
              ⏱️ Ước tính {path.estimatedWeeks} tuần để lên level
            </div>
          )}
        </div>
        <div className="clay-card" style={{
          padding: 28,
          background: 'linear-gradient(135deg, rgba(253,188,180,0.15), rgba(253,188,180,0.05))',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#718096', marginBottom: 8 }}>LEVEL TIẾP THEO</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FDBCB4', marginBottom: 8 }}>
            {path?.nextLevel?.nextLevel || '—'}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
            {path?.nextLevel?.requirements || 'Tiếp tục luyện tập để tiến lên!'}
          </p>
        </div>
      </div>

      {/* Milestones */}
      {path?.milestones?.length > 0 && (
        <div className="clay-card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={20} color="#8b5cf6" /> Mốc quan trọng
          </h3>
          <div style={{ position: 'relative' }}>
            {path.milestones.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ color: m.completed ? '#22C55E' : '#e2e8f0' }}>
                    {m.completed ? <CheckCircle size={24} fill="#22C55E" /> : <Circle size={24} />}
                  </div>
                  {i < path.milestones.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 20, background: m.completed ? '#22C55E' : '#e2e8f0', margin: '4px 0' }} />
                  )}
                </div>
                <div style={{
                  flex: 1, padding: '12px 16px', borderRadius: 14,
                  background: m.completed ? 'rgba(34,197,94,0.06)' : 'rgba(0,0,0,0.02)',
                  border: `2px solid ${m.completed ? 'rgba(34,197,94,0.2)' : 'rgba(0,0,0,0.06)'}`,
                  marginBottom: 4,
                }}>
                  <div style={{ fontWeight: 800, color: m.completed ? '#16a34a' : '#1a202c', marginBottom: 4 }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                    {m.completed ? `✅ Hoàn thành (${m.score}/10)` : `⏳ Chưa hoàn thành`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested exercises */}
      {path?.suggestedExercises?.length > 0 && (
        <div className="clay-card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={20} color="#f59e0b" /> Bài tập gợi ý
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {path.suggestedExercises.map((ex, i) => (
              <Link key={i} to="/exercises" style={{ textDecoration: 'none' }}>
                <div className="clay-card" style={{ padding: 20, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 8,
                      background: PRIORITY_COLOR[ex.priority] + '22',
                      color: PRIORITY_COLOR[ex.priority],
                      fontWeight: 800, fontSize: '0.72rem',
                    }}>{ex.priority}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: '#718096' }}>{ex.level}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 6 }}>{ex.skill}</div>
                  <p style={{ color: '#718096', fontWeight: 600, fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>{ex.description}</p>
                  <div style={{ marginTop: 12, color: '#22C55E', fontWeight: 800, fontSize: '0.85rem' }}>
                    Luyện ngay <ChevronRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No data fallback */}
      {!path && (
        <div className="clay-card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🗺️</div>
          <h3 style={{ fontWeight: 900, color: '#1a202c', marginBottom: 8 }}>Lộ trình đang được tạo</h3>
          <p style={{ color: '#718096', fontWeight: 600, marginBottom: 20 }}>
            Hãy hoàn thành một số bài tập để nhận lộ trình học tập cá nhân hóa!
          </p>
          <Link to="/exercises">
            <button className="clay-btn clay-btn-primary">Làm bài tập ngay</button>
          </Link>
        </div>
      )}
    </div>
  );
}
