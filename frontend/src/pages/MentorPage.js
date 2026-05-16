import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Send, ChevronLeft, User } from 'lucide-react';

export default function MentorPage() {
  const { user } = useAuth();
  const [myMentor, setMyMentor] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('chat');
  const messagesEndRef = useRef(null);

  const isMentor = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isMentor) {
        const res = await fetch('/api/mentor/students', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) setConversations(await res.json());
      } else {
        const res = await fetch('/api/mentor/my-mentor', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMyMentor(data);
          if (data.hasMentor) {
            fetchMessages(data.id);
          }
        }
      }
    } catch {}
    setLoading(false);
  };

  const fetchMessages = async (assignmentId) => {
    try {
      const res = await fetch(`/api/mentor/messages/${assignmentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setMessages(await res.json());
    } catch {}
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const assignmentId = isMentor ? selectedConv?.id : myMentor?.id;
    if (!assignmentId) return;

    try {
      const res = await fetch(`/api/mentor/messages/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ content: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages(assignmentId);
      }
    } catch {}
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#718096', fontWeight: 600 }}>Đang tải...</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 4 }}>
          👨‍🏫 {isMentor ? 'Học viên của tôi' : 'Mentor của tôi'}
        </h1>
        <p style={{ color: '#718096', fontWeight: 600 }}>
          {isMentor ? 'Theo dõi và hỗ trợ học viên' : 'Nhắn tin với mentor của bạn'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMentor ? '300px 1fr' : '1fr', gap: 24 }}>
        {/* Sidebar - Students list (for mentors) or Mentor info (for students) */}
        {isMentor ? (
          <div className="clay-card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
            <div style={{ padding: '16px 20px', borderBottom: '2px solid rgba(0,0,0,0.06)', fontWeight: 800, color: '#1a202c' }}>
              Danh sách học viên ({conversations.length})
            </div>
            {conversations.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#718096', fontWeight: 600 }}>
                Chưa có học viên nào
              </div>
            ) : (
              conversations.map((conv, i) => (
                <div key={i} onClick={() => { setSelectedConv(conv); fetchMessages(conv.id); }}
                  style={{
                    padding: '14px 20px', cursor: 'pointer',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    background: selectedConv?.id === conv.id ? 'rgba(34,197,94,0.06)' : 'transparent',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FDBCB4, #ADD8E6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', color: '#7c2d12' }}>
                      {(conv.student?.fullName || conv.student?.username || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.9rem' }}>{conv.student?.fullName || conv.student?.username}</div>
                      <div style={{ fontSize: '0.75rem', color: '#718096' }}>Level: {conv.student?.level}</div>
                    </div>
                    {conv.unreadMessages > 0 && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#EF4444', color: 'white', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {conv.unreadMessages}
                      </div>
                    )}
                  </div>
                  {conv.learningGoal && (
                    <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: 4 }}>
                      Mục tiêu: {conv.learningGoal}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          myMentor?.hasMentor && (
            <div className="clay-card" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #FDBCB4, #ADD8E6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem', color: '#7c2d12' }}>
                  {(myMentor.mentor?.fullName || 'M')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1a202c' }}>{myMentor.mentor?.fullName || 'Mentor'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#718096' }}>Mentor của bạn</div>
                  {myMentor.learningGoal && (
                    <div style={{ fontSize: '0.8rem', color: '#22C55E', fontWeight: 600, marginTop: 4 }}>
                      🎯 {myMentor.learningGoal}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* Chat area */}
        <div className="clay-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 500 }}>
          {((isMentor && selectedConv) || (!isMentor && myMentor?.hasMentor)) ? (
            <>
              {/* Chat header */}
              <div style={{ padding: '16px 20px', borderBottom: '2px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <MessageCircle size={18} color="#22C55E" />
                <span style={{ fontWeight: 700, color: '#1a202c' }}>
                  {isMentor ? (selectedConv?.student?.fullName || selectedConv?.student?.username) : (myMentor?.mentor?.fullName)}
                </span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.map((msg, i) => {
                  const isMine = msg.sender?.id === user?.id;
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 16px',
                        borderRadius: 18,
                        background: isMine ? 'linear-gradient(135deg, #22C55E, #16a34a)' : 'rgba(0,0,0,0.04)',
                        color: isMine ? 'white' : '#2d3748',
                        fontWeight: 600, fontSize: '0.95rem',
                        lineHeight: 1.6,
                      }}>
                        {msg.content}
                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                          {new Date(msg.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '16px 20px', borderTop: '2px solid rgba(0,0,0,0.06)', display: 'flex', gap: 12 }}>
                <input className="clay-input" placeholder="Nhập tin nhắn..."
                  value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  style={{ flex: 1 }} />
                <button className="clay-btn clay-btn-primary" onClick={sendMessage} style={{ padding: '10px 18px' }}>
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>💬</div>
                <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>
                  {isMentor ? 'Chọn một học viên để nhắn tin' : 'Bạn chưa có mentor'}
                </h3>
                <p style={{ color: '#718096', fontWeight: 600 }}>
                  {isMentor ? 'Chọn học viên từ danh sách bên trái' : 'Liên hệ quản trị viên để được gán mentor'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
