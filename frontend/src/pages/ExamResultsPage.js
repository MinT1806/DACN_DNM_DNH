import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { testAPI } from '../api/api';
import { toast } from 'react-toastify';
import {
  CheckCircle, XCircle, Clock, Award, Zap, ArrowLeft, RotateCcw,
  TrendingUp, Target, BookOpen, BarChart2
} from 'lucide-react';

function loadStoredResult(resultId) {
  try {
    const stored = sessionStorage.getItem('exam_result_' + resultId);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function storeResult(resultId, data) {
  try {
    sessionStorage.setItem('exam_result_' + resultId, JSON.stringify(data));
  } catch {}
}

export default function ExamResultsPage() {
  const { resultId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialResult = location.state?.result || loadStoredResult(resultId);
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(!initialResult && !!resultId);
  const [activeTab, setActiveTab] = useState('overview');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!result && resultId) {
      testAPI.getResultById(resultId)
        .then(r => {
          const data = r.data;
          setResult(data);
          storeResult(resultId, data);
        })
        .catch(() => toast.error('Không thể tải kết quả'))
        .finally(() => setLoading(false));
    }
  }, [resultId]);

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px', textAlign: 'center', color: '#718096', fontWeight: 700 }}>
        Đang tải kết quả...
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
        <h2 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Không tìm thấy kết quả</h2>
        <Link to="/tests"><button className="clay-btn clay-btn-primary" style={{ marginTop: 12 }}>Quay lại bài kiểm tra</button></Link>
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + 'p ' + s + 'gi';
  };

  const scoreColor = result.score >= 8 ? '#22C55E' : result.score >= 6 ? '#f59e0b' : '#ef4444';
  const questionResults = result.questionResults || [];

  const correctCount = questionResults.filter(q => q.isCorrect).length;
  const wrongCount = questionResults.length - correctCount;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      {/* Back button */}
      <button onClick={() => navigate('/tests')} className="clay-btn" style={{ marginBottom: 20, fontSize: '0.9rem' }}>
        <ArrowLeft size={16} style={{ marginRight: 6 }} /> Quay lại danh sách bài kiểm tra
      </button>

      {/* Score card */}
      <div className="clay-card" style={{
        padding: 32, marginBottom: 24, textAlign: 'center',
        background: 'linear-gradient(135deg, ' + scoreColor + '11, ' + scoreColor + '22)',
        border: '2px solid ' + scoreColor + '33',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 120, height: 120, borderRadius: 32,
            background: 'linear-gradient(135deg, ' + scoreColor + ', ' + scoreColor + 'aa)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px ' + scoreColor + '44',
          }}>
            <span style={{ fontWeight: 900, fontSize: '2.8rem', color: 'white', lineHeight: 1 }}>
              {result.score}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
              /{result.maxScore || 10}
            </span>
          </div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          background: result.passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: result.passed ? '#16a34a' : '#dc2626',
          fontWeight: 800, fontSize: '0.9rem', marginBottom: 16,
        }}>
          {result.passed ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {result.passed ? 'Đạt yêu cầu!' : 'Chưa đạt yêu cầu'}
        </div>

        <h2 style={{ fontWeight: 900, fontSize: '1.3rem', color: '#1a202c', marginBottom: 4 }}>
          {result.testTitle || 'Kết quả bài kiểm tra'}
        </h2>
        <p style={{ color: '#718096', fontWeight: 600, marginBottom: 20 }}>
          {result.feedback || ''}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, maxWidth: 500, margin: '0 auto' }}>
          {[
            { icon: <CheckCircle size={16} />, label: 'Đúng', value: correctCount + '/' + result.totalQuestions, color: '#22C55E' },
            { icon: <XCircle size={16} />, label: 'Sai', value: wrongCount, color: '#ef4444' },
            { icon: <Clock size={16} />, label: 'Thời gian', value: formatTime(result.timeSpentSeconds), color: '#3b82f6' },
            { icon: <Award size={16} />, label: 'Điểm TB', value: (result.percentage || 0) + '%', color: '#8b5cf6' },
            { icon: <Zap size={16} />, label: 'XP nhận', value: '+' + (result.xpEarned || 0), color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className="clay-card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ color: s.color, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'Tổng quan', icon: <BarChart2 size={16} /> },
          { id: 'questions', label: 'Chi tiết câu hỏi', icon: <BookOpen size={16} /> },
          { id: 'analysis', label: 'Phân tích', icon: <TrendingUp size={16} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="clay-btn"
            style={{
              background: activeTab === t.id ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'white',
              color: activeTab === t.id ? 'white' : '#4a5568',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 20 }}>Tổng quan kết quả</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Loại bài kiểm tra', value: (result.testType || '').replace(/_/g, ' ') || '—' },
              { label: 'Level', value: result.level || '—' },
              { label: 'Tổng số câu', value: result.totalQuestions },
              { label: 'Số câu đúng', value: correctCount },
              { label: 'Số câu sai', value: wrongCount },
              { label: 'Điểm số', value: result.score + '/' + (result.maxScore || 10) },
              { label: 'Phần trăm', value: (result.percentage || 0) + '%' },
              { label: 'Điểm đạt', value: (result.passingScore || 6) + '/' + (result.maxScore || 10) },
              { label: 'Thời gian làm bài', value: formatTime(result.timeSpentSeconds) },
              { label: 'XP nhận được', value: '+' + (result.xpEarned || 0) },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.03)' }}>
                <span style={{ fontWeight: 600, color: '#718096', fontSize: '0.85rem' }}>{item.label}</span>
                <span style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.9rem' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions tab */}
      {activeTab === 'questions' && (
        <div>
          {questionResults.map((qr, idx) => (
            <div key={idx} className="clay-card" style={{
              padding: 24, marginBottom: 16,
              border: '2px solid ' + (qr.isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'),
              background: qr.isCorrect ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: qr.isCorrect ? '#22C55E' : '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {qr.isCorrect ? <CheckCircle size={18} color="white" /> : <XCircle size={18} color="white" />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a202c', marginBottom: 4 }}>
                    Câu {idx + 1}: {qr.question}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: qr.isCorrect ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                    Đáp án của bạn: {qr.userAnswer ? String.fromCharCode(65 + parseInt(qr.userAnswer)) : '—'}
                  </div>
                  {!qr.isCorrect && (
                    <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700, marginTop: 4 }}>
                      Đáp án đúng: {String.fromCharCode(65 + parseInt(qr.correctAnswer))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {questionResults.length === 0 && (
            <div className="clay-card" style={{ padding: 40, textAlign: 'center', color: '#718096', fontWeight: 600 }}>
              Không có dữ liệu chi tiết câu hỏi
            </div>
          )}
        </div>
      )}

      {/* Analysis tab */}
      {activeTab === 'analysis' && (
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 20 }}>Phân tích kết quả</h3>

          {/* Score distribution */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: '#4a5568', marginBottom: 10 }}>Tỷ lệ đúng/sai</div>
            <div style={{ display: 'flex', height: 24, borderRadius: 12, overflow: 'hidden', background: '#e2e8f0' }}>
              {result.totalQuestions > 0 && (
                <>
                  <div style={{
                    width: (correctCount / result.totalQuestions) * 100 + '%',
                    background: 'linear-gradient(90deg, #22C55E, #16a34a)',
                    transition: 'width 0.5s',
                  }} />
                  <div style={{
                    width: (wrongCount / result.totalQuestions) * 100 + '%',
                    background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                    transition: 'width 0.5s',
                  }} />
                </>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
              <span style={{ color: '#22C55E' }}>Đúng: {correctCount} ({Math.round(correctCount / Math.max(result.totalQuestions, 1) * 100)}%)</span>
              <span style={{ color: '#ef4444' }}>Sai: {wrongCount} ({Math.round(wrongCount / Math.max(result.totalQuestions, 1) * 100)}%)</span>
            </div>
          </div>

          {/* Time analysis */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: '#4a5568', marginBottom: 10 }}>Thời gian làm bài</div>
            <div style={{
              padding: '16px 20px', borderRadius: 12,
              background: 'rgba(59,130,246,0.06)', border: '2px solid rgba(59,130,246,0.12)',
              textAlign: 'center',
            }}>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#3b82f6' }}>
                {formatTime(result.timeSpentSeconds)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
                {result.timeSpentSeconds && result.totalQuestions > 0
                  ? 'Trung bình ' + Math.round(result.timeSpentSeconds / result.totalQuestions) + 's / câu'
                  : ''}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(139,92,246,0.06)', border: '2px solid rgba(139,92,246,0.12)' }}>
            <div style={{ fontWeight: 800, color: '#7c3aed', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={18} /> Gợi ý cải thiện
            </div>
            <p style={{ color: '#4a5568', fontWeight: 600, fontSize: '0.9rem', margin: 0, lineHeight: 1.7 }}>
              {result.score >= 8
                ? 'Bạn làm rất tốt! Hãy tiếp tục duy trì và thử các bài khó hơn để nâng cao trình độ.'
                : result.score >= 6
                ? 'Kết quả khả quan. Hãy ôn tập lại các phần chưa nắm vững và làm thêm bài tập để cải thiện.'
                : 'Đừng nản lòng! Hãy xem lại bài giảng, ôn tập kiến thức cơ bản và thử lại bài kiểm tra.'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <Link to="/tests" style={{ flex: 1, textDecoration: 'none' }}>
          <button className="clay-btn" style={{ width: '100%' }}>
            <BookOpen size={16} style={{ marginRight: 6 }} /> Danh sách bài kiểm tra
          </button>
        </Link>
        <Link to={'/test/' + result.testId} style={{ flex: 1, textDecoration: 'none' }}>
          <button className="clay-btn clay-btn-primary" style={{ width: '100%' }}>
            <RotateCcw size={16} style={{ marginRight: 6 }} /> Làm lại
          </button>
        </Link>
      </div>
    </div>
  );
}
