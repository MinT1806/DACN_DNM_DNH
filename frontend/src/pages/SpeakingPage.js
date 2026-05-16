import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2, RefreshCw, CheckCircle } from 'lucide-react';

const TOPICS = ['Daily Life', 'Travel', 'Business', 'Academic', 'Interview', 'Free Talk'];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

export default function SpeakingPage() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [scoring, setScoring] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [topic, setTopic] = useState('Daily Life');
  const [level, setLevel] = useState('B1');
  const [mode, setMode] = useState('record'); // record, compare
  const [referenceText, setReferenceText] = useState('');
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      alert('Vui lòng cho phép truy cập microphone!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const analyzeSpeech = async () => {
    if (!audioBlob) return;
    setLoading(true);
    setScoring(null);
    try {
      // Simulate transcription and scoring
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('skillType', 'SPEAKING');

      const res = await fetch('/api/agent/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          skillType: 'SPEAKING',
          userText: transcript || 'Simulated speech transcription',
          question: `Speaking about: ${topic}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setScoring(data);
      }
    } catch {}
    setLoading(false);
  };

  const reset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript('');
    setScoring(null);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return '#22C55E';
    if (score >= 5) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 4 }}>
          🎤 Luyện phát âm
        </h1>
        <p style={{ color: '#718096', fontWeight: 600 }}>
          Ghi âm giọng nói, AI đánh giá phát âm của bạn
        </p>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[{ id: 'record', label: '🎤 Ghi âm' }, { id: 'compare', label: '🔊 So sánh' }].map(m => (
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select className="clay-input" value={topic} onChange={e => setTopic(e.target.value)} style={{ cursor: 'pointer' }}>
          {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="clay-input" value={level} onChange={e => setLevel(e.target.value)} style={{ cursor: 'pointer' }}>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Recording area */}
      <div className="clay-card" style={{ padding: 40, textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: recording ? '#EF444422' : '#22C55E22',
          border: `4px solid ${recording ? '#EF4444' : '#22C55E'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          animation: recording ? 'pulse 1.5s infinite' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? (
            <Square size={40} color="#EF4444" fill="#EF4444" />
          ) : (
            <Mic size={40} color="#22C55E" />
          )}
        </div>

        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a202c', marginBottom: 8 }}>
          {recording ? 'Đang ghi âm...' : 'Nhấn để bắt đầu ghi âm'}
        </div>
        <div style={{ color: '#718096', fontSize: '0.85rem', fontWeight: 600, marginBottom: 20 }}>
          {recording ? 'Nhấn để dừng' : 'Nói về chủ đề: ' + topic}
        </div>

        {audioUrl && (
          <div style={{ marginBottom: 20 }}>
            <audio controls src={audioUrl} style={{ width: '100%', maxWidth: 400 }} />
            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="clay-btn" onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} /> Ghi lại
              </button>
              <button className="clay-btn clay-btn-primary" onClick={analyzeSpeech}
                disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {loading ? '⏳ Đang phân tích...' : '🤖 Phân tích phát âm'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scoring result */}
      {scoring && (
        <div className="clay-card" style={{ padding: 32 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 20, color: '#1a202c' }}>📊 Kết quả đánh giá</h3>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: `${getScoreColor(scoring.content?.score)}22`,
              border: `4px solid ${getScoreColor(scoring.content?.score)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontWeight: 900, fontSize: '2rem', color: getScoreColor(scoring.content?.score) }}>
                {scoring.content?.score}
              </span>
            </div>
          </div>

          {/* Criteria */}
          {scoring.content?.criteria && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontWeight: 700, color: '#1a202c', marginBottom: 12 }}>Tiêu chí đánh giá:</h4>
              {Object.entries(scoring.content.criteria).map(([key, val], i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4a5568', fontWeight: 600, marginBottom: 4 }}>
                    <span>{key}</span>
                    <span style={{ color: getScoreColor(val) }}>{val}/10</span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${val * 10}%`, height: '100%', background: getScoreColor(val), borderRadius: 6, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <h4 style={{ fontWeight: 700, color: '#1a202c', marginBottom: 8 }}>📝 Nhận xét:</h4>
            <p style={{ color: '#4a5568', lineHeight: 1.7, fontWeight: 600 }}>{scoring.content?.feedback}</p>
          </div>

          {scoring.content?.improvement && (
            <div>
              <h4 style={{ fontWeight: 700, color: '#1a202c', marginBottom: 8 }}>💡 Gợi ý cải thiện:</h4>
              {scoring.content.improvement.map((tip, i) => (
                <div key={i} style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.06)', marginBottom: 6, fontSize: '0.9rem', color: '#4a5568', fontWeight: 600 }}>
                  → {tip}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="clay-card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 12, color: '#1a202c' }}>💡 Tips luyện phát âm</h3>
        {[
          'Đảm bảo microphone gần miệng nhưng không che',
          'Nói rõ ràng với tốc độ vừa phải',
          'Chọn chủ đề phù hợp với level của bạn',
          'Luyện tập mỗi ngày 10-15 phút',
          'Nghe lại bản ghi để tự đánh giá',
        ].map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, fontSize: '0.9rem', color: '#4a5568', fontWeight: 600 }}>
            <span style={{ color: '#22C55E', fontWeight: 900 }}>✓</span>
            {tip}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
