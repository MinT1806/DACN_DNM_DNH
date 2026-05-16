import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const Timer = ({
  totalTimeLeft,
  sectionTimeLeft,
  totalTime,
  hasSectionTimer = false,
  sectionName = '',
  onTimeUp,
  onSectionTimeUp,
  compact = false
}) => {
  const [pulse, setPulse] = useState(false);

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTimerColor = (seconds, maxSeconds) => {
    if (maxSeconds <= 0) return { color: '#718096', bg: 'rgba(113,128,150,0.1)' };
    const ratio = seconds / maxSeconds;
    if (ratio <= 0.1) return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (ratio <= 0.25) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
  };

  const totalStyle = getTimerColor(totalTimeLeft, totalTime);
  const sectionStyle = hasSectionTimer
    ? getTimerColor(sectionTimeLeft, Math.floor(totalTime / (totalTime > 3600 ? 4 : 6)))
    : { color: '#718096', bg: 'rgba(113,128,150,0.1)' };

  useEffect(() => {
    if (totalTimeLeft <= 60 && totalTimeLeft > 0) {
      setPulse(true);
      const interval = setInterval(() => setPulse(p => !p), 500);
      return () => clearInterval(interval);
    }
    setPulse(false);
  }, [totalTimeLeft]);

  const handleTimeUp = () => {
    if (onTimeUp) onTimeUp();
  };

  const handleSectionTimeUp = () => {
    if (onSectionTimeUp) onSectionTimeUp();
  };

  useEffect(() => {
    if (totalTimeLeft === 0) handleTimeUp();
  }, [totalTimeLeft, onTimeUp]);

  useEffect(() => {
    if (sectionTimeLeft === 0 && hasSectionTimer) handleSectionTimeUp();
  }, [sectionTimeLeft, hasSectionTimer, onSectionTimeUp]);

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 10,
        background: totalStyle.bg,
        color: totalStyle.color,
        fontWeight: 700,
        fontSize: '0.9rem',
        fontFamily: 'monospace',
        animation: pulse ? 'pulse 1s ease-in-out infinite' : 'none',
        transition: 'all 0.3s',
      }}>
        <Clock size={16} />
        {formatTime(totalTimeLeft)}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 16,
      borderRadius: 14,
      background: 'white',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: `1px solid ${totalStyle.color}22`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Tổng thời gian
        </span>
        {totalTimeLeft <= 60 && totalTimeLeft > 0 && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: '#ef4444',
            fontWeight: 700,
            fontSize: '0.75rem',
            animation: 'pulse 1s ease-in-out infinite',
          }}>
            <AlertTriangle size={12} /> Sắp hết giờ!
          </span>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '12px 20px',
        borderRadius: 12,
        background: totalStyle.bg,
        color: totalStyle.color,
        fontWeight: 900,
        fontSize: '1.8rem',
        fontFamily: 'monospace',
        letterSpacing: 2,
        animation: pulse ? 'pulse 1s ease-in-out infinite' : 'none',
      }}>
        <Clock size={28} style={{ opacity: 0.8 }} />
        {formatTime(totalTimeLeft)}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: '#a0aec0',
        fontWeight: 600,
      }}>
        <span>Đã dùng: {formatTime(totalTime - totalTimeLeft)}</span>
        <span>{Math.round((totalTimeLeft / totalTime) * 100)}% còn lại</span>
      </div>

      {hasSectionTimer && sectionName && (
        <>
          <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#4a5568' }}>
              Phần: {sectionName}
            </span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 8,
              background: sectionStyle.bg,
              color: sectionStyle.color,
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'monospace',
            }}>
              <Clock size={14} />
              {formatTime(sectionTimeLeft)}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
        }
      `}</style>
    </div>
  );
};

export default Timer;
