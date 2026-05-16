import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { testAPI, testManagementAPI } from '../api/api';
import { toast } from 'react-toastify';
import {
  CheckCircle, XCircle, Clock, Award, Zap, ArrowLeft, RotateCcw,
  TrendingUp, Target, BookOpen, BarChart2, Star, MessageSquare,
  Mic, FileText, Lightbulb, ThumbsUp, AlertTriangle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

function loadStoredResult(resultId) {
  try {
    const stored = sessionStorage.getItem('exam_result_' + resultId);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

const SKILL_COLORS = {
  GRAMMAR: '#22C55E', VOCABULARY: '#3b82f6',
  WRITING: '#a855f7', SPEAKING: '#f59e0b',
  READING: '#8b5cf6', LISTENING: '#06b6d4',
  MIXED: '#6366f1',
};

const SECTION_LABELS = {
  VOCABULARY: 'Từ vựng',
  GRAMMAR: 'Ngữ pháp',
  READING: 'Đọc hiểu',
  LISTENING: 'Nghe',
  WRITING: 'Viết',
  SPEAKING: 'Nói',
  MIXED: 'Hỗn hợp',
};

export default function CompleteResultPage() {
  const { resultId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialResult = location.state?.result || loadStoredResult(resultId);
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(!initialResult && !!resultId);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiGrading, setAiGrading] = useState(null);
  const [gradingLoading, setGradingLoading] = useState(false);

  useEffect(() => {
    if (!result && resultId) {
      Promise.all([
        testAPI.getResultById(resultId).catch(() => null),
        testManagementAPI.getResult(resultId).catch(() => null),
      ]).then(([r1, r2]) => {
        const data = r1?.data || r2?.data || null;
        if (data) {
          setResult(data);
          try { sessionStorage.setItem('exam_result_' + resultId, JSON.stringify(data)); } catch {}
        }
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [resultId]);

  const loadAIGrading = async () => {
    if (aiGrading || !result) return;
    setGradingLoading(true);
    try {
      const responses = [];
      if (result.questionResults) {
        for (const qr of result.questionResults) {
          if (qr.questionType === 'WRITING' || qr.questionType === 'SPEAKING') {
            try {
              const api = qr.questionType === 'WRITING'
                ? testManagementAPI.gradeWriting
                : testManagementAPI.gradeSpeaking;
              const r = await api({
                questionType: qr.questionType,
                question: qr.question,
                userAnswer: qr.userAnswer || 'No answer provided',
                maxScore: qr.points || 10,
              });
              responses.push({ index: qr.questionIndex, ...r.data });
            } catch { /* ignore */ }
          }
        }
      }
      setAiGrading(responses);
    } catch { /* ignore */ }
    setGradingLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'ai-feedback') {
      loadAIGrading();
    }
  }, [activeTab]);

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
    return m + 'p ' + s + 's';
  };

  const scoreColor = result.score >= 8 ? '#22C55E' : result.score >= 6 ? '#f59e0b' : '#ef4444';
  const questionResults = result.questionResults || [];

  const correctCount = questionResults.filter(q => q.isCorrect).length;
  const wrongCount = questionResults.length - correctCount;
  const unanswered = questionResults.filter(q => !q.userAnswer || q.userAnswer === '').length;

  const pieData = [
    { name: 'Đúng', value: correctCount, color: '#22C55E' },
    { name: 'Sai', value: wrongCount, color: '#ef4444' },
    { name: 'Bỏ trống', value: unanswered, color: '#a0aec0' },
  ].filter(d => d.value > 0);

  const sectionBreakdown = {};
  questionResults.forEach((qr, i) => {
    const sectionType = qr.questionType || 'MIXED';
    if (!sectionBreakdown[sectionType]) {
      sectionBreakdown[sectionType] = { total: 0, correct: 0 };
    }
    sectionBreakdown[sectionType].total++;
    if (qr.isCorrect) sectionBreakdown[sectionType].correct++;
  });

  const sectionChartData = Object.entries(sectionBreakdown).map(([type, data]) => ({
    name: SECTION_LABELS[type] || type,
    fullName: type,
    correct: data.correct,
    wrong: data.total - data.correct,
    rate: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
  }));

  const getScoreGrade = (score, max) => {
    const pct = (score / max) * 100;
    if (pct >= 90) return { grade: 'A', color: '#22C55E', text: 'Xuất sắc' };
    if (pct >= 80) return { grade: 'B', color: '#3b82f6', text: 'Tốt' };
    if (pct >= 70) return { grade: 'C', color: '#f59e0b', text: 'Khá' };
    if (pct >= 60) return { grade: 'D', color: '#f97316', text: 'Trung bình' };
    return { grade: 'F', color: '#ef4444', text: 'Cần cải thiện' };
  };

  const grade = getScoreGrade(result.score, result.maxScore || 10);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
      <button onClick={() => navigate('/tests')} className="clay-btn" style={{ marginBottom: 20, fontSize: '0.9rem' }}>
        <ArrowLeft size={16} style={{ marginRight: 6 }} /> Quay lại danh sách bài kiểm tra
      </button>

      <div className="clay-card" style={{
        padding: 32, marginBottom: 24, textAlign: 'center',
        background: 'linear-gradient(135deg, ' + scoreColor + '11, ' + scoreColor + '22)',
        border: '2px solid ' + scoreColor + '33',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            width: 140, height: 140, borderRadius: 36,
            background: 'linear-gradient(135deg, ' + scoreColor + ', ' + scoreColor + 'aa)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px ' + scoreColor + '44',
          }}>
            <span style={{ fontWeight: 900, fontSize: '3.2rem', color: 'white', lineHeight: 1 }}>
              {result.score}
            </span>
            <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
              /{result.maxScore || 10}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: result.passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: result.passed ? '#16a34a' : '#dc2626',
            fontWeight: 800, fontSize: '0.9rem',
          }}>
            {result.passed ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {result.passed ? 'Đạt yêu cầu!' : 'Chưa đạt yêu cầu'}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: 'rgba(139,92,246,0.1)', color: '#8b5cf6',
            fontWeight: 800, fontSize: '0.9rem',
          }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 900 }}>{grade.grade}</span>
            <span style={{ fontSize: '0.8rem' }}>{grade.text}</span>
          </div>
        </div>

        <h2 style={{ fontWeight: 900, fontSize: '1.3rem', color: '#1a202c', marginBottom: 4 }}>
          {result.testTitle || 'Kết quả bài kiểm tra'}
        </h2>
        <p style={{ color: '#718096', fontWeight: 600, marginBottom: 24 }}>
          {result.feedback || result.overallFeedback || ''}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, maxWidth: 600, margin: '0 auto' }}>
          {[
            { icon: <CheckCircle size={16} />, label: 'Đúng', value: correctCount + '/' + result.totalQuestions, color: '#22C55E' },
            { icon: <XCircle size={16} />, label: 'Sai', value: wrongCount, color: '#ef4444' },
            { icon: <AlertTriangle size={16} />, label: 'Bỏ trống', value: unanswered, color: '#a0aec0' },
            { icon: <Clock size={16} />, label: 'Thời gian', value: formatTime(result.timeSpentSeconds), color: '#3b82f6' },
            { icon: <Award size={16} />, label: 'Phần trăm', value: (result.percentage || 0) + '%', color: '#8b5cf6' },
            { icon: <Zap size={16} />, label: 'XP', value: '+' + (result.xpEarned || 0), color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className="clay-card" style={{ padding: 12, textAlign: 'center' }}>
              <div style={{ color: s.color, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '1rem', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#718096', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'Tổng quan', icon: <BarChart2 size={16} /> },
          { id: 'questions', label: 'Chi tiết', icon: <BookOpen size={16} /> },
          { id: 'analysis', label: 'Phân tích', icon: <TrendingUp size={16} /> },
          { id: 'ai-feedback', label: 'AI Phản hồi', icon: <MessageSquare size={16} /> },
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

      {activeTab === 'overview' && (
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 20 }}>Tổng quan kết quả</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
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
              { label: 'Đánh giá', value: grade.text },
              { label: 'Hoàn thành lúc', value: result.completedAt ? new Date(result.completedAt).toLocaleString('vi-VN') : '—' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.03)' }}>
                <span style={{ fontWeight: 600, color: '#718096', fontSize: '0.85rem' }}>{item.label}</span>
                <span style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.9rem' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div>
          {questionResults.map((qr, idx) => {
            const hasWriting = qr.questionType === 'WRITING';
            const hasSpeaking = qr.questionType === 'SPEAKING';

            return (
              <div key={idx} className="clay-card" style={{
                padding: 24, marginBottom: 16,
                border: '2px solid ' + (qr.isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'),
                background: qr.isCorrect ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: qr.isCorrect ? '#22C55E' : '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {qr.isCorrect ? <CheckCircle size={20} color="white" /> : <XCircle size={20} color="white" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: '#1a202c' }}>Câu {idx + 1}</span>
                      {qr.questionType && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 6,
                          background: (SKILL_COLORS[qr.questionType] || '#718096') + '22',
                          color: SKILL_COLORS[qr.questionType] || '#718096',
                          fontWeight: 700, fontSize: '0.75rem',
                        }}>
                          {SECTION_LABELS[qr.questionType] || qr.questionType}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, color: '#4a5568', fontSize: '0.9rem', marginBottom: 8 }}>
                      {qr.question}
                    </div>
                    {hasWriting && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 8, background: 'white',
                        fontSize: '0.85rem', color: '#4a5568', lineHeight: 1.6,
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}>
                        <strong style={{ color: '#8b5cf6' }}>Bài viết:</strong> {qr.userAnswer || '—'}
                      </div>
                    )}
                    {hasSpeaking && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.06)',
                        display: 'flex', alignItems: 'center', gap: 8,
                        border: '1px solid rgba(245,158,11,0.15)',
                      }}>
                        <Mic size={16} color="#f59e0b" />
                        <span style={{ color: '#4a5568', fontSize: '0.85rem' }}>
                          {qr.userAnswer ? 'Đã ghi âm' : 'Không có bản ghi'}
                        </span>
                      </div>
                    )}
                    {!hasWriting && !hasSpeaking && (
                      <div style={{ fontSize: '0.85rem', color: qr.isCorrect ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                        Đáp án của bạn: {qr.userAnswer ? String.fromCharCode(65 + parseInt(qr.userAnswer)) : '—'}
                      </div>
                    )}
                    {!qr.isCorrect && qr.correctAnswer !== undefined && (
                      <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700, marginTop: 4 }}>
                        Đáp án đúng: {String.fromCharCode(65 + parseInt(qr.correctAnswer))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 24 }}>Phân tích kết quả</h3>

          {pieData.length > 0 && (
            <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
              <div style={{ width: 200, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: d.color }} />
                    <span style={{ flex: 1, fontWeight: 600, color: '#4a5568', fontSize: '0.9rem' }}>{d.name}</span>
                    <span style={{ fontWeight: 900, color: '#1a202c' }}>{d.value}</span>
                    <span style={{ fontWeight: 600, color: '#718096', fontSize: '0.8rem', width: 50, textAlign: 'right' }}>
                      ({Math.round((d.value / result.totalQuestions) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sectionChartData.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h4 style={{ fontWeight: 700, color: '#4a5568', marginBottom: 16, fontSize: '0.95rem' }}>Điểm theo phần</h4>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionChartData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => v + '%'} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip formatter={(v) => v + '%'} />
                    <Bar dataKey="rate" name="Tỷ lệ đúng" radius={[0, 4, 4, 0]}>
                      {sectionChartData.map((entry, index) => (
                        <Cell key={index} fill={SKILL_COLORS[entry.fullName] || '#8b5cf6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(139,92,246,0.06)', border: '2px solid rgba(139,92,246,0.12)' }}>
            <div style={{ fontWeight: 800, color: '#7c3aed', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lightbulb size={18} /> Gợi ý cải thiện
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

      {activeTab === 'ai-feedback' && (
        <div>
          <div className="clay-card" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <MessageSquare size={20} color="#8b5cf6" />
            <div>
              <div style={{ fontWeight: 800, color: '#1a202c' }}>Phản hồi từ AI</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>AI phân tích chi tiết bài làm của bạn</div>
            </div>
          </div>

          {gradingLoading && (
            <div className="clay-card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{
                width: 32, height: 32, border: '3px solid #8b5cf633',
                borderTopColor: '#8b5cf6', borderRadius: '50%',
                animation: 'spin 1s linear infinite', margin: '0 auto 12px',
              }} />
              <div style={{ color: '#718096', fontWeight: 600 }}>AI đang phân tích bài làm của bạn...</div>
            </div>
          )}

          {!gradingLoading && aiGrading && aiGrading.length === 0 && (
            <div className="clay-card" style={{ padding: 40, textAlign: 'center' }}>
              <Star size={32} color="#f59e0b" style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Không có bài viết hoặc bài nói để phân tích</div>
              <div style={{ color: '#718096', fontSize: '0.85rem' }}>Phần Writing và Speaking sẽ có phản hồi chi tiết từ AI</div>
            </div>
          )}

          {!gradingLoading && aiGrading && aiGrading.map((g, i) => (
            <div key={i} className="clay-card" style={{
              padding: 24, marginBottom: 16,
              background: g.score >= 7 ? 'rgba(34,197,94,0.03)' : 'rgba(245,158,11,0.03)',
              border: `1px solid ${g.score >= 7 ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 800, color: '#1a202c' }}>
                  Câu {g.index + 1} - {g.questionType === 'WRITING' ? 'Bài viết' : 'Bài nói'}
                </span>
                <span style={{
                  fontWeight: 900, fontSize: '1.3rem',
                  color: g.score >= 7 ? '#22C55E' : '#f59e0b',
                }}>
                  {g.score}/{g.maxScore}
                </span>
              </div>

              <p style={{ color: '#4a5568', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 12 }}>
                {g.feedback || g.overallComment}
              </p>

              {g.criteriaScores && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#718096', marginBottom: 8 }}>Điểm theo tiêu chí:</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(g.criteriaScores).map(([key, val]) => (
                      <div key={key} style={{
                        padding: '4px 10px', borderRadius: 6,
                        background: 'rgba(0,0,0,0.04)',
                        fontSize: '0.75rem', fontWeight: 600,
                      }}>
                        <span style={{ color: '#718096', textTransform: 'capitalize' }}>{key}:</span>{' '}
                        <span style={{ color: '#1a202c' }}>{Number(val).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {g.corrections && g.corrections.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#ef4444', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={12} /> Sửa lỗi
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem', color: '#4a5568' }}>
                    {g.corrections.map((c, j) => <li key={j}>{c}</li>)}
                  </ul>
                </div>
              )}

              {g.suggestions && g.suggestions.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#22C55E', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ThumbsUp size={12} /> Gợi ý
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem', color: '#4a5568' }}>
                    {g.suggestions.map((s, j) => <li key={j}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
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
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
