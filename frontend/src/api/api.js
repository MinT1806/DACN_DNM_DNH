import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - global error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle 429 - Too Many Requests (Rate Limit)
    if (error.response?.status === 429) {
      console.warn('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      console.error('Lỗi kết nối. Vui lòng kiểm tra internet.');
      return Promise.reject(error);
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      console.error('Lỗi server. Vui lòng thử lại sau.');
    }

    return Promise.reject(error);
  }
);

// Retry logic for failed requests
const retryRequest = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (token) => api.post('/auth/refresh', { refreshToken: token }),
  socialLogin: (provider, token) => api.post(`/auth/social/${provider}`, { token }),
};

// ─── User API ─────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  changePassword: (data) => api.post('/user/change-password', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Course API ───────────────────────────────────────────────────────────────
export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getLessons: (courseId) => api.get(`/courses/${courseId}/lessons`),
  getChapters: (courseId) => api.get(`/courses/${courseId}/chapters`),
  enroll: (courseId) => api.post(`/courses/${courseId}/enroll`),
  getProgress: (courseId) => api.get(`/courses/${courseId}/progress`),
  getMyCourses: () => api.get('/courses/my'),
  search: (query) => api.get('/courses/search', { params: { q: query } }),
};

// ─── Lesson API ───────────────────────────────────────────────────────────────
export const lessonAPI = {
  getById: (id) => api.get(`/lessons/${id}`),
  getLessons: (courseId) => api.get(`/lessons/course/${courseId}`),
  getCourseLessons: (courseId) => api.get(`/lessons/course/${courseId}`),
  start: (lessonId) => api.post(`/lessons/${lessonId}/start`),
  complete: (lessonId) => api.post(`/lessons/${lessonId}/complete`),
  updateProgress: (lessonId, progress) => api.put(`/lessons/${lessonId}/progress`, { progress }),
};

// ─── Vocabulary API ───────────────────────────────────────────────────────────
export const vocabularyAPI = {
  getWords: (params) => api.get('/vocabulary/words', { params }),
  search: (query) => api.get('/vocabulary/search', { params: { q: query } }),
  getFlashcards: (params) => api.get('/vocabulary/flashcards', { params }),
  review: (data) => api.post('/vocabulary/review', data),
  addToLearning: (wordId) => api.post(`/vocabulary/learn/${wordId}`),
  quiz: (data) => api.post('/vocabulary/quiz', data),
  getStats: () => api.get('/vocabulary/stats'),
};

// ─── Exercise API ─────────────────────────────────────────────────────────────
export const exerciseAPI = {
  getAll: (level = null, skill = null) =>
    api.get('/exercises', { params: { level, type: skill } }),
  getById: (id) => api.get(`/exercises/${id}`),
  submit: (id, answers) => api.post(`/exercises/${id}/submit`, answers),
  getResults: () => api.get('/exercises/results'),
  generate: (skillType, level, topic) =>
    api.post('/exercises/generate', { skillType, level, topic }),
};

// ─── Forum API ─────────────────────────────────────────────────────────────────
export const forumAPI = {
  getPosts: (params) => api.get('/forum/posts', { params }),
  getPostById: (id) => api.get(`/forum/posts/${id}`),
  createPost: (data) => api.post('/forum/posts', data),
  updatePost: (id, data) => api.put(`/forum/posts/${id}`, data),
  deletePost: (id) => api.delete(`/forum/posts/${id}`),
  upvotePost: (id) => api.post(`/forum/posts/${id}/upvote`),
  getComments: (postId) => api.get(`/forum/posts/${postId}/comments`),
  addComment: (postId, data) => api.post(`/forum/posts/${postId}/comments`, data),
  upvoteComment: (commentId) => api.post(`/forum/comments/${commentId}/upvote`),
  acceptAnswer: (postId, commentId) => api.post(`/forum/posts/${postId}/accept/${commentId}`),
};

