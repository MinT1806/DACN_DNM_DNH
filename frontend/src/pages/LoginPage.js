import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="clay-card" style={{ padding: 40, width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 28,
            background: 'linear-gradient(135deg, #FDBCB4, #22C55E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 12px 32px rgba(253, 188, 180, 0.5)',
          }}>
            <BookOpen size={36} color="white" />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 8 }}>Chào mừng trở lại!</h1>
          <p style={{ color: '#718096', fontWeight: 600 }}>Đăng nhập để tiếp tục hành trình học tiếng Anh</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#2d3748' }}>
              Tên đăng nhập
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#ADD8E6' }} />
              <input
                className="clay-input"
                style={{ paddingLeft: 48 }}
                placeholder="username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#2d3748' }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#ADD8E6' }} />
              <input
                className="clay-input"
                style={{ paddingLeft: 48, paddingRight: 48 }}
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="clay-btn clay-btn-primary"
            style={{ width: '100%', fontSize: '1.05rem', opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, color: '#718096', fontWeight: 600 }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: '#22C55E', fontWeight: 800, textDecoration: 'none' }}>
            Đăng ký miễn phí
          </Link>
        </div>

        {/* Forgot Password */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/forgot-password" style={{ color: '#718096', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Quên mật khẩu?
          </Link>
        </div>

        {/* Social Login */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
            <span style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: 700 }}>HOẶC</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => window.location.href = '/api/auth/social/google'}
              className="clay-btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700, fontSize: '0.9rem', padding: '12px 16px', border: '2px solid rgba(0,0,0,0.08)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.29 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.71 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button
              onClick={() => window.location.href = '/api/auth/social/facebook'}
              className="clay-btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700, fontSize: '0.9rem', padding: '12px 16px', border: '2px solid rgba(0,0,0,0.08)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </div>
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop: 24, padding: 16, borderRadius: 14,
          background: 'rgba(173,216,230,0.15)', border: '2px solid rgba(173,216,230,0.3)',
          fontSize: '0.8rem', color: '#4a5568', fontWeight: 600, textAlign: 'center',
        }}>
          💡 Demo: username <strong>demo</strong> / password <strong>demo123</strong>
        </div>
      </div>
    </div>
  );
}
