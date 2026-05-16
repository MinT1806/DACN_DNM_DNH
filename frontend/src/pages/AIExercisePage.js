import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { aiExerciseAPI } from '../api/aiExerciseApi';
import ResultDisplay from '../components/exercises/ResultDisplay';

const SKILL_COLORS = {
  READING: '#8B5CF6',
  LISTENING: '#3B82F6',
  WRITING: '#F59E0B',
  SPEAKING: '#22C55E',
};

const SKILL_LABELS = {
  READING: 'Đọc hiểu',
  LISTENING: 'Nghe hiểu',
  WRITING: 'Viết bài',
  SPEAKING: 'Nói tiếng Anh',
};

// ─── Reading Exercise ────────────────────────────────────────────────────────────
function ReadingExercise({ exercise, answers, onAnswer, onAIGrade, gradingResults }) {
  const passage = exercise.content;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Passage */}
      <div className="clay-card" style={{ padding: 24, background: '#faf5ff', border: '2px solid #8b5cf633' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: '1.2rem' }}>📖</span>
          <h3 style={{ fontWeight: 800, color: '#8b5cf6', margin: 0, fontSize: '0.95rem' }}>
            Đoạn văn đọc hiểu
          </h3>
        </div>
        <p style={{
          fontSize: '0.95rem', color: '#1a202c', lineHeight: 1.9,
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          background: '#fff', padding: 16, borderRadius: 10,
          border: '1px solid #e2e8f0',
        }}>
          {passage}
        </p>
      </div>

      {/* Questions */}
      {exercise.questions?.map((q, idx) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={idx}
          answers={answers}
          onAnswer={onAnswer}
          gradingResults={gradingResults}
        />
      ))}
    </div>
  );
}

