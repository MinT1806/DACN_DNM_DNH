import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lessonManagementAPI } from '../api/api';
import { toast } from 'react-toastify';
import {
  ArrowLeft, CheckCircle, ChevronRight, ChevronLeft, Clock, Eye, EyeOff,
  RotateCcw, ArrowRight, BookOpen, BookMarked, BrainCircuit,
  FileText, Lightbulb, Mic, Headphones, PenLine, Target, Trophy,
  Star, Award, Save, X, Plus, Volume2, Play, Pause, RefreshCw, MessageSquare,
  Zap, Edit, Eye as EyeIcon, List, BarChart2, ThumbsUp
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────
function parseJsonField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : [p]; }
  catch { return []; }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(minutes) {
  if (!minutes) return '0 phút';
  if (minutes < 60) return `${minutes} phút`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60 > 0 ? minutes % 60 + 'p' : ''}`;
}

// ─── Step Bar ─────────────────────────────────────────────────────────────
function StepBar({ steps, currentStep, completedSteps, onStep }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 4, marginBottom: 24, flexWrap: 'wrap'
    }}>
      {steps.map((step, i) => {
        const isActive = currentStep === i;
        const isDone = completedSteps?.includes(step.id);
        const canClick = i === 0 || completedSteps?.includes(steps[i - 1]?.id) || isDone;
        return (
          <React.Fragment key={i}>
            <button
              onClick={() => canClick && onStep(i)}
              style={{
                padding: '8px 18px', borderRadius: 30, border: 'none',
                background: isActive ? 'linear-gradient(135deg, #667eea, #764ba2)' : isDone ? '#22c55e' : '#f1f5f9',
                color: isActive || isDone ? 'white' : '#94a3b8',
                fontWeight: 700, fontSize: '0.85rem', cursor: canClick ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: isActive ? '0 4px 15px rgba(102,126,234,0.4)' : 'none',
                opacity: canClick ? 1 : 0.5,
                transition: 'all 0.3s',
              }}
            >
              {isDone ? <CheckCircle size={16} /> : <span>{step.icon}</span>}
              {step.label}
            </button>
            {i < steps.length - 1 && (
              <div style={{
                width: 32, height: 2,
                background: isDone ? '#22c55e' : '#e2e8f0',
                margin: '0 4px',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Video Player with Interactive Subtitles ────────────────────────────────
function VideoPlayer({ url, subtitles = [], lessonId }) {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedWord, setSelectedWord] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setCurrentTime(video.currentTime);
    const onMeta = () => setDuration(video.duration || 0);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('loadedmetadata', onMeta);
    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('loadedmetadata', onMeta);
    };
  }, []);

  const currentSub = useMemo(() => {
    if (!subtitles || subtitles.length === 0) return null;
    return subtitles.find(s => currentTime >= (s.startTime || s.start || 0) && currentTime <= (s.endTime || s.end || 0)) || null;
  }, [currentTime, subtitles]);

  const handleSubClick = (sub) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sub.startTime || sub.start || 0;
      videoRef.current.play();
    }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(speed);
    setSpeed(speeds[(idx + 1) % speeds.length]);
    if (videoRef.current) videoRef.current.playbackRate = speeds[(idx + 1) % speeds.length];
  };

  const handleWordClick = (word) => {
    const clean = word.replace(/[^a-zA-Z']/g, '');
    if (clean) setSelectedWord(clean);
  };

  if (!url) return null;

  return (
    <div style={{
      background: '#000', borderRadius: 16, overflow: 'hidden', marginBottom: 20,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }}>
      <div style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          src={url}
          controls
          style={{ width: '100%', maxHeight: 450, display: 'block' }}
          playbackRate={speed}
        />
        {currentSub && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.88))',
            color: 'white', padding: '40px 24px 16px',
            fontSize: '1.15rem', fontWeight: 600, textAlign: 'center',
            cursor: 'pointer',
          }} onClick={() => handleWordClick(currentSub.content || currentSub.text || '')}>
            {currentSub.content || currentSub.text || ''}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        background: '#111', flexWrap: 'wrap'
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8', minWidth: 70 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div style={{ flex: 1, height: 4, background: '#333', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: duration ? `${(currentTime / duration) * 100}%` : '0%',
            height: '100%', background: '#667eea', borderRadius: 2, transition: 'width 0.1s'
          }} />
        </div>
        <button onClick={changeSpeed} style={{
          padding: '4px 10px', borderRadius: 6, border: '1px solid #333',
          background: 'transparent', color: '#94a3b8', cursor: 'pointer',
          fontSize: '0.8rem', fontWeight: 600,
        }}>
          {speed}x
        </button>
        <button onClick={() => setShowTranscript(!showTranscript)} style={{
          padding: '4px 10px', borderRadius: 6, border: '1px solid #333',
          background: 'transparent', color: showTranscript ? '#667eea' : '#94a3b8',
          cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
        }}>
          {showTranscript ? <EyeOff size={14} /> : <Eye size={14} />}
          Phụ đề
        </button>
      </div>

      {/* Transcript */}
      {showTranscript && subtitles.length > 0 && (
        <div style={{
          maxHeight: 220, overflowY: 'auto', padding: '0 16px 12px',
          background: '#1a1a1a'
        }}>
          {subtitles.map((s, i) => {
            const st = s.startTime || s.start || 0;
            const isActive = currentSub === s;
            return (
              <div key={i} onClick={() => handleSubClick(s)}
                style={{
                  padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                  fontSize: '0.875rem', color: isActive ? '#667eea' : '#94a3b8',
                  background: isActive ? 'rgba(102,126,234,0.15)' : 'transparent',
                  marginBottom: 2, display: 'flex', gap: 10, fontWeight: isActive ? 600 : 400,
                }}>
                <span style={{ fontFamily: 'monospace', minWidth: 40, flexShrink: 0 }}>{formatTime(st)}</span>
                <span>{s.content || s.text || ''}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Word lookup */}
      {selectedWord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={() => setSelectedWord(null)}>
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: 'white', borderRadius: 20, padding: 28, width: 420, maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', zIndex: 1000,
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedWord(null)} style={{
              position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
              fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1
            }}>×</button>
            <h2 style={{ margin: '0 0 4px' }}>{selectedWord}</h2>
            <p style={{ color: '#64748b', marginTop: 8 }}>Click từ để tra nghĩa</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Content Section ────────────────────────────────────────────────────────
function ContentSection({ lesson, content, subtitles, onComplete }) {
  const [showAllVocab, setShowAllVocab] = useState(false);
  const [showAllGrammar, setShowAllGrammar] = useState(false);
  const [showAllPoints, setShowAllPoints] = useState(false);

  const vocabList = parseJsonField(content?.vocabulary);
  const grammarList = parseJsonField(content?.grammarRules);
  const keyPoints = parseJsonField(content?.keyPoints);
  const parsedSubtitles = parseJsonField(subtitles).map(s => ({
    startTime: s.startTime || s.start || 0,
    endTime: s.endTime || s.end || 0,
    text: s.content || s.text || ''
  }));

  return (
    <div>
      {/* Video */}
      {lesson?.videoUrl && (
        <VideoPlayer
          url={lesson.videoUrl}
          subtitles={parsedSubtitles}
          lessonId={lesson?.id}
        />
      )}

      {/* Header */}
      <div style={{
        padding: '16px 20px', borderRadius: 16, marginBottom: 16,
        background: 'linear-gradient(135deg, #667eea20, #764ba220)',
        border: '1px solid #667eea30', display: 'flex', alignItems: 'center', gap: 10
      }}>
        <span style={{ fontSize: '1.5rem' }}>📖</span>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{lesson?.title}</h2>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: '#64748b', marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} /> {lesson?.durationMinutes || 15} phút
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <BookOpen size={14} /> {vocabList.length} từ vựng
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <BrainCircuit size={14} /> {grammarList.length} ngữ pháp
            </span>
          </div>
        </div>
      </div>

      {/* Text content */}
      {content?.textContent && (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="#667eea" /> Nội dung bài học
          </h3>
          <p style={{ lineHeight: 1.8, color: '#475569', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
            {content.textContent}
          </p>
        </div>
      )}

      {/* Grammar */}
      {grammarList.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrainCircuit size={18} color="#8b5cf6" /> Ngữ pháp ({grammarList.length})
          </h3>
          {(showAllGrammar ? grammarList : grammarList.slice(0, 3)).map((g, i) => {
            const title = typeof g === 'object' ? (g.title || g.rule || g.heading || '') : g;
            const explanation = typeof g === 'object' ? (g.explanation || g.content || g.desc || '') : '';
            const example = typeof g === 'object' ? g.example : '';
            return (
              <div key={i} style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: 14, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.95rem', marginBottom: 4 }}>
                  📐 {title}
                </div>
                {explanation && <div style={{ color: '#6b7280', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: example ? 6 : 0 }}>{explanation}</div>}
                {example && <div style={{ background: '#ede9fe', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', color: '#6d28d9', fontStyle: 'italic' }}>"{example}"</div>}
              </div>
            );
          })}
          {grammarList.length > 3 && (
            <button onClick={() => setShowAllGrammar(!showAllGrammar)} style={{
              padding: '6px 16px', borderRadius: 8, border: '1px solid #ddd6fe',
              background: '#f5f3ff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#7c3aed'
            }}>
              {showAllGrammar ? '▲ Ẩn bớt' : `▼ Xem thêm (${grammarList.length - 3})`}
            </button>
          )}
        </div>
      )}

      {/* Vocabulary */}
      {vocabList.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookMarked size={18} color="#10b981" /> Từ vựng ({vocabList.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
            {(showAllVocab ? vocabList : vocabList.slice(0, 6)).map((v, i) => {
              const word = typeof v === 'object' ? (v.word || '') : v;
              const trans = typeof v === 'object' ? (v.translation || v.meaning || v.translationVi || '') : '';
              const pron = typeof v === 'object' ? (v.pronunciation || '') : '';
              return (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 12, background: '#f8fafc',
                  border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.95rem' }}>{word}</div>
                    {pron && <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>{pron}</div>}
                    <div style={{ fontSize: '0.85rem', color: '#6478b' }}>{trans}</div>
                  </div>
                  <Volume2 size={16} color="#94a3b8" style={{ cursor: 'pointer', flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
          {vocabList.length > 6 && (
            <button onClick={() => setShowAllVocab(!showAllVocab)} style={{
              marginTop: 12, padding: '6px 16px', borderRadius: 8, border: '1px solid #bbf7d0',
              background: '#f0fdf4', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#15803d'
            }}>
              {showAllVocab ? '▲ Ẩn bớt' : `▼ Xem thêm (${vocabList.length - 6})`}
            </button>
          )}
        </div>
      )}

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={18} color="#f59e0b" /> Điểm quan trọng
          </h3>
          {(showAllPoints ? keyPoints : keyPoints.slice(0, 5)).map((k, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: '#f59e0b',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.8rem', flexShrink: 0
              }}>{i + 1}</div>
              <div style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, paddingTop: 4 }}>
                {typeof k === 'object' ? (k.point || k.text || k.content || JSON.stringify(k)) : k}
              </div>
            </div>
          ))}
          {keyPoints.length > 5 && (
            <button onClick={() => setShowAllPoints(!showAllPoints)} style={{
              padding: '6px 16px', borderRadius: 8, border: '1px solid #fde68a',
              background: '#fefce8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#a16207'
            }}>
              {showAllPoints ? '▲ Ẩn bớt' : `▼ Xem thêm (${keyPoints.length - 5})`}
            </button>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button onClick={onComplete} style={{
          padding: '14px 40px', borderRadius: 30, border: 'none',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(102,126,234,0.4)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          Bắt đầu luyện tập <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Multiple Choice Exercise ───────────────────────────────────────────────
function MultipleChoiceQuestion({ question, selectedAnswer, onSelect, showResult }) {
  const options = question.options || [];
  return (
    <div>
      {question.content && (
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>NỘI DUNG</div>
          <div style={{ color: '#475569', lineHeight: 1.7 }}>{question.content}</div>
        </div>
      )}
      <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '1.05rem', marginBottom: 16 }}>
        {question.question}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {(Array.isArray(options) ? options : []).map((opt, i) => {
          const optText = typeof opt === 'string' ? opt : (opt.text || opt.label || JSON.stringify(opt));
          const isSelected = selectedAnswer === optText;
          const isCorrect = showResult && question.correctAnswer === optText;
          const isWrong = showResult && isSelected && question.correctAnswer !== optText;
          const bg = isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : isSelected ? '#eff6ff' : 'white';
          const border = isCorrect ? '#22c55e' : isWrong ? '#ef4444' : isSelected ? '#667eea' : '#e2e8f0';
          return (
            <button key={i} onClick={() => !showResult && onSelect(optText)}
              style={{
                padding: '14px 16px', borderRadius: 12, border: `2px solid ${border}`,
                background: bg, color: isCorrect ? '#15803d' : isWrong ? '#dc2626' : isSelected ? '#667eea' : '#475569',
                textAlign: 'left', fontSize: '0.95rem', fontWeight: isSelected ? 700 : 600,
                cursor: showResult ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              }}>
              <span style={{ marginRight: 10, fontWeight: 800 }}>{String.fromCharCode(65 + i)}.</span>
              {optText}
              {isCorrect && <CheckCircle size={18} style={{ float: 'right' }} />}
              {isWrong && <X size={18} style={{ float: 'right' }} />}
            </button>
          );
        })}
      </div>
      {showResult && question.explanation && (
        <div style={{ background: '#fef3c7', borderRadius: 12, padding: '12px 16px', border: '1px solid #fde68a', marginBottom: 12 }}>
          <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 700, marginBottom: 4 }}>GIẢI THÍCH</div>
          <div style={{ color: '#78350f', fontSize: '0.9rem' }}>{question.explanation}</div>
        </div>
      )}
    </div>
  );
}

// ─── Fill in the Blank ──────────────────────────────────────────────────────
function FillBlankQuestion({ question, value, onChange, showResult }) {
  return (
    <div>
      <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '1.05rem', marginBottom: 16 }}>
        {question.question}
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={showResult}
        placeholder="Nhập câu trả lời..."
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 12,
          border: `2px solid ${showResult ? (value === question.correctAnswer ? '#22c55e' : '#ef4444') : '#e2e8f0'}`,
          fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
          background: showResult ? (value === question.correctAnswer ? '#dcfce7' : '#fee2e2') : 'white',
          color: showResult ? (value === question.correctAnswer ? '#15803d' : '#dc2626') : '#1a202c',
          marginBottom: 12
        }}
      />
      {showResult && (
        <div style={{
          background: value === question.correctAnswer ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${value === question.correctAnswer ? '#22c55e' : '#ef4444'}`,
          borderRadius: 12, padding: '10px 14px', color: value === question.correctAnswer ? '#15803d' : '#dc2626',
          fontSize: '0.9rem'
        }}>
          Đáp án đúng: <strong>{question.correctAnswer}</strong>
        </div>
      )}
    </div>
  );
}

