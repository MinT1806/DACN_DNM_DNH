import { useState, useEffect, useRef, useCallback } from 'react';
import { testManagementAPI } from '../api/api';
import { toast } from 'react-toastify';

export const useTestManagement = (testId) => {
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [audioAnswers, setAudioAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  const timerRef = useRef(null);
  const totalTimeRef = useRef(0);
  const sectionTimeRef = useRef(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);
  const [sectionTimeLeft, setSectionTimeLeft] = useState(0);
  const autoSaveTimerRef = useRef(null);

  const answersRef = useRef({});
  const sessionRef = useRef(null);
  const submittingRef = useRef(false);

  const startTest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await testManagementAPI.start(testId);
      const data = response.data;
      sessionRef.current = data;

      setSession(data);
      setTotalTimeLeft(data.remainingSeconds || data.totalDuration * 60);
      totalTimeRef.current = data.remainingSeconds || data.totalDuration * 60;

      if (data.sections && data.sections.length > 0) {
        setSections(data.sections);
        setCurrentSection(data.sections[0]);
        setQuestions(data.sections[0]?.questions || []);
        if (data.sections[0]?.durationMinutes) {
          setSectionTimeLeft(data.sections[0].durationMinutes * 60);
          sectionTimeRef.current = data.sections[0].durationMinutes * 60;
        }
      } else {
        setQuestions(data.questions || []);
        setSectionTimeLeft(0);
      }

      if (data.savedAnswers) {
        setAnswers(data.savedAnswers);
        answersRef.current = data.savedAnswers;
      }

      if (data.hasSections) {
        setCurrentSection(data.sections[0]);
      }

      startTimers(data);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start test');
      toast.error('Không thể bắt đầu bài kiểm tra');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  const resumeTest = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testManagementAPI.resume(sessionId);
      const data = response.data;
      sessionRef.current = data;

      setSession(data);
      setTotalTimeLeft(data.remainingSeconds || 0);
      totalTimeRef.current = data.remainingSeconds || 0;

      if (data.sections && data.sections.length > 0) {
        setSections(data.sections);
        setCurrentSection(data.sections[0]);
        setQuestions(data.sections[0]?.questions || []);
      } else {
        setQuestions(data.questions || []);
      }

      if (data.savedAnswers) {
        setAnswers(data.savedAnswers);
        answersRef.current = data.savedAnswers;
      }

      startTimers(data);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resume test');
      toast.error('Không thể khôi phục bài kiểm tra');
    } finally {
      setLoading(false);
    }
  }, []);

  const startTimers = useCallback((data) => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (data.timed && data.remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTotalTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });

        setSectionTimeLeft(prev => {
          if (prev <= 1) {
            handleSectionTimeout();
            return data.currentSection?.durationMinutes
              ? data.currentSection.durationMinutes * 60
              : prev;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setInterval(() => {
      handleAutoSave();
    }, 30000);
  }, []);

  const handleAutoSave = useCallback(async () => {
    if (!sessionRef.current?.sessionId || isLocked) return;
    try {
      await testManagementAPI.autoSave(sessionRef.current.sessionId, {
        answers: answersRef.current,
        audioAnswers: audioAnswersRef.current,
        timeSpentSeconds: totalTimeRef.current - totalTimeLeft,
        currentQuestionIndex: currentQuestionIndex,
      });
    } catch (err) {
      console.warn('Auto-save failed:', err);
    }
  }, [totalTimeLeft, currentQuestionIndex, isLocked]);

  const audioAnswersRef = useRef({});

  useEffect(() => {
    audioAnswersRef.current = audioAnswers;
  }, [audioAnswers]);

  const handleAutoSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    toast.warning('Hết giờ! Đang nộp bài...');
    clearInterval(timerRef.current);
    clearInterval(autoSaveTimerRef.current);

    try {
      const response = await testManagementAPI.submit(testId, {
        sessionId: sessionRef.current?.sessionId,
        answers: answersRef.current,
        audioAnswers: audioAnswersRef.current,
        timeSpentSeconds: totalTimeRef.current,
      });

      const resultData = response.data;
      setResult(resultData);
      setIsLocked(true);

      sessionStorage.setItem(`test_result_${resultData.resultId}`, JSON.stringify(resultData));
      window.location.href = `/exam-result/${resultData.resultId}`;

    } catch (err) {
      toast.error('Lỗi nộp bài tự động');
      submittingRef.current = false;
    }
  }, [testId]);

  const handleSectionTimeout = useCallback(() => {
    if (!currentSection) return;

    const currentIndex = sections.findIndex(s => s.id === currentSection.id);
    const nextSection = sections[currentIndex + 1];

    if (nextSection) {
      toast.info(`Hết giờ phần ${currentSection.title}. Chuyển sang phần tiếp theo...`);
      changeSection(nextSection);
    } else {
      handleAutoSubmit();
    }
  }, [currentSection, sections]);

  const changeSection = useCallback((section) => {
    setCurrentSection(section);
    setCurrentQuestionIndex(0);
    setQuestions(section.questions || []);
    setSectionTimeLeft(section.durationMinutes ? section.durationMinutes * 60 : 0);
    sectionTimeRef.current = section.durationMinutes ? section.durationMinutes * 60 : 0;

    sessionRef.current = {
      ...sessionRef.current,
      currentSection: section.type,
    };
  }, []);

  const nextSection = useCallback(() => {
    if (!currentSection) return;
    const currentIndex = sections.findIndex(s => s.id === currentSection.id);
    if (currentIndex < sections.length - 1) {
      changeSection(sections[currentIndex + 1]);
    }
  }, [currentSection, sections, changeSection]);

  const prevSection = useCallback(() => {
    if (!currentSection) return;
    const currentIndex = sections.findIndex(s => s.id === currentSection.id);
    if (currentIndex > 0) {
      changeSection(sections[currentIndex - 1]);
    }
  }, [currentSection, sections, changeSection]);

  const setAnswer = useCallback((questionKey, value) => {
    const newAnswers = { ...answersRef.current, [questionKey]: value };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
  }, []);

  const setAudioAnswer = useCallback((questionKey, audioBlob, audioUrl) => {
    const newAudioAnswers = { ...audioAnswersRef.current, [questionKey]: audioUrl };
    audioAnswersRef.current = newAudioAnswers;
    setAudioAnswers(newAudioAnswers);
  }, []);

  const submitTest = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    clearInterval(timerRef.current);
    clearInterval(autoSaveTimerRef.current);

    try {
      const response = await testManagementAPI.submit(testId, {
        sessionId: sessionRef.current?.sessionId,
        answers: answersRef.current,
        audioAnswers: audioAnswersRef.current,
        timeSpentSeconds: totalTimeRef.current - totalTimeLeft,
      });

      const resultData = response.data;
      setResult(resultData);
      setIsLocked(true);

      sessionStorage.setItem(`test_result_${resultData.resultId}`, JSON.stringify(resultData));

      return resultData;

    } catch (err) {
      toast.error('Lỗi nộp bài. Vui lòng thử lại.');
      submittingRef.current = false;
      setSubmitting(false);
      return null;
    }
  }, [testId, totalTimeLeft]);

  const gradeWriting = useCallback(async (question, userAnswer, maxScore = 10) => {
    try {
      const response = await testManagementAPI.gradeWriting({
        questionType: 'WRITING',
        question,
        userAnswer,
        maxScore,
      });
      return response.data;
    } catch (err) {
      toast.error('Lỗi chấm điểm viết');
      return null;
    }
  }, []);

  const gradeSpeaking = useCallback(async (question, userAnswer, maxScore = 10) => {
    try {
      const response = await testManagementAPI.gradeSpeaking({
        questionType: 'SPEAKING',
        question,
        userAnswer,
        maxScore,
      });
      return response.data;
    } catch (err) {
      toast.error('Lỗi chấm điểm nói');
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, []);

  const answeredCount = Object.values(answersRef.current).filter(v => v !== '' && v != null).length;
  const audioAnsweredCount = Object.keys(audioAnswersRef.current).length;

  return {
    session,
    questions,
    sections,
    currentSection,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    audioAnswers,
    loading,
    submitting,
    result,
    error,
    isLocked,
    totalTimeLeft,
    sectionTimeLeft,
    totalTime: session?.totalDuration * 60 || 0,
    answeredCount,
    audioAnsweredCount,
    totalQuestions: questions.length,
    hasSections: session?.hasSections || false,

    startTest,
    resumeTest,
    setAnswer,
    setAudioAnswer,
    changeSection,
    nextSection,
    prevSection,
    submitTest,
    gradeWriting,
    gradeSpeaking,
    handleAutoSubmit,
    handleAutoSave,
  };
};
