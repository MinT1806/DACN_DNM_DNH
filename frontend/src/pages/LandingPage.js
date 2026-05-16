import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../api/api';
import { Star, Users, BookOpen, Trophy, Zap, MessageCircle, Target, ChevronRight, Play, CheckCircle } from 'lucide-react';

const TESTIMONIALS = [
  { name: "Nguyễn Thị Lan", level: "B2 → C1", avatar: "👩‍💼", text: "ABC English đã giúp tôi đạt IELTS 7.5! AI tutor cực kỳ thông minh và phân tích bài viết rất chi tiết.", stars: 5 },
  { name: "Trần Văn Minh", level: "A2 → B1", avatar: "👨‍💻", text: "Giao diện dễ dùng, bài tập phong phú. Sau 3 tháng, tôi tự tin giao tiếp tiếng Anh trong công việc rồi!", stars: 5 },
  { name: "Phạm Thu Hương", level: "B1 → B2", avatar: "👩‍🎓", text: "Hệ thống theo dõi tiến độ rất trực quan. Tôi thấy mình tiến bộ rõ rệt mỗi tuần nhờ AI gợi ý bài học.", stars: 5 },
  { name: "Lê Quốc Bảo", level: "A1 → A2", avatar: "👨‍🎨", text: "Xuất phát điểm từ zero, giờ tôi đã có thể đọc tin tức tiếng Anh. Platform này thật sự tuyệt vời!", stars: 5 },
];

const FEATURES = [
  { icon: "🤖", title: "AI Scoring", desc: "Chấm điểm thông minh 4 kỹ năng với nhận xét chi tiết và gợi ý cải thiện cá nhân hóa.", color: "#FDBCB4" },
  { icon: "📝", title: "Exercise Generator", desc: "Tự động tạo bài tập phù hợp theo topic, level và loại kỹ năng bạn muốn luyện.", color: "#ADD8E6" },
  { icon: "💬", title: "AI Chatbot", desc: "Hỏi đáp 24/7 về ngữ pháp, từ vựng. AI giải thích rõ ràng bằng tiếng Việt + ví dụ tiếng Anh.", color: "#22C55E" },
  { icon: "🎯", title: "Learning Guidance", desc: "Phân tích điểm yếu và đề xuất lộ trình học cá nhân hóa dựa trên kết quả của bạn.", color: "#FDBCB4" },
];

const STATS = [
  { number: "10,000+", label: "Học viên", icon: <Users size={24} /> },
  { number: "500+", label: "Bài tập", icon: <BookOpen size={24} /> },
  { number: "4.8★", label: "Đánh giá", icon: <Star size={24} /> },
  { number: "95%", label: "Cải thiện", icon: <Trophy size={24} /> },
];

const LEVEL_COLORS = { A1: '#22C55E', A2: '#ADD8E6', B1: '#FDBCB4', B2: '#f9a59b', C1: '#c084fc' };