// ─── Gamification API ─────────────────────────────────────────────────────────
export const gamificationAPI = {
  getStats: () => api.get('/gamification/stats'),
  getBadges: () => api.get('/gamification/badges'),
  getMyBadges: () => api.get('/gamification/my-badges'),
  getLeaderboard: (limit) => api.get('/gamification/leaderboard', { params: { limit } }),
  getStreak: () => api.get('/gamification/streak'),
};

// ─── Notification API ──────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// ─── Mentor API ────────────────────────────────────────────────────────────────
export const mentorAPI = {
  getStudents: () => api.get('/mentor/students'),
  getMentor: () => api.get('/mentor/my-mentor'),
  requestMentor: () => api.post('/mentor/request'),
  getMessages: (assignmentId) => api.get(`/mentor/messages/${assignmentId}`),
  sendMessage: (assignmentId, content) => api.post(`/mentor/messages/${assignmentId}`, { content }),
};

// ─── Placement Test API ────────────────────────────────────────────────────────
export const placementAPI = {
  start: (level) => api.post('/placement/start', {}, { params: { level } }),
  submit: (data) => api.post('/placement/submit', data),
  getResult: () => api.get('/placement/result'),
};

// ─── Learning Path API ─────────────────────────────────────────────────────────
export const learningPathAPI = {
  getPath: () => api.get('/learning-path'),
  get: () => api.get('/learning-path'),
  generate: () => api.post('/learning-path/generate'),
  startItem: (itemId) => api.post(`/learning-path/item/${itemId}/start`),
  completeItem: (itemId) => api.post(`/learning-path/item/${itemId}/complete`),
};

// ─── Daily Challenge API ──────────────────────────────────────────────────────
export const dailyAPI = {
  // Today's challenge with all sections
  getToday: () => api.get('/daily'),
  // Submit challenge answers
  submit: (data) => api.post('/daily/submit', data),
  // Weekly progress Mon-Sun
  getWeek: () => api.get('/daily/week'),
  // Streak info
  getStreak: () => api.get('/daily/streak'),
  // Challenge history
  getHistory: (limit = 10) => api.get('/daily/history', { params: { limit } }),
};

// ─── Certificate API ───────────────────────────────────────────────────────────
export const certificateAPI = {
  getMy: () => api.get('/certificate/my'),
  get: (courseId) => api.get(`/certificate/${courseId}`),
  generate: (courseId) => api.post(`/certificate/${courseId}/generate`),
  download: (courseId) => api.get(`/certificate/${courseId}/download`),
};

// ─── Analytics API ─────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getMyAnalytics: () => api.get('/analytics/my'),
  getDashboard: () => api.get('/analytics'),
  getStats: () => api.get('/analytics/stats'),
  getProgress: (days) => api.get('/analytics/progress', { params: { days } }),
  getSkills: () => api.get('/analytics/skills'),
  getVocabAnalytics: () => api.get('/analytics/vocabulary'),
  getActivity: (params) => api.get('/analytics/activity', { params }),
  getLeaderboard: (limit) => api.get('/analytics/leaderboard', { params: { limit } }),
};

// ─── AI Writing API ────────────────────────────────────────────────────────────
export const writingAPI = {
  check: (text) => api.post('/ai/writing-check', { text }),
};

// ─── Agent API ─────────────────────────────────────────────────────────────────
export const agentAPI = {
  scoreAnswer: (data) => api.post('/agent/score', data),
  generateExercises: (data) => api.post('/agent/generate-exercises', data),
  chat: (data) => api.post('/agent/chat', data),
  getGuidance: (userId) => api.get(`/agent/guidance/${userId}`),
};

// ─── Video Learning API ─────────────────────────────────────────────────────────
export const videoAPI = {
  getLessonVideo: (lessonId) => api.get(`/video/lesson/${lessonId}`),
  lookupWord: (word) => api.post('/video/lookup', { word }),
  saveWord: (vocabularyId) => api.post('/video/save', { vocabularyId }),
};

