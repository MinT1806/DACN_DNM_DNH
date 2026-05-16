import { useState, useCallback, useRef, useEffect } from 'react';
import { testFlowAPI, lessonFlowAPI } from '../api/api';

export const useTest = (lessonId) => {
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [grading, setGrading] = useState({});
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const loadTest = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await lessonFlowAPI.getTest(Number(lessonId));
      if (res.data.success && res.data.data.hasTest) {
        const data = res.data.data;
        setTest(data);
        setQuestions(data.questions || []);
      } else {
        setTest(null);
        setQuestions([]);
      }
    } catch (err) {
      setError('Failed to load test');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const startTest = useCallback(async () => {
    if (!test) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await testFlowAPI.start(test.id, lessonId ? Number(lessonId) : null);
      if (res.data.success) {
        const sessionData = res.data.data;
        setSession(sessionData);
        setAnswers({});
        setResult(null);
        startTimeRef.current = Date.now();
        setTimeLeft(sessionData.durationSeconds);
        return sessionData;
      } else {
        setError(res.data.message || 'Failed to start test');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
    return null;
  }, [test, lessonId]);

  const submitTest = useCallback(async () => {
    if (!test || !session) return null;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const timeSpent = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    try {
      const res = await testFlowAPI.submit(test.id, {
        sessionId: session.sessionId,
        answers,
        timeSpentSeconds: timeSpent,
      });
      if (res.data.success) {
        setResult(res.data.data);
        return res.data.data;
      } else {
        setError(res.data.message || 'Failed to submit');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setSubmitting(false);
    }
    return null;
  }, [test, session, answers]);

  const setAnswer = useCallback((questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [`q_${questionId}`]: value,
    }));
  }, []);

  const gradeSingleQuestion = useCallback(async (questionId, answer, audioTranscript = null) => {
    if (!test) return null;
    setGrading(prev => ({ ...prev, [questionId]: true }));
    try {
      const res = await testFlowAPI.submit(test.id, {
        sessionId: session?.sessionId,
        answers: { [`q_${questionId}`]: answer },
        timeSpentSeconds: 0,
      });
      setGrading(prev => ({ ...prev, [questionId]: false }));
      if (res.data.success) {
        return res.data.data;
      }
    } catch (err) {
      console.error('Failed to grade:', err);
    }
    setGrading(prev => ({ ...prev, [questionId]: false }));
    return null;
  }, [test, session]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft !== null && timeLeft > 0]);

  const reset = useCallback(() => {
    setSession(null);
    setAnswers({});
    setResult(null);
    setTimeLeft(null);
    setError(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return {
    test,
    questions,
    session,
    answers,
    submitting,
    result,
    loading,
    error,
    timeLeft,
    grading,
    loadTest,
    startTest,
    submitTest,
    setAnswer,
    gradeSingleQuestion,
    reset,
  };
};