// ─── Listening Exercise ─────────────────────────────────────────────────────────
function ListeningExercise({ exercise, answers, onAnswer, onAIGrade, gradingResults }) {
  const script = exercise.content;
  const [listenCount, setListenCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef(null);

  const handlePlay = () => {
    if (playing) return;
    setPlaying(true);
    setListenCount((c) => c + 1);

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utteranceRef.current = utterance;

    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Audio Player Simulation */}
      <div className="clay-card" style={{ padding: 24, background: '#eff6ff', border: '2px solid #3b82f633' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: '1.2rem' }}>🎧</span>
          <h3 style={{ fontWeight: 800, color: '#3b82f6', margin: 0, fontSize: '0.95rem' }}>
            Nghe đoạn hội thoại
          </h3>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: 20, borderRadius: 14,
          background: playing ? '#dbeafe' : '#fff',
          border: `2px solid ${playing ? '#3b82f6' : '#e2e8f0'}`,
          transition: 'all 0.3s',
        }}>
          <button
            onClick={playing ? handleStop : handlePlay}
            disabled={listenCount >= 2 && !playing}
            className="clay-btn"
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: playing ? '#ef444422' : '#3b82f622',
              color: playing ? '#ef4444' : '#3b82f6',
              border: `2px solid ${playing ? '#ef444433' : '#3b82f633'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {playing ? (
              <span style={{ fontSize: '1.2rem' }}>⏹</span>
            ) : (
              <span style={{ fontSize: '1.4rem' }}>▶</span>
            )}
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.9rem', marginBottom: 4 }}>
              {playing ? 'Đang phát...' : 'Bấm để nghe'}
            </div>
            {playing && (
              <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{
                    width: 3, height: 8 + Math.random() * 12,
                    background: '#3b82f6', borderRadius: 2,
                    animation: 'wave 0.4s ease-in-out infinite alternate',
                  }} />
                ))}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '0.78rem', fontWeight: 700, color: listenCount >= 2 ? '#ef4444' : '#718096',
            }}>
              {listenCount >= 2 ? 'Đã hết lượt' : `${listenCount}/2 lượt`}
            </div>
          </div>
        </div>

        {/* Script transcript (for reference - hidden by default) */}
        <details style={{ marginTop: 12 }}>
          <summary style={{
            fontSize: '0.8rem', color: '#718096', cursor: 'pointer', fontWeight: 600,
          }}>
            📄 Xem script
          </summary>
          <div style={{
            marginTop: 8, padding: 12, borderRadius: 10,
            background: '#fff', fontSize: '0.85rem', color: '#4a5568',
            lineHeight: 1.7, fontStyle: 'italic', border: '1px solid #e2e8f0',
          }}>
            {script}
          </div>
        </details>
      </div>

      {/* Questions */}
      {exercise.questions?.map((q, idx) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={idx}
          answers={answers}
          onAnswer={onAnswer}
          gradingResults={gradingResults}
        />
      ))}

      <style>{`
        @keyframes wave {
          from { height: 6px; }
          to { height: 20px; }
        }
      `}</style>
    </div>
  );
}

// ─── Writing Exercise ───────────────────────────────────────────────────────────
function WritingExercise({ exercise, answers, onAnswer, onAIGrade, gradingResults }) {
  const [localAnswers, setLocalAnswers] = useState(answers);
  const q = exercise.questions?.[0];

  const handleChange = (qId, value) => {
    setLocalAnswers((prev) => ({ ...prev, [`q_${qId}`]: value }));
    onAnswer(qId, value);
  };

  const handleGrade = async (qId, value) => {
    if (!value?.trim() || value.trim().split(/\s+/).filter(w => w).length < 50) {
      alert('Bài viết cần ít nhất 50 từ để được chấm điểm.');
      return;
    }
    await onAIGrade(qId, value);
  };

  const wordCount = q
    ? (localAnswers[`q_${q.id}`] || '').trim().split(/\s+/).filter((w) => w).length
    : 0;
  const minWords = 100;
  const grading = gradingResults?.[q?.id];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Writing Prompt */}
      <div className="clay-card" style={{ padding: 24, background: '#fffbeb', border: '2px solid #f59e0b33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: '1.2rem' }}>✍️</span>
          <h3 style={{ fontWeight: 800, color: '#f59e0b', margin: 0, fontSize: '0.95rem' }}>
            Đề bài viết
          </h3>
        </div>
        <div style={{
          fontSize: '0.95rem', color: '#1a202c', lineHeight: 1.7,
          fontWeight: 600, background: '#fff', padding: 14, borderRadius: 10,
          border: '1px solid #fcd34d',
        }}>
          {q?.question}
        </div>
        {q?.explanation && (
          <div style={{
            marginTop: 10, fontSize: '0.82rem', color: '#92400e',
            background: '#fef3c7', padding: '8px 12px', borderRadius: 8,
            border: '1px solid #fcd34d',
          }}>
            💡 Yêu cầu: {q.explanation}
          </div>
        )}
      </div>

      {/* Writing Area */}
      <div className="clay-card" style={{ padding: 24 }}>
        <div style={{
          padding: '8px 12px', borderRadius: '10px 10px 0 0',
          background: '#fef3c7', border: '1px solid #fcd34d',
          borderBottom: 'none',
          fontSize: '0.82rem', color: '#92400e', fontWeight: 500,
        }}>
          📝 Viết ít nhất <strong>{minWords} từ</strong>. Bài viết sẽ được AI đánh giá chi tiết.
        </div>
        <textarea
          value={localAnswers[`q_${q?.id}`] || ''}
          onChange={(e) => handleChange(q?.id, e.target.value)}
          placeholder={`Viết bài luận của bạn ở đây...\n\nGợi ý:\n- Mở bài: Giới thiệu chủ đề\n- Thân bài: Trình bày ý kiến với các luận điểm\n- Kết bài: Tóm tắt và kết luận`}
          style={{
            width: '100%', minHeight: 280, padding: 16,
            fontSize: '0.95rem', borderRadius: '0 0 12px 12px',
            border: `2px solid ${wordCount >= minWords ? '#22C55E33' : '#e2e8f0'}`,
            borderTop: 'none',
            resize: 'vertical', fontFamily: 'inherit', outline: 'none',
            lineHeight: 1.8, transition: 'border-color 0.2s',
            background: '#fff',
          }}
          rows={12}
        />

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 12, flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{
            fontSize: '0.82rem', color: wordCount >= minWords ? '#22C55E' : '#ef4444',
            fontWeight: 600,
          }}>
            {wordCount} / {minWords} từ {wordCount >= minWords ? '✓' : '(tối thiểu)'}
          </span>
          <button
            onClick={() => handleGrade(q?.id, localAnswers[`q_${q?.id}`])}
            disabled={wordCount < 50}
            className="clay-btn"
            style={{
              opacity: wordCount < 50 ? 0.5 : 1,
              padding: '6px 16px', fontSize: '0.82rem',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Sparkles size={14} />
            Phân tích AI
          </button>
        </div>

        {/* Real-time AI Result */}
        {grading && (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 12,
            background: grading.score >= 7 ? '#22C55E11' : grading.score >= 5 ? '#f59e0b11' : '#ef444411',
            border: `2px solid ${grading.score >= 7 ? '#22C55E33' : grading.score >= 5 ? '#f59e0b33' : '#ef444433'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: '1.5rem', fontWeight: 900,
                color: grading.score >= 7 ? '#22C55E' : grading.score >= 5 ? '#f59e0B' : '#ef4444',
              }}>
                {grading.score?.toFixed(1)}/10
              </span>
              <span style={{ color: '#718096', fontSize: '0.82rem' }}>AI đánh giá</span>
            </div>
            {grading.feedback && (
              <p style={{ color: '#4a5568', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 8 }}>
                {grading.feedback}
              </p>
            )}
            {grading.details?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {grading.details.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '4px 10px', borderRadius: 8, background: '#fff',
                  }}>
                    <span style={{ fontWeight: 600, color: '#4a5568', fontSize: '0.82rem' }}>
                      {d.criterion}
                    </span>
                    <span style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.85rem' }}>
                      {d.score}/10
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Speaking Exercise ─────────────────────────────────────────────────────────
function SpeakingExercise({ exercise, answers, onAnswer, onAIGrade, gradingResults }) {
  const questions = exercise.questions || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcripts, setTranscripts] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioUrls, setAudioUrls] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [localAnswers, setLocalAnswers] = useState(answers);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const currentQ = questions[currentIdx];
  const currentTranscript = transcripts[currentQ?.id] || '';
  const grading = gradingResults?.[currentQ?.id];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrls((prev) => ({ ...prev, [currentQ.id]: url }));

        // Attempt speech recognition
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalText = '';
        recognition.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalText += event.results[i][0].transcript;
            }
          }
        };
        recognition.onend = () => {
          if (finalText) {
            setTranscripts((prev) => ({ ...prev, [currentQ.id]: finalText }));
            setLocalAnswers((prev) => ({ ...prev, [`q_${currentQ.id}`]: finalText }));
            onAnswer(currentQ.id, finalText);
          }
          setIsProcessing(false);
        };

        try { recognition.start(); } catch {}
        setTimeout(() => { try { recognition.stop(); } catch {} }, 3000);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setIsProcessing(true);
    } catch (err) {
      alert('Không thể truy cập microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setRecording(false);
  };

  const handleGrade = async () => {
    const text = transcripts[currentQ?.id] || localAnswers[`q_${currentQ?.id}`];
    if (!text?.trim()) {
      alert('Vui lòng ghi âm trước khi chấm điểm.');
      return;
    }
    await onAIGrade(currentQ.id, text);
  };

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Question Navigation */}
      {questions.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className="clay-btn"
              style={{
                padding: '4px 12px', fontSize: '0.8rem',
                background: i === currentIdx ? '#22C55E22' : '#f3f4f6',
                color: i === currentIdx ? '#22C55E' : '#718096',
                border: i === currentIdx ? '2px solid #22C55E' : '2px solid transparent',
              }}
            >
              Câu {i + 1}
              {transcripts[q.id] && ' ✓'}
            </button>
          ))}
        </div>
      )}

      {/* Current Question */}
      <div className="clay-card" style={{ padding: 24, background: '#f0fdf4', border: '2px solid #22C55E33' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: '1.2rem' }}>🎤</span>
          <h3 style={{ fontWeight: 800, color: '#22C55E', margin: 0, fontSize: '0.95rem' }}>
            Câu hỏi {currentIdx + 1}/{questions.length}
          </h3>
        </div>
        <div style={{
          fontSize: '1rem', color: '#1a202c', fontWeight: 600,
          lineHeight: 1.7, background: '#fff', padding: 14, borderRadius: 10,
          border: '1px solid #bbf7d0',
        }}>
          {currentQ?.question}
        </div>
      </div>

      {/* Recording Controls */}
      <div className="clay-card" style={{ padding: 24, textAlign: 'center' }}>
        {recording && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                width: 5, height: 10 + Math.random() * 20,
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
            width: 72, height: 72, borderRadius: '50%',
            background: recording ? '#ef444422' : '#22C55E22',
            color: recording ? '#ef4444' : '#22C55E',
            border: `3px solid ${recording ? '#ef444433' : '#22C55E33'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '2rem', cursor: 'pointer',
          }}
        >
          {recording ? '⏹' : '🎤'}
        </button>

        <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600, marginBottom: 16 }}>
          {recording ? 'Đang ghi âm... Nhấn để dừng' : 'Nhấn để bắt đầu ghi âm'}
        </div>

        {/* Playback */}
        {audioUrls[currentQ?.id] && (
          <div style={{ marginBottom: 12 }}>
            <audio src={audioUrls[currentQ?.id]} controls style={{ height: 36, width: '100%' }} />
          </div>
        )}

        {/* Transcript */}
        {currentTranscript && (
          <div style={{
            padding: 12, borderRadius: 10, background: '#f0fdf4',
            border: '1px solid #bbf7d0', textAlign: 'left', marginBottom: 12,
          }}>
            <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.82rem', marginBottom: 4 }}>
              📝 Bản ghi:
            </div>
            <div style={{ color: '#4a5568', fontSize: '0.88rem', fontStyle: 'italic' }}>
              "{currentTranscript}"
            </div>
          </div>
        )}

        {/* Grade Button */}
        {currentTranscript && (
          <button
            onClick={handleGrade}
            className="clay-btn clay-btn-primary"
            style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={15} />
            Chấm điểm AI
          </button>
        )}

        {/* AI Result */}
        {grading && (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 12,
            background: grading.score >= 7 ? '#22C55E11' : grading.score >= 5 ? '#f59e0b11' : '#ef444411',
            border: `2px solid ${grading.score >= 7 ? '#22C55E33' : grading.score >= 5 ? '#f59e0b33' : '#ef444433'}`,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: '1.5rem', fontWeight: 900,
                color: grading.score >= 7 ? '#22C55E' : grading.score >= 5 ? '#f59e0B' : '#ef4444',
              }}>
                {grading.score?.toFixed(1)}/10
              </span>
              <span style={{ color: '#718096', fontSize: '0.82rem' }}>AI đánh giá</span>
            </div>
            {grading.feedback && (
              <p style={{ color: '#4a5568', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 8 }}>
                {grading.feedback}
              </p>
            )}
            {grading.details?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {grading.details.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '4px 10px',
                    borderRadius: 8, background: '#fff',
                  }}>
                    <span style={{ fontWeight: 600, color: '#4a5568', fontSize: '0.82rem' }}>{d.criterion}</span>
                    <span style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.85rem' }}>{d.score}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {questions.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="clay-btn"
            style={{ opacity: currentIdx === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <ArrowLeft size={16} /> Câu trước
          </button>
          <button
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
            disabled={currentIdx === questions.length - 1}
            className="clay-btn"
            style={{ opacity: currentIdx === questions.length - 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Câu sau <ArrowRight size={16} />
          </button>
        </div>
      )}

      <style>{`@keyframes wave { from { height: 6px; } to { height: 20px; } }`}</style>
    </div>
  );
}

// ─── Shared Question Card (for Reading & Listening MCQ) ────────────────────────
function QuestionCard({ question, index, answers, onAnswer, gradingResults }) {
  const [selected, setSelected] = useState(answers?.[`q_${question.id}`] || null);
  const grading = gradingResults?.[question.id];

  let options = [];
  if (question.options) {
    try {
      options = Array.isArray(question.options)
        ? question.options
        : JSON.parse(question.options);
    } catch {
      options = [];
    }
  }

  const handleSelect = (opt) => {
    setSelected(opt);
    onAnswer(question.id, opt);
  };

  const isCorrect = grading?.correct;
  const showResult = grading !== undefined;

  return (
    <div className="clay-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{
          background: '#22C55E22', color: '#22C55E',
          padding: '3px 10px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 800,
        }}>
          Câu {index + 1}
        </span>
        {question.points > 1 && (
          <span style={{
            background: '#f59e0b22', color: '#f59e0b',
            padding: '3px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
          }}>
            {question.points} điểm
          </span>
        )}
      </div>

      <div style={{ fontSize: '0.95rem', color: '#1a202c', fontWeight: 600, lineHeight: 1.6, marginBottom: 16 }}>
        {question.question}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((opt, i) => {
          const isSelected = selected === opt;
          const letter = String.fromCharCode(65 + i);

          let bg = 'transparent';
          let border = '2px solid rgba(0,0,0,0.08)';
          let color = '#4a5568';
          let fontWeight = 600;

          if (showResult) {
            if (opt === question.correctAnswer) {
              bg = '#22C55E11';
              border = '2px solid #22C55E';
              color = '#166534';
              fontWeight = 700;
            } else if (isSelected && opt !== question.correctAnswer) {
              bg = '#ef444411';
              border = '2px solid #ef4444';
              color = '#991b1b';
            }
          } else if (isSelected) {
            bg = 'rgba(34,197,94,0.06)';
            border = '2px solid #22C55E';
            color = '#166534';
          }

          return (
            <div
              key={i}
              onClick={() => !showResult && handleSelect(opt)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                cursor: showResult ? 'default' : 'pointer',
                border, background: bg,
                fontWeight, color,
                transition: 'all 0.2s',
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: '50%',
                background: showResult
                  ? (opt === question.correctAnswer ? '#22C55E' : isSelected ? '#ef4444' : '#e2e8f0')
                  : (isSelected ? '#22C55E' : 'rgba(0,0,0,0.08)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: (showResult && (opt === question.correctAnswer || isSelected)) || isSelected ? 'white' : '#718096',
                fontSize: '0.78rem', fontWeight: 800, flexShrink: 0,
              }}>
                {showResult ? (
                  opt === question.correctAnswer ? '✓' : isSelected ? '✗' : letter
                ) : letter}
              </span>
              {opt}
            </div>
          );
        })}
      </div>

      {/* AI Feedback */}
      {showResult && grading?.aiFeedback && (
        <div style={{
          marginTop: 12, padding: 10, borderRadius: 10,
          background: '#8b5cf611', border: '1px solid #8b5cf633',
          fontSize: '0.82rem', color: '#6b21a8',
        }}>
          💬 {grading.aiFeedback}
        </div>
      )}
    </div>
  );
}

// ─── Main AIExercisePage ───────────────────────────────────────────────────────
export default function AIExercisePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exerciseId = searchParams.get('exerciseId');
  const skill = searchParams.get('skill') || 'READING';
  const topic = searchParams.get('topic') || '';
  const level = searchParams.get('level') || 'A1';

  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [gradingResults, setGradingResults] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    loadExercise();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [exerciseId]);

  useEffect(() => {
    if (!exercise?.duration || submitted) return;
    if (timeLeft === null) setTimeLeft(exercise.duration * 60);
  }, [exercise]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted]);

  useEffect(() => {
    if (!exercise?.questions) return;
    const count = Object.values(answers).filter((v) => v && v.trim() && v !== '{}').length;
    setAnsweredCount(count);
  }, [answers, exercise]);

  const loadExercise = async () => {
    setLoading(true);
    try {
      const res = await aiExerciseAPI.generateExercise({ skill, topic, level });
      if (res.data?.success && res.data?.data) {
        const ex = res.data.data;
        setExercise(ex);
        const init = {};
        (ex.questions || []).forEach((q) => { init[`q_${q.id}`] = ''; });
        setAnswers(init);
      }
    } catch (err) {
      console.error('Failed to load exercise:', err);
    }
    setLoading(false);
  };

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [`q_${questionId}`]: value }));
  };

  const handleAIGrade = async (questionId, answerText) => {
    try {
      const res = await aiExerciseAPI.gradeSingle({
        exerciseId: exercise.id,
        questionId,
        answer: answerText,
      });
      if (res.data?.success && res.data?.data) {
        setGradingResults((prev) => ({
          ...prev,
          [questionId]: res.data.data,
        }));
      }
    } catch (err) {
      console.error('AI grading failed:', err);
    }
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await aiExerciseAPI.submitExercise({
        exerciseId: exercise.id,
        answers,
      });
      if (res.data?.success && res.data?.data) {
        setResult(res.data.data.grading);
        setSubmitted(true);

        // Populate grading results for MCQ display
        const qrMap = {};
        (res.data.data.grading?.questionResults || []).forEach((qr) => {
          qrMap[qr.questionId] = qr;
        });
        setGradingResults(qrMap);
      }
    } catch (err) {
      console.error('Submit failed:', err);
      alert('Không thể nộp bài. Vui lòng thử lại.');
    }
    setSubmitting(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '4px solid #e2e8f0',
            borderTopColor: SKILL_COLORS[skill] || '#8b5cf6',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#718096', fontWeight: 600 }}>Đang tải bài tập...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, textAlign: 'center' }}>
        <div className="clay-card" style={{ padding: 40 }}>
          <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: 16 }}>
            Không tìm thấy bài tập
          </p>
          <button className="clay-btn clay-btn-primary" onClick={() => navigate('/ai-exercises')}>
            ← Quay lại chọn bài
          </button>
        </div>
      </div>
    );
  }

  // Result View
  if (submitted && result) {
    return (
      <ResultDisplay
        result={result}
        skill={skill}
        topic={topic}
        level={level}
        onBack={() => navigate('/ai-exercises')}
        onRetry={() => {
          setSubmitted(false);
          setResult(null);
          setAnswers({});
          setGradingResults({});
          loadExercise();
        }}
      />
    );
  }

  const questions = exercise.questions || [];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => navigate('/ai-exercises')}
          className="clay-btn"
          style={{ fontSize: '0.82rem', padding: '6px 12px' }}
        >
          ← Quay lại
        </button>
      </div>

      <div className="clay-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1a202c' }}>
              {exercise.title || `Bài ${SKILL_LABELS[skill] || skill}`}
            </h1>
            <p style={{ color: '#718096', fontSize: '0.82rem', fontWeight: 500 }}>
              {SKILL_LABELS[skill]} • Cấp {level} • {exercise.duration || 15} phút
              {topic && ` • ${topic}`}
            </p>
          </div>
          {timeLeft != null && (
            <div style={{
              padding: '8px 16px', borderRadius: 10,
              background: timeLeft < 60 ? '#ef444422' : '#f59e0b22',
              color: timeLeft < 60 ? '#ef4444' : '#f59e0b',
              fontWeight: 900, fontSize: '1.1rem',
            }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.06)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
              height: '100%',
              background: SKILL_COLORS[skill] || '#22C55E',
              borderRadius: 6, transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>
            {answeredCount}/{questions.length} đã trả lời
          </span>
        </div>
      </div>

      {/* Exercise Content */}
      {skill === 'READING' && (
        <ReadingExercise
          exercise={exercise}
          answers={answers}
          onAnswer={handleAnswer}
          onAIGrade={handleAIGrade}
          gradingResults={gradingResults}
        />
      )}
      {skill === 'LISTENING' && (
        <ListeningExercise
          exercise={exercise}
          answers={answers}
          onAnswer={handleAnswer}
          onAIGrade={handleAIGrade}
          gradingResults={gradingResults}
        />
      )}
      {skill === 'WRITING' && (
        <WritingExercise
          exercise={exercise}
          answers={answers}
          onAnswer={handleAnswer}
          onAIGrade={handleAIGrade}
          gradingResults={gradingResults}
        />
      )}
      {skill === 'SPEAKING' && (
        <SpeakingExercise
          exercise={exercise}
          answers={answers}
          onAnswer={handleAnswer}
          onAIGrade={handleAIGrade}
          gradingResults={gradingResults}
        />
      )}

      {/* Submit */}
      <div style={{ textAlign: 'center', marginTop: 28, marginBottom: 40 }}>
        <button
          className="clay-btn clay-btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ padding: '14px 40px', fontSize: '1rem' }}
        >
          {submitting ? (
            <>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white', animation: 'spin 0.8s linear infinite',
                display: 'inline-block', marginRight: 8,
              }} />
              Đang nộp bài...
            </>
          ) : '✓ Nộp bài'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
