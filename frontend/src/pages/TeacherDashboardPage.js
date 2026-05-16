import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseManagementAPI, lessonManagementAPI } from '../api/api';
import { toast } from 'react-toastify';
import {
  BookOpen, Plus, Wand2, CheckCircle, XCircle, FileText, Eye, Save,
  Clock, Shield, ArrowRight, Trash2, Edit, ChevronDown, ChevronUp,
  GraduationCap, Video, BarChart2, Users, Award, Settings, Search, X
} from 'lucide-react';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const EXERCISE_TYPES = [
  { value: 'VOCAB_QUIZ', label: 'Vocabulary Quiz' },
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'LISTENING', label: 'Listening' },
  { value: 'READING', label: 'Reading' },
  { value: 'WRITING', label: 'Writing' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'DRAG_DROP', label: 'Drag & Drop' },
  { value: 'MIXED', label: 'Mixed' },
];

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthorized = user && (user.role === 'TEACHER' || user.role === 'ADMIN');

  const [activeTab, setActiveTab] = useState('lessons');

  // Courses
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '', description: '', level: 'A1', instructor: '', thumbnailUrl: '', category: '', featured: false
  });

  // Lessons
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonFilter, setLessonFilter] = useState('');
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Exercises
  const [myExercises, setMyExercises] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exerciseType, setExerciseType] = useState('VOCAB_QUIZ');
  const [level, setLevel] = useState(user?.level || 'A1');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(15);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Stats
  const [stats, setStats] = useState({ totalCourses: 0, totalLessons: 0, totalExercises: 0, totalStudents: 0 });

  useEffect(() => {
    if (!isAuthorized) return;
    fetchCourses();
    fetchMyExercises();
    fetchStats();
  }, [isAuthorized]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse.id);
    }
  }, [selectedCourse]);

  useEffect(() => {
    setStats(prev => ({ ...prev, totalExercises: myExercises.length }));
  }, [myExercises.length]);

  const fetchCourses = async () => {
    try {
      const res = await courseManagementAPI.getAll();
      setCourses(res.data || []);
    } catch (e) { /* ignore */ }
  };

  const fetchLessons = async (courseId) => {
    setLoadingLessons(true);
    try {
      const res = await lessonManagementAPI.getLessonsByCourse(courseId);
      setLessons(res.data?.data || res.data || []);
    } catch (e) { setLessons([]); }
    setLoadingLessons(false);
  };

  const fetchMyExercises = async () => {
    try {
      const res = await fetch('/api/exercises', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyExercises(data.data || []);
      }
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await courseManagementAPI.getAll();
      const allCourses = res.data || [];
      let totalLessons = 0;
      for (const c of allCourses) {
        try {
          const lRes = await lessonManagementAPI.getLessonsByCourse(c.id);
          const ls = lRes.data?.data || lRes.data || [];
          totalLessons += ls.length;
        } catch {}
      }
      setStats({
        totalCourses: allCourses.length,
        totalLessons,
        totalExercises: myExercises.length,
        totalStudents: 0,
      });
    } catch {}
  };

  // ─── Course CRUD ──────────────────────────────────────────────────────────────

  const handleCreateCourse = async () => {
    if (!courseForm.title.trim()) { toast.error('Course title is required'); return; }
    setLoading(true);
    try {
      await courseManagementAPI.create({ ...courseForm, instructor: courseForm.instructor || user?.fullName || user?.username });
      toast.success('Course created successfully!');
      setCourseForm({ title: '', description: '', level: 'A1', instructor: '', thumbnailUrl: '', category: '', featured: false });
      fetchCourses();
      fetchStats();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create course');
    }
    setLoading(false);
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course and all its lessons?')) return;
    try {
      await courseManagementAPI.delete(courseId);
      toast.success('Course deleted');
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
      fetchCourses();
      fetchStats();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  // ─── Lesson CRUD ──────────────────────────────────────────────────────────────

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await lessonManagementAPI.deleteLesson(lessonId);
      toast.success('Lesson deleted');
      if (selectedCourse) fetchLessons(selectedCourse.id);
      fetchStats();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  // ─── Exercise CRUD ────────────────────────────────────────────────────────────

  const createLesson = async () => {
    if (!title.trim() || !selectedCourse) { toast.warn('Select a course and enter a title'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title, content: description, durationMinutes: duration, orderIndex: lessons.length,
        }),
      });
      if (res.ok) {
        toast.success('Lesson created!');
        setTitle(''); setDescription('');
        if (selectedCourse) fetchLessons(selectedCourse.id);
      }
    } catch { toast.error('Error creating lesson'); }
    setLoading(false);
  };

  const createExercise = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ title, description, type: exerciseType, level, durationMinutes: duration, active: false }),
      });
      if (res.ok) {
        const data = await res.json();
        const exerciseId = data.data?.id;
        if (exerciseId && generatedQuestions.length > 0) {
          for (const q of generatedQuestions) {
            await fetch(`/api/teacher/exercises/${exerciseId}/questions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
              body: JSON.stringify({
                question: q.question, type: 'MULTIPLE_CHOICE',
                options: q.options, correctAnswer: q.correctAnswer,
                explanation: q.explanation || '', points: 1, orderIndex: 0,
              }),
            });
          }
        }
        setTitle(''); setDescription(''); setTopic(''); setGeneratedQuestions([]);
        fetchMyExercises();
        toast.success('Exercise created!');
      }
    } catch { toast.error('Error creating exercise'); }
    setLoading(false);
  };

  const generateWithAI = async () => {
    if (!topic.trim() || !level) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/teacher/generate-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ type: exerciseType, level, topic, title: topic + ' - ' + exerciseType, save: false }),
      });
      if (res.ok) {
        const data = await res.json();
        const questions = data.data?.questions || [];
        setGeneratedQuestions(questions);
        if (questions.length > 0) setTitle(questions[0].question || topic + ' Quiz');
        if (questions.length > 0) toast.success(`Generated ${questions.length} questions!`);
        else toast.warning('No questions generated');
      }
    } catch { toast.error('Error generating with AI'); }
    setGenerating(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!isAuthorized) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '32px 24px', textAlign: 'center' }}>
        <Shield size={48} color="#3b82f6" style={{ marginBottom: 16 }} />
        <h2 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Truy cập bị từ chối</h2>
        <p style={{ color: '#718096', fontWeight: 600, marginBottom: 20 }}>
          Chỉ Giáo viên mới có quyền truy cập trang này.
        </p>
        <a href="/admin" style={{ padding: '12px 24px', background: '#ef4444', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          → Trang Quản trị
        </a>
      </div>
    );
  }

  const filteredLessons = lessons.filter(l =>
    !lessonFilter || l.title?.toLowerCase().includes(lessonFilter.toLowerCase())
  );

  const TABS = [
    { id: 'dashboard', label: '📊 Dashboard', icon: <BarChart2 size={16} /> },
    { id: 'courses', label: '📚 Courses', icon: <GraduationCap size={16} /> },
    { id: 'lessons', label: '📖 Lessons', icon: <BookOpen size={16} /> },
    { id: 'exercises', label: '✏️ Exercises', icon: <FileText size={16} /> },
    { id: 'ai', label: '🤖 AI Generator', icon: <Wand2 size={16} /> },
    { id: 'pending', label: `⏳ Created (${myExercises.length})`, icon: <Settings size={16} /> },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <GraduationCap size={26} color="white" />
        </div>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#1a202c', margin: 0 }}>
            Teacher Dashboard
          </h1>
          <p style={{ color: '#718096', margin: 0, fontWeight: 500 }}>
            Quản lý khóa học, bài học và bài tập
          </p>
        </div>
        {user.role === 'ADMIN' && (
          <a href="/admin" style={{
            marginLeft: 'auto', padding: '8px 16px', borderRadius: 10,
            border: '2px solid #ef4444', color: '#ef4444', textDecoration: 'none',
            fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <Shield size={14} /> Admin <ArrowRight size={14} />
          </a>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { icon: <GraduationCap size={20} />, value: stats.totalCourses, label: 'Courses', color: '#3b82f6' },
          { icon: <BookOpen size={20} />, value: stats.totalLessons, label: 'Lessons', color: '#22c55e' },
          { icon: <FileText size={20} />, value: myExercises.length, label: 'Exercises', color: '#8b5cf6' },
          { icon: <Users size={20} />, value: stats.totalStudents, label: 'Students', color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 16, padding: '16px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{ color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1a202c' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto', paddingBottom: 4, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : 'white',
              color: activeTab === tab.id ? 'white' : '#64748b',
              fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(59,130,246,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
              whiteSpace: 'nowrap',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─── DASHBOARD TAB ─── */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="clay-card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 800, color: '#1a202c' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Tạo khóa học mới', icon: <Plus size={16} />, color: '#3b82f6', action: () => setActiveTab('courses') },
                { label: 'Tạo bài học mới', icon: <BookOpen size={16} />, color: '#22c55e', action: () => setActiveTab('lessons') },
                { label: 'Tạo bài tập mới', icon: <FileText size={16} />, color: '#8b5cf6', action: () => setActiveTab('exercises') },
                { label: 'Tạo bằng AI', icon: <Wand2 size={16} />, color: '#f59e0b', action: () => setActiveTab('ai') },
              ].map((action, i) => (
                <button key={i} onClick={action.action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    borderRadius: 12, border: 'none', background: `${action.color}10`,
                    color: action.color, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                    textAlign: 'left',
                  }}>
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="clay-card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 800, color: '#1a202c' }}>Recent Courses</h3>
            {courses.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No courses yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {courses.slice(0, 5).map(c => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 10, background: '#f8fafc'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1a202c' }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.level || 'A1'} • {c.category || 'General'}</div>
                    </div>
                    <button onClick={() => { setSelectedCourse(c); setActiveTab('lessons'); }}
                      style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── COURSES TAB ─── */}
      {activeTab === 'courses' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Create form */}
          <div className="clay-card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: 800, color: '#1a202c' }}>Tạo khóa học mới</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Title *</label>
                <input className="clay-input" value={courseForm.title}
                  onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="VD: English A1 - Beginner" />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea className="clay-textarea" rows={3} value={courseForm.description}
                  onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả khóa học..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Level</label>
                  <select className="clay-input" value={courseForm.level}
                    onChange={e => setCourseForm(p => ({ ...p, level: e.target.value }))}>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Category</label>
                  <input className="clay-input" value={courseForm.category}
                    onChange={e => setCourseForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="VD: Grammar, Vocabulary..." />
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Instructor</label>
                <input className="clay-input" value={courseForm.instructor}
                  onChange={e => setCourseForm(p => ({ ...p, instructor: e.target.value }))}
                  placeholder={user?.fullName || user?.username} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={courseForm.featured}
                    onChange={e => setCourseForm(p => ({ ...p, featured: e.target.checked }))} />
                  Featured course
                </label>
              </div>
              <button className="btn btn-primary btn-block" onClick={handleCreateCourse} disabled={loading} style={{ marginTop: 4 }}>
                <Plus size={16} /> {loading ? 'Creating...' : 'Tạo khóa học'}
              </button>
            </div>
          </div>

          {/* Course list */}
          <div>
            <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 12 }}>All Courses ({courses.length})</h3>
            {courses.length === 0 ? (
              <div className="clay-card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                <GraduationCap size={40} style={{ marginBottom: 8 }} />
                <p style={{ fontWeight: 600 }}>No courses yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {courses.map(c => (
                  <div key={c.id} className="clay-card" style={{
                    padding: '14px 16px',
                    border: selectedCourse?.id === c.id ? '2px solid #3b82f6' : '2px solid transparent',
                    background: selectedCourse?.id === c.id ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                  }} onClick={() => setSelectedCourse(c)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.95rem', marginBottom: 4 }}>{c.title}</div>
                        <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                          <span>{c.level || 'A1'}</span>
                          <span>•</span>
                          <span>{c.category || 'General'}</span>
                          <span>•</span>
                          <span>{c.enrolledCount || 0} enrolled</span>
                          {c.featured && <span style={{ color: '#f59e0b' }}>⭐ Featured</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/lesson-create/${c.id}`); }}
                          className="btn btn-sm btn-outline" style={{ padding: '3px 8px' }}>
                          <Plus size={12} /> Lesson
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(c.id); }}
                          className="btn btn-sm" style={{ padding: '3px 8px', color: '#ef4444' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── LESSONS TAB ─── */}
      {activeTab === 'lessons' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#1a202c' }}>Lessons Management</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="clay-input" style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                value={selectedCourse?.id || ''}
                onChange={e => {
                  const c = courses.find(x => x.id === parseInt(e.target.value));
                  setSelectedCourse(c || null);
                }}>
                <option value="">Select a course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {selectedCourse && (
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/lesson-create/${selectedCourse.id}`)}>
                  <Plus size={14} /> New Lesson
                </button>
              )}
            </div>
          </div>

          {selectedCourse ? (
            <>
              {/* Course info */}
              <div className="clay-card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a202c' }}>{selectedCourse.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {lessons.length} lessons • Level {selectedCourse.level || 'A1'}
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/courses/${selectedCourse.id}`)}
                  style={{ marginLeft: 'auto' }}>
                  <Eye size={14} /> Preview
                </button>
              </div>

              {/* Search */}
              <div style={{ marginBottom: 12 }}>
                <input className="clay-input" placeholder="Search lessons..."
                  value={lessonFilter}
                  onChange={e => setLessonFilter(e.target.value)}
                  style={{ maxWidth: 300 }} />
              </div>

              {/* Lessons grid */}
              {loadingLessons ? (
                <div className="loading">Loading lessons...</div>
              ) : filteredLessons.length === 0 ? (
                <div className="clay-card" style={{ padding: 40, textAlign: 'center' }}>
                  <BookOpen size={40} color="#a0aec0" style={{ marginBottom: 8 }} />
                  <p style={{ color: '#94a3b8', fontWeight: 600 }}>No lessons yet</p>
                  <button className="btn btn-primary" onClick={() => navigate(`/lesson-create/${selectedCourse.id}`)} style={{ marginTop: 8 }}>
                    <Plus size={14} /> Create First Lesson
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredLessons.map((lesson, idx) => (
                    <div key={lesson.id} className="clay-card" style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: lesson.active === false ? '#fef3c7' : '#22c55e',
                          color: lesson.active === false ? '#92400e' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, fontSize: '0.875rem', flexShrink: 0
                        }}>
                          {lesson.active === false ? '🔒' : idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#1a202c', marginBottom: 2 }}>{lesson.title}</div>
                          <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                            {lesson.durationMinutes > 0 && <span>⏱ {lesson.durationMinutes} phút</span>}
                            {lesson.orderIndex >= 0 && <span>#{lesson.orderIndex}</span>}
                            <span>{lesson.level || selectedCourse.level || 'A1'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button className="btn btn-sm btn-outline"
                            onClick={() => navigate(`/lesson-create/${selectedCourse.id}/${lesson.id}`)}>
                            <Edit size={13} /> Edit
                          </button>
                          <button className="btn btn-sm"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            style={{ color: '#ef4444' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="clay-card" style={{ padding: 48, textAlign: 'center' }}>
              <GraduationCap size={48} color="#a0aec0" style={{ marginBottom: 12 }} />
              <p style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>
                Select a course to manage its lessons
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('courses')}>
                <Plus size={14} /> Go to Courses Tab
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── EXERCISES TAB ─── */}
      {activeTab === 'exercises' && (
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 20 }}>Tạo bài tập mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Tiêu đề</label>
              <input className="clay-input" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="VD: Vocabulary Quiz 1" />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Loại</label>
              <select className="clay-input" value={exerciseType} onChange={e => setExerciseType(e.target.value)}>
                {EXERCISE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Level</label>
              <select className="clay-input" value={level} onChange={e => setLevel(e.target.value)}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Mô tả</label>
            <textarea className="clay-textarea" rows={2} value={description}
              onChange={e => setDescription(e.target.value)} placeholder="Mô tả bài tập..." />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Thời lượng (phút)</label>
              <input type="number" className="clay-input" value={duration}
                onChange={e => setDuration(Number(e.target.value))} style={{ width: 100 }} />
            </div>
            <button className="btn btn-primary" onClick={createExercise} disabled={!title.trim() || loading}>
              <Save size={14} /> {loading ? 'Đang tạo...' : 'Tạo bài tập'}
            </button>
          </div>
        </div>
      )}

      {/* ─── AI TAB ─── */}
      {activeTab === 'ai' && (
        <div>
          <div className="clay-card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wand2 size={20} color="#8b5cf6" /> Tạo bài tập bằng AI
            </h3>
            <p style={{ color: '#718096', fontSize: '0.88rem', marginBottom: 20 }}>
              Nhập chủ đề và để AI tạo câu hỏi tự động
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Chủ đề</label>
                <input className="clay-input" value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="VD: Present Simple, Greetings..." />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Loại bài tập</label>
                <select className="clay-input" value={exerciseType} onChange={e => setExerciseType(e.target.value)}>
                  {EXERCISE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: 4 }}>Level</label>
                <select className="clay-input" value={level} onChange={e => setLevel(e.target.value)}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <button onClick={generateWithAI} disabled={!topic.trim() || generating}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: !topic.trim() || generating ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: 'white', fontWeight: 700, cursor: !topic.trim() || generating ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <Wand2 size={16} /> {generating ? 'Đang tạo...' : 'Tạo câu hỏi với AI'}
            </button>
          </div>

          {/* Preview */}
          {generatedQuestions.length > 0 && (
            <div className="clay-card" style={{ padding: 24 }}>
              <h4 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 16 }}>
                📋 Preview ({generatedQuestions.length} câu hỏi)
              </h4>
              {generatedQuestions.map((q, i) => (
                <div key={i} style={{
                  padding: 14, borderRadius: 12, background: '#f8fafc',
                  border: '1px solid #e2e8f0', marginBottom: 10
                }}>
                  <div style={{ fontWeight: 700, color: '#1a202c', marginBottom: 6 }}>
                    Câu {i + 1}: {q.question}
                  </div>
                  {q.options && Array.isArray(q.options) && q.options.map((opt, j) => (
                    <div key={j} style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 2 }}>
                      {String.fromCharCode(65 + j)}. {opt}
                    </div>
                  ))}
                  {q.correctAnswer !== undefined && (
                    <div style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 700, marginTop: 6 }}>
                      ✓ Đáp án: {q.options?.[parseInt(q.correctAnswer)] || q.correctAnswer}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-outline" onClick={() => setGeneratedQuestions([])}>
                  <Trash2 size={14} /> Xóa
                </button>
                <button className="btn btn-primary" onClick={createExercise} disabled={loading}>
                  <Save size={14} /> Lưu bài tập
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── PENDING TAB ─── */}
      {activeTab === 'pending' && (
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 20 }}>
            Bài tập đã tạo ({myExercises.length})
          </h3>
          {myExercises.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <FileText size={40} style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 600 }}>Chưa có bài tập nào được tạo</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myExercises.map(ex => (
                <div key={ex.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 12, background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a202c', marginBottom: 4 }}>{ex.title}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span>{ex.type?.replace(/_/g, ' ')}</span>
                      <span>•</span>
                      <span>{ex.level}</span>
                      {ex.durationMinutes && <><span>•</span><span>{ex.durationMinutes} phút</span></>}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                    background: ex.active ? '#22c55e22' : '#fef3c7',
                    color: ex.active ? '#15803d' : '#92400e',
                  }}>
                    {ex.active ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
