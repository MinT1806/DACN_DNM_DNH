import React, { useEffect, useState } from 'react';
import { adminAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Users, BarChart2, BookOpen,   Shield, Trash2, Edit3, Search, ChevronLeft, ChevronRight,
  TrendingUp, Award, Target, TestTube, Trophy, BarChart, Plus, Eye, EyeOff, Save, CheckCircle, XCircle
} from 'lucide-react';

const ROLE_COLORS = { ADMIN: '#ef4444', TEACHER: '#3b82f6', STUDENT: '#22C55E' };
const LEVEL_COLORS = { A1: '#22C55E', A2: '#3b82f6', B1: '#f59e0b', B2: '#8b5cf6', C1: '#ef4444', C2: '#6366f1' };

const TEST_TYPES = [
  'VOCAB_QUIZ', 'GRAMMAR', 'LISTENING', 'READING', 'WRITING', 'SPEAKING',
  'MIXED', 'WEEKLY_TEST', 'MIDTERM', 'FINAL', 'PLACEMENT'
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function AdminDashboardPage({ tab: initialTab = 'stats' }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tests, setTests] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [pagination, setPagination] = useState({ page: 0, size: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ role: '', level: '', search: '' });
  const [testFilter, setTestFilter] = useState({ type: '', level: '', search: '' });
  const [creatingTest, setCreatingTest] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [testForm, setTestForm] = useState({
    title: '', description: '', type: 'VOCAB_QUIZ', level: 'A1',
    durationMinutes: 30, passingScore: 6, totalQuestions: 10, timed: true,
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '0' }],
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tab === 'stats') loadStats();
    if (tab === 'users') loadUsers();
    if (tab === 'tests') loadTests();
    if (tab === 'ranking') loadRanking();
  }, [tab]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tab === 'users') loadUsers();
  }, [filters.role, filters.level, filters.search]);

  const loadStats = () => {
    setLoading(true);
    adminAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => toast.error('Không thể tải thống kê'))
      .finally(() => setLoading(false));
  };

  const loadUsers = (page = 0) => {
    setLoading(true);
    adminAPI.getUsers(filters.role || null, filters.level || null, page, 20, filters.search || null)
      .then(r => {
        setUsers(r.data.users || []);
        setPagination({
          page: r.data.page, size: r.data.size, total: r.data.total, totalPages: r.data.totalPages,
        });
      })
      .catch(() => toast.error('Không thể tải users'))
      .finally(() => setLoading(false));
  };

  const loadTests = () => {
    setLoading(true);
    adminAPI.getTests()
      .then(r => setTests(r.data || []))
      .catch(() => toast.error('Không thể tải danh sách test'))
      .finally(() => setLoading(false));
  };

  const loadRanking = () => {
    setLoading(true);
    adminAPI.getRanking('all', 50)
      .then(r => setRanking(r.data || []))
      .catch(() => toast.error('Không thể tải ranking'))
      .finally(() => setLoading(false));
  };

  const handleRoleUpdate = async (userId) => {
    if (!newRole) return;
    try {
      await adminAPI.updateRole(userId, newRole);
      toast.success('Đã cập nhật role!');
      setEditUser(null);
      loadUsers(pagination.page);
    } catch { toast.error('Lỗi cập nhật role'); }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Xóa user "${username}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success('Đã xóa user');
      loadUsers(pagination.page);
    } catch { toast.error('Lỗi xóa user'); }
  };

  const handleToggleTest = async (testId, currentActive) => {
    try {
      await adminAPI.updateTest(testId, { active: !currentActive });
      toast.success(!currentActive ? 'Đã vô hiệu hóa test' : 'Đã kích hoạt test');
      loadTests();
    } catch { toast.error('Lỗi cập nhật test'); }
  };

  const handleDeleteTest = async (testId, title) => {
    if (!window.confirm(`Xóa test "${title}"?`)) return;
    try {
      await adminAPI.deleteTest(testId);
      toast.success('Đã xóa test');
      loadTests();
    } catch { toast.error('Lỗi xóa test'); }
  };

  const handleSaveTest = async () => {
    if (!testForm.title.trim()) { toast.warning('Vui lòng nhập tiêu đề'); return; }
    setLoading(true);
    try {
      const validQuestions = testForm.questions.filter(q => q.question.trim());
      if (validQuestions.length === 0) {
        toast.warning('Vui lòng thêm ít nhất 1 câu hỏi');
        setLoading(false);
        return;
      }
      const data = {
        ...testForm,
        questionData: JSON.stringify(validQuestions),
        totalQuestions: validQuestions.length,
      };
      if (editTest) {
        await adminAPI.updateTest(editTest, data);
        toast.success('Đã cập nhật test');
      } else {
        await adminAPI.createTest(data);
        toast.success('Đã tạo test mới');
      }
      setCreatingTest(false);
      setEditTest(null);
      resetForm();
      loadTests();
    } catch (e) { toast.error('Lỗi lưu test: ' + (e.response?.data?.error || e.message)); }
    finally { setLoading(false); }
  };

  const handleEditTest = (test) => {
    let questions = [{ question: '', options: ['', '', '', ''], correctAnswer: '0' }];
    try {
      if (typeof test.questionData === 'string') {
        questions = JSON.parse(test.questionData || '[]');
      } else if (Array.isArray(test.questionData)) {
        questions = test.questionData;
      }
      if (!Array.isArray(questions) || questions.length === 0) {
        questions = [{ question: '', options: ['', '', '', ''], correctAnswer: '0' }];
      }
    } catch {}
    setTestForm({
      title: test.title, description: test.description || '',
      type: test.type || 'VOCAB_QUIZ', level: test.level || 'A1',
      durationMinutes: test.duration || 30, passingScore: test.passingScore || 6,
      totalQuestions: questions.length, timed: test.timed !== false,
      questions,
    });
    setEditTest(test.id);
    setCreatingTest(true);
  };

  const resetForm = () => {
    setTestForm({
      title: '', description: '', type: 'VOCAB_QUIZ', level: 'A1',
      durationMinutes: 30, passingScore: 6, totalQuestions: 10, timed: true,
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: '0' }],
    });
  };

  const addQuestion = () => {
    setTestForm(f => ({
      ...f,
      questions: [...f.questions, { question: '', options: ['', '', '', ''], correctAnswer: '0' }],
    }));
  };

  const removeQuestion = (idx) => {
    setTestForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  };

  const updateQuestion = (idx, field, value) => {
    setTestForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === idx ? { ...q, [field]: value } : q),
    }));
  };

  const filteredTests = tests.filter(t => {
    if (testFilter.type && t.type !== testFilter.type) return false;
    if (testFilter.level && t.level !== testFilter.level) return false;
    if (testFilter.search && !t.title?.toLowerCase().includes(testFilter.search.toLowerCase())) return false;
    return true;
  });

  const tabs = [
    { id: 'stats', label: 'Thống kê', icon: <BarChart2 size={16} /> },
    { id: 'users', label: 'Quản lý Users', icon: <Users size={16} /> },
    { id: 'tests', label: 'Quản lý Tests', icon: <TestTube size={16} /> },
    { id: 'moderation', label: 'Duyệt nội dung', icon: <Shield size={16} /> },
    { id: 'ranking', label: 'Xếp hạng', icon: <Trophy size={16} /> },
  ];

  // Admin-only guard — teachers go to /teacher
  if (!user || user.role !== 'ADMIN') {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '32px 24px', textAlign: 'center' }}>
        <Shield size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <h2 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Truy cập bị từ chối</h2>
        <p style={{ color: '#718096', fontWeight: 600, marginBottom: 20 }}>Chỉ Quản trị viên mới có quyền truy cập trang này.</p>
        <a href="/teacher" style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, display: 'inline-block' }}>
          → Trang Giáo viên
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={26} color="white" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontWeight: 900, fontSize: '1.8rem', color: '#1a202c', margin: 0 }}>Admin Dashboard</h1>
            <span style={{ padding: '3px 10px', borderRadius: 20, background: '#ef444422', color: '#ef4444', fontSize: '0.72rem', fontWeight: 800 }}>QUẢN TRỊ</span>
          </div>
          <p style={{ color: '#718096', fontWeight: 600, margin: 0 }}>Quản lý toàn bộ hệ thống ABC English</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="clay-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: tab === t.id ? 'linear-gradient(135deg, #ef4444, #dc2626)' : undefined,
              color: tab === t.id ? 'white' : undefined,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── STATS TAB ── */}
      {tab === 'stats' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096', fontWeight: 700 }}>⏳ Đang tải...</div>
          ) : stats ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                  { icon: <Users size={24} />, label: 'Tổng Users', value: stats.totalUsers, color: '#3b82f6' },
                  { icon: <BookOpen size={24} />, label: 'Khóa học', value: stats.totalCourses, color: '#22C55E' },
                  { icon: <Target size={24} />, label: 'Bài tập hoàn thành', value: stats.totalExercises, color: '#f59e0b' },
                  { icon: <Award size={24} />, label: 'Từ vựng', value: stats.totalVocabulary || 0, color: '#8b5cf6' },
                  { icon: <TrendingUp size={24} />, label: 'Điểm TB', value: `${stats.platformAverageScore || 0}/10`, color: '#FDBCB4' },
                  { icon: <Users size={24} />, label: 'Users mới (tuần)', value: stats.newUsersThisWeek, color: '#22C55E' },
                  { icon: <BarChart size={24} />, label: 'Users mới (tháng)', value: stats.newUsersThisMonth, color: '#3b82f6' },
                  { icon: <BarChart2 size={24} />, label: 'Tỷ lệ hoàn thành', value: `${stats.completionRate || 0}%`, color: '#8b5cf6' },
                ].map((s, i) => (
                  <div key={i} className="clay-card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontWeight: 900, fontSize: '1.5rem', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 700 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
                <div className="clay-card" style={{ padding: 24 }}>
                  <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 16 }}>Users theo Role</h3>
                  {Object.entries(stats.usersByRole || {}).map(([role, count]) => (
                    <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 8, background: (ROLE_COLORS[role] || '#22C55E') + '22', color: ROLE_COLORS[role] || '#22C55E', fontWeight: 800, fontSize: '0.75rem' }}>{role}</span>
                      <span style={{ fontWeight: 900, color: '#1a202c' }}>{count}</span>
                    </div>
                  ))}
                </div>
                <div className="clay-card" style={{ padding: 24 }}>
                  <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 16 }}>Users theo Level</h3>
                  {Object.entries(stats.usersByLevel || {}).map(([level, count]) => (
                    <div key={level} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 8, background: (LEVEL_COLORS[level] || '#22C55E') + '22', color: LEVEL_COLORS[level] || '#22C55E', fontWeight: 800, fontSize: '0.75rem' }}>{level}</span>
                      <div style={{ flex: 1, margin: '0 12px', height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                        <div style={{ height: '100%', borderRadius: 3, background: LEVEL_COLORS[level] || '#22C55E', width: `${(count / (stats.totalUsers || 1)) * 100}%` }} />
                      </div>
                      <span style={{ fontWeight: 900, color: '#1a202c', minWidth: 24, textAlign: 'right' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096', fontWeight: 700 }}>Không thể tải dữ liệu</div>
          )}
        </div>
      )}

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div>
          <div className="clay-card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#718096' }} />
              <input className="clay-input" placeholder="Tìm kiếm username, email, tên..." value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} style={{ paddingLeft: 36, width: '100%' }} />
            </div>
            <select className="clay-input" style={{ minWidth: 130 }} value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}>
              <option value="">Tất cả Role</option>
              <option value="STUDENT">STUDENT</option>
              <option value="TEACHER">TEACHER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select className="clay-input" style={{ minWidth: 100 }} value={filters.level} onChange={e => setFilters(f => ({ ...f, level: e.target.value }))}>
              <option value="">Tất cả Level</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <span style={{ color: '#718096', fontWeight: 600, fontSize: '0.85rem' }}>{pagination.total} users</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096', fontWeight: 700 }}>⏳ Đang tải...</div>
          ) : (
            <div className="clay-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                      {['ID', 'Username', 'Email', 'Level', 'Role', 'Bài tập', 'Điểm', 'Hành động'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, fontSize: '0.82rem', color: '#718096', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#718096', fontSize: '0.85rem' }}>{u.id}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.9rem' }}>{u.username}</div>
                          {u.fullName && <div style={{ fontSize: '0.75rem', color: '#718096' }}>{u.fullName}</div>}
                          <div style={{ fontSize: '0.7rem', color: '#a0aec0', marginTop: 2 }}>
                            {u.createdAt ? `Tham gia: ${new Date(u.createdAt).toLocaleDateString('vi-VN')}` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 600 }}>{u.email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 8, background: (LEVEL_COLORS[u.level] || '#718096') + '22', color: LEVEL_COLORS[u.level] || '#718096', fontWeight: 800, fontSize: '0.75rem' }}>{u.level || '—'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {editUser === u.id ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <select className="clay-input" style={{ padding: '4px 8px', fontSize: '0.8rem' }} value={newRole} onChange={e => setNewRole(e.target.value)}>
                                <option value="">Chọn role</option>
                                <option value="STUDENT">STUDENT</option>
                                <option value="TEACHER">TEACHER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                              <button className="clay-btn" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#22C55E', color: 'white', border: 'none' }} onClick={() => handleRoleUpdate(u.id)}>✓</button>
                              <button className="clay-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setEditUser(null)}>✗</button>
                            </div>
                          ) : (
                            <span style={{ padding: '3px 10px', borderRadius: 8, background: (ROLE_COLORS[u.role] || '#22C55E') + '22', color: ROLE_COLORS[u.role] || '#22C55E', fontWeight: 800, fontSize: '0.75rem' }}>{u.role || '—'}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4a5568', fontSize: '0.85rem' }}>{u.totalExercises || 0}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#22C55E', fontSize: '0.85rem' }}>{u.totalPoints || 0}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => { setEditUser(u.id); setNewRole(u.role || ''); }}
                              style={{ background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#3b82f6' }} title="Sửa role">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDelete(u.id, u.username)}
                              style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#ef4444' }} title="Xóa user">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#718096', fontWeight: 600 }}>Không có dữ liệu</div>
              )}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <button className="clay-btn" onClick={() => loadUsers(pagination.page - 1)} disabled={pagination.page === 0}
                style={{ opacity: pagination.page === 0 ? 0.5 : 1 }}>
                <ChevronLeft size={16} /> Trước
              </button>
              <span style={{ fontWeight: 700, color: '#4a5568' }}>Trang {pagination.page + 1} / {pagination.totalPages}</span>
              <button className="clay-btn" onClick={() => loadUsers(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages - 1}
                style={{ opacity: pagination.page >= pagination.totalPages - 1 ? 0.5 : 1 }}>
                Sau <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TESTS TAB ── */}
      {tab === 'tests' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <select className="clay-input" style={{ minWidth: 140 }} value={testFilter.type}
                onChange={e => setTestFilter(f => ({ ...f, type: e.target.value }))}>
                <option value="">Tất cả loại</option>
                {TEST_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
              <select className="clay-input" style={{ minWidth: 100 }} value={testFilter.level}
                onChange={e => setTestFilter(f => ({ ...f, level: e.target.value }))}>
                <option value="">Tất cả level</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <input className="clay-input" placeholder="Tìm kiếm test..." style={{ minWidth: 180 }}
                value={testFilter.search} onChange={e => setTestFilter(f => ({ ...f, search: e.target.value }))} />
            </div>
            <button className="clay-btn clay-btn-primary" onClick={() => { resetForm(); setEditTest(null); setCreatingTest(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Tạo Test mới
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096', fontWeight: 700 }}>⏳ Đang tải...</div>
          ) : (
            <div className="clay-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                    {['ID', 'Tiêu đề', 'Loại', 'Level', 'Thời gian', 'Câu', 'Điểm đạt', 'Active', 'Hành động'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, fontSize: '0.82rem', color: '#718096', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.map(t => (
                    <tr key={t.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#718096', fontSize: '0.85rem' }}>{t.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#1a202c', fontSize: '0.85rem' }}>{t.title}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 8, background: '#8b5cf622', color: '#8b5cf6', fontWeight: 800, fontSize: '0.75rem' }}>
                          {t.type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 8, background: (LEVEL_COLORS[t.level] || '#718096') + '22', color: LEVEL_COLORS[t.level] || '#718096', fontWeight: 800, fontSize: '0.75rem' }}>{t.level || '—'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4a5568', fontSize: '0.85rem' }}>{t.duration} phút</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#4a5568', fontSize: '0.85rem' }}>{t.totalQuestions}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#22C55E', fontSize: '0.85rem' }}>{t.passingScore}/{t.maxScore}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 8, background: t.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: t.active ? '#16a34a' : '#dc2626', fontWeight: 800, fontSize: '0.75rem' }}>
                          {t.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleEditTest(t)}
                            style={{ background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#3b82f6' }} title="Sửa">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleToggleTest(t.id, t.active)}
                            style={{ background: t.active ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: t.active ? '#f59e0b' : '#22C55E' }} title={t.active ? 'Vô hiệu hóa' : 'Kích hoạt'}>
                            {t.active ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button onClick={() => handleDeleteTest(t.id, t.title)}
                            style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#ef4444' }} title="Xóa">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#718096', fontWeight: 600 }}>Không có test nào</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── RANKING TAB ── */}
      {tab === 'ranking' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096', fontWeight: 700 }}>⏳ Đang tải...</div>
          ) : ranking.length === 0 ? (
            <div className="clay-card" style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏆</div>
              <div style={{ fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Chưa có dữ liệu ranking</div>
              <p style={{ color: '#718096', fontWeight: 600 }}>Khi có kết quả test, bảng xếp hạng sẽ hiển thị tại đây</p>
            </div>
          ) : (
            <div className="clay-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                    {['#', 'Học viên', 'Level', 'XP', 'Quiz', 'Test', 'Điểm TB', 'Huy hiệu'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem', color: '#718096', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((entry, i) => {
                    const isTop3 = entry.rank <= 3;
                    return (
                      <tr key={i} style={{
                        borderTop: '1px solid rgba(0,0,0,0.05)',
                        background: isTop3 ? (entry.rank === 1 ? 'rgba(255,215,0,0.05)' : entry.rank === 2 ? 'rgba(192,192,192,0.05)' : 'rgba(205,127,50,0.05)') : undefined,
                      }}>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 900, fontSize: '1rem',
                            color: entry.rank === 1 ? '#FFD700' : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : '#718096',
                          }}>
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 800, color: '#1a202c', fontSize: '0.9rem' }}>{entry.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#718096' }}>{entry.username}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 8, background: (LEVEL_COLORS[entry.level] || '#718096') + '22', color: LEVEL_COLORS[entry.level] || '#718096', fontWeight: 800, fontSize: '0.75rem' }}>{entry.level || '—'}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 900, color: '#f59e0b', fontSize: '0.9rem' }}>{entry.totalPoints} XP</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#4a5568', fontSize: '0.85rem' }}>{entry.quizCount}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#4a5568', fontSize: '0.85rem' }}>{entry.testCount}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: entry.avgScore >= 8 ? '#22C55E' : entry.avgScore >= 6 ? '#f59e0b' : '#ef4444' }}>
                            {entry.avgScore}/10
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#8b5cf6', fontSize: '0.85rem' }}>{entry.badgeCount}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE/EDIT TEST MODAL ── */}
      {creatingTest && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '20px', overflowY: 'auto',
        }}>
          <div className="clay-card" style={{ padding: 28, maxWidth: 800, width: '100%', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 900, color: '#1a202c', margin: 0 }}>
                {editTest ? 'Sửa Test' : 'Tạo Test mới'}
              </h2>
              <button className="clay-btn" onClick={() => { setCreatingTest(false); setEditTest(null); resetForm(); }}>✕ Đóng</button>
            </div>

            {/* Basic info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Tiêu đề *</label>
                <input className="clay-input" value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} placeholder="VD: Bài kiểm tra từ vựng A1" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Mô tả</label>
                <textarea className="clay-input" rows={2} value={testForm.description} onChange={e => setTestForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả bài kiểm tra..." />
              </div>
              <div>
                <label style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Loại</label>
                <select className="clay-input" value={testForm.type} onChange={e => setTestForm(f => ({ ...f, type: e.target.value }))}>
                  {TEST_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Level</label>
                <select className="clay-input" value={testForm.level} onChange={e => setTestForm(f => ({ ...f, level: e.target.value }))}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Thời gian (phút)</label>
                <input className="clay-input" type="number" value={testForm.durationMinutes} onChange={e => setTestForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Số câu hỏi</label>
                <input className="clay-input" type="text" value={testForm.questions.length} readOnly title="Tự động tính từ Số câu hỏi" />
              </div>
              <div>
                <label style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Điểm đạt (trên thang 10)</label>
                <input className="clay-input" type="number" value={testForm.passingScore} onChange={e => setTestForm(f => ({ ...f, passingScore: Number(e.target.value) }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: 28 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, color: '#4a5568' }}>
                  <input type="checkbox" checked={testForm.timed} onChange={e => setTestForm(f => ({ ...f, timed: e.target.checked }))} />
                  Có giới hạn thời gian
                </label>
              </div>
            </div>

            {/* Questions */}
            <h3 style={{ fontWeight: 800, color: '#1a202c', marginBottom: 16 }}>Câu hỏi ({testForm.questions.length})</h3>
            {testForm.questions.map((q, idx) => (
              <div key={idx} style={{ padding: 16, borderRadius: 12, background: 'rgba(0,0,0,0.03)', marginBottom: 12, border: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, color: '#1a202c' }}>Câu {idx + 1}</div>
                  {testForm.questions.length > 1 && (
                    <button onClick={() => removeQuestion(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem' }}>Xóa</button>
                  )}
                </div>
                <textarea className="clay-input" rows={2} placeholder="Nội dung câu hỏi..."
                  value={q.question} onChange={e => updateQuestion(idx, 'question', e.target.value)}
                  style={{ marginBottom: 10 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.75rem', color: '#718096' }}>{String.fromCharCode(65 + optIdx)}.</span>
                      <input className="clay-input" placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                        value={opt} onChange={e => {
                          const newOpts = [...q.options];
                          newOpts[optIdx] = e.target.value;
                          updateQuestion(idx, 'options', newOpts);
                        }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.8rem' }}>Đáp án đúng: </label>
                  <select className="clay-input" style={{ display: 'inline-block', width: 'auto', marginLeft: 8 }}
                    value={q.correctAnswer} onChange={e => updateQuestion(idx, 'correctAnswer', e.target.value)}>
                    {q.options.map((_, optIdx) => <option key={optIdx} value={String(optIdx)}>{String.fromCharCode(65 + optIdx)}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <button className="clay-btn" onClick={addQuestion} style={{ marginBottom: 24 }}>
              <Plus size={14} style={{ marginRight: 6 }} /> Thêm câu hỏi
            </button>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="clay-btn" onClick={() => { setCreatingTest(false); setEditTest(null); resetForm(); }} style={{ flex: 1 }}>
                Hủy
              </button>
              <button className="clay-btn clay-btn-primary" onClick={handleSaveTest} disabled={loading} style={{ flex: 1 }}>
                <Save size={14} style={{ marginRight: 6 }} />
                {loading ? 'Đang lưu...' : (editTest ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Moderation Panel ──────────────────────────────────────────────────────────
function ModerationPanel() {
  const [pendingLessons, setPendingLessons] = useState([]);
  const [pendingExercises, setPendingExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('lessons');

  useEffect(() => {
    if (activeTab === 'lessons') loadPendingLessons();
    else loadPendingExercises();
  }, [activeTab]);

  const loadPendingLessons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setPendingLessons(res.data?.data || []);
    } catch {}
    setLoading(false);
  };

  const loadPendingExercises = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exercises', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const all = res.data?.data || [];
        setPendingExercises(all.filter(e => !e.active));
      }
    } catch {}
    setLoading(false);
  };

  const approveLesson = async (id) => {
    try {
      await fetch(`/api/courses/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPendingLessons(prev => prev.filter(l => l.id !== id));
    } catch {}
  };

  const approveExercise = async (id) => {
    try {
      await fetch(`/api/exercises/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPendingExercises(prev => prev.filter(e => e.id !== id));
    } catch {}
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontWeight: 800, color: '#1a202c' }}>Duyệt nội dung</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ id: 'lessons', label: 'Bài học' }, { id: 'exercises', label: 'Bài tập' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="clay-btn"
              style={{
                background: activeTab === t.id ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'white',
                color: activeTab === t.id ? 'white' : '#718096',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#718096', fontWeight: 600 }}>
          ⏳ Đang tải...
        </div>
      ) : activeTab === 'lessons' ? (
        pendingLessons.length === 0 ? (
          <div className="clay-card" style={{ padding: 40, textAlign: 'center' }}>
            <Shield size={40} color="#a0aec0" style={{ marginBottom: 12 }} />
            <p style={{ color: '#718096', fontWeight: 600 }}>Không có bài học nào đang chờ duyệt</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingLessons.map(lesson => (
              <div key={lesson.id} className="clay-card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#1a202c', fontSize: '1rem', marginBottom: 4 }}>{lesson.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#718096' }}>{lesson.description}</div>
                  <div style={{ fontSize: '0.78rem', color: '#a0aec0', marginTop: 4 }}>Level: {lesson.level}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => approveLesson(lesson.id)}
                    className="clay-btn"
                    style={{ background: '#22C55E22', color: '#22C55E', border: '2px solid #22C55E33', padding: '8px 16px' }}>
                    <CheckCircle size={15} /> Duyệt
                  </button>
                  <button className="clay-btn"
                    style={{ background: '#ef444422', color: '#ef4444', border: '2px solid #ef444433', padding: '8px 16px' }}>
                    <XCircle size={15} /> Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        pendingExercises.length === 0 ? (
          <div className="clay-card" style={{ padding: 40, textAlign: 'center' }}>
            <Shield size={40} color="#a0aec0" style={{ marginBottom: 12 }} />
            <p style={{ color: '#718096', fontWeight: 600 }}>Không có bài tập nào đang chờ duyệt</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingExercises.map(ex => (
              <div key={ex.id} className="clay-card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#1a202c', fontSize: '1rem', marginBottom: 4 }}>{ex.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#718096' }}>{ex.description}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: '0.78rem', color: '#a0aec0' }}>
                    <span>{ex.type}</span>
                    <span> - {ex.level}</span>
                    <span> - {ex.questionsCount} câu</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => approveExercise(ex.id)}
                    className="clay-btn"
                    style={{ background: '#22C55E22', color: '#22C55E', border: '2px solid #22C55E33', padding: '8px 16px' }}>
                    <CheckCircle size={15} /> Duyệt
                  </button>
                  <button className="clay-btn"
                    style={{ background: '#ef444422', color: '#ef4444', border: '2px solid #ef444433', padding: '8px 16px' }}>
                    <XCircle size={15} /> Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
