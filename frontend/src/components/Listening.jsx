import { useRef, useState, useEffect } from 'react';

const S = {
  container: { padding: '24px', maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', margin: 0 },
  audioPlayer: { background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 },
  playBtn: { width: 56, height: 56, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  progressWrapper: { flex: 1 },
  progressBar: { width: '100%', height: 6, borderRadius: 3, background: '#e2e8f0', cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, background: '#3b82f6', transition: 'width 0.1s linear' },
  timeDisplay: { fontSize: '0.8rem', color: '#94a3b8', marginTop: 4, fontFamily: 'monospace' },
  speedBtn: { padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 },
  questionText: { fontSize: '1.05rem', fontWeight: 600, color: '#1a202c', marginBottom: 16, lineHeight: 1.5 },
  optionsGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  optionBtn: { padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', textAlign: 'left', fontSize: '0.95rem', color: '#475569', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500 },
  optionSelected: { borderColor: '#3b82f6', background: '#eff6ff', color: '#1e40af' },
  optionCorrect: { borderColor: '#10b981', background: '#f0fdf4', color: '#15803d' },
  optionWrong: { borderColor: '#ef4444', background: '#fef2f2', color: '#dc2626' },
  transcript: { background: '#f8fafc', borderRadius: 10, padding: 12, fontSize: '0.85rem', color: '#64748b', marginTop: 12, maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0' },
  showTranscriptBtn: { fontSize: '0.8rem', color: '#3b82f6', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600, marginTop: 8 },
};

function getOptionStyle(selected, isCorrect, showResult, isSelected) {
  if (!showResult) return isSelected ? { ...S.optionBtn, ...S.optionSelected } : S.optionBtn;
  if (isCorrect) return { ...S.optionBtn, ...S.optionCorrect };
  if (isSelected && !isCorrect) return { ...S.optionBtn, ...S.optionWrong };
  return S.optionBtn;
}

export default function Listening({ question, answer, onAnswer, showResult, result }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const newTime = pct * duration;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    const idx = speeds.indexOf(playbackRate);
    const next = speeds[(idx + 1) % speeds.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const options = Array.isArray(question.options) ? question.options
    : typeof question.options === 'object' ? Object.values(question.options) : [];
  const correct = result?.correctAnswer?.toLowerCase?.()?.trim?.();
  const userAns = typeof answer === 'string' ? answer.toLowerCase().trim() : '';

  const audioUrl = question.content || question.audioUrl;

  return (
    <div style={S.container}>
      <div style={S.header}>
        <span style={{ fontSize: '1.5rem' }}>🎧</span>
        <h2 style={S.title}>Luyện nghe</h2>
      </div>

      {audioUrl && (
        <div style={S.audioPlayer}>
          <audio ref={audioRef} src={audioUrl} />
          <button style={S.playBtn} onClick={togglePlay}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <div style={S.progressWrapper}>
            <div style={S.progressBar} onClick={handleSeek}>
              <div style={{ ...S.progressFill, width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
            </div>
            <div style={S.timeDisplay}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <button style={S.speedBtn} onClick={changeSpeed}>
            {playbackRate}x
          </button>
        </div>
      )}

      {question.question && (
        <div style={S.questionText}>{question.question}</div>
      )}

      <div style={S.optionsGrid}>
        {options.map((opt, i) => {
          const optText = typeof opt === 'string' ? opt : opt.text || opt.label || JSON.stringify(opt);
          const isSelected = userAns === optText.toLowerCase().trim();
          const isCorrectOpt = correct === optText.toLowerCase().trim();
          return (
            <button
              key={i}
              style={getOptionStyle(answer, result?.correctAnswer, showResult, isSelected)}
              onClick={() => !showResult && onAnswer(optText)}
              disabled={showResult}
            >
              <span style={{ marginRight: 8, fontWeight: 700 }}>{String.fromCharCode(65 + i)}. </span>
              {optText}
              {showResult && isCorrectOpt && ' ✓'}
              {showResult && isSelected && !isCorrectOpt && ' ✗'}
            </button>
          );
        })}
      </div>

      {showResult && result?.explanation && (
        <div style={{ marginTop: 12, fontSize: '0.9rem', color: '#64748b', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
          💡 {result.explanation}
        </div>
      )}

      {question.content && (
        <>
          <button style={S.showTranscriptBtn} onClick={() => setShowTranscript(!showTranscript)}>
            {showTranscript ? '▲ Ẩn bản ghi' : '▼ Hiện bản ghi'}
          </button>
          {showTranscript && (
            <div style={S.transcript}>{question.content}</div>
          )}
        </>
      )}
    </div>
  );
}
