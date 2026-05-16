import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, Bell, User } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar({ sidebarOpen, onSidebarToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // On public pages (no sidebar), show full navbar
  if (!user) {
    return (
      <nav style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '2px solid rgba(253,188,180,0.3)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 14,
              background: 'linear-gradient(135deg, #FDBCB4, #22C55E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(253,188,180,0.5)',
            }}>
              <BookOpen size={20} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.4rem', color: '#2d3748' }}>
              ABC<span style={{ color: '#22C55E' }}>·English</span>
            </span>
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login">
              <button className="clay-btn clay-btn-blue" style={{ padding: '8px 20px' }}>Login</button>
            </Link>
            <Link to="/register">
              <button className="clay-btn clay-btn-primary" style={{ padding: '8px 20px' }}>Sign Up Free</button>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated: compact top bar
  return (
    <header style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '2px solid rgba(253,188,180,0.2)',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      height: 64, gap: 12,
    }}>
      {/* Points badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 12,
        background: 'rgba(34,197,94,0.08)',
        border: '2px solid rgba(34,197,94,0.15)',
      }}>
        <span style={{ fontSize: '1rem' }}>⭐</span>
        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#16a34a' }}>{user.totalPoints || 0} pts</span>
      </div>

      {/* Level badge */}
      <div style={{
        padding: '5px 12px', borderRadius: 12,
        background: 'linear-gradient(135deg, #FDBCB4, #f9a59b)',
        fontWeight: 800, fontSize: '0.82rem', color: '#7c2d12',
      }}>
        {user.level}
      </div>

      {/* Notification Bell */}
      <NotificationBell />

      {/* User menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 14, border: 'none',
            background: 'rgba(0,0,0,0.04)', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.85rem', color: '#2d3748',
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 10,
            background: 'linear-gradient(135deg, #FDBCB4, #ADD8E6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.85rem', color: '#7c2d12',
          }}>
            {(user.username || 'U')[0].toUpperCase()}
          </div>
          <span>{user.username}</span>
          <span style={{
            fontSize: '0.7rem', padding: '2px 6px', borderRadius: 6,
            background: user.role === 'ADMIN' ? '#ef4444' : user.role === 'TEACHER' ? '#3b82f6' : '#22C55E',
            color: 'white', fontWeight: 800,
          }}>{user.role}</span>
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: '110%',
            background: 'white', borderRadius: 16, padding: 8, minWidth: 160,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            border: '2px solid rgba(253,188,180,0.3)',
            zIndex: 300,
          }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: '#ef4444', fontWeight: 700, fontSize: '0.9rem',
              }}
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