// ─── Story Mode API ─────────────────────────────────────────────────────────────
export const storyAPI = {
  getAll: () => api.get('/stories'),
  getById: (id) => api.get(`/stories/${id}`),
  submitAnswer: (id, stepOrder, answer) =>
    api.post(`/stories/${id}/answer`, { stepOrder, answer }),
  getProgress: () => api.get('/stories/progress'),
};

// ─── Flashcard API ──────────────────────────────────────────────────────────────
export const flashcardAPI = {
  getToday: () => api.get('/flashcards/today'),
  review: (vocabularyId, rating) =>
    api.post('/flashcards/review', { vocabularyId, rating }),
  getStats: () => api.get('/flashcards/stats'),
  getAll: () => api.get('/flashcards/all'),
  addCard: (data) => api.post('/flashcards', data),
  deleteCard: (vocabularyId) => api.delete(`/flashcards/${vocabularyId}`),
};

// ─── Saved Word API ────────────────────────────────────────────────────────────
export const savedWordAPI = {
  getAll: () => api.get('/saved-words'),
  save: (data) => api.post('/saved-words', data),
  remove: (vocabularyId) => api.delete(`/saved-words/${vocabularyId}`),
  getFlashcards: () => api.get('/saved-words/flashcards'),
  review: (data) => api.post('/saved-words/flashcards/review', data),
  getStats: () => api.get('/saved-words/stats'),
};

// ─── Result API ────────────────────────────────────────────────────────────────
export const resultAPI = {
  getMyResults: () => api.get('/exercises/results'),
};

// ─── Test API ─────────────────────────────────────────────────────────────────
export const testAPI = {
  getAll: (params) => api.get('/tests', { params }),
  getById: (id) => api.get(`/tests/${id}`),
  start: (id) => api.post(`/tests/${id}/start`),
  submit: (testId, sessionId, answers) => api.post(`/tests/${testId}/submit/${sessionId}`, answers),
  getResults: () => api.get('/tests/results'),
  getResultById: (id) => api.get(`/tests/results/${id}`),
  create: (data) => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  delete: (id) => api.delete(`/tests/${id}`),
};

// ─── Ranking API ───────────────────────────────────────────────────────────────
export const rankingAPI = {
  get: (period = 'all', limit = 10, level = null) =>
    api.get('/ranking', { params: { period, limit, level } }),
  getWeekly: (limit = 10) => api.get('/ranking/weekly', { params: { limit } }),
  getMonthly: (limit = 10) => api.get('/ranking/monthly', { params: { limit } }),
  getByLevel: (level, limit = 10) => api.get(`/ranking/level/${level}`, { params: { limit } }),
  getMyRank: () => api.get('/ranking/my-rank'),
};

// ─── Admin API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (role = null, level = null, page = 0, size = 20, search = null) =>
    api.get('/admin/users', { params: { role, level, page, size, search } }),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  updateRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  updateStatus: (userId, enabled) => api.put(`/admin/users/${userId}/status`, { enabled }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getReports: (days = 30) => api.get('/admin/reports', { params: { days } }),
  getAnalytics: () => api.get('/admin/analytics'),
  getTests: () => api.get('/tests'),
  createTest: (data) => api.post('/tests', data),
  updateTest: (id, data) => api.put(`/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/tests/${id}`),
  getRanking: (period = 'all', limit = 50) =>
    api.get('/ranking', { params: { period, limit } }),
};

// ─── Chat API ─────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (receiverId, content) => api.post('/chat/send', { receiverId, content }),
  getConversation: (otherUserId, page, size) =>
    api.get(`/chat/conversation/${otherUserId}`, { params: { page, size } }),
  markAsSeen: (senderId) => api.post(`/chat/conversation/${senderId}/seen`),
  getUnreadCount: () => api.get('/chat/unread-count'),
  getRecentChats: () => api.get('/chat/recent'),
};

