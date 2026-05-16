import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, Subtitles, Mic } from 'lucide-react';

const SAMPLE_AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export default function ListeningPage() {
  const [playing, setPlaying] = useState(false);
  const [subtitles, setSubtitles] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [showTranscript, setShowTranscript] = useState(false);
  const [dictationText, setDictationText] = useState('');
  const [dictationMode, setDictationMode] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [mode, setMode] = useState('listen'); // listen, dictation

  const sampleSubs = [
    { start: 0, end: 5, text: 'Welcome to this English listening practice.' },
    { start: 5, end: 10, text: 'Today we will talk about daily conversations.' },
    { start: 10, end: 15, text: 'Listen carefully and try to understand the main ideas.' },
    { start: 15, end: 20, text: 'You can replay any part as many times as you need.' },
  ];

  const SAMPLE_TRANSCRIPT = `Welcome to this English listening practice. Today we will talk about daily conversations. Listen carefully and try to understand the main ideas. You can replay any part as many times as you need. Practice makes perfect, so keep listening every day!`;

  const togglePlay = () => setPlaying(!playing);
  const handleVolume = (e) => setVolume(parseFloat(e.target.value));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 4 }}>
          🎧 Luyện nghe
        </h1>
        <p style={{ color: '#718096', fontWeight: 600 }}>
          Nghe audio/video với phụ đề và bài tập điền từ
        </p>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { id: 'listen', label: '🎧 Nghe & hiểu' },
          { id: 'dictation', label: '✏️ Nghe & điền từ' },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className="clay-btn"
            style={{
              background: mode === m.id ? 'linear-gradient(135deg, #22C55E, #16a34a)' : 'white',
              color: mode === m.id ? 'white' : '#4a5568',
            }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Audio Player */}
      <div className="clay-card" style={{ padding: 32, marginBottom: 24 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 20, color: '#1a202c' }}>
          📻 Daily Conversation Practice - {mode === 'dictation' ? 'Dictation Mode' : 'Listening Mode'}
        </h3>

        {/* Simulated waveform */}
        <div style={{
          height: 60, borderRadius: 12, background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(34,197,94,0.1))',
          border: '2px solid rgba(59,130,246,0.2)', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative',
        }}>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} style={{
              width: 3, height: Math.random() * 40 + 10,
              background: playing ? `rgba(59,130,246,${0.3 + Math.random() * 0.5})` : 'rgba(59,130,246,0.15)',
              borderRadius: 2, margin: '0 1px',
              animation: playing ? `wave ${0.5 + Math.random() * 0.5}s ease-in-out infinite ${Math.random() * 0.5}s` : 'none',
            }} />
          ))}
        </div>

        {/* Subtitles */}
        {subtitles && mode !== 'dictation' && (
          <div style={{
            padding: '16px 24px', borderRadius: 12,
            background: 'rgba(59,130,246,0.06)',
            border: '2px solid rgba(59,130,246,0.15)',
            marginBottom: 20, textAlign: 'center',
          }}>
            {sampleSubs.map((sub, i) => (
              <div key={i} style={{ fontSize: '1rem', color: '#2d3748', fontWeight: 600, lineHeight: 1.7 }}>
                {sub.text}
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button onClick={togglePlay}
            className="clay-btn"
            style={{
              background: playing ? '#F59E0B22' : '#22C55E22',
              border: `2px solid ${playing ? '#F59E0B44' : '#22C55E44'}`,
              color: playing ? '#F59E0B' : '#22C55E',
              padding: '12px 20px',
            }}>
            {playing ? <><Pause size={18} /> Dừng</> : <><Play size={18} /> Phát</>}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <Volume2 size={18} color="#718096" />
            <input type="range" min="0" max="1" step="0.05" value={volume}
              onChange={handleVolume}
              style={{ flex: 1, accentColor: '#22C55E' }} />
          </div>

          <button onClick={() => setSubtitles(!subtitles)}
            className="clay-btn"
            style={{
              background: subtitles ? '#3B82F622' : 'transparent',
              color: subtitles ? '#3B82F6' : '#718096',
              border: `2px solid ${subtitles ? '#3B82F644' : 'rgba(0,0,0,0.1)'}`,
            }}>
            <Subtitles size={16} /> Phụ đề
          </button>
        </div>
      </div>

      {/* Dictation Mode */}
      {mode === 'dictation' && (
        <div className="clay-card" style={{ padding: 32, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 16, color: '#1a202c' }}>
            ✏️ Bài tập điền từ
          </h3>
          <p style={{ color: '#718096', fontWeight: 600, marginBottom: 16 }}>
            Nghe đoạn audio và điền từ còn thiếu vào chỗ trống. Bạn có thể bật/tắt phụ đề để kiểm tra.
          </p>

          <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', fontSize: '0.95rem', color: '#4a5568', lineHeight: 2, fontFamily: 'monospace' }}>
            {`Welcome to this English listening practice. Today we will talk about daily [____________]. Listen carefully and try to understand the [____________] ideas. Practice makes [____________].`}
          </div>

          <textarea className="clay-textarea"
            placeholder="Điền từ còn thiếu vào đây..."
            value={dictationText}
            onChange={e => setDictationText(e.target.value)}
            style={{ minHeight: 120, marginBottom: 16 }}
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="clay-btn" onClick={() => setDictationText('')}>
              🔄 Xóa
            </button>
            <button className="clay-btn clay-btn-primary" onClick={() => setShowAnswer(true)}>
              ✅ Kiểm tra
            </button>
          </div>

          {showAnswer && (
            <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '2px solid rgba(34,197,94,0.15)' }}>
              <h4 style={{ fontWeight: 800, color: '#22C55E', marginBottom: 12 }}>✓ Đáp án:</h4>
              <div style={{ lineHeight: 2, fontFamily: 'monospace', color: '#4a5568', fontWeight: 600 }}>
                Welcome to this English listening practice. Today we will talk about daily <strong>conversations</strong>. Listen carefully and try to understand the <strong>main</strong> ideas. Practice makes <strong>perfect</strong>.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transcript */}
      <div className="clay-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c' }}>📜 Bản ghi (Transcript)</h3>
          <button className="clay-btn" onClick={() => setShowTranscript(!showTranscript)}
            style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {showTranscript ? 'Ẩn' : 'Hiện'}
          </button>
        </div>
        {showTranscript && (
          <p style={{ color: '#4a5568', lineHeight: 2, fontWeight: 600, fontStyle: 'italic' }}>
            {SAMPLE_TRANSCRIPT}
          </p>
        )}
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 20px; }
          50% { height: 50px; }
        }
      `}</style>
    </div>
  );
}
