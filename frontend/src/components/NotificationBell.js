import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Bell, CheckCheck } from 'lucide-react';

const AuthContext = createContext(null);
export const useAuthSimple = () => useContext(AuthContext);

export default function NotificationBell() {
  const { user } = useAuthSimple();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    fetchNotifications();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchUnread = async () => {
    try {
      const res = await fetch('/api/notifications/unread/count', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnread(data.count || 0);
      }
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?page=0&size=20', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.content || []);
      }
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUnread(u => Math.max(0, u - 1));
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUnread(0);
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const getTypeIcon = (type) => {
    const icons = {
      STUDY_REMINDER: '📚', BADGE_EARNED: '🏆', LEVEL_UP: '⬆️',
      COURSE_ENROLLMENT: '📖', FORUM_REPLY: '💬', MENTOR_MESSAGE: '👨‍🏫',
      SYSTEM: '⚙️', ASSIGNMENT_DUE: '📋'
    };
    return icons[type] || '🔔';
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
        padding: 8, borderRadius: 12, display: 'flex', alignItems: 'center',
      }}>
        <Bell size={22} color="#4a5568" />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 18, height: 18, borderRadius: '50%',
            background: '#EF4444', color: 'white',
            fontSize: '0.65rem', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, width: 360,
          maxHeight: 480, overflowY: 'auto',
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '2px solid rgba(0,0,0,0.06)',
          zIndex: 1000, marginTop: 8,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderBottom: '2px solid rgba(0,0,0,0.06)',
            position: 'sticky', top: 0, background: 'white', borderRadius: '16px 16px 0 0',
          }}>
            <div style={{ fontWeight: 800, color: '#1a202c' }}>Thông báo</div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#22C55E', fontSize: '0.85rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <CheckCheck size={14} /> Đọc hết
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#718096', fontWeight: 600 }}>
              Không có thông báo nào
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
                style={{
                  padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)',
                  cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(34,197,94,0.03)',
                  transition: 'background 0.2s',
                }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{getTypeIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1a202c', marginBottom: 2 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#718096', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: 4 }}>
                      {new Date(n.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