// ─── Writing/Essay ──────────────────────────────────────────────────────────
function WritingQuestion({ question, value, onChange, showResult, onGrade, grading }) {
  return (
    <div>
      <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '1.05rem', marginBottom: 16 }}>
        {question.question}
      </div>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={showResult}
        placeholder="Viết câu trả lời của bạn ở đây..."
        style={{
          width: '100%', minHeight: 160, padding: 16, borderRadius: 12,
          border: '2px solid #e2e8f0', fontSize: '1rem', lineHeight: 1.7,
          fontFamily: 'inherit', resize: 'vertical', outline: 'none',
          boxSizing: 'border-box', marginBottom: 12
        }}
      />
      {showResult && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803d', marginBottom: 8 }}>📝 Gợi ý đáp án:</div>
          <div style={{ color: '#166534', fontSize: '0.9rem' }}>{question.correctAnswer || 'Không có gợi ý'}</div>
        </div>
      )}
      {!showResult && (
        <button onClick={onGrade} disabled={grading || !value}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: grading ? '#94a3b8' : '#8b5cf6',
            color: 'white', fontWeight: 700, cursor: grading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
          }}>
          {grading ? '🤖 Đang chấm bằng AI...' : '🤖 Chấm bài bằng AI'}
        </button>
      )}
    </div>
  );
}

