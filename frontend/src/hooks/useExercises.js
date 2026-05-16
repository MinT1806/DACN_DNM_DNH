import { useState, useCallback } from 'react';
import { lessonFlowAPI, exerciseFlowAPI } from '../api/api';

export const useExercises = (lessonId) => {
  const [currentExercise, setCurrentExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [grading, setGrading] = useState({});
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const loadExercises = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    try {
      const res = await lessonFlowAPI.getExercises(Number(lessonId));
      if (res.data.success) {
        setExercises(res.data.data);
        if (res.data.data.length > 0) {
          loadExerciseDetail(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const loadExerciseDetail = useCallback(async (exerciseId) => {
    setLoading(true);
    setResult(null);
    setStartTime(Date.now());
    try {
      const res = await lessonFlowAPI.getExerciseDetail(Number(lessonId), exerciseId);
      if (res.data.success) {
        setCurrentExercise(res.data.data);
        setAnswers({});
        const idx = exercises.findIndex(e => e.id === exerciseId);
        if (idx >= 0) setCurrentIndex(idx);
      }
    } catch (err) {
      console.error('Failed to load exercise:', err);
    } finally {
      setLoading(false);
    }
  }, [lessonId, exercises]);

  const setAnswer = useCallback((questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [`q_${questionId}`]: value,
    }));
  }, []);

  const gradeSingleQuestion = useCallback(async (questionId, answer, audioTranscript = null) => {
    if (!currentExercise) return null;
    setGrading(prev => ({ ...prev, [questionId]: true }));
    try {
      const res = await exerciseFlowAPI.gradeSingle(currentExercise.id, {
        questionId,
        answer,
        audioTranscript,
      });
      if (res.data.success) {
        return res.data.data;
      }
    } catch (err) {
      console.error('Failed to grade:', err);
    } finally {
      setGrading(prev => ({ ...prev, [questionId]: false }));
    }
    return null;
  }, [currentExercise]);

  const submitExercise = useCallback(async () => {
    if (!currentExercise) return null;
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await exerciseFlowAPI.submit(currentExercise.id, answers, timeSpent);
      if (res.data.success) {
        setResult(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setSubmitting(false);
    }
    return null;
  }, [currentExercise, answers, startTime]);

  const goToExercise = useCallback((index) => {
    if (index >= 0 && index < exercises.length) {
      loadExerciseDetail(exercises[index].id);
    }
  }, [exercises, loadExerciseDetail]);

  const nextExercise = useCallback(() => {
    if (currentIndex < exercises.length - 1) {
      goToExercise(currentIndex + 1);
    }
  }, [currentIndex, exercises.length, goToExercise]);

  const prevExercise = useCallback(() => {
    if (currentIndex > 0) {
      goToExercise(currentIndex - 1);
    }
  }, [currentIndex, goToExercise]);

  return {
    exercises,
    currentExercise,
    currentIndex,
    answers,
    submitting,
    result,
    grading,
    loading,
    totalExercises: exercises.length,
    loadExercises,
    loadExerciseDetail,
    setAnswer,
    gradeSingleQuestion,
    submitExercise,
    goToExercise,
    nextExercise,
    prevExercise,
  };
};