// ─── Recommendation API ────────────────────────────────────────────────────────
export const recommendationAPI = {
  get: () => api.get('/recommendations'),
  getWeeklyPlan: () => api.get('/recommendations/weekly-plan'),
};

// ─── Password Reset API ────────────────────────────────────────────────────────
export const passwordResetAPI = {
  request: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  reset: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
};

// ─── Teacher API ─────────────────────────────────────────────────────────────────
export const teacherAPI = {
  createLesson: (data) => api.post('/teacher/lessons', data),
  createExercise: (data) => api.post('/teacher/exercises', data),
  addQuestion: (exerciseId, data) => api.post(`/teacher/exercises/${exerciseId}/questions`, data),
  generateExercises: (data) => api.post('/teacher/generate-exercises', data),
  generateFromContent: (data) => api.post('/teacher/generate-from-content', data),
  getSubmissions: () => api.get('/teacher/submissions'),
};

// ─── Exercise Enhanced API ───────────────────────────────────────────────────────
export const exerciseEnhancedAPI = {
  submit: (id, answers) => api.post(`/exercises/${id}/submit`, answers),
  suggestVocab: (data) => api.post('/exercises/suggest-vocab', data),
  saveWord: (data) => api.post('/exercises/save-word', data),
};

// ─── Lesson Flow API ──────────────────────────────────────────────────────────
export const lessonFlowAPI = {
  getLessonFlow: (lessonId) => api.get(`/lesson-flow/${lessonId}`),
  getContent: (lessonId) => api.get(`/lesson-flow/${lessonId}/content`),
  getExercises: (lessonId) => api.get(`/lesson-flow/${lessonId}/exercises`),
  getExerciseDetail: (lessonId, exerciseId) => api.get(`/lesson-flow/${lessonId}/exercise/${exerciseId}`),
  getTest: (lessonId) => api.get(`/lesson-flow/${lessonId}/test`),
  updateProgress: (lessonId, data) => api.post(`/lesson-flow/${lessonId}/progress`, data),
};

// ─── Exercise Flow API ─────────────────────────────────────────────────────────
export const exerciseFlowAPI = {
  submit: (exerciseId, answers, timeSpentSeconds = 0) =>
    api.post(`/exercises/v2/${exerciseId}/submit`, { ...answers, timeSpentSeconds }),
  gradeSingle: (exerciseId, data) => api.post(`/exercises/v2/${exerciseId}/grade-single`, data),
};

// ─── Test Flow API ─────────────────────────────────────────────────────────────
export const testFlowAPI = {
  start: (testId, lessonId = null) => api.post(`/tests/${testId}/start`, { lessonId }),
  submit: (testId, data) => api.post(`/tests/${testId}/submit`, data),
  getHistory: () => api.get('/tests/history'),
  create: (data) => api.post('/tests/create', data),
};

// ─── Progress API ──────────────────────────────────────────────────────────────
export const progressAPI = {
  getLesson: (lessonId) => api.get(`/progress/lesson/${lessonId}`),
  getCourse: (courseId) => api.get(`/progress/course/${courseId}`),
  getStats: () => api.get('/progress/stats'),
};

