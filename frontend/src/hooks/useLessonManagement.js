import { useState, useCallback } from 'react';
import { lessonManagementAPI } from '../api/api';

export const useLessonManagement = (lessonId) => {
  const [lesson, setLesson] = useState(null);
  const [content, setContent] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [vocabulary, setVocabulary] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [miniTest, setMiniTest] = useState(null);
  const [completionSettings, setCompletionSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLesson = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const [lessonRes, contentRes, subtitleRes, vocabRes, exerciseRes, miniTestRes, settingsRes] = await Promise.all([
        lessonManagementAPI.getLesson(lessonId).catch(() => null),
        lessonManagementAPI.getContent(lessonId).catch(() => null),
        lessonManagementAPI.getSubtitles(lessonId).catch(() => []),
        lessonManagementAPI.getVocabulary(lessonId).catch(() => []),
        lessonManagementAPI.getExercises(lessonId).catch(() => []),
        lessonManagementAPI.getMiniTest(lessonId).catch(() => null),
        lessonManagementAPI.getCompletionSettings(lessonId).catch(() => null),
      ]);

      setLesson(lessonRes?.data?.data || lessonRes?.data || null);
      setContent(contentRes?.data?.data || contentRes?.data || null);

      const subs = subtitleRes?.data?.data || subtitleRes?.data || [];
      setSubtitles(Array.isArray(subs) ? subs : []);

      const voc = vocabRes?.data?.data || vocabRes?.data || [];
      setVocabulary(Array.isArray(voc) ? voc : []);

      const ex = exerciseRes?.data?.data || exerciseRes?.data || [];
      setExercises(Array.isArray(ex) ? ex : []);

      setMiniTest(miniTestRes?.data?.data || miniTestRes?.data || null);
      setCompletionSettings(settingsRes?.data?.data || settingsRes?.data || null);
    } catch (e) {
      setError(e.message || 'Failed to load lesson');
    }
    setLoading(false);
  }, [lessonId]);

  const saveContent = useCallback(async (data) => {
    await lessonManagementAPI.saveContent(lessonId, data);
  }, [lessonId]);

  const saveSubtitles = useCallback(async (subtitlesList) => {
    await lessonManagementAPI.saveSubtitles(lessonId, subtitlesList);
  }, [lessonId]);

  const saveVocabulary = useCallback(async (words) => {
    await lessonManagementAPI.saveVocabulary(lessonId, words);
  }, [lessonId]);

  const saveCompletionSettings = useCallback(async (settings) => {
    const saved = await lessonManagementAPI.saveCompletionSettings(lessonId, settings);
    setCompletionSettings(saved?.data?.data || saved?.data || null);
  }, [lessonId]);

  const createMiniTest = useCallback(async (data) => {
    const res = await lessonManagementAPI.createMiniTest({ ...data, lessonId });
    await loadLesson();
    return res;
  }, [lessonId, loadLesson]);

  const updateMiniTest = useCallback(async (testId, data) => {
    await lessonManagementAPI.updateMiniTest(testId, data);
    await loadLesson();
  }, [loadLesson]);

  const submitMiniTest = useCallback(async (answers, timeSpentSeconds) => {
    const res = await lessonManagementAPI.submitMiniTest(lessonId, { answers, timeSpentSeconds });
    return res?.data?.data || res?.data;
  }, [lessonId]);

  const deleteLesson = useCallback(async () => {
    await lessonManagementAPI.deleteLesson(lessonId);
  }, [lessonId]);

  return {
    lesson, content, subtitles, vocabulary, exercises,
    miniTest, completionSettings, loading, error,
    loadLesson,
    saveContent, saveSubtitles, saveVocabulary, saveCompletionSettings,
    createMiniTest, updateMiniTest, submitMiniTest, deleteLesson,
    setLesson, setContent, setSubtitles, setVocabulary,
    setExercises, setMiniTest, setCompletionSettings,
  };
};
