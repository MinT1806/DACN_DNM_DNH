import { useState, useRef } from 'react';

const S = {
  container: { padding: '24px', maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', margin: 0 },
  prompt: { background: 'linear-gradient(135deg, #ec4899, #db2777)', borderRadius: 16, padding: 20, color: 'white', marginBottom: 16 },
  promptText: { fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.5, margin: 0 },
  recordBtn: { width: 80, height: 80, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #ec4899, #db2777)', color: 'white', fontSize: '2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px #ec489940', margin: '0 auto 16px', transition: 'transform 0.2s' },
  recordBtnActive: { transform: 'scale(0.95)', background: 'linear-gradient(135deg, #dc2626, #b91c1c)' },
  recordStatus: { textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: 12 },
  transcript: { background: '#f8fafc', borderRadius: 10, padding: 12, fontSize: '0.9rem', color: '#475569', marginTop: 8, border: '1px solid #e2e8f0', minHeight: 40 },
  btnGrade: { padding: '12px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ec4899, #db2777)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', marginTop: 16, display: 'block', width: '100%' },
  gradingBox: { marginTop: 20, padding: 20, borderRadius: 16, background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
  gradingHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  scoreCircle: { width: 80, height: 80, borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 },
  feedbackTitle: { fontWeight: 700, color: '#1a202c', marginBottom: 8 },
  feedbackText: { color: '#475569', lineHeight: 1.6, fontSize: '0.95rem' },
  detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 },
  detailCard: { padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' },
  detailLabel: { fontSize: '0.75rem', color: '#64748b', marginBottom: 2 },
  detailScore: { fontSize: '1.1rem', fontWeight: 700, color: '#1a202c' },
  detailComment: { fontSize: '0.8rem', color: '#64748b', marginTop: 2 },
  tipsBox: { marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' },
  listTitle: { fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, color: '#64748b' },
  listItem: { fontSize: '0.85rem', color: '#475569', marginLeft: 12 },
};

export default function Speaking({ question, answer, onAnswer, result, grading, onGrade }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(answer || '');
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      const mockTranscript = `You said: "${question.question}"`;
      setTranscript(mockTranscript);
      onAnswer(mockTranscript);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const aiScore = result?.aiScore;
  const aiFeedback = result?.aiFeedback;
  const aiDetails = result?.aiDetails || [];
  const tips = result?.pronunciationTips || [];
  const accuracy = result?.transcriptAccuracy;

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return '#64748b';
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={S.container}>
      <div style={S.header}>
        <span style={{ fontSize: '1.5rem' }}>🎙️</span>
        <h2 style={S.title}>Luyện nói</h2>
      </div>

      <div style={S.prompt}>
        <p style={S.promptText}>{question.question}</p>
        {question.content && (
          <p style={{ margin: '12px 0 0', fontSize: '0.9rem', opacity: 0.9 }}>{question.content}</p>
        )}
      </div>

      {permissionDenied ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#ef4444' }}>
          Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.
        </div>
      ) : (
        <>
          <button
            style={{ ...S.recordBtn, ...(isRecording ? S.recordBtnActive : {}) }}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={result !== null}
          >
            {isRecording ? '⬛' : '🎤'}
          </button>

          <div style={S.recordStatus}>
            {isRecording ? (
              <>⏺️ Đang ghi âm... {formatTime(recordingTime)}</>
            ) : transcript ? (
              <>✅ Đã ghi âm ({formatTime(recordingTime)})</>
            ) : (
              <>Nhấn để bắt đầu ghi âm</>
            )}
          </div>

          {transcript && (
            <div style={S.transcript}>
              <strong>Văn bản:</strong> {transcript}
            </div>
          )}

          {transcript && !result && (
            <button
              style={{ ...S.btnGrade, ...(grading ? { opacity: 0.5 } : {}) }}
              onClick={onGrade}
              disabled={grading}
            >
              {grading ? '🤖 Đang chấm bài...' : '🤖 Chấm bằng AI'}
            </button>
          )}
        </>
      )}

      {grading && (
        <div style={{ ...S.gradingBox, opacity: 0.7, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🤖</div>
          <div style={{ color: '#64748b' }}>AI đang phân tích giọng nói của bạn...</div>
        </div>
      )}

      {result && (
        <div style={S.gradingBox}>
          <div style={S.gradingHeader}>
            <div style={{ ...S.scoreCircle, background: `linear-gradient(135deg, #ec4899, #db2777)` }}>
              {aiScore != null ? aiScore.toFixed(1) : '?'}
            </div>
            <div>
              <div style={S.feedbackTitle}>Kết quả phát âm</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Thang điểm: 0 - 10</div>
            </div>
          </div>

          {aiFeedback && (
            <div style={{ marginBottom: 16 }}>
              <div style={S.feedbackTitle}>Nhận xét</div>
              <p style={S.feedbackText}>{aiFeedback}</p>
            </div>
          )}

          {accuracy && (
            <div style={{ marginBottom: 12, fontSize: '0.9rem', color: '#64748b' }}>
              <strong>Độ chính xác bản ghi:</strong> {accuracy}
            </div>
          )}

          {aiDetails.length > 0 && (
            <div style={S.detailsGrid}>
              {aiDetails.map((d, i) => (
                <div key={i} style={S.detailCard}>
                  <div style={S.detailLabel}>{d.criterion}</div>
                  <div style={S.detailScore}>{d.score}/10</div>
                  <div style={S.detailComment}>{d.comment}</div>
                </div>
              ))}
            </div>
          )}

          {tips.length > 0 && (
            <div style={S.tipsBox}>
              <div style={S.listTitle}>💡 Mẹo phát âm</div>
              {tips.map((t, i) => (
                <div key={i} style={S.listItem}>• {t}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
