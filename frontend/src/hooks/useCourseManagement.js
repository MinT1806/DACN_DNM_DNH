import { useState, useCallback } from 'react';
import { courseManagementAPI, lessonManagementAPI } from '../api/api';

export const useCourseManagement = (courseId) => {
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCourse = useCallback(async (id = courseId) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await courseManagementAPI.getDetail(id);
      const data = res?.data?.data || res?.data;
      setCourse(data);
      setLessons(data?.lessons || []);
    } catch (e) {
      setError(e.message || 'Failed to load course');
    }
    setLoading(false);
  }, [courseId]);

  const createCourse = useCallback(async (data) => {
    const res = await courseManagementAPI.create(data);
    return res?.data?.data || res?.data;
  }, []);

  const updateCourse = useCallback(async (id, data) => {
    const res = await courseManagementAPI.update(id, data);
    return res?.data?.data || res?.data;
  }, []);

  const deleteCourse = useCallback(async (id) => {
    await courseManagementAPI.delete(id);
  }, []);

  const enroll = useCallback(async (id = courseId) => {
    await courseManagementAPI.enroll(id);
  }, [courseId]);

  const reorderLessons = useCallback(async (id, lessonIds) => {
    await courseManagementAPI.reorderLessons(id, lessonIds);
  }, []);

  const getStats = useCallback(async (id = courseId) => {
    const res = await courseManagementAPI.getStats(id);
    return res?.data?.data || res?.data;
  }, [courseId]);

  return {
    course, lessons, loading, error,
    loadCourse, createCourse, updateCourse, deleteCourse,
    enroll, reorderLessons, getStats,
    setCourse, setLessons,
  };
};
