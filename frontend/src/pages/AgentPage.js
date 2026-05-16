import React, { useState, useRef, useEffect } from 'react';
import { agentAPI } from '../api/api';
import { toast } from 'react-toastify';
import { Send, BookOpen, MessageCircle, Target } from 'lucide-react';

const TABS = [
  { id: 'chat', label: '💬 AI Chat', icon: <MessageCircle size={16} /> },
  { id: 'score', label: '📊 Chấm điểm', icon: <Target size={16} /> },
  { id: 'exercise', label: '📝 Tạo bài tập', icon: <BookOpen size={16} /> },
];

const SKILL_TYPES = ['WRITING', 'SPEAKING', 'READING', 'LISTENING'];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const EXERCISE_TYPES = ['MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'WRITING'];
const SKILL_FOR_EXERCISE = ['GRAMMAR', 'VOCABULARY', 'WRITING', 'READING', 'LISTENING', 'SPEAKING'];

export default function AgentPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const defaultTab = urlParams.get('tab') || 'chat';
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 8 }}>
          🤖 AI Tutor
        </h1>
        <p style={{ color: '#718096', fontWeight: 600 }}>
          Trợ lý học tiếng Anh thông minh - Chấm điểm, Tạo bài tập, Hỏi đáp
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="clay-btn"
            style={{
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #22C55E, #16a34a)'
                : 'white',
              color: activeTab === tab.id ? 'white' : '#4a5568',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.9rem',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && <ChatTab />}
      {activeTab === 'score' && <ScoreTab />}
      {activeTab === 'exercise' && <ExerciseTab />}
    </div>
  );
}