// ─── Lesson Management API ──────────────────────────────────────────────────────
export const lessonManagementAPI = {
  // Lesson CRUD
  createLesson: (data) => api.post('/lesson-management/lessons', data),
  updateLesson: (id, data) => api.put(`/lesson-management/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/lesson-management/lessons/${id}`),
  getLesson: (id) => api.get(`/lesson-management/lessons/${id}`),
  getLessonsByCourse: (courseId) => api.get(`/lesson-management/lessons/course/${courseId}`),

  // Content
  getContent: (lessonId) => api.get(`/lesson-management/lessons/${lessonId}/content`),
  saveContent: (lessonId, data) => api.put(`/lesson-management/lessons/${lessonId}/content`, data),

  // Subtitles
  getSubtitles: (lessonId, language) =>
    api.get(`/lesson-management/lessons/${lessonId}/subtitles`, { params: { language } }),
  saveSubtitles: (lessonId, subtitles) =>
    api.put(`/lesson-management/lessons/${lessonId}/subtitles`, subtitles),

  // Vocabulary
  getVocabulary: (lessonId) => api.get(`/lesson-management/lessons/${lessonId}/vocabulary`),
  saveVocabulary: (lessonId, words) =>
    api.put(`/lesson-management/lessons/${lessonId}/vocabulary`, words),

  // Exercises
  getExercises: (lessonId) => api.get(`/lesson-management/lessons/${lessonId}/exercises`),
  getExercise: (exerciseId) => api.get(`/lesson-management/exercises/${exerciseId}`),
  createExercise: (data) => api.post('/lesson-management/exercises', data),
  deleteExercise: (id) => api.delete(`/lesson-management/exercises/${id}`),

  // Mini Test
  getMiniTest: (lessonId) => api.get(`/lesson-management/lessons/${lessonId}/mini-test`),
  createMiniTest: (data) => api.post('/lesson-management/mini-tests', data),
  updateMiniTest: (testId, data) => api.put(`/lesson-management/mini-tests/${testId}`, data),
  submitMiniTest: (lessonId, data) =>
    api.post(`/lesson-management/lessons/${lessonId}/mini-test/submit`, data),

  // Completion Settings
  getCompletionSettings: (lessonId) =>
    api.get(`/lesson-management/lessons/${lessonId}/completion-settings`),
  saveCompletionSettings: (lessonId, data) =>
    api.put(`/lesson-management/lessons/${lessonId}/completion-settings`, data),

  // Progress
  getProgress: (lessonId) => api.get(`/lesson-management/lessons/${lessonId}/progress`),
};

// ─── Course Management API ─────────────────────────────────────────────────────
export const courseManagementAPI = {
  create: (data) => api.post('/course-management', data),
  update: (id, data) => api.put(`/course-management/${id}`, data),
  delete: (id) => api.delete(`/course-management/${id}`),
  getAll: () => api.get('/course-management'),
  getById: (id) => api.get(`/course-management/${id}`),
  getDetail: (id) => api.get(`/course-management/${id}/detail`),
  getByLevel: (level) => api.get(`/course-management/level/${level}`),
  getFeatured: () => api.get('/course-management/featured'),
  enroll: (courseId) => api.post(`/course-management/${courseId}/enroll`),
  reorderLessons: (courseId, lessonIds) =>
    api.put(`/course-management/${courseId}/lessons/order`, lessonIds),
  getStats: (courseId) => api.get(`/course-management/${courseId}/stats`),
};

// ─── Test Management API ──────────────────────────────────────────────────────
export const testManagementAPI = {
  start: (testId, data = {}) => api.post(`/test-management/tests/${testId}/start`, data),
  resume: (sessionId) => api.post(`/test-management/sessions/${sessionId}/resume`),
  autoSave: (sessionId, data) => api.post(`/test-management/sessions/${sessionId}/autosave`, data),
  submit: (testId, data) => api.post(`/test-management/tests/${testId}/submit`, data),
  getResult: (resultId) => api.get(`/test-management/results/${resultId}`),
  getSession: (sessionId) => api.get(`/test-management/sessions/${sessionId}`),
  getInProgressSessions: () => api.get('/test-management/sessions/in-progress'),
  completeSection: (sessionId, sectionType) =>
    api.post(`/test-management/sessions/${sessionId}/section/complete`, { sectionType }),
  lockSession: (sessionId) => api.post(`/test-management/sessions/${sessionId}/lock`),
  gradeWriting: (data) => api.post('/test-management/grade/writing', data),
  gradeSpeaking: (data) => api.post('/test-management/grade/speaking', data),
  batchGrade: (requests) => api.post('/test-management/grade/batch', requests),
};

// Export retry wrapper
export { retryRequest };

export default api;
