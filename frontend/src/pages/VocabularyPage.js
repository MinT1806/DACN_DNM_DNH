import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Check, X, Save, Shuffle, RotateCcw, Plus, Pencil, Edit3 } from 'lucide-react';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CATEGORIES = ['Travel', 'Business', 'Daily', 'Academic', 'Food', 'Technology', 'Health', 'Sports'];
const LEVEL_COLORS = { A1: '#22C55E', A2: '#3B82F6', B1: '#8B5CF6', B2: '#F59E0B', C1: '#EF4444', C2: '#6366f1' };

export default function VocabularyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('learn');
  const [words, setWords] = useState([]);
  const [savedWords, setSavedWords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState(user?.level || 'A1');
  const [filterCategory, setFilterCategory] = useState('');

  // Flashcard state
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flashcardMode, setFlashcardMode] = useState('saved');
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0, incorrect: 0 });

  // Custom word form state
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [newWord, setNewWord] = useState({
    word: '',
    pronunciation: '',
    translation: '',
    definition: '',
    example: '',
    exampleTranslation: '',
    level: user?.level || 'A1',
    category: ''
  });

  const fetchVocabulary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterLevel) params.append('level', filterLevel);
      if (filterCategory) params.append('category', filterCategory);
      
      const res = await fetch(`/api/vocabulary?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Backend trả về List trực tiếp, không phải { data: [...] }
        const wordList = Array.isArray(data) ? data : (data.data || []);
        setWords(wordList);
      }
    } catch {}
    setLoading(false);
  }, [filterLevel, filterCategory]);

  const fetchSavedWords = useCallback(async () => {
    try {
      const res = await fetch('/api/saved-words', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedWords(data.data || []);
      }
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/saved-words/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  useEffect(() => {
    fetchSavedWords();
    fetchStats();
  }, [fetchSavedWords, fetchStats]);

  const saveWord = async (vocabId) => {
    try {
      await fetch('/api/saved-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ vocabularyId: vocabId }),
      });
      fetchSavedWords();
    } catch {}
  };

  const removeWord = async (vocabId) => {
    try {
      await fetch(`/api/saved-words/${vocabId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchSavedWords();
    } catch {}
  };

  // Chỉnh sửa từ
  const handleEditWord = (word) => {
    setEditingWord(word);
    setNewWord({
      word: word.word || '',
      pronunciation: word.pronunciation || '',
      translation: word.translation || '',
      definition: word.definition || '',
      example: word.example || '',
      exampleTranslation: word.exampleTranslation || '',
      level: word.level || user?.level || 'A1',
      category: word.category || ''
    });
    setShowAddWordModal(true);
  };

  // Xóa từ của mình
  const handleDeleteWord = async (wordId, createdBy) => {
    if (!window.confirm('Bạn có chắc muốn xóa từ này?')) return;

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      alert('Vui lòng đăng nhập');
      return;
    }

    try {
      const res = await fetch(`/api/vocabulary/my/${wordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setWords(prev => prev.filter(w => w.id !== wordId));
        alert('Đã xóa từ!');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || err.error || 'Không thể xóa từ');
      }
    } catch {
      alert('Có lỗi khi xóa từ');
    }
  };

  // Submit form (thêm mới hoặc cập nhật)
  const handleSubmitWord = async (e) => {
    e.preventDefault();
    if (!newWord.word.trim() || !newWord.translation.trim()) {
      alert('Vui lòng nhập từ và nghĩa');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      alert('Vui lòng đăng nhập để thêm từ mới');
      return;
    }

    try {
      let res;
      if (editingWord) {
        res = await fetch(`/api/vocabulary/${editingWord.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newWord)
        });
      } else {
        res = await fetch('/api/vocabulary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(newWord)
        });
      }

      if (res.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      if (res.ok) {
        const data = await res.json();

        if (!editingWord && data.data?.id) {
          try {
            await fetch('/api/saved-words', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ vocabularyId: data.data.id })
            });
          } catch {}
        }

        if (editingWord) {
          setWords(prev => prev.map(w => w.id === editingWord.id ? { ...w, ...newWord } : w));
          alert('Đã cập nhật từ!');
        } else {
          fetchVocabulary();
          alert('Đã thêm từ mới!');
        }

        fetchSavedWords();
        fetchStats();
        closeModal();
      } else {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.message || errData.error || `Lỗi ${res.status}: Không thể lưu từ`;
        console.error('Error:', msg);
        alert(msg);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Có lỗi khi lưu từ. Vui lòng kiểm tra kết nối mạng.');
    }
  };

  const closeModal = () => {
    setShowAddWordModal(false);
    setEditingWord(null);
    setNewWord({
      word: '',
      pronunciation: '',
      translation: '',
      definition: '',
      example: '',
      exampleTranslation: '',
      level: user?.level || 'A1',
      category: ''
    });
  };

  // Flashcard functions
  const startFlashcards = (mode) => {
    const source = mode === 'saved' ? savedWords : words;
    if (source.length === 0) return;
    setFlashcardMode(mode);
    setFlashcards([...source].sort(() => Math.random() - 0.5));
    setCurrentCard(0);
    setFlipped(false);
    setSessionStats({ total: source.length, correct: 0, incorrect: 0 });
    setActiveTab('flashcard');
  };

  const markReview = async (correct) => {
    const card = flashcards[currentCard];
    if (!card) return;

    try {
      await fetch('/api/saved-words/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ vocabularyId: card.vocabularyId || card.id, correct }),
      });
    } catch {}

    setSessionStats(prev => ({
      ...prev,
      [correct ? 'correct' : 'incorrect']: prev[correct ? 'correct' : 'incorrect'] + 1
    }));

    if (currentCard < flashcards.length - 1) {
      setCurrentCard(prev => prev + 1);
      setFlipped(false);
    } else {
      setActiveTab('flashcard-result');
    }
  };

  const tabs = [
    { id: 'learn', label: '📖 Học từ vựng' },
    { id: 'flashcard', label: '🃏 Flashcard' },
    { id: 'saved', label: '💾 Đã lưu' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h1 style={{ fontWeight: 900, fontSize: '1.6rem', color: '#1a202c', margin: 0 }}>
          📚 Từ vựng & Flashcard
        </h1>
        <button
          className="clay-btn"
          style={{
            padding: '10px 20px',
            fontSize: '0.9rem',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}
          onClick={() => setShowAddWordModal(true)}
        >
          <Plus size={18} /> Thêm từ mới
        </button>
      </div>
      <p style={{ color: '#718096', fontWeight: 600, marginBottom: 24 }}>
        Học và lưu từ vựng để ôn tập với flashcard
      </p>

      {/* Stats bar */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: 'Đã lưu', value: stats.totalSaved, color: '#3b82f6' },
            { label: 'Đã học', value: stats.totalLearned, color: '#22C55E' },
            { label: 'Lượt ôn', value: stats.totalReviews, color: '#f59e0b' },
            { label: 'Độ chính xác', value: stats.accuracy + '%', color: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} className="clay-card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '1.4rem', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '2px solid rgba(0,0,0,0.06)', paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', fontWeight: 700,
              fontSize: '0.9rem', background: 'transparent',
              color: activeTab === tab.id ? '#22C55E' : '#718096',
              borderBottom: activeTab === tab.id ? '3px solid #22C55E' : '3px solid transparent',
              borderRadius: '8px 8px 0 0', transition: 'all 0.2s',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Learn Tab */}
      {activeTab === 'learn' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <select className="clay-input" style={{ minWidth: 120 }} value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select className="clay-input" style={{ minWidth: 140 }} value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}>
              <option value="">Tất cả chủ đề</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="clay-btn" onClick={() => startFlashcards('all')} disabled={words.length === 0}>
              <Shuffle size={14} /> Luyện tất cả
            </button>
          </div>

          {/* Word cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#718096', fontWeight: 600 }}>
              Đang tải từ vựng...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {words.map(word => {
                const isSaved = savedWords.some(s => s.vocabularyId === word.id || s.id === word.id);
                const isMyWord = user && (word.createdBy === user.userId || word.createdBy === user.id);
                return (
                  <div key={word.id} className="clay-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1a202c' }}>{word.word}</div>
                        {word.pronunciation && (
                          <div style={{ fontSize: '0.8rem', color: '#a0aec0', fontStyle: 'italic' }}>{word.pronunciation}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {word.level && (
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 800,
                            background: (LEVEL_COLORS[word.level] || '#718096') + '22',
                            color: LEVEL_COLORS[word.level] || '#718096',
                          }}>
                            {word.level}
                          </span>
                        )}
                        {isMyWord && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => handleEditWord(word)}
                              style={{
                                background: '#f59e0b22',
                                border: '1px solid #f59e0b44',
                                borderRadius: 6,
                                padding: '3px 7px',
                                cursor: 'pointer',
                                color: '#f59e0b',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Sửa từ"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteWord(word.id, word.createdBy)}
                              style={{
                                background: '#ef444422',
                                border: '1px solid #ef444444',
                                borderRadius: 6,
                                padding: '3px 7px',
                                cursor: 'pointer',
                                color: '#ef4444',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Xóa từ"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, color: '#4a5568', marginBottom: 6, fontSize: '0.9rem' }}>
                      {word.translation}
                    </div>
                    {word.example && (
                      <div style={{ fontSize: '0.82rem', color: '#718096', fontStyle: 'italic', marginBottom: 10 }}>
                        "{word.example}"
                      </div>
                    )}
                    <button
                      className={`clay-btn ${isSaved ? 'clay-btn-green' : ''}`}
                      style={{ fontSize: '0.82rem', padding: '5px 12px' }}
                      onClick={() => isSaved ? removeWord(word.id) : saveWord(word.id)}
                    >
                      {isSaved ? <><Check size={13} /> Đã lưu</> : <><Save size={13} /> Lưu từ</>}
                    </button>
                  </div>
                );
              })}
              {words.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
                  <p style={{ color: '#718096', fontWeight: 600 }}>Không có từ vựng cho level này</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Flashcard Tab */}
      {activeTab === 'flashcard' && flashcards.length > 0 && (
        <div>
          {/* Progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem', color: '#718096', marginBottom: 6 }}>
              <span>Thẻ {currentCard + 1} / {flashcards.length}</span>
              <span>
                <span style={{ color: '#22C55E' }}>✓ {sessionStats.correct}</span>
                {' '}
                <span style={{ color: '#ef4444' }}>✗ {sessionStats.incorrect}</span>
              </span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 8, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${((currentCard) / flashcards.length) * 100}%`,
                height: '100%', background: '#22C55E', borderRadius: 8, transition: 'width 0.3s',
              }} />
            </div>
          </div>

          {/* Save word button */}
          {(() => {
            const card = flashcards[currentCard];
            if (!card) return null;
            const isSaved = savedWords.some(s => s.vocabularyId === card.vocabularyId || s.vocabularyId === card.id || s.id === card.vocabularyId);
            return (
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
                <button
                  className={`clay-btn ${isSaved ? 'clay-btn-green' : ''}`}
                  style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                  onClick={() => {
                    const vocabId = card.vocabularyId || card.id;
                    if (isSaved) {
                      removeWord(vocabId);
                    } else {
                      saveWord(vocabId);
                    }
                  }}
                >
                  {isSaved ? <><Check size={14} /> Đã lưu</> : <><Plus size={14} /> Lưu từ này</>}
                </button>
              </div>
            );
          })()}

          {/* Card */}
          {(() => {
            const card = flashcards[currentCard];
            if (!card) return null;
            return (
              <div style={{ perspective: 1000, marginBottom: 24, minHeight: 260 }}>
                <div style={{
                  position: 'relative',
                  minHeight: 220,
                  transition: 'transform 0.5s',
                  transformStyle: 'preserve-3d',
                  transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                }}>
                  {/* Mặt trước - Từ */}
                  <div style={{
                    position: flipped ? 'none' : 'block',
                    visibility: flipped ? 'hidden' : 'visible',
                    backfaceVisibility: 'hidden',
                    minHeight: 220, borderRadius: 20, cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f59e0b22, #f59e0b11)',
                    border: '2px solid #f59e0b33',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: 40, textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(245,158,11,0.15)',
                  }}
                    onClick={() => setFlipped(!flipped)}
                  >
                    <div style={{ fontWeight: 900, fontSize: '2rem', color: '#1a202c', marginBottom: 8 }}>
                      {card.word}
                    </div>
                    {card.pronunciation && (
                      <div style={{ fontSize: '0.9rem', color: '#a0aec0', fontStyle: 'italic' }}>
                        {card.pronunciation}
                      </div>
                    )}
                    <div style={{ marginTop: 20, fontSize: '0.85rem', color: '#a0aec0' }}>
                      Nhấn để xem đáp án
                    </div>
                  </div>

                  {/* Mặt sau - Nghĩa */}
                  <div style={{
                    position: flipped ? 'block' : 'absolute',
                    top: 0, left: 0, right: 0,
                    visibility: flipped ? 'visible' : 'hidden',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateX(180deg)',
                    minHeight: 220, borderRadius: 20, cursor: 'pointer',
                    background: 'linear-gradient(135deg, #22C55E22, #22C55E11)',
                    border: '2px solid #22C55E33',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: 40, textAlign: 'center',
                    boxShadow: '0 8px 24px rgba(34,197,94,0.15)',
                  }}
                    onClick={() => setFlipped(!flipped)}
                  >
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#22C55E', marginBottom: 8 }}>
                      {card.translation}
                    </div>
                    {card.definition && (
                      <div style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: 8, lineHeight: 1.6 }}>
                        {card.definition}
                      </div>
                    )}
                    {card.example && (
                      <div style={{ fontSize: '0.85rem', color: '#718096', fontStyle: 'italic', marginBottom: 8 }}>
                        "{card.example}"
                      </div>
                    )}
                    {card.exampleTranslation && (
                      <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>
                        {card.exampleTranslation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => markReview(false)}
              className="clay-btn"
              style={{ padding: '12px 32px', fontSize: '1rem', background: '#ef444422', color: '#ef4444', border: '2px solid #ef444433' }}
            >
              <X size={18} /> Chưa nhớ
            </button>
            <button
              onClick={() => setFlipped(!flipped)}
              className="clay-btn"
              style={{ padding: '12px 24px', fontSize: '1rem' }}
            >
              {flipped ? '← Quay lại' : 'Xem đáp án'}
            </button>
            <button
              onClick={() => markReview(true)}
              className="clay-btn"
              style={{ padding: '12px 32px', fontSize: '1rem', background: '#22C55E22', color: '#22C55E', border: '2px solid #22C55E33' }}
            >
              <Check size={18} /> Nhớ rồi
            </button>
          </div>
        </div>
      )}

      {/* Flashcard result */}
      {activeTab === 'flashcard-result' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>
            {sessionStats.correct >= sessionStats.total / 2 ? '🎉' : '💪'}
          </div>
          <h2 style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1a202c', marginBottom: 16 }}>
            {sessionStats.correct >= sessionStats.total / 2 ? 'Tuyệt vời!' : 'Cố gắng hơn nữa!'}
          </h2>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 24 }}>
            <div className="clay-card" style={{ padding: 20, minWidth: 100, textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#22C55E' }}>{sessionStats.correct}</div>
              <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: 600 }}>Nhớ đúng</div>
            </div>
            <div className="clay-card" style={{ padding: 20, minWidth: 100, textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: '#ef4444' }}>{sessionStats.incorrect}</div>
              <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: 600 }}>Chưa nhớ</div>
            </div>
          </div>
          <button className="clay-btn clay-btn-primary" style={{ padding: '12px 24px' }}
            onClick={() => startFlashcards(flashcardMode)}>
            <RotateCcw size={15} /> Ôn lại
          </button>
        </div>
      )}

      {/* Saved Words Tab */}
      {activeTab === 'saved' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 800, color: '#1a202c' }}>Từ đã lưu ({savedWords.length})</h3>
            <button className="clay-btn clay-btn-green" onClick={() => startFlashcards('saved')} disabled={savedWords.length === 0}>
              <Shuffle size={14} /> Luyện flashcard
            </button>
          </div>
          {savedWords.length === 0 ? (
            <div className="clay-card" style={{ padding: 40, textAlign: 'center' }}>
              <BookOpen size={40} color="#a0aec0" style={{ marginBottom: 12 }} />
              <p style={{ color: '#718096', fontWeight: 600 }}>Bạn chưa lưu từ nào. Hãy lưu từ khi học để ôn tập!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {savedWords.map(word => (
                <div key={word.id} className="clay-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, color: '#1a202c' }}>{word.word}</div>
                    {word.learned && <span style={{ color: '#22C55E', fontSize: '0.75rem', fontWeight: 700 }}>✓ Đã học</span>}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: 4 }}>{word.translation}</div>
                  {word.pronunciation && (
                    <div style={{ fontSize: '0.78rem', color: '#a0aec0', fontStyle: 'italic' }}>{word.pronunciation}</div>
                  )}
                  <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#a0aec0' }}>
                    Ôn {word.reviewCount} lần • Đúng {word.correctCount} lần
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Thêm từ mới */}
      {showAddWordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 32,
            maxWidth: 500,
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.3rem', color: '#1a202c', margin: 0 }}>
                <Edit3 size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                {editingWord ? 'Sửa từ' : 'Thêm từ mới'}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: '#718096'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitWord}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#4a5568', fontSize: '0.9rem' }}>
                  Từ * <span style={{ color: '#ef4444' }}>(bắt buộc)</span>
                </label>
                <input
                  type="text"
                  className="clay-input"
                  style={{ width: '100%', fontSize: '1rem' }}
                  value={newWord.word}
                  onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                  placeholder="VD: beautiful"
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#4a5568', fontSize: '0.9rem' }}>
                  Phiên âm
                </label>
                <input
                  type="text"
                  className="clay-input"
                  style={{ width: '100%', fontSize: '1rem' }}
                  value={newWord.pronunciation}
                  onChange={(e) => setNewWord({ ...newWord, pronunciation: e.target.value })}
                  placeholder="VD: /ˈbjuːtɪfl/"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#4a5568', fontSize: '0.9rem' }}>
                  Nghĩa * <span style={{ color: '#ef4444' }}>(bắt buộc)</span>
                </label>
                <input
                  type="text"
                  className="clay-input"
                  style={{ width: '100%', fontSize: '1rem' }}
                  value={newWord.translation}
                  onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
                  placeholder="VD: Đẹp, xinh đẹp"
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#4a5568', fontSize: '0.9rem' }}>
                  Định nghĩa
                </label>
                <textarea
                  className="clay-input"
                  style={{ width: '100%', fontSize: '1rem', minHeight: 60, resize: 'vertical' }}
                  value={newWord.definition}
                  onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
                  placeholder="VD: Có vẻ đẹp, dễ nhìn, hấp dẫn"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#4a5568', fontSize: '0.9rem' }}>
                  Ví dụ
                </label>
                <input
                  type="text"
                  className="clay-input"
                  style={{ width: '100%', fontSize: '1rem' }}
                  value={newWord.example}
                  onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
                  placeholder="VD: She has a beautiful smile."
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#4a5568', fontSize: '0.9rem' }}>
                  Nghĩa ví dụ
                </label>
                <input
                  type="text"
                  className="clay-input"
                  style={{ width: '100%', fontSize: '1rem' }}
                  value={newWord.exampleTranslation}
                  onChange={(e) => setNewWord({ ...newWord, exampleTranslation: e.target.value })}
                  placeholder="VD: Cô ấy có nụ cười rất đẹp."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#4a5568', fontSize: '0.9rem' }}>
                    Cấp độ
                  </label>
                  <select
                    className="clay-input"
                    style={{ width: '100%' }}
                    value={newWord.level}
                    onChange={(e) => setNewWord({ ...newWord, level: e.target.value })}
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#4a5568', fontSize: '0.9rem' }}>
                    Chủ đề
                  </label>
                  <select
                    className="clay-input"
                    style={{ width: '100%' }}
                    value={newWord.category}
                    onChange={(e) => setNewWord({ ...newWord, category: e.target.value })}
                  >
                    <option value="">Chọn chủ đề</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="clay-btn"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button type="submit" className="clay-btn clay-btn-green">
                  <Plus size={14} /> {editingWord ? 'Lưu thay đổi' : 'Thêm từ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
