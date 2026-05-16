import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, Dumbbell, Bot, BarChart2, Map,
  LayoutDashboard,
  Users, Shield, MessageCircle,
  Sparkles, Trophy, Mic, Headphones,
  Target, Award, Calendar, ChevronLeft, ChevronRight, GraduationCap
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/placement-test', icon: <Target size={20} />, label: 'Kiểm tra đầu vào', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/courses', icon: <BookOpen size={20} />, label: 'Khóa học', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/daily-challenge', icon: <Calendar size={20} />, label: 'Thử thách hàng ngày', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/flashcards', icon: <Sparkles size={20} />, label: 'Flashcards', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/stories', icon: <BookOpen size={20} />, label: 'Story Mode', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/vocabulary', icon: <Sparkles size={20} />, label: 'Từ vựng', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/speaking', icon: <Mic size={20} />, label: 'Luyện nói', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/listening', icon: <Headphones size={20} />, label: 'Luyện nghe', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/exercises', icon: <Dumbbell size={20} />, label: 'Bài tập', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/complete-test', icon: <Target size={20} />, label: 'Hệ thống thi', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/ai-exercises', icon: <Sparkles size={20} />, label: 'Luyện tập AI', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/forum', icon: <MessageCircle size={20} />, label: 'Diễn đàn', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/agent', icon: <Bot size={20} />, label: 'AI Assistant', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/certificates', icon: <Award size={20} />, label: 'Chứng chỉ', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/gamification', icon: <Trophy size={20} />, label: 'Thành tựu', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/analytics', icon: <BarChart2 size={20} />, label: 'Thống kê học tập', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { to: '/learning-path', icon: <Map size={20} />, label: 'Lộ trình học', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },

  // ── TEACHER SECTION ──
  { divider: true, label: 'GIÁO VIÊN', roles: ['TEACHER', 'ADMIN'] },
  { to: '/teacher', icon: <GraduationCap size={20} />, label: 'Tạo nội dung', roles: ['TEACHER', 'ADMIN'] },
  { to: '/lesson-create', icon: <BookOpen size={20} />, label: 'Tạo bài học', roles: ['TEACHER', 'ADMIN'] },

  // ── ADMIN SECTION ──
  { divider: true, label: 'QUẢN TRỊ', roles: ['ADMIN'] },
  { to: '/admin', icon: <Shield size={20} />, label: 'Dashboard', roles: ['ADMIN'] },
  { to: '/admin/users', icon: <Users size={20} />, label: 'Quản lý Users', roles: ['ADMIN'] },
];

export default function Sidebar({ open, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || 'STUDENT';

  const visibleItems = NAV_ITEMS.filter(item => item.roles?.includes(role));

  const sidebarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: open ? 260 : 72,
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    borderRight: '2px solid rgba(253,188,180,0.25)',
    boxShadow: '4px 0 24px rgba(0,0,0,0.06)',
    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  return (
    <aside style={sidebarStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center',
        padding: open ? '20px 12px 16px' : '20px 0 16px',
        borderBottom: '2px solid rgba(253,188,180,0.15)',
        minHeight: 72,
        flexShrink: 0,
      }}>
        {open && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #FDBCB4, #22C55E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={18} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1a202c', whiteSpace: 'nowrap' }}>
              ABC<span style={{ color: '#22C55E' }}>·English</span>
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            width: 28, height: 28, borderRadius: 8, border: 'none',
            background: 'rgba(34,197,94,0.1)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#22C55E', flexShrink: 0, transition: 'background 0.2s',
          }}
          title={open ? 'Thu gọn' : 'Mở rộng'}
        >
          {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px' }}>
        {visibleItems.map((item, i) => {
          if (item.divider) {
            return open ? (
              <div key={i} style={{
                padding: '16px 10px 6px',
                fontSize: '0.68rem', fontWeight: 800, color: '#a0aec0',
                letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>
                {item.label}
              </div>
            ) : (
              <div key={i} style={{ margin: '12px 0', borderTop: '1px solid rgba(0,0,0,0.06)' }} />
            );
          }

          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: open ? 12 : 0,
                justifyContent: open ? 'flex-start' : 'center',
                padding: open ? '10px 12px' : '10px',
                borderRadius: 14, marginBottom: 4,
                background: active
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))'
                  : 'transparent',
                border: active ? '2px solid rgba(34,197,94,0.25)' : '2px solid transparent',
                color: active ? '#16a34a' : '#4a5568',
                fontWeight: active ? 800 : 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
                title={!open ? item.label : undefined}
              >
                <span style={{ flexShrink: 0, color: active ? '#22C55E' : '#718096' }}>{item.icon}</span>
                {open && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div style={{
          padding: open ? '12px 16px' : '12px 8px',
          borderTop: '2px solid rgba(253,188,180,0.15)',
          display: 'flex', alignItems: 'center',
          gap: open ? 10 : 0,
          justifyContent: open ? 'flex-start' : 'center',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #FDBCB4, #ADD8E6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.9rem', color: '#7c2d12',
          }}>
            {(user.username || 'U')[0].toUpperCase()}
          </div>
          {open && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.fullName || user.username}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.72rem', color: '#718096', fontWeight: 600 }}>{user.role}</span>
                <span style={{
                  background: role === 'ADMIN' ? '#ef4444' : role === 'TEACHER' ? '#3b82f6' : '#22C55E',
                  color: 'white', fontSize: '0.65rem', fontWeight: 800,
                  padding: '1px 6px', borderRadius: 6
                }}>{user.level}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
