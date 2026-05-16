import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { placementAPI } from '../api/api';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';

const QUESTIONS = [
  { id: 1, level: 'A1', question: 'She ___ a teacher.', options: ['is', 'are', 'am', 'be'], answer: 'is' },
  { id: 2, level: 'A1', question: 'They ___ football every Sunday.', options: ['play', 'plays', 'playing', 'played'], answer: 'play' },
  { id: 3, level: 'A2', question: 'I ___ to Paris last year.', options: ['go', 'went', 'gone', 'going'], answer: 'went' },
  { id: 4, level: 'A2', question: 'She has ___ finished the report.', options: ['just', 'yet', 'since', 'for'], answer: 'just' },
  { id: 5, level: 'B1', question: 'By the time he arrived, she ___ already left.', options: ['had', 'has', 'was', 'did'], answer: 'had' },
  { id: 6, level: 'B1', question: 'If I ___ rich, I would travel the world.', options: ['were', 'am', 'will be', 'be'], answer: 'were' },
  { id: 7, level: 'B2', question: 'The proposal ___ by the committee next week.', options: ['will be reviewed', 'will review', 'is reviewing', 'has reviewed'], answer: 'will be reviewed' },
  { id: 8, level: 'B2', question: 'Despite ___ tired, she continued working.', options: ['being', 'been', 'to be', 'be'], answer: 'being' },
  { id: 9, level: 'C1', question: 'The report was ___ before the meeting commenced.', options: ['circulated', 'circulating', 'to circulate', 'circulation'], answer: 'circulated' },
  { id: 10, level: 'C1', question: 'Hardly ___ she arrived when the phone rang.', options: ['had', 'has', 'did', 'was'], answer: 'had' },
];

const LEVEL_LABELS = { A1: '🌱 Beginner', A2: '📗 Elementary', B1: '📘 Pre-Intermediate', B2: '📙 Intermediate', C1: '📕 Advanced' };

function inferLevel(correct, total) {
  const pct = correct / total;
  if (pct >= 0.85) return 'C1';
  if (pct >= 0.70) return 'B2';
  if (pct >= 0.55) return 'B1';
  if (pct >= 0.40) return 'A2';
  return 'A1';
}

export default function PlacementTestPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = (qId, option) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = async () => {
    const answered = Object.keys(answers).length;
    if (answered < QUESTIONS.length) {
      toast.warning(`Bạn còn ${QUESTIONS.length - answered} câu chưa trả lời`);
      return;
    }
    setSubmitting(true);
    const correct = QUESTIONS.filter(q => answers[q.id] === q.answer).length;
    const level = inferLevel(correct, QUESTIONS.length);
    try {
      const res = await placementAPI.submit({ correctAnswers: correct, totalQuestions: QUESTIONS.length, recommendedLevel: level });
      setResult({ correct, total: QUESTIONS.length, level: res.data?.level || level });
      setSubmitted(true);
      // Update local user data
      const updatedUser = { ...user, level: res.data?.level || level, placementTestCompleted: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Đã hoàn thành bài kiểm tra đầu vào! 🎉');
    } catch {
      // Still show result even if API fails
      setResult({ correct, total: QUESTIONS.length, level });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && result) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <div className="clay-card" style={{ padding: 48 }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎯</div>
          <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#1a202c', marginBottom: 8 }}>
            Kết quả kiểm tra đầu vào
          </h1>
          <div style={{
            margin: '24px 0', padding: '24px',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(173,216,230,0.1))',
            borderRadius: 20, border: '2px solid rgba(34,197,94,0.2)',
          }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#22C55E', marginBottom: 8 }}>
              {result.correct}/{result.total}
            </div>
            <div style={{ fontSize: '1rem', color: '#4a5568', fontWeight: 600 }}>câu trả lời đúng</div>
          </div>
          <div style={{
            padding: '20px 28px', borderRadius: 16,
            background: 'linear-gradient(135deg, #FDBCB4, #f9a59b)',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: '0.85rem', color: '#7c2d12', fontWeight: 700, marginBottom: 4 }}>Trình độ được xác định</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7c2d12' }}>{result.level}</div>
            <div style={{ fontSize: '0.9rem', color: '#9a3412', fontWeight: 600 }}>{LEVEL_LABELS[result.level]}</div>
          </div>
          <p style={{ color: '#718096', fontWeight: 600, marginBottom: 28, lineHeight: 1.7 }}>
            Dựa trên kết quả, hệ thống đã xếp bạn vào trình độ <strong>{result.level}</strong>. 
            Bạn sẽ nhận được lộ trình học tập phù hợp!
          </p>
          <button
            className="clay-btn clay-btn-primary"
            style={{ width: '100%', fontSize: '1rem' }}
            onClick={() => navigate('/dashboard')}
          >
            Bắt đầu học ngay <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div className="clay-card" style={{
        padding: 28, marginBottom: 28,
        background: 'linear-gradient(135deg, rgba(253,188,180,0.15), rgba(173,216,230,0.15))',
      }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.6rem', color: '#1a202c', marginBottom: 8 }}>
          📋 Bài Kiểm Tra Đầu Vào
        </h1>
        <p style={{ color: '#718096', fontWeight: 600, lineHeight: 1.6 }}>
          Hoàn thành {QUESTIONS.length} câu hỏi để xác định trình độ của bạn (A1–C1).
          Thời gian không giới hạn - hãy cố gắng hết sức!
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {Object.keys(LEVEL_LABELS).map(l => (
            <span key={l} style={{
              padding: '4px 12px', borderRadius: 8,
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              fontSize: '0.8rem', fontWeight: 700, color: '#16a34a',
            }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568' }}>
            Đã trả lời: {Object.keys(answers).length}/{QUESTIONS.length}
          </span>
        </div>
        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4 }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: 'linear-gradient(90deg, #22C55E, #16a34a)',
            width: `${(Object.keys(answers).length / QUESTIONS.length) * 100}%`,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Questions */}
      {QUESTIONS.map((q, idx) => (
        <div key={q.id} className="clay-card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <span style={{
              minWidth: 32, height: 32, borderRadius: 10,
              background: answers[q.id]
                ? 'linear-gradient(135deg, #22C55E, #16a34a)'
                : 'rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.85rem',
              color: answers[q.id] ? 'white' : '#718096',
            }}>{idx + 1}</span>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ADD8E6', marginBottom: 4 }}>
                Level {q.level}
              </div>
              <p style={{ fontWeight: 700, color: '#1a202c', margin: 0, fontSize: '1rem' }}>
                {q.question}
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map(opt => (
              <button
                key={opt}
                onClick={() => handleAnswer(q.id, opt)}
                style={{
                  padding: '10px 16px', borderRadius: 12, border: '2px solid',
                  borderColor: answers[q.id] === opt ? '#22C55E' : 'rgba(0,0,0,0.08)',
                  background: answers[q.id] === opt
                    ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.8)',
                  color: answers[q.id] === opt ? '#16a34a' : '#4a5568',
                  fontWeight: answers[q.id] === opt ? 800 : 600,
                  cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        className="clay-btn clay-btn-primary"
        style={{ width: '100%', fontSize: '1.1rem', marginTop: 8, opacity: submitting ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? '⏳ Đang chấm điểm...' : '🚀 Nộp bài & Xem kết quả'}
      </button>
    </div>
  );
}
