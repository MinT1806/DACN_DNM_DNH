import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { flashcardAPI } from '../api/api';

const RATINGS = [
  { key: 'again', label: 'Again', color: '#ef4444', bg: '#fef2f2', icon: '↩', hint: '< 1 day' },
  { key: 'hard', label: 'Hard', color: '#f97316', bg: '#fff7ed', icon: '😓', hint: '~1.2× longer' },
  { key: 'good', label: 'Good', color: '#22c55e', bg: '#f0fdf4', icon: '👍', hint: '2× longer' },
  { key: 'easy', label: 'Easy', color: '#3b82f6', bg: '#eff6ff', icon: '😎', hint: '2.5× longer' },
];

function ProgressRing({ value, max, size = 80, stroke = 8, color = '#3b82f6' }) {
  const pct = max > 0 ? value / max : 0;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - pct * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

export default function FlashcardPage() {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ word: '', translation: '', pronunciation: '', level: 'A1' });
  const [addError, setAddError] = useState('');

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const [cardsRes, statsRes] = await Promise.all([
        flashcardAPI.getToday(),
        flashcardAPI.getStats(),
      ]);
      if (cardsRes.data.success) {
        setCards(cardsRes.data.data || []);
        setDone((cardsRes.data.data || []).length === 0);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const currentCard = cards[currentIndex];

  const handleRating = async (rating) => {
    if (!currentCard || saving) return;
    setSaving(true);
    try {
      await flashcardAPI.review(currentCard.vocabularyId, rating);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((i) => i + 1);
        setFlipped(false);
      } else {
        setDone(true);
        loadCards();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleFlip = () => {
    if (saving) return;
    setFlipped((f) => !f);
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.word.trim() || !addForm.translation.trim()) {
      setAddError('Word and translation are required');
      return;
    }
    try {
      const res = await flashcardAPI.addCard(addForm);
      if (res.data.success) {
        setShowAddForm(false);
        setAddForm({ word: '', translation: '', pronunciation: '', level: 'A1' });
        loadCards();
      } else {
        setAddError(res.data.message || 'Failed to add card');
      }
    } catch {
      setAddError('Failed to add card');
    }
  };

  const handleDeleteCard = async (vocabularyId) => {
    if (!window.confirm('Delete this card?')) return;
    try {
      await flashcardAPI.deleteCard(vocabularyId);
      setCards((prev) => prev.filter((c) => c.vocabularyId !== vocabularyId));
      loadCards();
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🧠</div>
        <div style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>Loading flashcards...</div>
      </div>
    );
  }

  // ── Empty / Done State ─────────────────────────────────────────
  if (done && cards.length === 0) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1a202c', margin: '0 0 8px' }}>🧠 Spaced Repetition</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Smart vocabulary review</p>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Saved', value: stats.totalSaved, color: '#8b5cf6' },
              { label: 'Learned', value: stats.totalLearned, color: '#22c55e' },
              { label: 'Due Today', value: stats.dueToday, color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: 16, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value || 0}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '5rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: '#1a202c', marginBottom: 8 }}>You're all done!</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>
            {stats?.dueToday === 0 ? "No cards due for review today." : "You've reviewed all cards due today."}
          </p>
          <button
            onClick={() => { setDone(false); loadCards(); }}
            style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 700, cursor: 'pointer', marginRight: 8 }}
          >
            Practice Again
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            style={{ padding: '12px 24px', borderRadius: 12, border: '2px solid #e2e8f0', background: 'white', color: '#334155', fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Card
          </button>
        </div>

        {renderAddForm()}
      </div>
    );
  }

  // ── Add Card Form ──────────────────────────────────────────────
  function renderAddForm() {
    if (!showAddForm) return null;
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setShowAddForm(false)} />
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'white', borderRadius: 20, padding: 28, width: 440, maxWidth: '90vw', zIndex: 1000, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <h3 style={{ margin: '0 0 20px', color: '#1a202c' }}>Add New Card</h3>
          <form onSubmit={handleAddCard} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Word *</label>
              <input
                value={addForm.word}
                onChange={(e) => setAddForm((f) => ({ ...f, word: e.target.value }))}
                placeholder="e.g. beautiful"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Translation *</label>
              <input
                value={addForm.translation}
                onChange={(e) => setAddForm((f) => ({ ...f, translation: e.target.value }))}
                placeholder="e.g. đẹp"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Pronunciation</label>
              <input
                value={addForm.pronunciation}
                onChange={(e) => setAddForm((f) => ({ ...f, pronunciation: e.target.value }))}
                placeholder="e.g. /ˈbjuːtɪfl/"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Level</label>
              <select
                value={addForm.level}
                onChange={(e) => setAddForm((f) => ({ ...f, level: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', background: 'white' }}
              >
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {addError && <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>{addError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                Add Card
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }

  // ── Main Flashcard Review ──────────────────────────────────────
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1a202c', margin: 0 }}>🧠 Flashcards</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.85rem' }}>
            {currentIndex + 1} / {cards.length} cards remaining
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            to="/daily-challenge"
            style={{ padding: '8px 16px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', textDecoration: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Daily Challenge
          </Link>
          <button
            onClick={() => setShowAddForm(true)}
            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            + Add Card
          </button>
        </div>
      </div>

      {/* Progress */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
          {[
            { label: 'Saved', value: stats.totalSaved, color: '#8b5cf6' },
            { label: 'Learned', value: stats.totalLearned, color: '#22c55e' },
            { label: 'Due', value: stats.dueToday, color: '#f59e0b' },
            { label: 'Accuracy', value: `${Math.round(stats.accuracy || 0)}%`, color: '#3b82f6' },
          ].map((s) => (
            <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '10px 8px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Card */}
      {currentCard && (
        <div
          onClick={handleFlip}
          style={{
            perspective: 1000,
            marginBottom: 24,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: 280,
              transition: 'transform 0.6s',
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                borderRadius: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
                boxShadow: '0 12px 40px rgba(139,92,246,0.3)',
              }}
            >
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 12, fontWeight: 600 }}>FRONT</div>
              <div style={{ color: 'white', fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', marginBottom: 8 }}>
                {currentCard.word}
              </div>
              {currentCard.pronunciation && (
                <div style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', fontSize: '1rem', marginBottom: 8 }}>
                  {currentCard.pronunciation}
                </div>
              )}
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: 16 }}>
                Tap to reveal meaning
              </div>
              {currentCard.level && (
                <div style={{ position: 'absolute', top: 16, right: 16, padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                  {currentCard.level}
                </div>
              )}
            </div>

            {/* Back */}
            <div
              style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'white',
                borderRadius: 24,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                border: '2px solid #e2e8f0',
              }}
            >
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 12, fontWeight: 600 }}>BACK</div>
              <div style={{ color: '#1a202c', fontSize: '2rem', fontWeight: 900, textAlign: 'center', marginBottom: 8 }}>
                {currentCard.translation}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5 }}>
                {currentCard.word}
              </div>
              <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#94a3b8' }}>
                {currentCard.reviewCount} reviews • {currentCard.correctCount} correct
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Buttons */}
      {flipped && currentCard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {RATINGS.map((r) => (
            <button
              key={r.key}
              onClick={() => handleRating(r.key)}
              disabled={saving}
              style={{
                padding: '14px 8px',
                borderRadius: 14,
                border: `2px solid ${r.color}40`,
                background: r.bg,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{r.icon}</span>
              <span style={{ fontWeight: 800, color: r.color, fontSize: '0.9rem' }}>{r.label}</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.hint}</span>
            </button>
          ))}
        </div>
      )}

      {/* Flip hint */}
      {!flipped && currentCard && (
        <div style={{ textAlign: 'center', marginBottom: 20, color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
          👆 Click the card to flip
        </div>
      )}

      {/* Review Progress Bar */}
      <div style={{ background: '#f1f5f9', borderRadius: 10, height: 8, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
        {currentIndex} reviewed
      </div>

      {renderAddForm()}
    </div>
  );
}
