import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle, BookOpen, Video, FileText, ChevronLeft, ChevronRight,
  BarChart2, Edit, Settings, GraduationCap, Target, Zap,
  Clock, Star, Users, ArrowLeft, PlayCircle, Lock, Award
} from 'lucide-react';
import { courseManagementAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list' | 'detail'

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = user?.id || localStorage.getItem('userId') || 0;
      const res = await courseManagementAPI.getDetail(id);
      if (res.data?.success) {
        setCourse(res.data.data);
      } else if (res.data) {
        setCourse(res.data);
      }
    } catch (e) {
      console.error('Error:', e);
      setError('Không thể tải khóa học. Vui lòng thử lại.');
    }
    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => { fetchCourseData(); }, [fetchCourseData]);

  const handleEnroll = async () => {
    if (!user) { toast.warn('Vui lòng đăng nhập để đăng ký khóa học'); navigate('/login'); return; }
    setEnrolling(true);
    try {
      await courseManagementAPI.enroll(id);
      toast.success('Đăng ký khóa học thành công!');
      fetchCourseData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Đăng ký thất bại');
    }
    setEnrolling(false);
  };

  const openLesson = (lesson) => {
    if (lesson.locked) { toast.info('Hoàn thành bài trước để mở khóa bài này'); return; }
    navigate(`/lesson/${lesson.id}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏳</div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.1rem' }}>
          Đang tải khóa học...
        </p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
        <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error || 'Không tìm thấy khóa học'}</p>
        <button className="btn btn-primary" onClick={fetchCourseData} style={{ marginTop: 16 }}>Thử lại</button>
      </div>
    );
  }

  const lessons = course.lessons || [];
  const progress = course.progress;
  const progressPercent = progress?.percentage || 0;
  const completedCount = lessons.filter(l => l.completed).length;
  const inProgressCount = lessons.filter(l => l.inProgress && !l.completed).length;

  const getLevelColor = (level) => {
    const colors = { A1: '#22c55e', A2: '#84cc16', B1: '#eab308', B2: '#f97316', C1: '#ef4444', C2: '#dc2626' };
    return colors[level] || 'var(--primary)';
  };

  const getLessonTypeIcon = (lesson) => {
    if (lesson.videoUrl) return <Video size={16} />;
    if (lesson.content?.length > 50) return <FileText size={16} />;
    return <BookOpen size={16} />;
  };

  const getStatusBadge = (lesson) => {
    if (lesson.completed) return (
      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: '#22c55e', color: 'white' }}>
        ✓ Hoàn thành
      </span>
    );
    if (lesson.locked) return (
      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: '#e2e8f0', color: '#94a3b8' }}>
        🔒 Khóa
      </span>
    );
    if (lesson.inProgress) return (
      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>
        ◐ Đang học
      </span>
    );
    return (
      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' }}>
        ○ Chưa học
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
      {/* Back link */}
      <Link to="/courses" style={{
        textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem',
        display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
      }}>
        <ArrowLeft size={16} /> Quay lại khóa học
      </Link>

      {/* Course Header */}
      <div className="clay-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Thumbnail */}
          <div style={{
            width: 120, height: 120, borderRadius: 16, flexShrink: 0,
            background: `linear-gradient(135deg, ${getLevelColor(course.level)}, #60a5fa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3rem', fontWeight: 900, color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {course.level || 'A1'}
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', color: '#1a202c' }}>
                {course.title}
              </h1>
              {course.category && (
                <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(59,130,246,0.1)', color: 'var(--primary)' }}>
                  {course.category}
                </span>
              )}
              {course.featured && (
                <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>
                  ⭐ Nổi bật
                </span>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6, fontSize: '0.95rem' }}>
              {course.description}
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <BookOpen size={15} /> {lessons.length} bài học
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={15} /> {lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0)} phút
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={15} /> {course.enrolledCount || 0} học viên
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Star size={15} color="#f59e0b" /> {course.rating?.toFixed(1) || 'N/A'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, color: getLevelColor(course.level) }}>
                <GraduationCap size={15} /> {course.level}
              </span>
            </div>
          </div>

          {/* Progress + Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 180 }}>
            {/* Progress ring */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                background: `conic-gradient(#22c55e ${progressPercent * 3.6}deg, #e2e8f0 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px'
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', background: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '1.2rem', color: '#22c55e'
                }}>
                  {progressPercent}%
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {completedCount}/{lessons.length} bài hoàn thành
              </div>
            </div>

            {/* Enroll / Continue */}
            {course.enrolled ? (
              <button className="btn btn-primary btn-block" onClick={() => {
                const nextLesson = lessons.find(l => !l.completed && !l.locked);
                if (nextLesson) openLesson(nextLesson);
                else navigate(`/lesson/${lessons[0]?.id}`);
              }}>
                <PlayCircle size={16} />
                {completedCount > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
              </button>
            ) : (
              <button className="btn btn-primary btn-block" onClick={handleEnroll} disabled={enrolling}>
                <Zap size={16} />
                {enrolling ? 'Đang đăng ký...' : 'Đăng ký ngay'}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            <span>Tiến độ khóa học</span>
            <span>{completedCount} hoàn thành • {inProgressCount} đang học</span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 8, height: 8, overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`, height: '100%',
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
              borderRadius: 8, transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Stats cards */}
        {progress && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 20 }}>
            {[
              { icon: <Award size={18} />, label: 'Bài hoàn thành', value: `${progress.completedLessons}/${progress.totalLessons}`, color: '#22c55e' },
              { icon: <Clock size={18} />, label: 'Thời gian học', value: `${Math.round(progress.totalTimeSpent / 60)} phút`, color: '#3b82f6' },
              { icon: <Target size={18} />, label: 'Điểm TB', value: `${progress.averageScore.toFixed(0)}%`, color: '#f59e0b' },
              { icon: <BarChart2 size={18} />, label: 'Trạng thái', value: course.enrolled ? '✓ Đã đăng ký' : '○ Chưa đăng ký', color: course.enrolled ? '#22c55e' : '#94a3b8' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: `${stat.color}10`, border: `1px solid ${stat.color}30`,
                borderRadius: 12, padding: '12px 14px', display: 'flex',
                alignItems: 'center', gap: 10
              }}>
                <div style={{ color: stat.color }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a202c' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson List */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', color: '#1a202c' }}>
          📚 Danh sách bài học ({lessons.length})
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            Hoàn thành: {completedCount}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
            Đang học: {inProgressCount}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} />
            Khóa: {lessons.filter(l => l.locked).length}
          </span>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="clay-card" style={{ padding: 48, textAlign: 'center' }}>
          <BookOpen size={48} color="var(--text-secondary)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Khóa học đang được cập nhật nội dung...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lessons.map((lesson, idx) => {
            const isLocked = lesson.locked;
            const isCompleted = lesson.completed;
            const isInProgress = lesson.inProgress;
            return (
              <div
                key={lesson.id}
                className="clay-card"
                onClick={() => openLesson(lesson)}
                style={{
                  padding: '16px 20px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.65 : 1,
                  border: isInProgress ? '2px solid #f59e0b40' : '2px solid transparent',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Left accent bar */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                  background: isCompleted ? '#22c55e' : isInProgress ? '#f59e0b' : isLocked ? '#e2e8f0' : 'var(--primary)',
                  borderRadius: '4px 0 0 4px'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 8 }}>
                  {/* Number */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: isCompleted ? '#22c55e' : isInProgress ? '#fef3c7' : isLocked ? '#f1f5f9' : 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isCompleted ? 'white' : isInProgress ? '#92400e' : isLocked ? '#94a3b8' : 'white',
                    fontWeight: 900, fontSize: '1rem', flexShrink: 0
                  }}>
                    {isCompleted ? <CheckCircle size={20} /> : idx + 1}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.975rem', color: '#1a202c',
                      marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      {lesson.title}
                      {getStatusBadge(lesson)}
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      {lesson.durationMinutes > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} /> {lesson.durationMinutes} phút
                        </span>
                      )}
                      {lesson.score > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star size={13} color="#f59e0b" /> {lesson.score}%
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {getLessonTypeIcon(lesson)}
                        Bài {idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div style={{ flexShrink: 0 }}>
                    {isLocked ? (
                      <Lock size={20} color="#94a3b8" />
                    ) : isCompleted ? (
                      <CheckCircle size={20} color="#22c55e" />
                    ) : isInProgress ? (
                      <PlayCircle size={20} color="#f59e0b" />
                    ) : (
                      <ChevronRight size={20} color="#94a3b8" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Teacher: Edit button */}
      {user && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button className="btn btn-outline" onClick={() => navigate(`/course-edit/${id}`)}>
            <Edit size={16} /> Quản lý khóa học
          </button>
        </div>
      )}
    </div>
  );
}
