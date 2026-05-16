import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../api/api';
import { BookOpen, Users, Star, ChevronRight } from 'lucide-react';

const LEVELS = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_COLORS = { A1: '#22C55E', A2: '#ADD8E6', B1: '#FDBCB4', B2: '#f9a59b', C1: '#c084fc' };
const LEVEL_EMOJIS = { A1: '🌱', A2: '🌿', B1: '🌳', B2: '🚀', C1: '⭐' };

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseAPI.getAll().then(r => {
      const data = Array.isArray(r.data) ? r.data : (r.data?.data || []);
      setCourses(data);
      setFiltered(data);
    }).catch(() => {
      // Fallback demo data
      const demo = [
        { id:1, title:'English for Beginners', description:'Start your English journey with essential vocabulary and grammar basics.', level:'A1', instructor:'Ms. Sarah Johnson', totalLessons:24, enrolledCount:1250, rating:4.8 },
        { id:2, title:'Elementary English', description:'Build confidence with everyday conversations and simple grammar.', level:'A2', instructor:'Mr. David Chen', totalLessons:32, enrolledCount:980, rating:4.7 },
        { id:3, title:'Pre-Intermediate English', description:'Expand your language skills with more complex structures and topics.', level:'B1', instructor:'Ms. Emily Parker', totalLessons:40, enrolledCount:750, rating:4.9 },
        { id:4, title:'Intermediate English', description:'Master grammar, idioms, and professional communication.', level:'B2', instructor:'Mr. James Wilson', totalLessons:48, enrolledCount:520, rating:4.6 },
        { id:5, title:'Advanced English', description:'Achieve near-native fluency with advanced writing and critical thinking.', level:'C1', instructor:'Dr. Lisa Thompson', totalLessons:56, enrolledCount:380, rating:4.9 },
      ];
      setCourses(demo);
      setFiltered(demo);
    }).finally(() => setLoading(false));
  }, []);

  const filterByLevel = (level) => {
    setSelectedLevel(level);
    setFiltered(level === 'ALL' ? courses : courses.filter(c => c.level === level));
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 8 }}>
          📚 Khóa học tiếng Anh
        </h1>
        <p style={{ color: '#718096', fontWeight: 600 }}>Chọn cấp độ phù hợp và bắt đầu học ngay hôm nay</p>
      </div>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
        {LEVELS.map(level => (
          <button
            key={level}
            onClick={() => filterByLevel(level)}
            className="clay-btn"
            style={{
              background: selectedLevel === level
                ? (level === 'ALL' ? 'linear-gradient(135deg, #22C55E, #16a34a)' : `linear-gradient(135deg, ${LEVEL_COLORS[level] || '#22C55E'}, ${LEVEL_COLORS[level] || '#16a34a'}bb)`)
                : 'white',
              color: selectedLevel === level ? (level === 'ALL' ? 'white' : '#1a202c') : '#4a5568',
              padding: '8px 20px', fontSize: '0.9rem',
            }}
          >
            {level !== 'ALL' && LEVEL_EMOJIS[level]} {level}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096', fontWeight: 700 }}>
          ⏳ Đang tải...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {filtered.map(course => (
            <Link key={course.id} to={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
            <div className="clay-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
              {/* Course header */}
              <div style={{
                height: 140, padding: 24,
                background: `linear-gradient(135deg, ${LEVEL_COLORS[course.level] || '#22C55E'}44, ${LEVEL_COLORS[course.level] || '#22C55E'}22)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '4rem',
              }}>
                {LEVEL_EMOJIS[course.level] || '📖'}
              </div>

              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{
                    background: `${LEVEL_COLORS[course.level] || '#22C55E'}22`,
                    color: LEVEL_COLORS[course.level] || '#22C55E',
                    fontWeight: 800, fontSize: '0.75rem', padding: '3px 10px', borderRadius: 8,
                    border: `2px solid ${LEVEL_COLORS[course.level] || '#22C55E'}44`,
                  }}>
                    {course.level}
                  </span>
                </div>

                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a202c', marginBottom: 8 }}>
                  {course.title}
                </h3>

                <p style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600, lineHeight: 1.6, marginBottom: 16 }}>
                  {course.description}
                </p>

                <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 700, marginBottom: 16 }}>
                  👩‍🏫 {course.instructor}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: '0.85rem', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4a5568' }}>
                    <BookOpen size={14} /> {course.totalLessons} bài học
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4a5568' }}>
                    <Users size={14} /> {(course.enrolledCount || 0).toLocaleString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}>
                    <Star size={14} fill="#f59e0b" /> {course.rating}
                  </span>
                </div>

                <button className="clay-btn clay-btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Đăng ký học <ChevronRight size={16} />
                </button>
              </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
