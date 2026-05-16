import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonManagementAPI, courseManagementAPI } from '../api/api';
import { toast } from 'react-toastify';
import {
  BookOpen, Video, FileText, ListChecks, HelpCircle, Save, ArrowLeft,
  Plus, Trash2, GripVertical, ChevronDown, Star, MessageSquare
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
const QUESTION_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'FILL_BLANK', label: 'Fill in the Blank' },
  { value: 'DRAG_DROP', label: 'Drag & Drop' },
  { value: 'LISTENING_CONTENT', label: 'Listening' },
  { value: 'READING_PASSAGE', label: 'Reading' },
  { value: 'ESSAY', label: 'Essay' },
  { value: 'SPEAKING_PROMPT', label: 'Speaking' },
];

export default function CreateEditLessonPage() {
  const { lessonId, courseId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!lessonId;

  const [activeTab, setActiveTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [courses, setCourses] = useState([]);

  // Lesson info
  const [lessonInfo, setLessonInfo] = useState({
    title: '', content: '', videoUrl: '', orderIndex: 0,
    durationMinutes: 15, courseId: courseId || '', level: 'A1', active: true
  });

  // Content
  const [content, setContent] = useState({
    textContent: '', grammarRules: '', vocabulary: '', keyPoints: '',
    audioUrl: '', imageUrl: '', videoSubtitles: ''
  });

  // Subtitles
  const [subtitles, setSubtitles] = useState([]);
  const [subtitleForm, setSubtitleForm] = useState({ language: 'en', content: '', startTime: 0, endTime: 5 });

  // Vocabulary
  const [vocabulary, setVocabulary] = useState([]);
  const [vocabForm, setVocabForm] = useState({
    word: '', pronunciation: '', translation: '', definition: '', example: ''
  });

  // Exercises
  const [exercises, setExercises] = useState([]);
  const [exerciseForm, setExerciseForm] = useState({
    title: '', description: '', type: 'VOCAB_QUIZ', level: 'A1',
    topic: '', category: '', content: '', instructions: '',
    durationMinutes: 15, maxScore: 10, questions: []
  });

  // Mini Test
  const [miniTest, setMiniTest] = useState(null);
  const [miniTestForm, setMiniTestForm] = useState({
    title: '', description: '', durationMinutes: 15, passingScore: 60,
    questions: []
  });

  // Completion Settings
  const [completionSettings, setCompletionSettings] = useState({
    requireContentView: true, requireExercises: true, requireMiniTest: true,
    minTestScore: 60, minExerciseScore: 0, autoUnlockNext: true,
    completionMessage: 'Congratulations! You have completed this lesson.',
    certificateTemplate: ''
  });

  // Load courses
  useEffect(() => {
    courseManagementAPI.getAll().then(r => {
      if (r.data) setCourses(r.data);
    }).catch(() => {});
  }, []);

  // Load lesson data if editing
  useEffect(() => {
    if (!isEditing) return;
    const load = async () => {
      try {
        const [lessonRes, contentRes, vocabRes, subtitleRes, exerciseRes, miniTestRes, settingsRes] = await Promise.all([
          lessonManagementAPI.getLesson(lessonId),
          lessonManagementAPI.getContent(lessonId),
          lessonManagementAPI.getVocabulary(lessonId),
          lessonManagementAPI.getSubtitles(lessonId),
          lessonManagementAPI.getExercises(lessonId),
          lessonManagementAPI.getMiniTest(lessonId).catch(() => null),
          lessonManagementAPI.getCompletionSettings(lessonId),
        ]);

        const l = lessonRes.data?.data;
        if (l) setLessonInfo({
          title: l.title || '', content: l.content || '', videoUrl: l.videoUrl || '',
          orderIndex: l.orderIndex || 0, durationMinutes: l.durationMinutes || 15,
          courseId: l.courseId || '', level: l.level || 'A1', active: l.active !== false
        });

        const c = contentRes.data?.data;
        if (c) setContent({
          textContent: c.textContent || '', grammarRules: c.grammarRules || '',
          vocabulary: c.vocabulary || '', keyPoints: c.keyPoints || '',
          audioUrl: c.audioUrl || '', imageUrl: c.imageUrl || '',
          videoSubtitles: c.videoSubtitles || ''
        });

        const v = vocabRes.data?.data || [];
        setVocabulary(v.map(w => ({ id: w.id, ...w })));

        const s = subtitleRes.data?.data || [];
        setSubtitles(s.map((sub, i) => ({ id: sub.id || i, ...sub })));

        const ex = exerciseRes.data?.data || [];
        setExercises(ex);

        const mt = miniTestRes?.data?.data;
        if (mt) {
          setMiniTest(mt);
          setMiniTestForm({
            title: mt.title || '', description: mt.description || '',
            durationMinutes: mt.durationMinutes || 15, passingScore: mt.passingScore || 60,
            questions: (mt.questions || []).map((q, i) => ({
              id: q.id || i, question: q.question, type: q.type || 'MULTIPLE_CHOICE',
              content: q.content || '', options: q.options || [], correctAnswer: '', explanation: q.explanation || '', points: q.points || 10
            }))
          });
        }

        const cs = settingsRes.data?.data;
        if (cs) setCompletionSettings({
          requireContentView: cs.requireContentView !== false,
          requireExercises: cs.requireExercises !== false,
          requireMiniTest: cs.requireMiniTest !== false,
          minTestScore: cs.minTestScore || 60, minExerciseScore: cs.minExerciseScore || 0,
          autoUnlockNext: cs.autoUnlockNext !== false,
          completionMessage: cs.completionMessage || '',
          certificateTemplate: cs.certificateTemplate || ''
        });
      } catch (e) {
        toast.error('Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lessonId, isEditing]);

  // Save lesson (info tab)
  const handleSaveLessonInfo = async () => {
    if (!lessonInfo.title.trim()) { toast.error('Title is required'); return; }
    if (!lessonInfo.courseId) { toast.error('Please select a course'); return; }
    setSaving(true);
    try {
      if (isEditing) {
        await lessonManagementAPI.updateLesson(lessonId, lessonInfo);
        toast.success('Lesson updated');
      } else {
        const res = await lessonManagementAPI.createLesson(lessonInfo);
        const newId = res.data?.data?.id;
        toast.success('Lesson created! ID: ' + newId);
        navigate(`/lesson-create/${newId}`, { replace: true });
        window.location.reload();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  // Save content
  const handleSaveContent = async () => {
    if (!isEditing) { toast.warn('Save the lesson first'); return; }
    setSaving(true);
    try {
      await lessonManagementAPI.saveContent(lessonId, content);
      toast.success('Content saved');
    } catch (e) {
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // Save subtitles
  const handleAddSubtitle = () => {
    if (!subtitleForm.content.trim()) return;
    setSubtitles(prev => [...prev, { ...subtitleForm, id: Date.now() }]);
    setSubtitleForm({ language: 'en', content: '', startTime: 0, endTime: 5 });
  };

  const handleSaveSubtitles = async () => {
    if (!isEditing) { toast.warn('Save the lesson first'); return; }
    setSaving(true);
    try {
      const formatted = subtitles.map(s => ({
        language: s.language, content: s.content,
        startTime: s.startTime, endTime: s.endTime
      }));
      await lessonManagementAPI.saveSubtitles(lessonId, formatted);
      toast.success('Subtitles saved');
    } catch (e) {
      toast.error('Failed to save subtitles');
    } finally {
      setSaving(false);
    }
  };

  // Vocabulary
  const handleAddVocab = () => {
    if (!vocabForm.word.trim()) return;
    setVocabulary(prev => [...prev, { ...vocabForm, id: Date.now() }]);
    setVocabForm({ word: '', pronunciation: '', translation: '', definition: '', example: '' });
  };

  const handleSaveVocabulary = async () => {
    if (!isEditing) { toast.warn('Save the lesson first'); return; }
    setSaving(true);
    try {
      await lessonManagementAPI.saveVocabulary(lessonId, vocabulary);
      toast.success('Vocabulary saved');
    } catch (e) {
      toast.error('Failed to save vocabulary');
    } finally {
      setSaving(false);
    }
  };

  // Exercise
  const handleAddExercise = () => {
    const form = { ...exerciseForm, questions: [] };
    setExercises(prev => [...prev, { ...form, id: Date.now(), _expanded: true }]);
    setExerciseForm({
      title: '', description: '', type: 'VOCAB_QUIZ', level: 'A1',
      topic: lessonInfo.courseId, category: lessonInfo.courseId,
      content: '', instructions: '', durationMinutes: 15, maxScore: 10, questions: []
    });
  };

  const handleAddQuestion = (exerciseId) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return { ...ex, questions: [...(ex.questions || []), {
        question: '', type: 'MULTIPLE_CHOICE', content: '',
        options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 10, id: Date.now()
      }]};
    }));
  };

  const handleSaveExercises = async () => {
    if (!isEditing) { toast.warn('Save the lesson first'); return; }
    setSaving(true);
    try {
      for (const ex of exercises) {
        const payload = {
          title: ex.title, description: ex.description, type: ex.type, level: ex.level || 'A1',
          topic: ex.topic || lessonInfo.courseId, category: ex.category || lessonInfo.courseId,
          content: ex.content || '', instructions: ex.instructions || '',
          durationMinutes: ex.durationMinutes || 15, maxScore: ex.maxScore || 10,
          questions: (ex.questions || []).map((q, i) => ({
            question: q.question, type: q.type, content: q.content,
            options: q.options, correctAnswer: q.correctAnswer,
            explanation: q.explanation, points: q.points || 10
          }))
        };
        if (ex._saved) {
          // Already saved, skip
        } else {
          await lessonManagementAPI.createExercise(payload);
        }
      }
      toast.success('Exercises saved');
    } catch (e) {
      toast.error('Failed to save exercises');
    } finally {
      setSaving(false);
    }
  };

  // Mini Test
  const handleAddMiniTestQuestion = () => {
    setMiniTestForm(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '', type: 'MULTIPLE_CHOICE', content: '',
        options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 10, id: Date.now()
      }]
    }));
  };

  const handleSaveMiniTest = async () => {
    if (!isEditing) { toast.warn('Save the lesson first'); return; }
    setSaving(true);
    try {
      const payload = {
        lessonId: parseInt(lessonId),
        title: miniTestForm.title || 'Mini Test',
        description: miniTestForm.description,
        durationMinutes: miniTestForm.durationMinutes,
        passingScore: miniTestForm.passingScore,
        questions: miniTestForm.questions.map(q => ({
          question: q.question, type: q.type, content: q.content,
          options: q.options, correctAnswer: q.correctAnswer,
          explanation: q.explanation, points: q.points || 10
        }))
      };
      if (miniTest?.id) {
        await lessonManagementAPI.updateMiniTest(miniTest.id, payload);
      } else {
        await lessonManagementAPI.createMiniTest(payload);
      }
      toast.success('Mini test saved');
    } catch (e) {
      toast.error('Failed to save mini test');
    } finally {
      setSaving(false);
    }
  };

  // Completion Settings
  const handleSaveCompletionSettings = async () => {
    if (!isEditing) { toast.warn('Save the lesson first'); return; }
    setSaving(true);
    try {
      await lessonManagementAPI.saveCompletionSettings(lessonId, completionSettings);
      toast.success('Completion settings saved');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'info', label: 'Lesson Info', icon: BookOpen },
    { id: 'content', label: 'Learning Content', icon: FileText },
    { id: 'video', label: 'Video & Subtitles', icon: Video },
    { id: 'vocab', label: 'Vocabulary', icon: Star },
    { id: 'exercises', label: 'Exercises', icon: ListChecks },
    { id: 'miniTest', label: 'Mini Test', icon: HelpCircle },
    { id: 'completion', label: 'Completion', icon: MessageSquare },
  ];

  if (loading) {
    return <div className="page-container"><div className="loading">Loading lesson data...</div></div>;
  }

  return (
    <div className="page-container" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '0.5rem' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
            {isEditing ? 'Edit Lesson' : 'Create New Lesson'}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isEditing ? `Lesson #${lessonId}` : 'Fill in all sections to create a complete lesson'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4,
        borderBottom: '2px solid var(--border)', marginBottom: 24
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', border: 'none', borderRadius: '8px 8px 0 0',
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===================== INFO TAB ===================== */}
      {activeTab === 'info' && (
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Lesson Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Title *</label>
              <input className="clay-input" value={lessonInfo.title}
                onChange={e => setLessonInfo(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Introduction to Greetings" />
            </div>

            <div className="form-group">
              <label>Course *</label>
              <select className="clay-input" value={lessonInfo.courseId}
                onChange={e => setLessonInfo(p => ({ ...p, courseId: e.target.value }))}>
                <option value="">Select a course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Level</label>
              <select className="clay-input" value={lessonInfo.level}
                onChange={e => setLessonInfo(p => ({ ...p, level: e.target.value }))}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Order Index</label>
              <input type="number" className="clay-input" value={lessonInfo.orderIndex}
                onChange={e => setLessonInfo(p => ({ ...p, orderIndex: parseInt(e.target.value) || 0 }))} />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" className="clay-input" value={lessonInfo.durationMinutes}
                onChange={e => setLessonInfo(p => ({ ...p, durationMinutes: parseInt(e.target.value) || 15 }))} />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Video URL</label>
              <input className="clay-input" value={lessonInfo.videoUrl}
                onChange={e => setLessonInfo(p => ({ ...p, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/embed/..." />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Main Content</label>
              <textarea className="clay-textarea" rows={5} value={lessonInfo.content}
                onChange={e => setLessonInfo(p => ({ ...p, content: e.target.value }))}
                placeholder="Main lesson content text..." />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={lessonInfo.active}
                  onChange={e => setLessonInfo(p => ({ ...p, active: e.target.checked }))} />
                Active
              </label>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={handleSaveLessonInfo} disabled={saving} style={{ marginTop: 16 }}>
            <Save size={18} /> {saving ? 'Saving...' : (isEditing ? 'Update Lesson' : 'Create Lesson')}
          </button>
        </div>
      )}

      {/* ===================== CONTENT TAB ===================== */}
      {activeTab === 'content' && (
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Learning Content</h3>

          <div className="form-group">
            <label>Text Content</label>
            <textarea className="clay-textarea" rows={8} value={content.textContent}
              onChange={e => setContent(p => ({ ...p, textContent: e.target.value }))}
              placeholder="Main learning content for this lesson..." />
          </div>

          <div className="form-group">
            <label>Grammar Rules (JSON or text)</label>
            <textarea className="clay-textarea" rows={4} value={content.grammarRules}
              onChange={e => setContent(p => ({ ...p, grammarRules: e.target.value }))}
              placeholder='[{"rule": "...", "example": "..."}]' />
          </div>

          <div className="form-group">
            <label>Key Points (JSON or text)</label>
            <textarea className="clay-textarea" rows={4} value={content.keyPoints}
              onChange={e => setContent(p => ({ ...p, keyPoints: e.target.value }))}
              placeholder="- Key point 1&#10;- Key point 2..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Audio URL</label>
              <input className="clay-input" value={content.audioUrl}
                onChange={e => setContent(p => ({ ...p, audioUrl: e.target.value }))}
                placeholder="https://..." />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input className="clay-input" value={content.imageUrl}
                onChange={e => setContent(p => ({ ...p, imageUrl: e.target.value }))}
                placeholder="https://..." />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSaveContent} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Content'}
          </button>
        </div>
      )}

      {/* ===================== VIDEO TAB ===================== */}
      {activeTab === 'video' && (
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Video & Subtitles</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="form-group">
              <label>Video URL</label>
              <input className="clay-input" value={lessonInfo.videoUrl}
                onChange={e => setLessonInfo(p => ({ ...p, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/embed/..." />
            </div>
          </div>

          {lessonInfo.videoUrl && (
            <div style={{ marginBottom: 24 }}>
              <label>Preview</label>
              <div style={{
                position: 'relative', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden',
                background: '#000', maxWidth: 640
              }}>
                <iframe
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  src={lessonInfo.videoUrl.includes('youtube') ?
                    lessonInfo.videoUrl.replace('watch?v=', 'embed/') :
                    lessonInfo.videoUrl}
                  title="Video preview" allowFullScreen />
              </div>
            </div>
          )}

          <h4 style={{ marginBottom: 12 }}>Subtitles</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px 80px auto', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <input className="clay-input" placeholder="Lang" value={subtitleForm.language}
              onChange={e => setSubtitleForm(p => ({ ...p, language: e.target.value }))} style={{ padding: '6px 8px', fontSize: '0.8rem' }} />
            <input className="clay-input" placeholder="Subtitle text" value={subtitleForm.content}
              onChange={e => setSubtitleForm(p => ({ ...p, content: e.target.value }))} style={{ padding: '6px 8px', fontSize: '0.8rem' }} />
            <input type="number" className="clay-input" placeholder="Start" value={subtitleForm.startTime}
              onChange={e => setSubtitleForm(p => ({ ...p, startTime: parseInt(e.target.value) || 0 }))} style={{ padding: '6px 8px', fontSize: '0.8rem' }} />
            <input type="number" className="clay-input" placeholder="End" value={subtitleForm.endTime}
              onChange={e => setSubtitleForm(p => ({ ...p, endTime: parseInt(e.target.value) || 0 }))} style={{ padding: '6px 8px', fontSize: '0.8rem' }} />
            <button className="btn btn-sm btn-primary" onClick={handleAddSubtitle}><Plus size={14} /></button>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
            {subtitles.map((sub, idx) => (
              <div key={sub.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px',
                background: 'var(--bg)', borderRadius: 8, marginBottom: 4
              }}>
                <GripVertical size={14} color="var(--text-secondary)" />
                <span style={{ width: 40, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub.language}</span>
                <span style={{ flex: 1, fontSize: '0.875rem' }}>{sub.content}</span>
                <span style={{ width: 80, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub.startTime}s - {sub.endTime}s</span>
                <button className="btn btn-sm" style={{ color: 'var(--danger)', padding: '2px 6px' }}
                  onClick={() => setSubtitles(prev => prev.filter((_, i) => i !== idx))}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={handleSaveSubtitles} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Subtitles'}
          </button>
        </div>
      )}

      {/* ===================== VOCABULARY TAB ===================== */}
      {activeTab === 'vocab' && (
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Vocabulary</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label>Word *</label>
              <input className="clay-input" value={vocabForm.word}
                onChange={e => setVocabForm(p => ({ ...p, word: e.target.value }))}
                placeholder="apple" />
            </div>
            <div className="form-group">
              <label>Pronunciation</label>
              <input className="clay-input" value={vocabForm.pronunciation}
                onChange={e => setVocabForm(p => ({ ...p, pronunciation: e.target.value }))}
                placeholder="/ˈæpəl/" />
            </div>
            <div className="form-group">
              <label>Translation</label>
              <input className="clay-input" value={vocabForm.translation}
                onChange={e => setVocabForm(p => ({ ...p, translation: e.target.value }))}
                placeholder="quả táo" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Definition</label>
              <input className="clay-input" value={vocabForm.definition}
                onChange={e => setVocabForm(p => ({ ...p, definition: e.target.value }))}
                placeholder="a round fruit with red, yellow, or green skin" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Example</label>
              <input className="clay-input" value={vocabForm.example}
                onChange={e => setVocabForm(p => ({ ...p, example: e.target.value }))}
                placeholder="An apple a day keeps the doctor away." />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleAddVocab} style={{ marginBottom: 20 }}>
            <Plus size={16} /> Add Word
          </button>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {vocabulary.map((v, idx) => (
              <div key={v.id || idx} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                background: 'var(--bg)', borderRadius: 12, marginBottom: 8
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{v.word}</span>
                  {v.pronunciation && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 8 }}>{v.pronunciation}</span>}
                  <span style={{ color: 'var(--success)', marginLeft: 12 }}>{v.translation}</span>
                </div>
                <button className="btn btn-sm" style={{ color: 'var(--danger)', padding: '2px 6px' }}
                  onClick={() => setVocabulary(prev => prev.filter((_, i) => i !== idx))}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={handleSaveVocabulary} disabled={saving} style={{ marginTop: 16 }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Vocabulary'}
          </button>
        </div>
      )}

      {/* ===================== EXERCISES TAB ===================== */}
      {activeTab === 'exercises' && (
        <div className="clay-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Exercises</h3>
            <button className="btn btn-primary" onClick={handleAddExercise}>
              <Plus size={16} /> Add Exercise
            </button>
          </div>

          {exercises.length === 0 && (
            <div className="empty-state">
              <ListChecks size={48} color="var(--text-secondary)" />
              <p>No exercises yet. Click "Add Exercise" to create one.</p>
            </div>
          )}

          {exercises.map((ex, exIdx) => (
            <div key={ex.id} style={{
              border: '1px solid var(--border)', borderRadius: 12, marginBottom: 16, overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                background: 'var(--bg)', cursor: 'pointer'
              }}
                onClick={() => setExercises(prev => prev.map((e, i) => i === exIdx ? { ...e, _expanded: !e._expanded } : e))}>
                <ChevronDown size={16} style={{
                  transform: ex._expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s'
                }} />
                <div style={{ flex: 1 }}>
                  <strong>{ex.title || 'Untitled Exercise'}</strong>
                  <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {ex.type} • {(ex.questions || []).length} questions
                  </span>
                </div>
                <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                  onClick={(e) => { e.stopPropagation(); setExercises(prev => prev.filter((_, i) => i !== exIdx)); }}>
                  <Trash2 size={14} />
                </button>
              </div>

              {ex._expanded && (
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div className="form-group">
                      <label>Title</label>
                      <input className="clay-input" value={ex.title}
                        onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? { ...x, title: e.target.value } : x))} />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select className="clay-input" value={ex.type}
                        onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? { ...x, type: e.target.value } : x))}>
                        {EXERCISE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Level</label>
                      <select className="clay-input" value={ex.level || 'A1'}
                        onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? { ...x, level: e.target.value } : x))}>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Duration (min)</label>
                      <input type="number" className="clay-input" value={ex.durationMinutes || 15}
                        onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? { ...x, durationMinutes: parseInt(e.target.value) } : x))} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Instructions</label>
                      <input className="clay-input" value={ex.instructions || ''}
                        onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? { ...x, instructions: e.target.value } : x))}
                        placeholder="Read the passage and answer the questions..." />
                    </div>
                  </div>

                  {/* Questions */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontWeight: 600 }}>Questions</label>
                      <button className="btn btn-sm btn-outline" onClick={() => handleAddQuestion(ex.id)}>
                        <Plus size={14} /> Add Question
                      </button>
                    </div>

                    {(ex.questions || []).map((q, qIdx) => (
                      <div key={q.id || qIdx} style={{
                        background: 'var(--bg)', borderRadius: 8, padding: 12, marginBottom: 8
                      }}>
                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Question {qIdx + 1}</label>
                          <input className="clay-input" value={q.question}
                            onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? {
                              ...x, questions: x.questions.map((qq, j) => j === qIdx ? { ...qq, question: e.target.value } : qq)
                            } : x))}
                            placeholder="Enter the question..." />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <div className="form-group">
                            <label style={{ fontSize: '0.8rem' }}>Type</label>
                            <select className="clay-input" value={q.type}
                              onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? {
                                ...x, questions: x.questions.map((qq, j) => j === qIdx ? { ...qq, type: e.target.value } : qq)
                              } : x))}>
                              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label style={{ fontSize: '0.8rem' }}>Points</label>
                            <input type="number" className="clay-input" value={q.points || 10}
                              onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? {
                                ...x, questions: x.questions.map((qq, j) => j === qIdx ? { ...qq, points: parseInt(e.target.value) } : qq)
                              } : x))} />
                          </div>
                        </div>
                        {(q.type === 'MULTIPLE_CHOICE' || q.type === 'DRAG_DROP') && (
                          <div className="form-group">
                            <label style={{ fontSize: '0.8rem' }}>Options (comma-separated or fill)</label>
                            {((q.options && q.options.length) ? q.options : ['', '', '', '']).map((opt, oIdx) => (
                              <input key={oIdx} className="clay-input" value={opt}
                                style={{ marginBottom: 4 }}
                                onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? {
                                  ...x, questions: x.questions.map((qq, j) => j === qIdx ? {
                                    ...qq, options: qq.options.map((oo, k) => k === oIdx ? e.target.value : oo)
                                  } : qq)
                                } : x))}
                                placeholder={`Option ${oIdx + 1}`} />
                            ))}
                          </div>
                        )}
                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Correct Answer</label>
                          <input className="clay-input" value={q.correctAnswer}
                            onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? {
                              ...x, questions: x.questions.map((qq, j) => j === qIdx ? { ...qq, correctAnswer: e.target.value } : qq)
                            } : x))}
                            placeholder="Correct answer or option text" />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.8rem' }}>Explanation</label>
                          <input className="clay-input" value={q.explanation || ''}
                            onChange={e => setExercises(prev => prev.map((x, i) => i === exIdx ? {
                              ...x, questions: x.questions.map((qq, j) => j === qIdx ? { ...qq, explanation: e.target.value } : qq)
                            } : x))}
                            placeholder="Why is this the correct answer?" />
                        </div>
                        <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                          onClick={() => setExercises(prev => prev.map((x, i) => i === exIdx ? {
                            ...x, questions: x.questions.filter((qq, j) => j !== qIdx)
                          } : x))}>
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {exercises.length > 0 && (
            <button className="btn btn-primary" onClick={handleSaveExercises} disabled={saving} style={{ marginTop: 8 }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save All Exercises'}
            </button>
          )}
        </div>
      )}

      {/* ===================== MINI TEST TAB ===================== */}
      {activeTab === 'miniTest' && (
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Mini Test</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label>Title</label>
              <input className="clay-input" value={miniTestForm.title}
                onChange={e => setMiniTestForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Quick Check" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input className="clay-input" value={miniTestForm.description}
                onChange={e => setMiniTestForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Test your understanding..." />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" className="clay-input" value={miniTestForm.durationMinutes}
                onChange={e => setMiniTestForm(p => ({ ...p, durationMinutes: parseInt(e.target.value) || 15 }))} />
            </div>
            <div className="form-group">
              <label>Passing Score (%)</label>
              <input type="number" className="clay-input" value={miniTestForm.passingScore}
                onChange={e => setMiniTestForm(p => ({ ...p, passingScore: parseInt(e.target.value) || 60 }))} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontWeight: 600 }}>Questions</label>
            <button className="btn btn-sm btn-outline" onClick={handleAddMiniTestQuestion}>
              <Plus size={14} /> Add Question
            </button>
          </div>

          {miniTestForm.questions.map((q, qIdx) => (
            <div key={q.id || qIdx} style={{
              background: 'var(--bg)', borderRadius: 12, padding: 16, marginBottom: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>Question {qIdx + 1}</span>
                <button className="btn btn-sm" style={{ color: 'var(--danger)' }}
                  onClick={() => setMiniTestForm(p => ({
                    ...p, questions: p.questions.filter((_, i) => i !== qIdx)
                  }))}>
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem' }}>Question Text</label>
                <input className="clay-input" value={q.question}
                  onChange={e => setMiniTestForm(p => ({
                    ...p, questions: p.questions.map((qq, j) => j === qIdx ? { ...qq, question: e.target.value } : qq)
                  }))}
                  placeholder="What is the capital of France?" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>Type</label>
                  <select className="clay-input" value={q.type}
                    onChange={e => setMiniTestForm(p => ({
                      ...p, questions: p.questions.map((qq, j) => j === qIdx ? { ...qq, type: e.target.value } : qq)
                    }))}>
                    {QUESTION_TYPES.filter(t => ['MULTIPLE_CHOICE', 'FILL_BLANK', 'DRAG_DROP', 'LISTENING_CONTENT', 'READING_PASSAGE'].includes(t.value))
                      .map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>Points</label>
                  <input type="number" className="clay-input" value={q.points || 10}
                    onChange={e => setMiniTestForm(p => ({
                      ...p, questions: p.questions.map((qq, j) => j === qIdx ? { ...qq, points: parseInt(e.target.value) } : qq)
                    }))} />
                </div>
              </div>

              {q.type === 'MULTIPLE_CHOICE' && (
                <div>
                  {q.options.map((opt, oIdx) => (
                    <input key={oIdx} className="clay-input" value={opt}
                      style={{ marginBottom: 4 }}
                      onChange={e => setMiniTestForm(p => ({
                        ...p, questions: p.questions.map((qq, j) => j === qIdx ? {
                          ...qq, options: (qq.options || ['', '', '', '']).map((oo, k) => k === oIdx ? e.target.value : oo)
                        } : qq)
                      }))}
                      placeholder={`Option ${oIdx + 1}`} />
                  ))}
                </div>
              )}

              <div className="form-group">
                <label style={{ fontSize: '0.8rem' }}>Correct Answer</label>
                <input className="clay-input" value={q.correctAnswer}
                  onChange={e => setMiniTestForm(p => ({
                    ...p, questions: p.questions.map((qq, j) => j === qIdx ? { ...qq, correctAnswer: e.target.value } : qq)
                  }))}
                  placeholder="Paris" />
              </div>
            </div>
          ))}

          <button className="btn btn-primary" onClick={handleSaveMiniTest} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Mini Test'}
          </button>
        </div>
      )}

      {/* ===================== COMPLETION TAB ===================== */}
      {activeTab === 'completion' && (
        <div className="clay-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Completion Settings</h3>

          <div style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={completionSettings.requireContentView}
                onChange={e => setCompletionSettings(p => ({ ...p, requireContentView: e.target.checked }))} />
              Require content to be viewed before completion
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={completionSettings.requireExercises}
                onChange={e => setCompletionSettings(p => ({ ...p, requireExercises: e.target.checked }))} />
              Require exercises to be completed
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={completionSettings.requireMiniTest}
                onChange={e => setCompletionSettings(p => ({ ...p, requireMiniTest: e.target.checked }))} />
              Require mini test to be passed
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Minimum Test Score (%)</label>
                <input type="number" className="clay-input" value={completionSettings.minTestScore}
                  onChange={e => setCompletionSettings(p => ({ ...p, minTestScore: parseInt(e.target.value) || 60 }))} />
              </div>
              <div className="form-group">
                <label>Minimum Exercise Score</label>
                <input type="number" className="clay-input" value={completionSettings.minExerciseScore}
                  onChange={e => setCompletionSettings(p => ({ ...p, minExerciseScore: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={completionSettings.autoUnlockNext}
                onChange={e => setCompletionSettings(p => ({ ...p, autoUnlockNext: e.target.checked }))} />
              Auto-unlock next lesson on completion
            </label>

            <div className="form-group">
              <label>Completion Message</label>
              <textarea className="clay-textarea" rows={3} value={completionSettings.completionMessage}
                onChange={e => setCompletionSettings(p => ({ ...p, completionMessage: e.target.value }))}
                placeholder="Congratulations! You have completed this lesson." />
            </div>

            <div className="form-group">
              <label>Certificate Template</label>
              <input className="clay-input" value={completionSettings.certificateTemplate}
                onChange={e => setCompletionSettings(p => ({ ...p, certificateTemplate: e.target.value }))}
                placeholder="default" />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSaveCompletionSettings} disabled={saving} style={{ marginTop: 16 }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  );
}
