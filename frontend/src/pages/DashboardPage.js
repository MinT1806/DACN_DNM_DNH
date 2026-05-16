import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { agentAPI, resultAPI, adminAPI, dailyAPI } from '../api/api';
import { BarChart2, Trophy, Zap, Target, ChevronRight, Shield, Settings } from 'lucide-react';

function AdminSummary() {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminAPI.getStats().then(r => setStats(r.data)).catch(() => {}); }, []);
  return (
    <div>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Tổng users', value: stats.totalUsers, icon: '👥', color: '#3b82f6' },
            { label: 'Khóa học', value: stats.totalCourses, icon: '📚', color: '#22C55E' },
            { label: 'Bài tập', value: stats.totalExercises, icon: '📝', color: '#f59e0b' },
            { label: 'Kết quả', value: stats.totalResults, icon: '✅', color: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} className="clay-card" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Link to="/admin" style={{ textDecoration: 'none' }}>
          <div className="clay-card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer', border: '2px solid rgba(239,68,68,0.2)' }}>
            <Shield size={32} color="#ef4444" style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 800, color: '#1a202c' }}>Admin Panel</div>
            <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>Quản lý users & hệ thống</div>
          </div>
        </Link>
        <Link to="/exercises" style={{ textDecoration: 'none' }}>
          <div className="clay-card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}>📚</span>
            <div style={{ fontWeight: 800, color: '#1a202c' }}>Bài tập</div>
            <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>Xem và quản lý bài tập</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function TeacherSummary() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Link to="/teacher" style={{ textDecoration: 'none' }}>
        <div className="clay-card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer', border: '2px solid rgba(59,130,246,0.2)' }}>
          <Settings size={32} color="#3b82f6" style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 800, color: '#1a202c' }}>Teacher Panel</div>
          <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>Tạo và quản lý bài tập</div>
        </div>
      </Link>
      <Link to="/exercises" style={{ textDecoration: 'none' }}>
        <div className="clay-card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer' }}>
          <span style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }}>📋</span>
          <div style={{ fontWeight: 800, color: '#1a202c' }}>Xem bài tập</div>
          <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>Duyệt và chỉnh sửa</div>
        </div>
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [guidance, setGuidance] = useState(null);
  const [results, setResults] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState([]);

  useEffect(() => {
    if (user?.userId) {
      agentAPI.getGuidance(user.userId).then(r => setGuidance(r.data)).catch(() => {});
    }
    resultAPI.getMyResults().then(r => setResults(r.data)).catch(() => {});
    loadDailyChallenge();
  }, [user]);

  const loadDailyChallenge = async () => {
    try {
      const res = await dailyAPI.getToday();
      if (res.data.success) {
        setDailyChallenge(res.data.data);
      }
      const weekRes = await dailyAPI.getWeek();
      if (weekRes.data.success) {
        setWeeklyProgress(weekRes.data.data || []);
      }
    } catch (err) {
      console.error('Error loading daily challenge:', err);
    }
  };

  const avgScore = results.length > 0
    ? (results.reduce((s, r) => s + (r.score || 0), 0) / results.length).toFixed(1)
    : '—';

  const quickActions = [
    { to: '/agent', icon: '🤖', label: 'AI Tutor', desc: 'Chat với AI', color: '#FDBCB4' },
    { to: '/agent?tab=score', icon: '📊', label: 'Chấm điểm', desc: 'Nộp bài', color: '#ADD8E6' },
    { to: '/exercises', icon: '📝', label: 'Bài tập', desc: 'Luyện tập', color: '#22C55E' },
    { to: '/analytics', icon: '📈', label: 'Phân tích', desc: 'Xem thống kê', color: '#c084fc' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      {/* Welcome */}
      <div className="clay-card" style={{
        padding: 36, marginBottom: 32,
        background: 'linear-gradient(135deg, rgba(253,188,180,0.2), rgba(173,216,230,0.2))',
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 28,
          background: 'linear-gradient(135deg, #FDBCB4, #22C55E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', flexShrink: 0,
          boxShadow: '0 8px 24px rgba(253,188,180,0.5)',
        }}>
          👋
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#1a202c', marginBottom: 6 }}>
            Chào mừng trở lại, {user?.fullName || user?.username}!
          </h1>
          <p style={{ color: '#718096', fontWeight: 600 }}>Tiếp tục hành trình học tiếng Anh của bạn hôm nay 🚀</p>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Level', value: user?.level, color: '#22C55E' },
            { label: 'Điểm', value: user?.totalPoints || 0, color: '#FDBCB4' },
            { label: 'TB Score', value: avgScore, color: '#ADD8E6' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 70 }}>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 700 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#1a202c', marginBottom: 20 }}>⚡ Hành động nhanh</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        {quickActions.map((action, i) => (
          <Link key={i} to={action.to} style={{ textDecoration: 'none' }}>
            <div className="clay-card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: `linear-gradient(135deg, ${action.color}44, ${action.color}22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', margin: '0 auto 12px',
              }}>
                {action.icon}
              </div>
              <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 4 }}>{action.label}</div>
              <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>{action.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Daily Challenge Widget */}
      {dailyChallenge && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#1a202c', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎯 Daily Challenge
            {dailyChallenge.streak?.currentStreak > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 12px', borderRadius: 100,
                fontSize: '0.8rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
                color: 'white',
              }}>
                🔥 {dailyChallenge.streak.currentStreak} ngày
              </span>
            )}
          </h2>

          <Link to="/daily-challenge" style={{ textDecoration: 'none' }}>
            <div style={{
              background: dailyChallenge.alreadyCompleted
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              borderRadius: 20,
              padding: 24,
              color: 'white',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              {/* Decorative circles */}
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 120, height: 120, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
              }} />
              <div style={{
                position: 'absolute', bottom: -30, right: 60,
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 4 }}>
                      {dailyChallenge.title || 'Thử thách hàng ngày'}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>
                      {dailyChallenge.description || 'Hoàn thành bài tập hôm nay để nhận XP!'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>
                      {dailyChallenge.alreadyCompleted ? '🎉' : '🎯'}
                    </div>
                    {dailyChallenge.alreadyCompleted ? (
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 100 }}>
                        Đã hoàn thành
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, background: 'rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: 100 }}>
                        ⭐ +{dailyChallenge.xpReward} XP
                      </div>
                    )}
                  </div>
                </div>

                {/* Challenge Sections Preview */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  {['📖 Reading', '🎧 Listening', '📚 Vocabulary', '✍️ Writing'].map((sec, i) => (
                    <div key={i} style={{
                      padding: '6px 14px',
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 100,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      backdropFilter: 'blur(4px)',
                    }}>
                      {sec}
                    </div>
                  ))}
                </div>

                {/* Progress indicator */}
                {dailyChallenge.progress?.completed && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6, fontWeight: 700 }}>
                      <span>Điểm số</span>
                      <span>{dailyChallenge.progress.score}/10</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(dailyChallenge.progress.score / 10) * 100}%`,
                        height: '100%',
                        background: 'white',
                        borderRadius: 8,
                      }} />
                    </div>
                  </div>
                )}

                {/* Weekly mini progress */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {weeklyProgress.slice(0, 7).map((day, i) => (
                      <div key={i} style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: day.completed ? 'rgba(255,255,255,0.9)' : day.isFuture ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                        border: day.isToday ? '2px solid white' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 900,
                        color: day.completed ? '#22c55e' : 'white',
                      }}>
                        {day.completed ? '✓' : i + 1}
                      </div>
                    ))}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: '0.85rem', fontWeight: 700,
                    color: 'white',
                  }}>
                    {dailyChallenge.alreadyCompleted ? 'Ngày mai nhé →' : 'Bắt đầu ngay →'}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Role-based section */}
        {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
          <div className="clay-card" style={{ padding: 28, gridColumn: '1 / -1' }}>
            <h3 style={{ fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#1a202c' }}>
              {user.role === 'ADMIN' ? <><Shield size={20} color="#ef4444" /> Quản lý hệ thống</> : <><Settings size={20} color="#3b82f6" /> Công cụ giảng dạy</>}
            </h3>
            {user.role === 'ADMIN' ? <AdminSummary /> : <TeacherSummary />}
          </div>
        )}

        {/* AI Guidance */}
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#1a202c' }}>
            <Target size={20} color="#22C55E" /> Gợi ý từ AI
          </h3>
          {guidance ? (
            <div>
              <p style={{ color: '#4a5568', fontWeight: 600, marginBottom: 16, lineHeight: 1.7 }}>
                {guidance.content?.summary}
              </p>
              {guidance.content?.recommendations?.slice(0, 3).map((rec, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(34,197,94,0.06)', marginBottom: 8,
                  border: '2px solid rgba(34,197,94,0.12)',
                }}>
                  <span style={{ color: '#22C55E', fontWeight: 900, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: '0.85rem', color: '#4a5568', fontWeight: 600 }}>{rec}</span>
                </div>
              ))}
              {guidance.content?.nextLesson && (
                <div style={{
                  marginTop: 16, padding: '12px 16px', borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(253,188,180,0.2), rgba(173,216,230,0.2))',
                  border: '2px solid rgba(253,188,180,0.3)',
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 700 }}>Bài học tiếp theo</div>
                  <div style={{ fontWeight: 800, color: '#1a202c', marginTop: 4 }}>{guidance.content.nextLesson}</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#718096', fontWeight: 600, textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</div>
              Hoàn thành một bài để nhận gợi ý từ AI!
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#1a202c' }}>
            <Trophy size={20} color="#FDBCB4" /> Kết quả gần đây
          </h3>
          {results.length > 0 ? (
            results.slice(0, 5).map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 12,
                background: 'rgba(0,0,0,0.02)', marginBottom: 8,
                border: '2px solid rgba(0,0,0,0.04)',
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1a202c' }}>
                    {r.skillType} {r.exercise ? `- ${r.exercise.title}` : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>
                    {new Date(r.completedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div style={{
                  fontWeight: 900, fontSize: '1.2rem',
                  color: r.score >= 8 ? '#22C55E' : r.score >= 5 ? '#f59e0b' : '#ef4444',
                }}>
                  {r.score}/10
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#718096', fontWeight: 600, textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📝</div>
              Chưa có kết quả nào. Hãy bắt đầu làm bài!
            </div>
          )}
          <Link to="/progress" style={{ textDecoration: 'none' }}>
            <button className="clay-btn clay-btn-blue" style={{ width: '100%', marginTop: 12, fontSize: '0.9rem' }}>
              Xem tất cả <ChevronRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