// ─── Drag & Drop ─────────────────────────────────────────────────────────────
function DragDropQuestion({ question, items, onUpdate }) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const list = items || (question.options || []);

  const handleDragStart = (e, idx) => { dragItem.current = idx; e.dataTransfer.effectAllowed = 'move'; };
  const handleDragEnter = (e, idx) => { dragOverItem.current = idx; e.preventDefault(); };
  const handleDrop = (e) => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newList = [...list];
    const dragged = newList[dragItem.current];
    newList.splice(dragItem.current, 1);
    newList.splice(dragOverItem.current, 0, dragged);
    onUpdate(newList);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div>
      <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '1.05rem', marginBottom: 16 }}>
        {question.question}
      </div>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 12 }}>Kéo và thả để sắp xếp:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((item, idx) => (
          <div key={idx} draggable onDragStart={e => handleDragStart(e, idx)}
            onDragEnter={e => handleDragEnter(e, idx)} onDragEnd={handleDrop}
            onDragOver={e => e.preventDefault()}
            style={{
              padding: '12px 16px', borderRadius: 12, border: '2px solid #e2e8f0',
              background: 'white', color: '#475569', fontWeight: 600, cursor: 'grab',
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 0.2s',
            }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: '#667eea',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 800, flexShrink: 0
            }}>{idx + 1}</div>
            <span>{typeof item === 'string' ? item : item.text || JSON.stringify(item)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Listening ────────────────────────────────────────────────────────────────
function ListeningQuestion({ question, value, onChange, showResult }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else { audioRef.current.play(); setPlaying(true); }
    }
  };

  return (
    <div>
      <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 12, padding: '16px 20px', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎧</div>
        <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 8 }}>Bài nghe</div>
        <div style={{ color: '#1e40af', fontSize: '0.9rem', marginBottom: 12 }}>{question.content || 'Nghe và trả lời câu hỏi'}</div>
        <button onClick={toggleAudio} style={{
          padding: '10px 24px', borderRadius: 30, border: 'none',
          background: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {playing ? <Pause size={18} /> : <Play size={18} />} {playing ? 'Dừng' : 'Phát âm thanh'}
        </button>
      </div>
      <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '1.05rem', marginBottom: 16 }}>
        {question.question}
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={showResult}
        placeholder="Nhập câu trả lời..."
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 12,
          border: `2px solid ${showResult ? (value === question.correctAnswer ? '#22c55e' : '#ef4444') : '#e2e8f0'}`,
          fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
        }}
      />
    </div>
  );
}

