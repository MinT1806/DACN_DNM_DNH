import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const SpeakingRecorder = ({
  question = '',
  instructions = '',
  value = null,
  onChange = () => {},
  onSave = () => {},
  maxDuration = 120,
  minDuration = 10,
  disabled = false,
  showFeedback = false,
  feedback = null,
  gradingInProgress = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (value?.audioUrl) {
      setAudioUrl(value.audioUrl);
      setRecordedBlob(null);
    }
    if (value?.blob) {
      setRecordedBlob(value.blob);
      setAudioUrl(URL.createObjectURL(value.blob));
    }
  }, [value]);

  useEffect(() => {
    const MediaRecorder = window.MediaRecorder || window.webkitMediaRecorder;
    if (!MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setError('Trình duyệt không hỗ trợ ghi âm');
    }
  }, []);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio();
      audio.src = audioUrl;
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        setPlaybackTime(audio.currentTime);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      });
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setPermissionDenied(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const MediaRecorder = window.MediaRecorder || window.webkitMediaRecorder;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm'
        });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setAudioUrl(url);

        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.addEventListener('loadedmetadata', () => {
            setDuration(audioRef.current.duration);
          });
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Vui lòng cho phép truy cập microphone');
      } else {
        setError('Không thể truy cập microphone. Vui lòng kiểm tra cài đặt.');
      }
    }
  }, [maxDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      setIsPaused(false);
    }
  }, [maxDuration, stopRecording]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleDelete = useCallback(() => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setRecordedBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setPlaybackTime(0);
    setDuration(0);
    setError(null);
    onChange(null);
  }, [audioUrl, onChange]);

  const handleSave = useCallback(async () => {
    if (!recordedBlob && !audioUrl) {
      setError('Chưa có bản ghi âm');
      return;
    }

    setUploading(true);
    try {
      const result = await onSave(recordedBlob, audioUrl);
      setUploading(false);
      return result;
    } catch (err) {
      setError('Lỗi khi lưu bản ghi');
      setUploading(false);
      return null;
    }
  }, [recordedBlob, audioUrl, onSave]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getDurationColor = () => {
    if (recordingTime < minDuration) return '#ef4444';
    if (recordingTime > maxDuration * 0.9) return '#f59e0b';
    return '#22C55E';
  };

  if (!isSupported) {
    return (
      <div style={{
        padding: 20,
        borderRadius: 12,
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        textAlign: 'center',
      }}>
        <AlertCircle size={24} color="#ef4444" style={{ marginBottom: 8 }} />
        <p style={{ color: '#ef4444', fontWeight: 600 }}>Trình duyệt không hỗ trợ ghi âm</p>
        <p style={{ color: '#718096', fontSize: '0.85rem', marginTop: 8 }}>
          Vui lòng sử dụng Chrome, Firefox, hoặc Edge để ghi âm
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {instructions && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.15)',
          fontSize: '0.85rem',
          color: '#4a5568',
          fontWeight: 500,
          lineHeight: 1.6,
        }}>
          <strong style={{ color: '#f59e0b' }}>Hướng dẫn:</strong> {instructions}
        </div>
      )}

      <div className="clay-card" style={{ padding: 20 }}>
        {permissionDenied && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'rgba(239,68,68,0.1)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.85rem',
            color: '#ef4444',
            fontWeight: 600,
          }}>
            <AlertCircle size={16} />
            Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt
            <button
              onClick={startRecording}
              className="clay-btn"
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
            >
              <RefreshCw size={12} style={{ marginRight: 4 }} />
              Thử lại
            </button>
          </div>
        )}

        {error && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'rgba(239,68,68,0.1)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.85rem',
            color: '#ef4444',
            fontWeight: 600,
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: isRecording
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : audioUrl
              ? 'linear-gradient(135deg, #22C55E, #16a34a)'
              : 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: isRecording
              ? '0 0 0 8px rgba(239,68,68,0.2), 0 8px 24px rgba(239,68,68,0.3)'
              : '0 8px 24px rgba(0,0,0,0.15)',
            transition: 'all 0.3s',
            animation: isRecording ? 'pulse-record 1.5s ease-in-out infinite' : 'none',
          }}>
            {isRecording ? (
              <Square size={36} color="white" fill="white" />
            ) : audioUrl ? (
              <CheckCircle size={36} color="white" />
            ) : (
              <Mic size={36} color="white" />
            )}
          </div>

          <div style={{
            fontSize: '2rem',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: isRecording ? '#ef4444' : '#1a202c',
            marginBottom: 8,
          }}>
            {isRecording ? formatTime(recordingTime) : audioUrl ? formatTime(playbackTime) + ' / ' + formatTime(duration) : '00:00'}
          </div>

          <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600 }}>
            {isRecording
              ? 'Đang ghi âm...'
              : audioUrl
              ? 'Bản ghi hoàn thành'
              : 'Nhấn nút để bắt đầu ghi âm'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              disabled={disabled || permissionDenied}
              className="clay-btn clay-btn-primary"
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Mic size={24} />
            </button>
          )}

          {isRecording && (
            <>
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="clay-btn"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isPaused ? <Play size={24} /> : <Pause size={24} />}
              </button>
              <button
                onClick={stopRecording}
                className="clay-btn clay-btn-primary"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                }}
              >
                <Square size={24} color="white" fill="white" />
              </button>
            </>
          )}

          {audioUrl && !isRecording && (
            <>
              <button
                onClick={togglePlayback}
                className="clay-btn clay-btn-primary"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button
                onClick={handleDelete}
                disabled={disabled}
                className="clay-btn"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(239,68,68,0.1)',
                }}
              >
                <Trash2 size={20} color="#ef4444" />
              </button>
              <button
                onClick={startRecording}
                disabled={disabled}
                className="clay-btn"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RefreshCw size={20} />
              </button>
            </>
          )}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          fontSize: '0.8rem',
          color: '#718096',
          fontWeight: 600,
        }}>
          <span style={{ color: recordingTime < minDuration ? '#ef4444' : '#22C55E' }}>
            Tối thiểu: {minDuration}s
          </span>
          <span style={{ color: recordingTime > maxDuration ? '#ef4444' : '#718096' }}>
            Tối đa: {maxDuration}s
          </span>
          <span style={{ color: getDurationColor() }}>
            {recordingTime}s
          </span>
        </div>

        {uploading && (
          <div style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: '#718096',
            fontWeight: 600,
          }}>
            <div style={{
              width: 16,
              height: 16,
              border: '2px solid #718096',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            Đang tải lên...
          </div>
        )}
      </div>

      {showFeedback && feedback && (
        <div style={{
          padding: 16,
          borderRadius: 12,
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)',
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

          {feedback.languageLevel && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(139,92,246,0.1)',
              color: '#8b5cf6',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}>
              Cấp độ: {feedback.languageLevel}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse-record {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SpeakingRecorder;
