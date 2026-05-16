import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { BarChart2, TrendingUp, Target, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const SKILL_COLORS = {
  WRITING: '#FDBCB4', SPEAKING: '#f59e0b',
  READING: '#8b5cf6', LISTENING: '#06b6d4',
};

export default function LearningAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getMyAnalytics()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 700, color: '#718096' }}>Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (!data || data.totalExercises === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <div className="clay-card" style={{ padding: 48 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>📈</div>
          <h2 style={{ fontWeight: 900, color: '#1a202c', marginBottom: 12 }}>Chưa có dữ liệu</h2>
          <p style={{ color: '#718096', fontWeight: 600, lineHeight: 1.7 }}>
            Hãy hoàn thành ít nhất một bài tập để hệ thống phân tích quá trình học tập của bạn!
          </p>
        </div>
      </div>
    );
  }

  const radarData = Object.entries(data.skillAverages || {}).map(([skill, score]) => ({
    skill: skill.slice(0, 4),
    score,
    fullMark: 10,
  }));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#1a202c', marginBottom: 8 }}>📊 Thống Kê Học Tập</h1>
      <p style={{ color: '#718096', fontWeight: 600, marginBottom: 28 }}>Phân tích tiến độ và điểm mạnh/yếu của bạn</p>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '📝', label: 'Bài đã làm', value: data.totalExercises, color: '#22C55E' },
          { icon: '⭐', label: 'Điểm TB', value: `${data.overallAverage}/10`, color: '#f59e0b' },
          { icon: '📅', label: 'Ngày học', value: data.activeDays, color: '#3b82f6' },
          { icon: '🏆', label: 'Tổng điểm', value: user?.totalPoints || 0, color: '#FDBCB4' },
          { icon: '📚', label: 'Level hiện tại', value: data.currentLevel, color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} className="clay-card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontWeight: 900, fontSize: '1.4rem', color: stat.color, marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 700 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Radar chart */}
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} color="#22C55E" /> Kỹ năng tổng quan
          </h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fontWeight: 700 }} />
                <Radar name="Score" dataKey="score" stroke="#22C55E" fill="#22C55E" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#718096' }}>Chưa đủ dữ liệu</div>
          )}
        </div>

        {/* Score trend */}
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#3b82f6" /> Xu hướng điểm số
          </h3>
          {data.scoreTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}/10`, 'Điểm']} />
                <Line type="monotone" dataKey="score" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#718096' }}>Chưa đủ dữ liệu</div>
          )}
        </div>
      </div>

      {/* Skill averages */}
      <div className="clay-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={18} color="#8b5cf6" /> Điểm trung bình theo kỹ năng
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {Object.entries(data.skillAverages || {}).map(([skill, score]) => (
            <div key={skill} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.02)', border: '2px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.9rem' }}>{skill}</span>
                <span style={{
                  fontWeight: 900, fontSize: '1.1rem',
                  color: score >= 7.5 ? '#22C55E' : score >= 5 ? '#f59e0b' : score > 0 ? '#ef4444' : '#a0aec0',
                }}>{score > 0 ? `${score}/10` : 'N/A'}</span>
              </div>
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: SKILL_COLORS[skill] || '#22C55E',
                  width: `${(score / 10) * 100}%`,
                  transition: 'width 0.5s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak/Strong + Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#ef4444" /> Điểm cần cải thiện
          </h3>
          {data.weakSkills?.length > 0 ? (
            data.weakSkills.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '2px solid rgba(239,68,68,0.12)', marginBottom: 8 }}>
                <span style={{ fontSize: '1rem' }}>⚠️</span>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>{s}</span>
              </div>
            ))
          ) : (
            <div style={{ color: '#22C55E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} /> Không có điểm yếu rõ ràng
            </div>
          )}
        </div>

        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#22C55E" /> Gợi ý từ AI
          </h3>
          {data.recommendations?.map((rec, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '2px solid rgba(34,197,94,0.12)', marginBottom: 8 }}>
              <span style={{ color: '#22C55E', fontWeight: 900, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: 600 }}>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