// ─── Reading ─────────────────────────────────────────────────────────────────
function ReadingQuestion({ question, value, onChange, showResult }) {
  return (
    <div>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <FileText size={14} /> BÀI ĐỌC
        </div>
        <div style={{ color: '#475569', lineHeight: 1.8, fontSize: '0.95rem' }}>
          {question.content || 'No reading content provided.'}
        </div>
      </div>
      <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '1.05rem', marginBottom: 16 }}>
        {question.question}
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={showResult}
        placeholder="Nhập câu trả lời..."
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 12,
          border: `2px solid ${showResult ? (value === question.correctAnswer ? '#22c55e' : '#ef4444') : '#e2e8f0'}`,
          fontSize: '1rem', outline: 'none', boxSizing: 'border-box', marginBottom: 12
        }}
      />
    </div>
  );
}

// ─── Speaking ─────────────────────────────────────────────────────────────────
function SpeakingQuestion({ question, value, onChange, showResult }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startRecording = () => {
    setRecording(true);
    // Simulate recording
    setTimeout(() => {
      setRecording(false);
      setTranscript(value || 'Simulated transcription...');
    }, 3000);
  };

  return (
    <div>
      <div style={{ background: '#fdf2f8', border: '1px solid #f9a8d4', borderRadius: 12, padding: '16px 20px', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎙️</div>
        <div style={{ fontWeight: 700, color: '#be185d', marginBottom: 8 }}>Bài nói</div>
        <div style={{ color: '#9d174d', fontSize: '0.9rem', marginBottom: 12 }}>{question.content || 'Hãy đọc to câu sau'}</div>
        <button onClick={startRecording} style={{
          padding: '10px 24px', borderRadius: 30, border: 'none',
          background: recording ? '#ef4444' : '#ec4899',
          color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {recording ? <Pause size={18} /> : <Mic size={18} />}
          {recording ? 'Đang ghi âm...' : 'Bắt đầu ghi âm'}
        </button>
        {recording && <div style={{ marginTop: 8, color: '#dc2626', fontSize: '0.85rem' }}>⏱ Đang ghi...</div>}
      </div>
      <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '1.05rem', marginBottom: 16 }}>
        {question.question}
      </div>
      <div style={{
        background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '10px 14px',
        color: '#6d28d9', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: 12
      }}>
        "{question.correctAnswer || 'Hãy phát âm câu này'}"
      </div>
      {transcript && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 14px', color: '#15803d', fontSize: '0.9rem' }}>
          Văn bản: {transcript}
        </div>
      )}
    </div>
  );
}

// ─── Exercise Section ────────────────────────────────────────────────────────
function ExerciseSection({ lessonId, exercises, onNext, onBack }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [grading, setGrading] = useState({});
  const [aiFeedback, setAiFeedback] = useState({});
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [exerciseList, setExerciseList] = useState([]);

  useEffect(() => {
    if (exercises && exercises.length > 0) {
      setExerciseList(exercises);
      setLoadingExercises(false);
    } else {
      lessonManagementAPI.getExercises(lessonId).then(r => {
        setExerciseList(r.data?.data || []);
      }).catch(() => {}).finally(() => setLoadingExercises(false));
    }
  }, [exercises, lessonId]);

  const exercise = exerciseList[currentIdx];

  const handleAnswer = (val) => {
    const qId = exercise?.questions?.[0]?.id || 0;
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleGrade = async (questionId) => {
    setGrading(prev => ({ ...prev, [questionId]: true }));
    try {
      const res = await lessonManagementAPI.submitMiniTest(lessonId, {
        answers: { [questionId]: answers[questionId] || '' }, timeSpentSeconds: 0
      });
      if (res.data?.data?.aiFeedback) {
        setAiFeedback(prev => ({ ...prev, [questionId]: res.data.data.aiFeedback }));
      }
    } catch (e) {
      toast.error('AI grading failed');
    }
    setGrading(prev => ({ ...prev, [questionId]: false }));
  };

  const currentQ = exercise?.questions?.[0];
  const answerValue = currentQ ? (answers[currentQ.id] || '') : '';

  if (loadingExercises) {
    return <div className="loading">Đang tải bài tập...</div>;
  }

  if (exerciseList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📝</div>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Chưa có bài tập cho bài học này.</p>
        <button onClick={onBack} style={{
          padding: '10px 24px', borderRadius: 10, border: '2px solid #e2e8f0',
          background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', marginTop: 16
        }}>← Quay lại nội dung</button>
      </div>
    );
  }

  return (
    <div>
      {/* Exercise tabs */}
      {exerciseList.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {exerciseList.map((ex, i) => (
            <button key={ex.id} onClick={() => { setCurrentIdx(i); setShowResult(false); }}
              style={{
                padding: '8px 16px', borderRadius: 10,
                border: `2px solid ${currentIdx === i ? '#667eea' : '#e2e8f0'}`,
                background: currentIdx === i ? '#eff6ff' : 'white',
                color: currentIdx === i ? '#667eea' : '#64748b',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}>
              {ex.type === 'VOCAB_QUIZ' ? '📚' : ex.type === 'GRAMMAR' ? '📐' :
                ex.type === 'LISTENING' ? '🎧' : ex.type === 'READING' ? '📖' :
                  ex.type === 'WRITING' ? '📝' : ex.type === 'SPEAKING' ? '🎙️' : '📋'}
              {' '}{ex.title || `Bài ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Exercise card */}
      {exercise && (
        <div style={{
          background: 'white', borderRadius: 20, padding: 28, marginBottom: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1a202c' }}>
                {exercise.title || 'Bài tập'}
              </h3>
              {exercise.instructions && (
                <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                  {exercise.instructions}
                </p>
              )}
            </div>
            <span style={{
              padding: '4px 14px', borderRadius: 20,
              background: '#f1f5f9', color: '#64748b', fontSize: '0.8rem', fontWeight: 700
            }}>
              Câu 1 / {exercise.questions?.length || 0}
            </span>
          </div>

          {/* Question nav dots */}
          {exercise.questions?.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {exercise.questions.map((q, i) => (
                <button key={q.id || i}
                  onClick={() => { setCurrentIdx(i === 0 ? currentIdx : currentIdx); }}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: '2px solid',
                    borderColor: i === 0 ? '#667eea' : answers[q.id] ? '#22c55e' : '#e2e8f0',
                    background: i === 0 ? '#eff6ff' : answers[q.id] ? '#dcfce7' : 'white',
                    color: i === 0 ? '#667eea' : answers[q.id] ? '#15803d' : '#64748b',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
                  }}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Question renderer */}
          {currentQ && (
            <>
              {currentQ.type === 'MULTIPLE_CHOICE' && (
                <MultipleChoiceQuestion
                  question={currentQ}
                  selectedAnswer={answerValue}
                  onSelect={handleAnswer}
                  showResult={showResult}
                />
              )}
              {currentQ.type === 'FILL_BLANK' && (
                <FillBlankQuestion
                  question={currentQ}
                  value={answerValue}
                  onChange={handleAnswer}
                  showResult={showResult}
                />
              )}
              {(currentQ.type === 'WRITING' || currentQ.type === 'ESSAY') && (
                <WritingQuestion
                  question={currentQ}
                  value={answerValue}
                  onChange={handleAnswer}
                  showResult={showResult}
                  onGrade={() => handleGrade(currentQ.id)}
                  grading={grading[currentQ.id]}
                />
              )}
              {currentQ.type === 'DRAG_DROP' && (
                <DragDropQuestion
                  question={currentQ}
                  items={answerValue}
                  onUpdate={handleAnswer}
                />
              )}
              {currentQ.type === 'LISTENING_CONTENT' && (
                <ListeningQuestion
                  question={currentQ}
                  value={answerValue}
                  onChange={handleAnswer}
                  showResult={showResult}
                />
              )}
              {currentQ.type === 'READING_PASSAGE' && (
                <ReadingQuestion
                  question={currentQ}
                  value={answerValue}
                  onChange={handleAnswer}
                  showResult={showResult}
                />
              )}
              {currentQ.type === 'SPEAKING_PROMPT' && (
                <SpeakingQuestion
                  question={currentQ}
                  value={answerValue}
                  onChange={handleAnswer}
                  showResult={showResult}
                />
              )}
            </>
          )}

          {/* AI Feedback */}
          {aiFeedback[currentQ?.id] && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 16, padding: 16, marginTop: 16
            }}>
              <div style={{ fontWeight: 800, color: '#15803d', fontSize: '0.9rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BrainCircuit size={16} /> AI Feedback
              </div>
              <div style={{ color: '#166534', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {aiFeedback[currentQ.id]}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{
          padding: '10px 24px', borderRadius: 10, border: '2px solid #e2e8f0',
          background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
        }}>← Nội dung</button>
        {!showResult ? (
          <button onClick={() => setShowResult(true)} disabled={!answerValue}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: answerValue ? '#667eea' : '#94a3b8',
              color: 'white', fontWeight: 700, cursor: answerValue ? 'pointer' : 'not-allowed',
              fontSize: '0.95rem',
            }}>
            Kiểm tra đáp án
          </button>
        ) : (
          <button onClick={onNext} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
          }}>
            Tiếp tục Test →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Mini Test Section ────────────────────────────────────────────────────────
function MiniTestSection({ lessonId, onNext, onBack }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    lessonManagementAPI.getMiniTest(lessonId)
      .then(r => {
        const t = r.data?.data;
        setTest(t);
        if (t) setTimeLeft((t.durationMinutes || 15) * 60);
      })
      .catch(() => setTest(null))
      .finally(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => {
    if (timeLeft > 0 && !result) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft, result]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const mappedAnswers = {};
      if (test?.questions) {
        test.questions.forEach((q, i) => {
          const ans = answers[q.id];
          if (ans !== undefined) mappedAnswers[q.id] = ans;
        });
      }
      const res = await lessonManagementAPI.submitMiniTest(lessonId, {
        answers: mappedAnswers,
        timeSpentSeconds: ((test?.durationMinutes || 15) * 60) - timeLeft
      });
      setResult(res.data?.data);
      clearInterval(timerRef.current);
    } catch (e) {
      toast.error('Failed to submit');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="loading">Đang tải bài kiểm tra...</div>;

  if (!test) {
    return (
      <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16 }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📝</div>
        <p style={{ color: '#64748b', fontWeight: 600 }}>Chưa có mini test cho bài học này.</p>
        <button onClick={onNext} style={{
          padding: '12px 32px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', marginTop: 12
        }}>Xem kết quả →</button>
      </div>
    );
  }

  // Result view
  if (result) {
    const pct = parseInt(result.percentage) || 0;
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{
          background: result.passed ? 'linear-gradient(135deg, #11998e, #38ef7d)' : 'linear-gradient(135deg, #f093fb, #f5576c)',
          borderRadius: 24, color: 'white', padding: 40, maxWidth: 600, margin: '0 auto 20px',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>{result.passed ? '🎉' : '💪'}</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 900 }}>
            {result.passed ? 'Chúc mừng!' : 'Cố gắng hơn!'}
          </h2>
          <p style={{ opacity: 0.9, marginBottom: 20 }}>
            {result.passed ? 'Bạn đã vượt qua bài kiểm tra!' : 'Hãy ôn tập và thử lại nhé!'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
            {[
              { label: 'Điểm', value: `${result.score}%`, icon: '⭐' },
              { label: 'Đúng', value: `${result.correctAnswers}/${result.totalQuestions}`, icon: '✓' },
              { label: 'Thời gian', value: formatTime(result.timeSpentSeconds), icon: '⏱' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Question results */}
        {result.questionResults?.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'left', maxWidth: 600, margin: '0 auto' }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>📋 Chi tiết đáp án</h3>
            {result.questionResults.map((qr, i) => (
              <div key={i} style={{
                padding: 12, borderRadius: 12, marginBottom: 8,
                background: qr.correct ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${qr.correct ? '#bbf7d0' : '#fecaca'}`
              }}>
                <div style={{ fontWeight: 700, color: qr.correct ? '#15803d' : '#dc2626', marginBottom: 4 }}>
                  {qr.correct ? '✓' : '✗'} Câu {i + 1}: {qr.question}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Đáp án của bạn: <strong>{qr.userAnswer || '(trống)'}</strong>
                  {!qr.correct && <> • Đúng: <strong>{qr.correctAnswer}</strong></>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onBack} style={{
            padding: '10px 24px', borderRadius: 10, border: '2px solid #e2e8f0',
            background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer',
          }}>← Quay lại</button>
          {!result.passed && (
            <button onClick={() => { setResult(null); setAnswers({}); setCurrentQ(0); setTimeLeft((test.durationMinutes || 15) * 60); }}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#667eea', color: 'white', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
              <RefreshCw size={16} /> Làm lại
            </button>
          )}
          {result.passed && (
            <button onClick={onNext} style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', fontWeight: 700, cursor: 'pointer',
            }}>
              Xem kết quả → 🎯
            </button>
          )}
        </div>
      </div>
    );
  }

  const questions = test.questions || [];
  const q = questions[currentQ];
  const timerColor = timeLeft <= 60 ? { background: '#dc2626', color: 'white' } :
    timeLeft <= 300 ? { background: '#fef3c7', color: '#92400e' } :
      { background: '#f1f5f9', color: '#334155' };

  return (
    <div>
      {/* Timer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 10
      }}>
        <h3 style={{ margin: 0, fontWeight: 800, color: '#1a202c', fontSize: '1.1rem' }}>
          🧪 {test.title || 'Mini Test'}
        </h3>
        <div style={{
          padding: '8px 16px', borderRadius: 10, fontWeight: 800,
          fontFamily: 'monospace', fontSize: '1.1rem', ...timerColor,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 20, flexWrap: 'wrap' }}>
        {questions.map((_, i) => (
          <div key={i} onClick={() => setCurrentQ(i)}
            style={{
              width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
              background: i === currentQ ? '#667eea' : answers[questions[i]?.id] ? '#22c55e' : '#f1f5f9',
              color: i === currentQ ? 'white' : answers[questions[i]?.id] ? 'white' : '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.75rem', border: 'none',
            }}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* Question */}
      <div style={{ background: 'white', borderRadius: 20, padding: 28, marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '1.05rem', marginBottom: 16 }}>
          Câu {currentQ + 1}: {q?.question || ''}
        </div>

        {q?.type === 'MULTIPLE_CHOICE' && q.options?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => {
              const isSelected = answers[q.id] === opt;
              return (
                <button key={i} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                  style={{
                    padding: '12px 16px', borderRadius: 12,
                    border: `2px solid ${isSelected ? '#667eea' : '#e2e8f0'}`,
                    background: isSelected ? '#eff6ff' : 'white',
                    color: isSelected ? '#667eea' : '#475569',
                    textAlign: 'left', fontWeight: isSelected ? 700 : 600,
                    cursor: 'pointer', fontSize: '0.95rem',
                  }}>
                  <span style={{ marginRight: 10, fontWeight: 800 }}>{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q?.type !== 'MULTIPLE_CHOICE' && (
          <input
            type="text"
            value={answers[q?.id] || ''}
            onChange={e => setAnswers(prev => ({ ...prev, [q?.id]: e.target.value }))}
            placeholder="Nhập câu trả lời..."
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none'
            }}
          />
        )}
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onBack} disabled={currentQ === 0}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '2px solid #e2e8f0',
            background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer',
            opacity: currentQ === 0 ? 0.5 : 1
          }}>←</button>

        {currentQ < questions.length - 1 ? (
          <button onClick={() => setCurrentQ(prev => prev + 1)}
            style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#667eea', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            Tiếp →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#22c55e', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            {submitting ? 'Đang nộp...' : '✓ Nộp bài'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Result Section ──────────────────────────────────────────────────────────
function ResultSection({ lesson, progress, onRetry, onBack }) {
  const totalScore = progress?.totalScore || 0;
  const completed = progress?.lessonCompleted || false;
  const timeSpentMin = Math.round((progress?.timeSpentSeconds || 0) / 60);

  const sections = [
    { label: 'Nội dung', done: progress?.contentViewed, icon: '📖', color: '#667eea' },
    { label: 'Bài tập', done: progress?.exercisesCompleted, icon: '✏️', color: '#8b5cf6' },
    { label: 'Mini Test', done: progress?.testCompleted, icon: '🧪', color: '#06b6d4' },
  ];

  const completionPct = Math.round(
    (progress?.contentViewed ? 33 : 0) + (progress?.exercisesCompleted ? 33 : 0) + (progress?.testCompleted ? 34 : 0)
  );

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        background: completed ? 'linear-gradient(135deg, #11998e, #38ef7d)' : 'linear-gradient(135deg, #f093fb, #f5576c)',
        borderRadius: 24, color: 'white', padding: 40, maxWidth: 600, margin: '0 auto 20px',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>{completed ? '🎉' : '💪'}</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 900 }}>
          {completed ? 'Chúc mừng bạn!' : 'Đã hoàn thành bài học!'}
        </h2>
        <p style={{ opacity: 0.9, marginBottom: 24, fontSize: '1rem' }}>
          {completed ? 'Bạn đã hoàn thành xuất sắc bài học này!' : 'Hãy tiếp tục cố gắng nhé!'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Điểm', value: totalScore || progress?.exerciseScore || 0, icon: '⭐' },
            { label: 'Thời gian', value: `${timeSpentMin} phút`, icon: '⏱' },
            { label: 'Hoàn thành', value: `${completionPct}%`, icon: '✅' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {sections.map((s, i) => (
            <div key={i} style={{
              padding: '6px 14px', borderRadius: 20,
              background: s.done ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)',
              fontSize: '0.85rem', fontWeight: 700,
            }}>
              {s.done ? '✓' : '○'} {s.icon} {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Feedback card */}
      <div style={{
        background: 'white', borderRadius: 20, padding: 24, margin: '0 auto 20px',
        maxWidth: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'left'
      }}>
        <h3 style={{ margin: '0 0 12px', fontWeight: 800, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrainCircuit size={20} color="#8b5cf6" /> AI Learning Insights
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Điểm mạnh', value: 'Đã hoàn thành nội dung bài học', color: '#22c55e' },
            { label: 'Cần cải thiện', value: 'Làm thêm bài tập để cải thiện', color: '#f59e0b' },
            { label: 'Gợi ý', value: 'Học từ vựng mỗi ngày 15 phút', color: '#3b82f6' },
            { label: 'Bài tiếp', value: 'Hoàn thành 3 bài để nhận badge', color: '#8b5cf6' },
          ].map((item, i) => (
            <div key={i} style={{
              background: `${item.color}10`, border: `1px solid ${item.color}30`,
              borderRadius: 12, padding: '10px 14px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion message */}
      {progress?.completionMessage && (
        <div style={{
          background: '#fef3c7', borderRadius: 16, padding: '16px 20px', margin: '0 auto 20px',
          maxWidth: 600, color: '#92400e', fontWeight: 600, fontSize: '0.95rem'
        }}>
          💬 {progress.completionMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{
          padding: '10px 24px', borderRadius: 10, border: '2px solid #e2e8f0',
          background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6
        }}>← Quay lại</button>
        <button onClick={onRetry} style={{
          padding: '10px 24px', borderRadius: 10, border: '2px solid #e2e8f0',
          background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <RotateCcw size={16} /> Làm lại
        </button>
        {lesson?.navigation?.nextId && (
          <button onClick={() => { window.location.href = `/lesson/${lesson.navigation.nextId}`; }}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
            Bài tiếp theo <ArrowRight size={16} />
          </button>
        )}
        <button onClick={() => { window.location.href = `/courses/${lesson?.courseId}`; }}
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: '#64748b', color: 'white', fontWeight: 700, cursor: 'pointer'
          }}>
          Quay lại khóa học
        </button>
      </div>
    </div>
  );
}

// ─── Main LessonPage ──────────────────────────────────────────────────────────
export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [lesson, setLesson] = useState(null);
  const [content, setContent] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [progress, setProgress] = useState(null);
  const [exercises, setExercises] = useState([]);

  const STEPS = [
    { id: 'content', label: '📖 Nội dung', icon: '📖' },
    { id: 'exercise', label: '✏️ Luyện tập', icon: '✏️' },
    { id: 'test', label: '🧪 Mini Test', icon: '🧪' },
    { id: 'result', label: '🎯 Kết quả', icon: '🎯' },
  ];

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lessonRes, contentRes, subtitleRes, progressRes, exerciseRes] = await Promise.all([
        lessonManagementAPI.getLesson(lessonId).catch(() => null),
        lessonManagementAPI.getContent(lessonId).catch(() => null),
        lessonManagementAPI.getSubtitles(lessonId).catch(() => null),
        user ? lessonManagementAPI.getProgress(lessonId).catch(() => null) : Promise.resolve(null),
        lessonManagementAPI.getExercises(lessonId).catch(() => null),
      ]);

      setLesson(lessonRes?.data?.data || lessonRes?.data);
      setContent(contentRes?.data?.data || contentRes?.data);

      const subs = subtitleRes?.data?.data || [];
      setSubtitles(Array.isArray(subs) ? subs : []);

      setProgress(progressRes?.data?.data || progressRes?.data);

      const ex = exerciseRes?.data?.data || [];
      setExercises(Array.isArray(ex) ? ex : []);

      // Auto-set step based on progress
      const p = progressRes?.data?.data || progressRes?.data;
      if (p?.testCompleted) setCurrentStep(3);
      else if (p?.exercisesCompleted) setCurrentStep(2);
      else if (p?.contentViewed) setCurrentStep(1);
    } catch (e) {
      setError('Không thể tải bài học');
    }
    setLoading(false);
  }, [lessonId, user]);

  useEffect(() => { loadLesson(); }, [loadLesson]);

  const updateProgress = async (section, score, completed) => {
    try {
      await lessonManagementAPI.getLesson(lessonId); // Just refresh
      const res = await lessonManagementAPI.getProgress(lessonId);
      setProgress(res.data?.data || res.data);
    } catch (e) { /* ignore */ }
  };

  const handleStepComplete = async () => {
    const sectionMap = { 0: 'content', 1: 'exercises', 2: 'test' };
    const section = sectionMap[currentStep];
    if (!section) return;
    await updateProgress(section, 0, true);
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));
  const handleGoToLesson = (id) => navigate(`/lesson/${id}`);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📚</div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.1rem' }}>
          Đang tải bài học...
        </p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
        <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error || 'Không tìm thấy bài học'}</p>
        <button onClick={() => navigate(-1)} style={{
          padding: '10px 24px', borderRadius: 10, border: 'none',
          background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', marginTop: 16
        }}>← Quay lại</button>
      </div>
    );
  }

  const completedSteps = STEPS
    .map((s, i) => (i < currentStep || (i === 0 && progress?.contentViewed) ||
      (i === 1 && progress?.exercisesCompleted) || (i === 2 && progress?.testCompleted)) ? s.id : null)
    .filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50, background: 'white',
        borderBottom: '1px solid #e2e8f0', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
      }}>
        <button onClick={() => navigate(`/courses/${lesson.courseId}`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 10, border: '2px solid #e2e8f0', background: 'white',
            cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: '0.875rem'
          }}>
          <ArrowLeft size={16} /> Khóa học
        </button>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1a202c' }}>
            {lesson.title}
          </h1>
          {progress?.lessonCompleted && (
            <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 700 }}>
              ✓ Hoàn thành
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {lesson.navigation?.previousId && (
            <button onClick={() => handleGoToLesson(lesson.navigation.previousId)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#64748b'
              }}>
              ← {String(lesson.navigation.previousTitle || '').substring(0, 15)}
            </button>
          )}
          {lesson.navigation?.nextId && (
            <button onClick={() => handleGoToLesson(lesson.navigation.nextId)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: 'none',
                background: '#667eea', color: 'white', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 700
              }}>
              {String(lesson.navigation.nextTitle || '').substring(0, 15)} →
            </button>
          )}
        </div>
      </div>

      {/* Step bar */}
      <div style={{ padding: '20px 24px 0', maxWidth: 900, margin: '0 auto' }}>
        <StepBar steps={STEPS} currentStep={currentStep} completedSteps={completedSteps} onStep={setCurrentStep} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 40px' }}>
        {currentStep === 0 && (
          <ContentSection
            lesson={lesson}
            content={content}
            subtitles={subtitles}
            onComplete={handleStepComplete}
          />
        )}
        {currentStep === 1 && (
          <ExerciseSection
            lessonId={lessonId}
            exercises={exercises}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 2 && (
          <MiniTestSection
            lessonId={lessonId}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <ResultSection
            lesson={lesson}
            progress={progress}
            onRetry={() => setCurrentStep(0)}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
