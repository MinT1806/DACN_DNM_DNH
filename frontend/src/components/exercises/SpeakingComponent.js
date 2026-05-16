import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RefreshCw, Volume2, CheckCircle } from 'lucide-react';

export default function SpeakingComponent({ question, value, onChange, showResult, result, onAIGrade }) {
  const [recording, setRecording] = useState(false);
  const [recordedText, setRecordedText] = useState(value || '');
  const [audioUrl, setAudioUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptConfirmed, setTranscriptConfirmed] = useState(false);
  const recognitionRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let transcript = '';
          let interim = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setRecordedText(transcript + interim);
          if (transcript) onChange(transcript);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            alert('Vui lòng cho phép truy cập microphone.');
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setRecording(true);
        setRecordedText('');
        setTranscriptConfirmed(false);
      } else {
        // Fallback: use MediaRecorder for audio-only
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setAudioUrl(URL.createObjectURL(blob));
        };
        recorder.start();
        setMediaRecorder(recorder);
        setAudioChunks(chunks);
        setRecording(true);
        setRecordedText('');
        setTranscriptConfirmed(false);
      }
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setRecording(false);
    }
    setIsProcessing(true);
    // Simulate processing time
    setTimeout(() => setIsProcessing(false), 1000);
  };

  const handleReRecord = () => {
    setRecordedText('');
    setAudioUrl(null);
    setTranscriptConfirmed(false);
    onChange('');
  };

  const handleConfirmTranscript = () => {
    if (recordedText.trim()) {
      setTranscriptConfirmed(true);
      onChange(recordedText);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    };
  }, []);

  if (showResult && result) {
    return (
      <div style={{ marginTop: 12 }}>
        {recordedText || result.userAnswer ? (
          <div style={{
            padding: 16, borderRadius: 12, background: '#f8fafc',
            border: '2px solid #e2e8f0', marginBottom: 12,
          }}>
            <div style={{ fontWeight: 700, color: '#1a202c', marginBottom: 6, fontSize: '0.88rem' }}>
              Bản ghi giọng nói:
            </div>
            <div style={{ color: '#4a5568', lineHeight: 1.7, fontSize: '0.9rem', fontStyle: 'italic' }}>
              "{result.userAnswer || recordedText}"
            </div>
          </div>
        ) : (
          <div style={{
            padding: 16, borderRadius: 12, background: '#fef3c7',
            border: '2px solid #fcd34d', marginBottom: 12,
          }}>
            <span style={{ color: '#92400e', fontSize: '0.88rem' }}>
              Không có bản ghi giọng nói cho câu này.
            </span>
          </div>
        )}

        {result.aiScore != null && (
          <div style={{
            padding: 16, borderRadius: 12,
            background: result.aiScore >= 7 ? '#22C55E11' : result.aiScore >= 5 ? '#f59e0b11' : '#ef444411',
            border: `2px solid ${result.aiScore >= 7 ? '#22C55E33' : result.aiScore >= 5 ? '#f59e0b33' : '#ef444433'}`,
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: '1.5rem', fontWeight: 900,
                color: result.aiScore >= 7 ? '#22C55E' : result.aiScore >= 5 ? '#f59e0b' : '#ef4444',
              }}>
                {result.aiScore.toFixed(1)}/10
              </span>
              <span style={{ color: '#718096', fontSize: '0.82rem' }}>AI đánh giá phát âm</span>
            </div>
            {result.aiFeedback && (
              <div style={{ color: '#4a5568', lineHeight: 1.6, fontSize: '0.88rem', marginBottom: 10 }}>
                {result.aiFeedback}
              </div>
            )}
            {result.aiDetails && result.aiDetails.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {result.aiDetails.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', borderRadius: 8, background: '#f8fafc',
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#1a202c', fontSize: '0.82rem' }}>{d.criterion}</span>
                      {d.comment && (
                        <div style={{ color: '#718096', fontSize: '0.78rem', marginTop: 2 }}>{d.comment}</div>
                      )}
                    </div>
                    <span style={{
                      fontWeight: 800, fontSize: '0.88rem',
                      color: d.score >= 7 ? '#22C55E' : d.score >= 5 ? '#f59e0b' : '#ef4444',
                    }}>
                      {d.score}/10
                    </span>
                  </div>
                ))}
              </div>
            )}
            {result.pronunciationTips && result.pronunciationTips.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.82rem', marginBottom: 6 }}>Mẹo phát âm</div>
                {result.pronunciationTips.map((tip, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#4a5568', marginBottom: 2 }}>
                    💡 {tip}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {result.explanation && (
          <div style={{ padding: 12, borderRadius: 10, background: '#8b5cf611', border: '1px solid #8b5cf633' }}>
            <span style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.82rem' }}>Gợi ý: </span>
            <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>{result.explanation}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      {/* Instructions */}
      <div style={{
        padding: '10px 14px', borderRadius: '10px 10px 0 0',
        background: '#dbeafe', border: '1px solid #93c5fd',
        fontSize: '0.82rem', color: '#1e40af', fontWeight: 500,
        marginBottom: 0,
      }}>
        🎤 Nhấn <strong>Bắt đầu ghi</strong>, đọc câu hỏi bằng tiếng Anh, sau đó nhấn <strong>Dừng ghi</strong>.
      </div>

      {/* Recording area */}
      <div style={{
        padding: 20, borderRadius: '0 0 12px 12px',
        border: `2px solid ${recording ? '#ef4444' : '#e2e8f0'}`,
        borderTop: 'none',
        background: recording ? '#fef2f2' : '#fff',
        textAlign: 'center', transition: 'all 0.3s',
      }}>
        {/* Waveform animation */}
        {recording && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                width: 4, height: 16 + Math.random() * 20,
                background: '#ef4444', borderRadius: 4,
                animation: `wave 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
              }} />
            ))}
          </div>
        )}

        <button
          onClick={recording ? stopRecording : startRecording}
          className="clay-btn"
          style={{
            background: recording ? '#ef444422' : '#22C55E22',
            color: recording ? '#ef4444' : '#22C55E',
            border: `2px solid ${recording ? '#ef444433' : '#22C55E33'}`,
            padding: '12px 28px', fontSize: '0.95rem', fontWeight: 700,
            borderRadius: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
            cursor: 'pointer',
          }}
        >
          {recording ? <><Square size={16} /> Dừng ghi</> : <><Mic size={16} /> Bắt đầu ghi</>}
        </button>

        {isProcessing && (
          <div style={{ marginTop: 12, color: '#718096', fontSize: '0.82rem' }}>
            ⏳ Đang xử lý...
          </div>
        )}

        {/* Audio playback */}
        {audioUrl && (
          <div style={{ marginTop: 16 }}>
            <audio src={audioUrl} controls style={{ height: 36 }} />
          </div>
        )}

        {/* Recorded text */}
        {(recordedText || transcriptConfirmed) && (
          <div style={{
            marginTop: 16, padding: 12, borderRadius: 10,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <CheckCircle size={14} color="#22C55E" />
              <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.82rem' }}>
                Bản ghi
              </span>
            </div>
            <div style={{ color: '#4a5568', fontSize: '0.88rem', fontStyle: 'italic', lineHeight: 1.6 }}>
              "{recordedText || value}"
            </div>
          </div>
        )}

        {/* Confirm / Re-record */}
        {recordedText && !transcriptConfirmed && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={handleConfirmTranscript}
              className="clay-btn clay-btn-green"
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              <CheckCircle size={13} /> Xác nhận
            </button>
            <button
              onClick={handleReRecord}
              className="clay-btn"
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              <RefreshCw size={13} /> Ghi lại
            </button>
          </div>
        )}

        {/* Manual text input fallback */}
        {!recording && !recordedText && !transcriptConfirmed && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: 8 }}>
              Hoặc nhập đáp án thủ công:
            </div>
            <textarea
              value={value || ''}
              onChange={(e) => { onChange(e.target.value); setRecordedText(e.target.value); }}
              placeholder="Nhập câu trả lời bằng tiếng Anh..."
              style={{
                width: '100%', minHeight: 80, padding: '10px 14px',
                fontSize: '0.88rem', borderRadius: 10, border: '2px solid #e2e8f0',
                resize: 'vertical', fontFamily: 'inherit', outline: 'none',
              }}
              rows={3}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes wave {
          from { height: 8px; }
          to { height: 28px; }
        }
      `}</style>
    </div>
  );
}