function ChatTab() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là AI Tutor của ABC English. Bạn có thể hỏi tôi về:\n• Ngữ pháp tiếng Anh\n• Từ vựng và cách dùng\n• Cách cải thiện kỹ năng\n• Luyện thi IELTS/TOEIC\n\nBạn muốn hỏi gì hôm nay? 😊',
      type: 'chatbot',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await agentAPI.chat({ message: input, sessionType: 'CHATBOT' });
      const c = data.content;
      let content = c.message;
      if (c.examples?.length) content += '\n\n**Ví dụ:**\n' + c.examples.map(e => `• ${e}`).join('\n');
      if (c.tip) content += '\n\n💡 **Tip:** ' + c.tip;
      setMessages(prev => [...prev, { role: 'assistant', content, type: 'chatbot' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xin lỗi, có lỗi xảy ra. Hãy thử lại!', type: 'chatbot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clay-card" style={{ overflow: 'hidden' }}>
      <div style={{ height: 450, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '12px 18px', borderRadius: 18,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #22C55E, #16a34a)'
                : 'rgba(173,216,230,0.2)',
              color: msg.role === 'user' ? 'white' : '#2d3748',
              border: msg.role === 'assistant' ? '2px solid rgba(173,216,230,0.3)' : 'none',
              fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.role === 'assistant' && (
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#22C55E', marginBottom: 6 }}>
                  🤖 AI Tutor
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 6, padding: '12px 18px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ADD8E6', animation: 'float 1s infinite' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FDBCB4', animation: 'float 1s 0.2s infinite' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', animation: 'float 1s 0.4s infinite' }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '16px 24px', borderTop: '2px solid rgba(173,216,230,0.2)', display: 'flex', gap: 12 }}>
        <input
          className="clay-input"
          placeholder="Hỏi về ngữ pháp, từ vựng, IELTS..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button className="clay-btn clay-btn-primary" onClick={send} disabled={loading || !input.trim()}
          style={{ padding: '12px 20px', flexShrink: 0 }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function ScoreTab() {
  const [form, setForm] = useState({ skillType: 'WRITING', userText: '', correctAnswer: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userText.trim()) { toast.error('Nhập nội dung cần chấm điểm!'); return; }
    setLoading(true);
    try {
      const { data } = await agentAPI.score(form);
      setResult(data);
      toast.success('Đã chấm điểm xong!');
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result ? (result.content.score >= 8 ? '#22C55E' : result.content.score >= 5 ? '#f59e0b' : '#ef4444') : '#22C55E';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24 }}>
      <div className="clay-card" style={{ padding: 28 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 24, color: '#1a202c' }}>📊 Chấm điểm bài làm</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#2d3748' }}>Kỹ năng</label>
            <select className="clay-input" value={form.skillType} onChange={e => setForm({ ...form, skillType: e.target.value })}
              style={{ cursor: 'pointer' }}>
              {SKILL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#2d3748' }}>
              {form.skillType === 'WRITING' ? 'Bài viết của bạn' :
               form.skillType === 'SPEAKING' ? 'Transcript bài nói' :
               'Câu trả lời của bạn'}
            </label>
            <textarea
              className="clay-textarea"
              placeholder={
                form.skillType === 'WRITING' ? 'Nhập bài viết tiếng Anh của bạn...' :
                form.skillType === 'SPEAKING' ? 'Nhập transcript bài nói...' :
                'Nhập câu trả lời...'
              }
              value={form.userText}
              onChange={e => setForm({ ...form, userText: e.target.value })}
              style={{ minHeight: 160 }}
            />
          </div>

          {(form.skillType === 'READING' || form.skillType === 'LISTENING') && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#2d3748' }}>Đáp án đúng</label>
              <input className="clay-input" placeholder="Nhập đáp án đúng..." value={form.correctAnswer}
                onChange={e => setForm({ ...form, correctAnswer: e.target.value })} />
            </div>
          )}

          <button type="submit" className="clay-btn clay-btn-primary" style={{ width: '100%', opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? '⏳ Đang chấm...' : '🎯 Chấm điểm ngay'}
          </button>
        </form>
      </div>

      {result && (
        <div className="clay-card" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, color: '#1a202c' }}>📋 Kết quả</h3>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 12px',
              background: `linear-gradient(135deg, ${scoreColor}33, ${scoreColor}66)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `4px solid ${scoreColor}`,
            }}>
              <span style={{ fontWeight: 900, fontSize: '2rem', color: scoreColor }}>
                {result.content.score}
              </span>
            </div>
            <div style={{ fontWeight: 700, color: '#718096' }}>/ 10 điểm</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>📝 Nhận xét:</div>
            <p style={{ color: '#4a5568', fontWeight: 600, lineHeight: 1.7, fontSize: '0.9rem' }}>
              {result.content.feedback}
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>💡 Gợi ý cải thiện:</div>
            <p style={{ color: '#4a5568', fontWeight: 600, lineHeight: 1.7, fontSize: '0.9rem' }}>
              {result.content.suggestions}
            </p>
          </div>

          <div style={{
            padding: '12px 16px', borderRadius: 12,
            background: 'rgba(34,197,94,0.06)', border: '2px solid rgba(34,197,94,0.15)',
            fontSize: '0.8rem', color: '#4a5568', fontWeight: 700,
          }}>
            📏 Rubric: {result.content.rubric}
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseTab() {
  const [form, setForm] = useState({ topic: '', level: 'B1', type: 'MULTIPLE_CHOICE', skill: 'GRAMMAR', count: 5 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setChecked(false);
    setAnswers({});
    try {
      const { data } = await agentAPI.generate({ ...form, count: Number(form.count) });
      setResult(data);
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const checkAnswers = () => setChecked(true);

  const score = checked && result
    ? result.content.questions.filter(q => answers[q.number] === q.correctAnswer).length
    : 0;

  return (
    <div>
      <div className="clay-card" style={{ padding: 28, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 24, color: '#1a202c' }}>📝 Tạo bài tập</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#2d3748', fontSize: '0.85rem' }}>Chủ đề</label>
              <input className="clay-input" placeholder="e.g. Present Simple, Travel..." value={form.topic}
                onChange={e => setForm({ ...form, topic: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#2d3748', fontSize: '0.85rem' }}>Cấp độ</label>
              <select className="clay-input" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}
                style={{ cursor: 'pointer' }}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#2d3748', fontSize: '0.85rem' }}>Kỹ năng</label>
              <select className="clay-input" value={form.skill} onChange={e => setForm({ ...form, skill: e.target.value })}
                style={{ cursor: 'pointer' }}>
                {SKILL_FOR_EXERCISE.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#2d3748', fontSize: '0.85rem' }}>Số câu</label>
              <input className="clay-input" type="number" min="3" max="10" value={form.count}
                onChange={e => setForm({ ...form, count: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="clay-btn clay-btn-primary" disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Đang tạo...' : '✨ Tạo bài tập'}
          </button>
        </form>
      </div>

      {result && (
        <div className="clay-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontWeight: 800, color: '#1a202c' }}>
              📚 {result.content.skill} - {result.content.level}
              {result.content.topic && ` | ${result.content.topic}`}
            </h3>
            {checked && (
              <div style={{
                padding: '8px 20px', borderRadius: 12, fontWeight: 800, fontSize: '1rem',
                background: score >= result.content.questions.length * 0.8 ? 'rgba(34,197,94,0.1)' : 'rgba(253,188,180,0.2)',
                color: score >= result.content.questions.length * 0.8 ? '#22C55E' : '#7c2d12',
                border: `2px solid ${score >= result.content.questions.length * 0.8 ? 'rgba(34,197,94,0.3)' : 'rgba(253,188,180,0.4)'}`,
              }}>
                🏆 {score}/{result.content.questions.length} câu đúng
              </div>
            )}
          </div>

          {result.content.questions.map((q, qi) => (
            <div key={qi} style={{
              marginBottom: 24, padding: 20, borderRadius: 16,
              background: checked
                ? (answers[q.number] === q.correctAnswer ? 'rgba(34,197,94,0.05)' : 'rgba(253,188,180,0.1)')
                : 'rgba(0,0,0,0.02)',
              border: checked
                ? `2px solid ${answers[q.number] === q.correctAnswer ? 'rgba(34,197,94,0.2)' : 'rgba(253,188,180,0.3)'}`
                : '2px solid rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontWeight: 700, color: '#1a202c', marginBottom: 14, fontSize: '0.95rem' }}>
                <span style={{ color: '#22C55E', fontWeight: 900 }}>Câu {q.number}: </span>
                {q.question}
              </p>

              {q.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((opt, oi) => (
                    <label key={oi} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
                      background: checked
                        ? (opt === q.correctAnswer ? 'rgba(34,197,94,0.15)' : answers[q.number] === opt ? 'rgba(239,68,68,0.1)' : 'white')
                        : (answers[q.number] === opt ? 'rgba(173,216,230,0.3)' : 'white'),
                      border: `2px solid ${checked
                        ? (opt === q.correctAnswer ? 'rgba(34,197,94,0.4)' : answers[q.number] === opt ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.06)')
                        : (answers[q.number] === opt ? '#ADD8E6' : 'rgba(0,0,0,0.06)')}`,
                      fontWeight: 600, fontSize: '0.9rem', color: '#2d3748',
                    }}>
                      <input type="radio" name={`q${q.number}`} value={opt}
                        checked={answers[q.number] === opt}
                        onChange={() => !checked && setAnswers({ ...answers, [q.number]: opt })}
                        style={{ accentColor: '#22C55E' }}
                      />
                      {opt}
                      {checked && opt === q.correctAnswer && <span style={{ color: '#22C55E', fontWeight: 800, marginLeft: 'auto' }}>✓</span>}
                    </label>
                  ))}
                </div>
              )}

              {checked && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(173,216,230,0.15)', border: '2px solid rgba(173,216,230,0.3)',
                  fontSize: '0.85rem', color: '#4a5568', fontWeight: 600,
                }}>
                  💡 {q.explanation}
                </div>
              )}
            </div>
          ))}

          {!checked && (
            <button className="clay-btn clay-btn-primary" onClick={checkAnswers}
              disabled={Object.keys(answers).length < result.content.questions.length}>
              ✅ Kiểm tra đáp án
            </button>
          )}
        </div>
      )}
    </div>
  );
}
