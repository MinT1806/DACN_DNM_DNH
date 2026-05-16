import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoAPI } from '../api/api';
import { savedWordAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const STYLES = {
  container: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '24px',
  },
  videoWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    background: '#000',
    marginBottom: 24,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  subtitleOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    padding: '12px 24px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    color: 'white',
    fontSize: '1.2rem',
    fontWeight: 600,
    minHeight: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    cursor: 'pointer',
  },
  wordChip: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  controls: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  wordPopup: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'white',
    borderRadius: 20,
    padding: 28,
    width: 420,
    maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    zIndex: 1000,
  },
  popupOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
};

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

function getWordColor(word) {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = word.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function VideoLearningPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);

  const [lesson, setLesson] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedWord, setSelectedWord] = useState(null);
  const [wordData, setWordData] = useState(null);
  const [wordLoading, setWordLoading] = useState(false);
  const [savedWords, setSavedWords] = useState(new Set());
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const lookupTimeout = useRef(null);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await videoAPI.getLessonVideo(Number(lessonId));
      if (res.data.success) {
        setLesson(res.data.data);
        setSubtitles(res.data.data.subtitles || []);
      } else {
        setError(res.data.message || 'Failed to load lesson');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const updateSubtitle = useCallback(() => {
    if (!videoRef.current || subtitles.length === 0) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    const active = subtitles.find(
      (s) => time >= s.start && time <= s.end
    );
    setCurrentSubtitle(active || null);
  }, [subtitles]);

  const handleTimeUpdate = useCallback(() => {
    updateSubtitle();
  }, [updateSubtitle]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const seekTo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  };

  const handleWordClick = (word, e) => {
    e.stopPropagation();
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);

    lookupTimeout.current = setTimeout(async () => {
      setSelectedWord(word);
      setWordData(null);
      setWordLoading(true);
      try {
        const res = await videoAPI.lookupWord(word);
        if (res.data.success) {
          setWordData(res.data.data);
        } else {
          setWordData({ word, notFound: true });
        }
      } catch {
        setWordData({ word, notFound: true });
      } finally {
        setWordLoading(false);
      }
    }, 150);
  };

  const handleSaveWord = async () => {
    if (!wordData || wordData.notFound) return;
    try {
      const res = await savedWordAPI.save({ vocabularyId: wordData.id });
      if (res.data.success) {
        setSavedWords((prev) => new Set([...prev, wordData.word.toLowerCase()]));
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
      }
    } catch {
      // silent
    }
  };

  const closePopup = () => {
    setSelectedWord(null);
    setWordData(null);
    setWordLoading(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderSubtitleText = (text) => {
    if (!text) return null;
    const words = text.split(/(\s+)/);
    return words.map((part, i) => {
      if (/^\s+$/.test(part)) return <span key={i}>{part}</span>;
      const cleaned = part.replace(/[^a-zA-Z']/g, '').toLowerCase();
      const color = savedWords.has(cleaned) ? '#10b981' : getWordColor(cleaned);
      return (
        <span
          key={i}
          style={{
            ...STYLES.wordChip,
            background: savedWords.has(cleaned) ? `${color}22` : `${color}18`,
            color,
            borderBottom: savedWords.has(cleaned) ? `2px solid ${color}` : 'none',
          }}
          onClick={(e) => handleWordClick(cleaned, e)}
          title={`Click to look up "${cleaned}"`}
        >
          {part}
        </span>
      );
    });
  };

  if (loading) {
    return (
      <div style={{ ...STYLES.container, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎬</div>
        <div style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>Loading video...</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div style={{ ...STYLES.container, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎬</div>
        <h2 style={{ color: '#1a202c', marginBottom: 8 }}>Cannot load video</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>{error}</p>
        <button onClick={() => navigate(-1)} style={STYLES.btn}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={STYLES.container}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1a202c', margin: 0 }}>
            {lesson.title || 'Video Lesson'}
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Click any word to see its meaning
          </p>
        </div>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 20px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
          ← Back
        </button>
      </div>

      <div style={STYLES.videoWrapper}>
        <video
          ref={videoRef}
          src={lesson.videoUrl}
          controls
          style={{ width: '100%', display: 'block', maxHeight: 540 }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
        <div style={STYLES.subtitleOverlay} onClick={() => {}}>
          {currentSubtitle ? renderSubtitleText(currentSubtitle.text) : (
            <span style={{ color: '#94a3b8', fontSize: '1rem', fontStyle: 'italic' }}>
              No subtitle at this time
            </span>
          )}
        </div>
      </div>

      <div style={STYLES.controls}>
        <div style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', flex: 1 }}>
          💡 Tip: Click any word in the subtitle to look up its meaning
        </div>
      </div>

      {subtitles.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
            Subtitles
          </h3>
          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {subtitles.map((s, i) => (
              <div
                key={i}
                onClick={() => seekTo(s.start)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: currentSubtitle === s ? '#eff6ff' : 'transparent',
                  border: currentSubtitle === s ? '1px solid #3b82f6' : '1px solid transparent',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', minWidth: 40 }}>
                  {formatTime(s.start)}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.4 }}>
                  {s.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedWord && (
        <>
          <div style={STYLES.popupOverlay} onClick={closePopup} />
          <div style={STYLES.wordPopup}>
            <button
              onClick={closePopup}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}
            >
              ×
            </button>

            {wordLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '2rem' }}>🔍</div>
                <p style={{ color: '#64748b', marginTop: 8 }}>Looking up "{selectedWord}"...</p>
              </div>
            ) : wordData?.notFound ? (
              <div>
                <h3 style={{ margin: '0 0 12px', color: '#1a202c' }}>"{selectedWord}"</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  This word is not in our vocabulary yet. Try another word!
                </p>
              </div>
            ) : wordData ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ margin: 0, color: '#1a202c', fontSize: '1.5rem' }}>
                    {wordData.word}
                    {savedWords.has(wordData.word?.toLowerCase()) && (
                      <span style={{ marginLeft: 8, color: '#10b981', fontSize: '0.9rem' }}>✓ Saved</span>
                    )}
                  </h2>
                  {wordData.pronunciation && (
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', marginTop: 4 }}>
                      {wordData.pronunciation}
                    </div>
                  )}
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>MEANING</div>
                  <div style={{ fontWeight: 700, color: '#15803d', fontSize: '1.1rem' }}>{wordData.translation}</div>
                </div>

                {wordData.definition && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>DEFINITION</div>
                    <div style={{ color: '#475569', fontSize: '0.95rem' }}>{wordData.definition}</div>
                  </div>
                )}

                {wordData.example && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>EXAMPLE</div>
                    <div style={{ color: '#1e40af', fontStyle: 'italic', fontSize: '0.95rem' }}>{wordData.example}</div>
                    {wordData.exampleTranslation && (
                      <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>{wordData.exampleTranslation}</div>
                    )}
                  </div>
                )}

                {!savedWords.has(wordData.word?.toLowerCase()) && (
                  <button
                    onClick={handleSaveWord}
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px #10b98140' }}
                  >
                    📚 Save to Flashcards
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}

      {showSaveSuccess && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 700, boxShadow: '0 4px 16px #10b98140', zIndex: 1001 }}>
          ✅ Word saved to flashcards!
        </div>
      )}
    </div>
  );
}
