import React, { useEffect, useState } from 'react';
import { rankingAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Trophy, Crown, Medal, TrendingUp, Flame, Star, ChevronUp, ChevronDown,
  Zap, Award, Target, BarChart2, Filter, Calendar
} from 'lucide-react';

const LEVEL_COLORS = { A1: '#22C55E', A2: '#3B82F6', B1: '#8B5CF6', B2: '#F59E0B', C1: '#EF4444', C2: '#6366f1' };

export default function RankingPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [levelFilter, setLevelFilter] = useState('');
  const [limit, setLimit] = useState(20);

  const refreshRanking = () => {
    setLoading(true);
    Promise.all([
      rankingAPI.get(period, limit, levelFilter || null),
      rankingAPI.getMyRank(),
    ])
      .then(([rankingRes, myRankRes]) => {
        setRanking(rankingRes.data || []);
        setMyRank(myRankRes.data);
      })
      .catch(() => toast.error('Không thể tải bảng xếp hạng'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshRanking();
  }, [period, levelFilter, limit]);

  const getRankStyle = (rank) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', color: 'white', shadow: '0 4px 20px rgba(255,215,0,0.4)' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', color: 'white', shadow: '0 4px 20px rgba(192,192,192,0.4)' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #CD7F32, #B8601A)', color: 'white', shadow: '0 4px 20px rgba(205,127,50,0.4)' };
    return { bg: 'rgba(0,0,0,0.04)', color: '#718096', shadow: 'none' };
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#1a202c', marginBottom: 8 }}>
          <Crown size={28} style={{ marginRight: 10, verticalAlign: 'middle', color: '#FFD700' }} />
          Bảng Xếp Hạng
        </h1>
        <p style={{ color: '#718096', fontWeight: 600 }}>
          Xem thứ hạng của bạn và so sánh với các học viên khác
        </p>
      </div>

      {/* My rank card */}
      {myRank && myRank.globalRank && (
        <div className="clay-card" style={{
          padding: 24, marginBottom: 24, textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(253,188,180,0.2), rgba(173,216,230,0.2))',
          border: '2px solid rgba(253,188,180,0.3)',
        }}>
          <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 700, marginBottom: 4 }}>Thứ hạng của bạn</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '1.8rem', color: 'white',
            }}>
              #{myRank.globalRank}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#1a202c' }}>
                Top {myRank.totalParticipants > 0 ? Math.round(myRank.globalRank / myRank.totalParticipants * 100) : 0}%
              </div>
              <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>
                {myRank.totalPoints} XP • Level {myRank.level}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="clay-card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'all', label: 'Tất cả', icon: <Trophy size={14} /> },
            { id: 'weekly', label: 'Tuần', icon: <Flame size={14} /> },
            { id: 'monthly', label: 'Tháng', icon: <BarChart2 size={14} /> },
          ].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className="clay-btn"
              style={{
                background: period === p.id ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'white',
                color: period === p.id ? 'white' : '#4a5568',
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              }}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <select className="clay-input" style={{ minWidth: 130 }} value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}>
          <option value="">Tất cả level</option>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <select className="clay-input" style={{ minWidth: 140 }} value={limit}
          onChange={e => setLimit(Number(e.target.value))}>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
          <option value={100}>Top 100</option>
        </select>

        <button className="clay-btn" onClick={refreshRanking} style={{ marginLeft: 'auto' }}>
          ↻ Làm mới
        </button>
      </div>

      {/* Top 3 podium */}
      {ranking.length >= 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[1, 0, 2].map(idx => {
            const entry = ranking[idx];
            const rank = idx + 1;
            const style = getRankStyle(rank);
            return (
              <div key={rank} className="clay-card" style={{
                padding: '20px 16px', textAlign: 'center',
                background: rank === 1 ? 'rgba(255,215,0,0.08)' : 'white',
                border: rank === 1 ? '2px solid rgba(255,215,0,0.3)' : '2px solid transparent',
                order: rank === 1 ? -1 : rank,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: style.bg, boxShadow: style.shadow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', fontWeight: 900, fontSize: '1.3rem', color: style.color,
                }}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </div>
                <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#1a202c', marginBottom: 4 }}>
                  {entry.fullName}
                </div>
                <div style={{
                  padding: '2px 8px', borderRadius: 6, display: 'inline-block',
                  background: (LEVEL_COLORS[entry.level] || '#718096') + '22',
                  color: LEVEL_COLORS[entry.level] || '#718096',
                  fontWeight: 800, fontSize: '0.7rem', marginBottom: 8,
                }}>
                  {entry.level}
                </div>
                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#8b5cf6' }}>
                  {entry.totalPoints} XP
                </div>
                <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>
                  {entry.quizCount + entry.testCount} bài
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full ranking table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096', fontWeight: 700 }}>
          Đang tải bảng xếp hạng...
        </div>
      ) : ranking.length === 0 ? (
        <div className="clay-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏆</div>
          <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Chưa có dữ liệu</div>
          <p style={{ color: '#718096', fontWeight: 600 }}>Hãy làm bài kiểm tra để tham gia xếp hạng!</p>
        </div>
      ) : (
        <div className="clay-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                  {['#', 'Học viên', 'Level', 'XP', 'Bài Quiz', 'Bài Test', 'Điểm TB', 'Huy hiệu', 'Progress'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#718096', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, i) => {
                  const style = getRankStyle(entry.rank);
                  const isMe = entry.userId === user?.id || entry.userId === user?.userId;
                  return (
                    <tr key={i} style={{
                      borderTop: '1px solid rgba(0,0,0,0.05)',
                      background: isMe ? 'rgba(139,92,246,0.05)' : undefined,
                    }}>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 10,
                          background: style.bg, boxShadow: style.shadow,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: '0.85rem', color: style.color,
                        }}>
                          {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.9rem' }}>
                          {entry.fullName}
                          {isMe && <span style={{ marginLeft: 6, color: '#8b5cf6', fontSize: '0.75rem' }}>(Bạn)</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 8,
                          background: (LEVEL_COLORS[entry.level] || '#718096') + '22',
                          color: LEVEL_COLORS[entry.level] || '#718096',
                          fontWeight: 800, fontSize: '0.75rem',
                        }}>
                          {entry.level}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Zap size={14} color="#f59e0b" />
                          <span style={{ fontWeight: 900, color: '#f59e0b', fontSize: '0.9rem' }}>
                            {entry.totalPoints}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#4a5568', fontSize: '0.85rem' }}>
                        {entry.quizCount}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#4a5568', fontSize: '0.85rem' }}>
                        {entry.testCount}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 800, fontSize: '0.85rem',
                          color: entry.avgScore >= 8 ? '#22C55E' : entry.avgScore >= 6 ? '#f59e0b' : '#ef4444',
                        }}>
                          {entry.avgScore}/10
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <Award size={14} color="#8b5cf6" />
                          <span style={{ fontWeight: 800, color: '#8b5cf6', fontSize: '0.85rem' }}>
                            {entry.badgeCount}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              width: (entry.progressPercent || 0) + '%',
                              height: '100%',
                              background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                              borderRadius: 3,
                            }} />
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '0.75rem', color: '#8b5cf6', minWidth: 28 }}>
                            {entry.progressPercent || 0}%
                          </span>
                        </div>
                        {entry.xpToNextLevel > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#a0aec0', fontWeight: 600, textAlign: 'center', marginTop: 2 }}>
                            +{entry.xpToNextLevel} XP
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Level legend */}
      <div className="clay-card" style={{ padding: 20, marginTop: 20 }}>
        <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 12 }}>Chú thích</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(LEVEL_COLORS).map(([level, color]) => (
            <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: color }} />
              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#4a5568' }}>{level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
