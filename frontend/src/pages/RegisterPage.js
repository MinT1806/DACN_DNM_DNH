import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { BookOpen, User, Mail, Lock } from 'lucide-react';

const AGE_GROUPS = [
  { value: 'CHILD', label: '🧒 Trẻ em (6–12 tuổi)', desc: 'Học qua trò chơi, hình ảnh sinh động' },
  { value: 'TEEN', label: '🧑 Thanh thiếu niên (13–17 tuổi)', desc: 'Học theo chủ đề thú vị, giao tiếp tự nhiên' },
  { value: 'ADULT', label: '👩 Người lớn (18+)', desc: 'Học chuyên sâu, hướng tới IELTS/TOEIC' },
];

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', ageGroup: '' });

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.ageGroup) {
      toast.error('Vui lòng chọn nhóm tuổi');
      return;
    }
    try {
      await register(form);
      toast.success('Đăng ký thành công! Hãy làm bài kiểm tra đầu vào 🎉');
      navigate('/placement-test');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
      setStep(1);
    }
  };

  const infoFields = [
    { key: 'fullName', label: 'Họ và tên', placeholder: 'Nguyễn Văn A', icon: <User size={18} />, type: 'text', required: false },
    { key: 'username', label: 'Tên đăng nhập', placeholder: 'nguyenvana', icon: <User size={18} />, type: 'text', required: true },
    { key: 'email', label: 'Email', placeholder: 'email@example.com', icon: <Mail size={18} />, type: 'email', required: true },
    { key: 'password', label: 'Mật khẩu', placeholder: '••••••••', icon: <Lock size={18} />, type: 'password', required: true },
  ];

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="clay-card" style={{ padding: 40, width: '100%', maxWidth: 480 }}>
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
          <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 8 }}>
            {step === 1 ? 'Tạo tài khoản mới' : 'Chọn nhóm tuổi của bạn'}
          </h1>
          <p style={{ color: '#718096', fontWeight: 600 }}>
            {step === 1 ? 'Bắt đầu hành trình học tiếng Anh ngay hôm nay' : 'Giúp chúng tôi cá nhân hóa nội dung cho bạn'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
          {[1, 2].map((s, i) => (
            <React.Fragment key={s}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step >= s ? '#22C55E' : '#e2e8f0',
                color: step >= s ? 'white' : '#718096',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: '0.9rem',
              }}>{s}</div>
              {i < 1 && <div style={{ flex: 1, height: 2, background: step > s ? '#22C55E' : '#e2e8f0', margin: '0 8px' }} />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleNext}>
            {infoFields.map(field => (
              <div key={field.key} style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#2d3748', fontSize: '0.9rem' }}>
                  {field.label}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#ADD8E6' }}>
                    {field.icon}
                  </span>
                  <input
                    className="clay-input"
                    style={{ paddingLeft: 48 }}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    required={field.required}
                  />
                </div>
              </div>
            ))}
            <button
              type="submit"
              className="clay-btn clay-btn-primary"
              style={{ width: '100%', fontSize: '1.05rem', marginTop: 10 }}
            >
              Tiếp theo →
            </button>
          </form>
        )}

        {step === 2 && (
          <div>
            {AGE_GROUPS.map(ag => (
              <div
                key={ag.value}
                onClick={() => setForm(f => ({ ...f, ageGroup: ag.value }))}
                style={{
                  padding: '16px 20px', borderRadius: 16, marginBottom: 12, cursor: 'pointer',
                  border: `2px solid ${form.ageGroup === ag.value ? '#22C55E' : 'rgba(0,0,0,0.08)'}`,
                  background: form.ageGroup === ag.value ? 'rgba(34,197,94,0.06)' : 'rgba(0,0,0,0.02)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 800, color: '#1a202c', fontSize: '1rem' }}>{ag.label}</div>
                <div style={{ fontSize: '0.82rem', color: '#718096', fontWeight: 600, marginTop: 4 }}>{ag.desc}</div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                className="clay-btn"
                style={{ flex: 1 }}
                onClick={() => setStep(1)}
              >
                ← Quay lại
              </button>
              <button
                className="clay-btn clay-btn-primary"
                style={{ flex: 2, opacity: loading ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? '⏳ Đang đăng ký...' : '🎉 Đăng ký miễn phí'}
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, color: '#718096', fontWeight: 600 }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: '#22C55E', fontWeight: 800, textDecoration: 'none' }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

