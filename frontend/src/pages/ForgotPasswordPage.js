import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState('request'); // request, verify
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setStep('verify');
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
    setLoading(false);
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Đặt lại mật khẩu thành công!');
        setTimeout(() => window.location.href = '/login', 1500);
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="clay-card" style={{ padding: 40, width: '100%', maxWidth: 440 }}>
        <Link to="/login" style={{ textDecoration: 'none', color: '#718096', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 28,
            background: 'linear-gradient(135deg, #FDBCB4, #22C55E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 12px 32px rgba(253, 188, 180, 0.5)',
          }}>
            <Mail size={36} color="white" />
          </div>
          <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 8 }}>
            {step === 'request' ? 'Quên mật khẩu?' : 'Nhập mã OTP'}
          </h1>
          <p style={{ color: '#718096', fontWeight: 600 }}>
            {step === 'request'
              ? 'Nhập email để nhận mã đặt lại mật khẩu'
              : 'Nhập mã OTP đã gửi đến email của bạn'}
          </p>
        </div>

        {step === 'request' ? (
          <form onSubmit={requestReset}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#2d3748' }}>
                Email
              </label>
              <input
                className="clay-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="clay-btn clay-btn-primary"
              style={{ width: '100%', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? '⏳ Đang gửi...' : '📧 Gửi mã OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#2d3748' }}>
                Mã OTP
              </label>
              <input
                className="clay-input"
                placeholder="Nhập mã 6 số"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                required
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: 8 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#2d3748' }}>
                Mật khẩu mới
              </label>
              <input
                className="clay-input"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <button
              type="submit"
              className="clay-btn clay-btn-primary"
              style={{ width: '100%', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? '⏳ Đang xử lý...' : '🔑 Đặt lại mật khẩu'}
            </button>
            <button
              type="button"
              onClick={() => setStep('request')}
              className="clay-btn"
              style={{ width: '100%', marginTop: 12 }}
            >
              Gửi lại mã OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
