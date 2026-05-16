import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Flame, Medal, ChevronRight, Crown } from 'lucide-react';

const LEVEL_COLORS = {
  A1: '#22C55E', A2: '#3B82F6', B1: '#8B5CF6', B2: '#F59E0B', C1: '#EF4444'
};

export default function GamificationPage() {
  const { user } = useAuth();
  const [levelInfo, setLevelInfo] = useState(null);
  const [streak, setStreak] = useState(null);
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    try {
      const [lvRes, streakRes, badgeRes, lbRes] = await Promise.all([
        fetch('/api/gamification/level', { headers }),
        fetch('/api/gamification/streak', { headers }),
        fetch('/api/gamification/badges', { headers }),
        fetch('/api/gamification/leaderboard?limit=10', { headers })
      ]);
      if (lvRes.ok) setLevelInfo(await lvRes.json());
      if (streakRes.ok) setStreak(await streakRes.json());
      if (badgeRes.ok) setBadges(await badgeRes.json());
      if (lbRes.ok) setLeaderboard(await lbRes.json());
    } catch {}
  };

  const recordActivity = async () => {
    try {
      await fetch('/api/gamification/activity', {
        method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchAll();
    } catch {}
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 4 }}>
          🏆 Thành tựu & Gamification
        </h1>
        <p style={{ color: '#718096', fontWeight: 600 }}>Theo dõi tiến độ, XP, streak và bảng xếp hạng</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: '📊 Tổng quan', icon: <Trophy size={16} /> },
          { id: 'streaks', label: '🔥 Streak', icon: <Flame size={16} /> },
          { id: 'badges', label: '🎖️ Huy hiệu', icon: <Medal size={16} /> },
          { id: 'leaderboard', label: '🏅 BXH', icon: <Crown size={16} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="clay-btn"
            style={{
              background: tab === t.id ? 'linear-gradient(135deg, #22C55E, #16a34a)' : 'white',
              color: tab === t.id ? 'white' : '#4a5568',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && levelInfo && (
        <div>
          {/* Level Card */}
          <div className="clay-card" style={{ padding: 32, marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(253,188,180,0.2), rgba(173,216,230,0.2))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{
                width: 100, height: 100, borderRadius: 24,
                background: `linear-gradient(135deg, ${LEVEL_COLORS[user?.level]}44, ${LEVEL_COLORS[user?.level]}88)`,
                border: `4px solid ${LEVEL_COLORS[user?.level]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontWeight: 900, fontSize: '2.5rem', color: LEVEL_COLORS[user?.level] }}>
                  {user?.level}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#1a202c', marginBottom: 4 }}>
                  Level {user?.level}
                </div>
                <div style={{ fontWeight: 700, color: '#718096', marginBottom: 12 }}>
                  {levelInfo.totalXp} XP total
                </div>
                {/* Progress bar */}
                <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 12, height: 16, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    width: `${levelInfo.progressPercent}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${LEVEL_COLORS[user?.level]}, ${LEVEL_COLORS[user?.level]}aa)`,
                    borderRadius: 12,
                    transition: 'width 0.5s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                  <span>{levelInfo.currentThreshold} XP</span>
                  <span>{levelInfo.xpToNextLevel} XP đến level tiếp</span>
                  <span>{levelInfo.nextThreshold} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: '🔥 Current Streak', value: streak?.currentStreak || 0, icon: '🔥', color: '#F59E0B' },
              { label: '🏆 Longest Streak', value: streak?.longestStreak || 0, icon: '🏆', color: '#EF4444' },
              { label: '🎖️ Badges Earned', value: badges.length, icon: '🎖️', color: '#8B5CF6' },
              { label: '📅 Active Days', value: streak?.totalActiveDays || 0, icon: '📅', color: '#22C55E' },
            ].map((s, i) => (
              <div key={i} className="clay-card" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontWeight: 900, fontSize: '1.5rem', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streaks Tab */}
      {tab === 'streaks' && (
        <div>
          <div className="clay-card" style={{ padding: 32, marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 8 }}>
              {streak?.currentStreak >= 7 ? '🔥' : streak?.currentStreak >= 3 ? '⭐' : '💪'}
            </div>
            <div style={{ fontWeight: 900, fontSize: '3rem', color: '#F59E0B', marginBottom: 4 }}>
              {streak?.currentStreak || 0} ngày
            </div>
            <div style={{ color: '#718096', fontWeight: 600, marginBottom: 20 }}>Current Streak</div>
            <button className="clay-btn clay-btn-primary" onClick={recordActivity}>
              📝 Record Today's Activity
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="clay-card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 4 }}>🏆</div>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#EF4444' }}>{streak?.longestStreak || 0}</div>
              <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>Longest Streak</div>
            </div>
            <div className="clay-card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 4 }}>📅</div>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#22C55E' }}>{streak?.totalActiveDays || 0}</div>
              <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>Total Active Days</div>
            </div>
          </div>
          {/* Weekly goal */}
          <div className="clay-card" style={{ padding: 24, marginTop: 16 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 16, color: '#1a202c' }}>🎯 Weekly Goal</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(day => (
                <div key={day} style={{
                  flex: 1, height: 40, borderRadius: 8,
                  background: day <= (streak?.weeklyProgress || 0) ? '#22C55E' : 'rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.8rem',
                  color: day <= (streak?.weeklyProgress || 0) ? 'white' : '#a0aec0',
                }}>
                  {day <= (streak?.weeklyProgress || 0) ? '✓' : day}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Badges Tab */}
      {tab === 'badges' && (
        <div>
          {badges.length === 0 ? (
            <div className="clay-card" style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎖️</div>
              <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Chưa có badge nào</h3>
              <p style={{ color: '#718096', fontWeight: 600 }}>Hoàn thành bài tập và streak để nhận badge!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {badges.map((ub, i) => (
                <div key={i} className="clay-card" style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 8 }}>
                    {ub.badge?.icon || '🏅'}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1a202c', marginBottom: 4 }}>
                    {ub.badge?.name}
                  </div>
                  {ub.badge?.description && (
                    <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: 8 }}>
                      {ub.badge.description}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                    +{ub.badge?.xpReward || 0} XP
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#a0aec0', marginTop: 4 }}>
                    {new Date(ub.earnedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <div>
          {leaderboard.map((entry, i) => (
            <div key={i} className="clay-card" style={{
              padding: '16px 24px', marginBottom: 12,
              border: i < 3 ? `2px solid ${
                i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32'
              }44` : undefined,
              background: i === 0 ? 'rgba(255,215,0,0.05)' : undefined,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '1rem',
                  color: i < 3 ? 'white' : '#718096',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#1a202c' }}>
                    {entry.fullName || entry.username}
                    {entry.userId === user?.id && <span style={{ color: '#22C55E', fontSize: '0.8rem', marginLeft: 6 }}>(Bạn)</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                    Level {entry.level} • 🔥 {entry.streak} days
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem', color: LEVEL_COLORS[entry.level] }}>
                    {entry.totalPoints} XP
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