export default function LandingPage() {
  const [courses, setCourses] = useState([]);
  const [activeStat, setActiveStat] = useState(0);

  useEffect(() => {
    courseAPI.getAll().then(r => setCourses(r.data.slice(0, 4))).catch(() => {});
    const interval = setInterval(() => setActiveStat(p => (p + 1) % 4), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background blobs */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(253,188,180,0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -50, left: -80,
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(173,216,230,0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, rgba(253,188,180,0.3), rgba(173,216,230,0.3))',
            border: '2px solid rgba(253,188,180,0.5)',
            borderRadius: 20, padding: '8px 20px',
            fontWeight: 700, fontSize: '0.9rem', color: '#7c2d12',
            marginBottom: 24,
          }}>
            🚀 Nền tảng học tiếng Anh AI #1 Việt Nam
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 900, lineHeight: 1.2,
            color: '#1a202c', marginBottom: 24,
          }}>
            Học Tiếng Anh Thông Minh
            <br />
            <span style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Cùng Trợ Lý AI
            </span>
          </h1>

          <p style={{ fontSize: '1.2rem', color: '#4a5568', lineHeight: 1.8, marginBottom: 40, fontWeight: 600 }}>
            ABC English sử dụng AI tiên tiến để chấm điểm, tạo bài tập, và hướng dẫn cá nhân hóa
            <br />giúp bạn tiến bộ nhanh hơn gấp 3 lần.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
            <Link to="/register">
              <button className="clay-btn clay-btn-primary" style={{ fontSize: '1.1rem', padding: '16px 36px' }}>
                🎉 Bắt đầu miễn phí
              </button>
            </Link>
            <Link to="/courses">
              <button className="clay-btn clay-btn-blue" style={{ fontSize: '1.1rem', padding: '16px 36px' }}>
                📚 Xem khóa học
              </button>
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            {STATS.map((stat, i) => (
              <div key={i} className="clay-card" style={{
                padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
                background: activeStat === i
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(173,216,230,0.1))'
                  : 'white',
                border: activeStat === i ? '2px solid #22C55E' : undefined,
              }}>
                <span style={{ color: '#22C55E' }}>{stat.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#1a202c' }}>{stat.number}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '60px 24px', background: 'rgba(255,255,255,0.4)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1a202c' }}>
              ✨ Tính năng <span style={{ color: '#22C55E' }}>nổi bật</span>
            </h2>
            <p style={{ color: '#718096', fontSize: '1.1rem', marginTop: 12, fontWeight: 600 }}>
              Tất cả những gì bạn cần để học tiếng Anh hiệu quả
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="clay-card" style={{ padding: 28, textAlign: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 22,
                  background: `linear-gradient(135deg, ${f.color}66, ${f.color}33)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', margin: '0 auto 16px',
                  boxShadow: `0 8px 24px ${f.color}44`,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 10, color: '#1a202c' }}>{f.title}</h3>
                <p style={{ color: '#718096', fontSize: '0.9rem', lineHeight: 1.7, fontWeight: 600 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Progress Demo */}
      <section style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1a202c' }}>
              📊 Theo dõi <span style={{ color: '#ADD8E6', WebkitTextStroke: '1px #93c5d9' }}>tiến độ</span> học tập
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }} className="progress-demo">
            <div className="clay-card" style={{ padding: 32 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 24, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={20} color="#22C55E" /> Điểm kỹ năng
              </h3>
              {[
                { skill: 'Writing', score: 82, color: '#22C55E' },
                { skill: 'Speaking', score: 75, color: '#ADD8E6' },
                { skill: 'Reading', score: 90, color: '#FDBCB4' },
                { skill: 'Listening', score: 68, color: '#c084fc' },
              ].map(item => (
                <div key={item.skill} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: '#2d3748' }}>{item.skill}</span>
                    <span style={{ fontWeight: 800, color: item.color }}>{item.score}%</span>
                  </div>
                  <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${item.score}%`,
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}bb)`,
                      borderRadius: 6,
                      transition: 'width 1.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="clay-card" style={{ padding: 32 }}>
              <h3 style={{ fontWeight: 800, marginBottom: 24, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={20} color="#FDBCB4" /> Thành tích
              </h3>
              {[
                { badge: '🌟', title: 'First Step', desc: 'Hoàn thành bài học đầu tiên', done: true },
                { badge: '🔥', title: '7 Day Streak', desc: 'Học 7 ngày liên tiếp', done: true },
                { badge: '📝', title: 'Writer Pro', desc: 'Đạt 8+ điểm writing', done: true },
                { badge: '🏆', title: 'Level Up', desc: 'Lên từ A1 lên A2', done: false },
              ].map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 14,
                  background: a.done ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(173,216,230,0.08))' : 'rgba(0,0,0,0.02)',
                  marginBottom: 10, border: `2px solid ${a.done ? 'rgba(34,197,94,0.2)' : 'transparent'}`,
                }}>
                  <span style={{ fontSize: '1.6rem' }}>{a.badge}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1a202c' }}>{a.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>{a.desc}</div>
                  </div>
                  {a.done && <CheckCircle size={18} color="#22C55E" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Courses Preview */}
      <section style={{ padding: '60px 24px', background: 'rgba(255,255,255,0.4)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a202c' }}>
              📚 Khóa học <span style={{ color: '#22C55E' }}>nổi bật</span>
            </h2>
            <Link to="/courses">
              <button className="clay-btn clay-btn-blue" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Xem tất cả <ChevronRight size={16} />
              </button>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {courses.length > 0 ? courses.map(course => (
              <CourseCard key={course.id} course={course} />
            )) : (
              [
                { id:1, title:'English for Beginners', level:'A1', instructor:'Ms. Sarah Johnson', totalLessons:24, enrolledCount:1250, rating:4.8 },
                { id:2, title:'Elementary English', level:'A2', instructor:'Mr. David Chen', totalLessons:32, enrolledCount:980, rating:4.7 },
                { id:3, title:'Pre-Intermediate', level:'B1', instructor:'Ms. Emily Parker', totalLessons:40, enrolledCount:750, rating:4.9 },
                { id:4, title:'Intermediate English', level:'B2', instructor:'Mr. James Wilson', totalLessons:48, enrolledCount:520, rating:4.6 },
              ].map(course => <CourseCard key={course.id} course={course} />)
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1a202c' }}>
              💬 Học viên <span style={{ color: '#FDBCB4', WebkitTextStroke: '1px #f9a59b' }}>nói gì</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="clay-card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 18,
                    background: 'linear-gradient(135deg, #FDBCB4, #ADD8E6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#1a202c' }}>{t.name}</div>
                    <div style={{
                      fontSize: '0.75rem', fontWeight: 700, color: '#22C55E',
                      background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 8, display: 'inline-block'
                    }}>{t.level}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} size={14} color="#f59e0b" fill="#f59e0b" />
                  ))}
                </div>
                <p style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.9rem', fontWeight: 600 }}>"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="clay-card" style={{
            padding: 56, textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(253,188,180,0.2), rgba(173,216,230,0.2))',
            border: '2px solid rgba(34,197,94,0.3)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎯</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a202c', marginBottom: 16 }}>
              Sẵn sàng bắt đầu<br />hành trình của bạn?
            </h2>
            <p style={{ color: '#718096', fontSize: '1.1rem', marginBottom: 32, fontWeight: 600 }}>
              Tham gia cùng 10,000+ học viên đang học tiếng Anh hiệu quả với AI
            </p>
            <Link to="/register">
              <button className="clay-btn clay-btn-primary" style={{
                fontSize: '1.2rem', padding: '18px 48px',
                animation: 'pulse-glow 2s infinite',
              }}>
                🚀 Đăng ký miễn phí ngay
              </button>
            </Link>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 24, color: '#718096', fontSize: '0.85rem', fontWeight: 700 }}>
              <span>✅ Không cần thẻ tín dụng</span>
              <span>✅ Miễn phí mãi mãi</span>
              <span>✅ Bắt đầu ngay hôm nay</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px',
        background: 'rgba(255,255,255,0.7)',
        borderTop: '2px solid rgba(253,188,180,0.3)',
        textAlign: 'center',
        color: '#718096', fontWeight: 600,
      }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontWeight: 900, color: '#1a202c' }}>ABC·English</span> — AI-Powered English Learning Platform
        </div>
        <div style={{ fontSize: '0.85rem' }}>© 2026 ABC English. All rights reserved.</div>
      </footer>
    </div>
  );
}

function CourseCard({ course }) {
  const color = LEVEL_COLORS[course.level] || '#22C55E';
  return (
    <div className="clay-card" style={{ padding: 24, cursor: 'pointer' }}>
      <div style={{
        height: 120, borderRadius: 16, marginBottom: 16,
        background: `linear-gradient(135deg, ${color}33, ${color}66)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3rem',
      }}>
        📖
      </div>
      <div style={{
        display: 'inline-block', background: `${color}22`,
        color: color, fontWeight: 800, fontSize: '0.75rem',
        padding: '3px 10px', borderRadius: 8, marginBottom: 8,
        border: `2px solid ${color}44`,
      }}>
        {course.level}
      </div>
      <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#1a202c', marginBottom: 6 }}>{course.title}</h3>
      <p style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600, marginBottom: 12 }}>👩‍🏫 {course.instructor}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#718096', fontWeight: 700 }}>
        <span>📚 {course.totalLessons} lessons</span>
        <span>👥 {(course.enrolledCount || 0).toLocaleString()}</span>
        <span>⭐ {course.rating}</span>
      </div>
    </div>
  );
}
