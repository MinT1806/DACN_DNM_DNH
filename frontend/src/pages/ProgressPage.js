import React, { useEffect, useState } from 'react';
import { agentAPI, resultAPI } from '../api/api';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Trophy, Target, TrendingUp } from 'lucide-react';

const SKILL_COLORS = { WRITING: '#22C55E', SPEAKING: '#ADD8E6', READING: '#FDBCB4', LISTENING: '#c084fc' };

export default function ProgressPage() {
  const [results, setResults] = useState([]);
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      resultAPI.getMyResults(),
      agentAPI.guidance(),
    ]).then(([rRes, gRes]) => {
      setResults(rRes.data);
      setGuidance(gRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Radar chart data
  const radarData = guidance?.content?.skillScores
    ? Object.entries(guidance.content.skillScores).map(([skill, score]) => ({
        skill,
        score: Math.round(score * 10),
        fullMark: 100,
      }))
    : [
        { skill: 'WRITING', score: 75, fullMark: 100 },
        { skill: 'SPEAKING', score: 60, fullMark: 100 },
        { skill: 'READING', score: 85, fullMark: 100 },
        { skill: 'LISTENING', score: 70, fullMark: 100 },
      ];

  // Line chart data (last 10 results)
  const lineData = results.slice(0, 10).reverse().map((r, i) => ({
    name: `#${i + 1}`,
    score: r.score,
    skill: r.skillType,
  }));

  // Per-skill stats
  const skillStats = ['WRITING', 'SPEAKING', 'READING', 'LISTENING'].map(skill => {
    const skillResults = results.filter(r => r.skillType === skill);
    const avg = skillResults.length > 0
      ? (skillResults.reduce((s, r) => s + r.score, 0) / skillResults.length).toFixed(1)
      : null;
    return { skill, count: skillResults.length, avg };
  });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#718096', fontWeight: 700 }}>⏳ Đang tải...</div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 8 }}>
          📊 Tiến độ học tập
        </h1>
        <p style={{ color: '#718096', fontWeight: 600 }}>Theo dõi sự tiến bộ của bạn theo từng kỹ năng</p>
      </div>

      {/* Skill Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {skillStats.map(s => (
          <div key={s.skill} className="clay-card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: `${SKILL_COLORS[s.skill]}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', fontSize: '1.5rem',
            }}>
              {s.skill === 'WRITING' ? '✍️' : s.skill === 'SPEAKING' ? '🎤' : s.skill === 'READING' ? '📖' : '🎧'}
            </div>
            <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 4 }}>{s.skill}</div>
            <div style={{ fontWeight: 900, fontSize: '1.5rem', color: SKILL_COLORS[s.skill] }}>
              {s.avg ? `${s.avg}/10` : '—'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 700, marginTop: 4 }}>
              {s.count} bài đã làm
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Radar Chart */}
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={20} color="#22C55E" /> Tổng quan kỹ năng
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(173,216,230,0.4)" />
              <PolarAngleAxis dataKey="skill" tick={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12 }} />
              <Radar name="Score" dataKey="score" stroke="#22C55E" fill="#22C55E" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} color="#ADD8E6" /> Xu hướng điểm số
          </h3>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(173,216,230,0.3)" />
                <XAxis dataKey="name" tick={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, fontFamily: 'Nunito', fontWeight: 700 }} />
                <Line type="monotone" dataKey="score" stroke="#22C55E" strokeWidth={3} dot={{ fill: '#22C55E', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096', fontWeight: 600 }}>
              Chưa có dữ liệu. Hãy hoàn thành một số bài tập!
            </div>
          )}
        </div>
      </div>

      {/* AI Guidance */}
      {guidance && (
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={20} color="#FDBCB4" /> Gợi ý từ AI
          </h3>
          <p style={{ color: '#4a5568', fontWeight: 600, lineHeight: 1.7, marginBottom: 20, fontSize: '1rem' }}>
            {guidance.content?.summary}
          </p>

          {guidance.content?.weaknesses?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 12 }}>⚠️ Điểm cần cải thiện:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {guidance.content.weaknesses.map((w, i) => (
                  <span key={i} style={{
                    background: 'rgba(253,188,180,0.2)', color: '#7c2d12',
                    fontWeight: 700, fontSize: '0.85rem', padding: '6px 14px', borderRadius: 10,
                    border: '2px solid rgba(253,188,180,0.4)',
                  }}>{w}</span>
                ))}
              </div>
            </div>
          )}

          {guidance.content?.recommendations?.length > 0 && (
            <div>
              <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 12 }}>✅ Khuyến nghị:</div>
              {guidance.content.recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '10px 16px', borderRadius: 12,
                  background: 'rgba(34,197,94,0.05)', border: '2px solid rgba(34,197,94,0.12)',
                  marginBottom: 8,
                }}>
                  <span style={{ color: '#22C55E', fontWeight: 900 }}>→</span>
                  <span style={{ fontWeight: 600, color: '#4a5568', fontSize: '0.9rem' }}>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
