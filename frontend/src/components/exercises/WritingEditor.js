import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, FileText, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const WritingEditor = ({
  question = '',
  instructions = '',
  value = '',
  onChange = () => {},
  onSave = () => {},
  onSubmit = () => {},
  maxWords = 500,
  minWords = 50,
  disabled = false,
  autoSaveInterval = 30000,
  showWordCount = true,
  showFeedback = false,
  feedback = null,
  gradingInProgress = false,
}) => {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const countWords = (str) => {
    if (!str || !str.trim()) return 0;
    return str.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const countChars = (str) => {
    if (!str) return 0;
    return str.replace(/\s/g, '').length;
  };

  useEffect(() => {
    const words = countWords(text);
    const chars = countChars(text);
    setWordCount(words);
    setCharCount(chars);
  }, [text]);

  useEffect(() => {
    if (autoSaveInterval > 0 && !disabled) {
      autoSaveTimerRef.current = setInterval(() => {
        if (textRef.current !== value && isDirty) {
          handleSave();
        }
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveInterval, disabled, value, isDirty]);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setIsDirty(true);
    setError(null);
    onChange(newText);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(200, textareaRef.current.scrollHeight) + 'px';
    }
  };

  const handleSave = useCallback(async () => {
    if (disabled || saving) return;
    setSaving(true);
    try {
      await onSave(text);
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err) {
      setError('Lỗi lưu tự động. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [text, onSave, disabled, saving]);

  const handleSubmit = () => {
    if (wordCount < minWords) {
      setError(`Cần ít nhất ${minWords} từ. Bạn mới viết ${wordCount} từ.`);
      return;
    }
    setError(null);
    onSubmit(text);
  };

  const handleClear = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ nội dung?')) {
      setText('');
      onChange('');
      setIsDirty(true);
      setError(null);
    }
  };

  const handleFormatBold = () => insertText('**', '**');
  const handleFormatItalic = () => insertText('_', '_');

  const insertText = (before, after) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);

    setText(newText);
    onChange(newText);
    setIsDirty(true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const getWordCountColor = () => {
    if (wordCount < minWords) return '#ef4444';
    if (wordCount > maxWords) return '#f59e0b';
    return '#22C55E';
  };

  const getWordCountMessage = () => {
    if (wordCount < minWords) return `Cần thêm ${minWords - wordCount} từ`;
    if (wordCount > maxWords) return `Vượt quá ${wordCount - maxWords} từ`;
    return 'Đạt yêu cầu';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {instructions && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.15)',
          fontSize: '0.85rem',
          color: '#4a5568',
          fontWeight: 500,
          lineHeight: 1.6,
        }}>
          <strong style={{ color: '#8b5cf6' }}>Hướng dẫn:</strong> {instructions}
        </div>
      )}

      <div className="clay-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: isFocused ? 'rgba(139,92,246,0.04)' : 'rgba(0,0,0,0.02)',
          transition: 'background 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="#8b5cf6" />
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#4a5568' }}>
              Trình soạn thảo
            </span>
            {isDirty && (
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#f59e0b',
              }} />
            )}
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={handleFormatBold}
              disabled={disabled}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: 'none',
                background: 'rgba(0,0,0,0.05)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
              }}
              title="In đậm"
            >
              B
            </button>
            <button
              onClick={handleFormatItalic}
              disabled={disabled}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: 'none',
                background: 'rgba(0,0,0,0.05)',
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '0.8rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
              }}
              title="In nghiêng"
            >
              I
            </button>
            <button
              onClick={handleClear}
              disabled={disabled}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                border: 'none',
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
              }}
              title="Xóa nội dung"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="Bắt đầu viết bài luận của bạn ở đây..."
          style={{
            width: '100%',
            minHeight: 200,
            padding: '16px',
            border: 'none',
            outline: 'none',
            fontSize: '0.95rem',
            lineHeight: 1.8,
            color: '#1a202c',
            background: 'transparent',
            resize: 'vertical',
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            boxSizing: 'border-box',
            opacity: disabled ? 0.6 : 1,
          }}
        />
      </div>

      {showWordCount && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
            <span>{charCount} ký tự</span>
            <span style={{ color: getWordCountColor() }}>
              {wordCount} / {minWords}-{maxWords} từ
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.75rem',
            fontWeight: 700,
            color: getWordCountColor(),
          }}>
            <CheckCircle size={12} />
            {getWordCountMessage()}
          </div>
        </div>
      )}

      {lastSaved && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.75rem',
          color: '#22C55E',
          fontWeight: 600,
        }}>
          <Save size={12} />
          Đã lưu lúc {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {saving && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.75rem',
          color: '#718096',
          fontWeight: 600,
        }}>
          <div style={{
            width: 12,
            height: 12,
            border: '2px solid #718096',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          Đang lưu...
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'rgba(239,68,68,0.1)',
          color: '#ef4444',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {showFeedback && feedback && (
        <div style={{
          padding: 16,
          borderRadius: 12,
          background: feedback.score >= 7 ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
          border: `1px solid ${feedback.score >= 7 ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1a202c' }}>
              Phản hồi từ AI
            </span>
            {gradingInProgress ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#718096',
                fontSize: '0.75rem',
              }}>
                <div style={{
                  width: 12,
                  height: 12,
                  border: '2px solid #718096',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Đang chấm điểm...
              </div>
            ) : (
              <span style={{
                fontWeight: 900,
                fontSize: '1.1rem',
                color: feedback.score >= 7 ? '#22C55E' : '#f59e0b',
              }}>
                {feedback.score}/{feedback.maxScore}
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: 1.7, marginBottom: 12 }}>
            {feedback.feedback || feedback.overallComment}
          </p>

          {feedback.corrections && feedback.corrections.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: '0.8rem', color: '#ef4444' }}>Sửa lỗi:</strong>
              <ul style={{ margin: '6px 0 0 16px', fontSize: '0.8rem', color: '#4a5568' }}>
                {feedback.corrections.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div>
              <strong style={{ fontSize: '0.8rem', color: '#8b5cf6' }}>Gợi ý cải thiện:</strong>
              <ul style={{ margin: '6px 0 0 16px', fontSize: '0.8rem', color: '#4a5568' }}>
                {feedback.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WritingEditor;
