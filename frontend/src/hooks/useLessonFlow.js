import { useState, useCallback, useEffect } from 'react';
import { lessonFlowAPI, progressAPI } from '../api/api';

export const useLessonFlow = (lessonId) => {
  const [lesson, setLesson] = useState(null);
  const [content, setContent] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [test, setTest] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectionLoading, setSectionLoading] = useState(false);

  const loadLesson = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await lessonFlowAPI.getLessonFlow(Number(lessonId));
      if (res.data.success) {
        const data = res.data.data;
        setLesson(data);
        setContent(data.contentDetails);
        setExercises(data.exercises || []);
        setTest(data.test || null);
        setProgress(data.progress || null);
      } else {
        setError(res.data.message || 'Failed to load lesson');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  const loadContent = useCallback(async () => {
    if (!lessonId) return;
    setSectionLoading(true);
    try {
      const res = await lessonFlowAPI.getContent(Number(lessonId));
      if (res.data.success) {
        setContent(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
    } finally {
      setSectionLoading(false);
    }
  }, [lessonId]);

  const loadExercises = useCallback(async () => {
    if (!lessonId) return;
    setSectionLoading(true);
    try {
      const res = await lessonFlowAPI.getExercises(Number(lessonId));
      if (res.data.success) {
        setExercises(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load exercises:', err);
    } finally {
      setSectionLoading(false);
    }
  }, [lessonId]);

  const loadTest = useCallback(async () => {
    if (!lessonId) return;
    setSectionLoading(true);
    try {
      const res = await lessonFlowAPI.getTest(Number(lessonId));
      if (res.data.success) {
        setTest(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load test:', err);
    } finally {
      setSectionLoading(false);
    }
  }, [lessonId]);

  const updateProgress = useCallback(async (section, score = 0, timeSpentSeconds = 0, completed = false) => {
    if (!lessonId) return;
    try {
      const res = await lessonFlowAPI.updateProgress(Number(lessonId), {
        section,
        score,
        timeSpentSeconds,
        completed,
      });
      if (res.data.success) {
        setProgress(res.data.data);
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  }, [lessonId]);

  const refreshProgress = useCallback(async () => {
    if (!lessonId) return;
    try {
      const res = await progressAPI.getLesson(Number(lessonId));
      if (res.data.success) {
        setProgress(res.data.data);
      }
    } catch (err) {
      console.error('Failed to refresh progress:', err);
    }
  }, [lessonId]);

  return {
    lesson,
    content,
    exercises,
    test,
    progress,
    loading,
    error,
    sectionLoading,
    loadLesson,
    loadContent,
    loadExercises,
    loadTest,
    updateProgress,
    refreshProgress,
  };
};
