import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const aiExerciseApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

aiExerciseApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

aiExerciseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const aiExerciseAPI = {
  getSkills: () => aiExerciseApi.get('/ai-exercises/skills'),

  getTopics: (skill) => aiExerciseApi.get('/ai-exercises/topics', { params: { skill } }),

  getLevels: () => aiExerciseApi.get('/ai-exercises/levels'),

  generateExercise: (data) => aiExerciseApi.post('/ai-exercises/generate', data),

  submitExercise: (data) => aiExerciseApi.post('/ai-exercises/submit', data),

  gradeSingle: (data) => aiExerciseApi.post('/ai-exercises/grade-single', data),

  transcribeAudio: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return aiExerciseApi.post('/ai-exercises/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },

  gradeSpeaking: (data) => aiExerciseApi.post('/ai-exercises/grade-speaking', data),

  getHistory: () => aiExerciseApi.get('/ai-exercises/history'),
};

export default aiExerciseApi;
