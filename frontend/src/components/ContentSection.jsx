import { useEffect, useRef, useState } from 'react';

const S = {
  container: { padding: '24px', maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  icon: { fontSize: '1.5rem' },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', margin: 0 },
  section: { background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
  textContent: { lineHeight: 1.7, color: '#475569', fontSize: '0.95rem', whiteSpace: 'pre-wrap' },
  vocabList: { listStyle: 'none', padding: 0, margin: 0 },
  vocabItem: { padding: '12px 16px', borderRadius: 10, marginBottom: 8, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  vocabWord: { fontWeight: 700, color: '#1a202c', fontSize: '1rem' },
  vocabTrans: { color: '#64748b', fontSize: '0.9rem' },
  vocabPron: { color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' },
  grammarCard: { padding: '12px 16px', borderRadius: 10, marginBottom: 8, background: '#eff6ff', border: '1px solid #bfdbfe' },
  grammarTitle: { fontWeight: 700, color: '#1e40af', marginBottom: 4 },
  grammarText: { color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 },
  keyPoint: { display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' },
  keyBullet: { width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 },
  keyText: { color: '#475569', fontSize: '0.95rem', lineHeight: 1.5 },
  videoWrapper: { position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 16 },
  videoEl: { width: '100%', maxHeight: 400, display: 'block' },
  subtitleBar: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white', padding: '12px 16px', fontSize: '1rem', textAlign: 'center', fontWeight: 500 },
  navBtns: { display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' },
  btnPrimary: { padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  btnSecondary: { padding: '10px 24px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' },
  progressBar: { height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden', marginTop: 16 },
  progressFill: { height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #10b981, #059669)', transition: 'width 0.5s ease' },
};

const VOCAB_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

function getVocabColor(word) {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = word.charCodeAt(i) + ((hash << 5) - hash);
  }
  return VOCAB_COLORS[Math.abs(hash) % VOCAB_COLORS.length];
}

export default function ContentSection({ content, lesson, videoRef, onNext }) {
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const subtitleTimeoutRef = useRef(null);

  useEffect(() => {
    if (content?.subtitles) {
      setSubtitles(content.subtitles);
    }
  }, [content]);

  useEffect(() => {
    if (!videoRef?.current || subtitles.length === 0) return;
    const video = videoRef.current;
    const handleTimeUpdate = () => {
      if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
      subtitleTimeoutRef.current = setTimeout(() => {
        const time = video.currentTime;
        const active = subtitles.find(s => time >= s.start && time <= s.end);
        setCurrentSubtitle(active || null);
      }, 100);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoRef, subtitles]);

  const vocabList = Array.isArray(content?.vocabulary) ? content.vocabulary
    : typeof content?.vocabulary === 'string' ? parseJson(content.vocabulary) : [];
  const grammarList = Array.isArray(content?.grammarRules) ? content.grammarRules
    : typeof content?.grammarRules === 'string' ? parseJson(content.grammarRules) : [];
  const keyPoints = Array.isArray(content?.keyPoints) ? content.keyPoints
    : typeof content?.keyPoints === 'string' ? parseJson(content.keyPoints) : [];

  const completionPct = Math.round(
    ((content?.textContent ? 25 : 0) +
     (vocabList.length > 0 ? 25 : 0) +
     (grammarList.length > 0 ? 25 : 0) +
     (keyPoints.length > 0 ? 25 : 0))
  );

  return (
    <div style={S.container}>
      <div style={S.header}>
        <span style={S.icon}>📖</span>
        <h2 style={S.title}>Nội dung bài học</h2>
      </div>

      <div style={{ ...S.progressBar, marginBottom: 16 }}>
        <div style={{ ...S.progressFill, width: `${Math.max(5, completionPct)}%` }} />
      </div>

      {lesson?.videoUrl && (
        <div style={S.videoWrapper}>
          <video ref={videoRef} src={lesson.videoUrl} controls style={S.videoEl} />
          {currentSubtitle && (
            <div style={S.subtitleBar}>{currentSubtitle.text}</div>
          )}
        </div>
      )}

      {content?.textContent && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}>
            <span>📝</span> Bài đọc
          </h3>
          <p style={S.textContent}>{content.textContent}</p>
        </div>
      )}

      {grammarList.length > 0 && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}>
            <span>📐</span> Ngữ pháp
          </h3>
          {grammarList.map((g, i) => (
            <div key={i} style={S.grammarCard}>
              <div style={S.grammarTitle}>
                {typeof g === 'object' ? g.title || g.rule : g}
              </div>
              <div style={S.grammarText}>
                {typeof g === 'object' ? g.explanation || g.content : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {vocabList.length > 0 && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}>
            <span>📚</span> Từ vựng ({vocabList.length})
          </h3>
          <ul style={S.vocabList}>
            {vocabList.map((v, i) => {
              const word = typeof v === 'object' ? v.word : v;
              const trans = typeof v === 'object' ? v.translation || v.meaning || '' : '';
              const pron = typeof v === 'object' ? v.pronunciation || '' : '';
              const color = getVocabColor(word);
              return (
                <li key={i} style={S.vocabItem}>
                  <div>
                    <span style={{ ...S.vocabWord, color }}>{word}</span>
                    {pron && <span style={S.vocabPron}> {pron}</span>}
                  </div>
                  <span style={S.vocabTrans}>{trans}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {keyPoints.length > 0 && (
        <div style={S.section}>
          <h3 style={S.sectionTitle}>
            <span>⭐</span> Điểm quan trọng
          </h3>
          {keyPoints.map((k, i) => (
            <div key={i} style={S.keyPoint}>
              <span style={S.keyBullet}>{i + 1}</span>
              <span style={S.keyText}>{typeof k === 'object' ? k.point || k.text || JSON.stringify(k) : k}</span>
            </div>
          ))}
        </div>
      )}

      {onNext && (
        <div style={S.navBtns}>
          <button style={S.btnPrimary} onClick={onNext}>
            Tiếp tục Bài tập →
          </button>
        </div>
      )}
    </div>
  );
}

function parseJson(str) {
  if (!str || typeof str !== 'string') return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
