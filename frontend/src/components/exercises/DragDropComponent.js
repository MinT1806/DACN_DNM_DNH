import React, { useState, useRef } from 'react';
import { GripVertical, RefreshCw } from 'lucide-react';

export default function DragDropComponent({ question, value, onChange, showResult, result }) {
  // value format: JSON string "{\"item_0\":\"slot_1\",\"item_1\":\"slot_0\"}"
  const [placements, setPlacements] = useState(() => {
    if (value) {
      try { return JSON.parse(value); } catch { return {}; }
    }
    return {};
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // Parse options - expected format: { items: ["word1", "word2", ...], slots: ["slot1", "slot2", ...] }
  // or simple array of strings
  let items = [];
  let slots = [];

  try {
    if (question.options) {
      const opts = typeof question.options === 'string'
        ? JSON.parse(question.options)
        : question.options;

      if (Array.isArray(opts)) {
        // Simple array - treat as both items and slots
        items = opts;
        slots = opts.map((_, i) => 'slot_' + i);
      } else if (opts.items && opts.slots) {
        items = opts.items;
        slots = opts.slots;
      } else if (typeof opts === 'object') {
        items = Object.values(opts);
        slots = Object.keys(opts);
      }
    }
  } catch (e) {
    items = [];
    slots = [];
  }

  // Get item text from key
  const getItemText = (item) => {
    if (typeof item === 'string') return item;
    if (Array.isArray(item)) return item[0] || '';
    return JSON.stringify(item);
  };

  // Get which item is placed in a slot
  const getItemInSlot = (slotKey) => {
    for (const [itemKey, slot] of Object.entries(placements)) {
      if (slot === slotKey) return itemKey;
    }
    return null;
  };

  // Get which slot an item is placed in
  const getSlotOfItem = (itemKey) => placements[itemKey] || null;

  // Drag handlers
  const handleDragStart = (e, itemKey) => {
    setDraggedItem(itemKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, slotKey) => {
    e.preventDefault();
    setDragOverSlot(slotKey);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e, slotKey) => {
    e.preventDefault();
    setDragOverSlot(null);

    if (draggedItem) {
      const newPlacements = { ...placements };

      // Remove dragged item from its previous slot (if any)
      for (const key of Object.keys(newPlacements)) {
        if (newPlacements[key] === slotKey) {
          delete newPlacements[key];
        }
      }

      // Remove item from its previous slot
      delete newPlacements[draggedItem];

      // Place item in new slot
      newPlacements[draggedItem] = slotKey;

      setPlacements(newPlacements);
      onChange(JSON.stringify(newPlacements));
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverSlot(null);
  };

  // Click to place (for mobile / accessibility)
  const handleItemClick = (itemKey) => {
    if (showResult) return;

    const newPlacements = { ...placements };

    // If item is already placed, remove it
    if (newPlacements[itemKey]) {
      delete newPlacements[itemKey];
    } else {
      // Find first empty slot
      for (const slot of slots) {
        const isOccupied = Object.values(newPlacements).includes(slot);
        if (!isOccupied) {
          newPlacements[itemKey] = slot;
          break;
        }
      }
    }

    setPlacements(newPlacements);
    onChange(JSON.stringify(newPlacements));
  };

  // Remove all placements
  const handleReset = () => {
    setPlacements({});
    onChange('{}');
  };

  // Result display
  if (showResult && result) {
    const correctRatio = result.correctRatio || 0;
    const isCorrect = result.correct;

    return (
      <div style={{ marginTop: 12 }}>
        {/* Score summary */}
        <div style={{
          padding: 12, borderRadius: 10, marginBottom: 12,
          background: isCorrect ? '#22C55E11' : correctRatio > 0 ? '#f59e0b11' : '#ef444411',
          border: `2px solid ${isCorrect ? '#22C55E33' : correctRatio > 0 ? '#f59e0b33' : '#ef444433'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: '1.2rem', fontWeight: 900,
              color: isCorrect ? '#22C55E' : correctRatio > 0 ? '#f59e0b' : '#ef4444',
            }}>
              {isCorrect ? '✓' : `${result.correctPlacements || 0}/${result.totalPlacements || 0}`}
            </span>
            <span style={{ color: '#4a5568', fontSize: '0.85rem', fontWeight: 600 }}>
              {isCorrect ? 'Chính xác!' : `${Math.round(correctRatio * 100)}% đúng`}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#718096' }}>
            {result.correctPlacements || 0}/{result.totalPlacements || 0} vị trí đúng
          </span>
        </div>

        {/* Show all placements with correct/incorrect indicators */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 12, marginBottom: 12,
        }}>
          {/* Your answer */}
          <div>
            <div style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.82rem', marginBottom: 8 }}>
              Câu trả lời của bạn
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {slots.map((slot, si) => {
                const itemKey = getItemInSlot(slot);
                const itemText = itemKey !== null ? getItemText(itemKey) : null;
                const wasCorrect = itemKey && result.correctAnswer
                  ? checkPlacement(itemKey, slot, result.correctAnswer)
                  : false;

                return (
                  <div key={slot} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    background: itemText
                      ? (wasCorrect ? '#22C55E11' : '#ef444411')
                      : 'rgba(0,0,0,0.03)',
                    border: `2px solid ${itemText ? (wasCorrect ? '#22C55E33' : '#ef444433') : '#e2e8f0'}`,
                  }}>
                    <span style={{ fontSize: '0.82rem', color: '#a0aec0', width: 40, flexShrink: 0 }}>
                      {slot.replace('slot_', 'Vị trí ')}{slot.replace('slot_', '')}
                    </span>
                    <span style={{
                      fontWeight: 600, fontSize: '0.88rem',
                      color: itemText ? (wasCorrect ? '#166534' : '#991b1b') : '#a0aec0',
                    }}>
                      {itemText || '(trống)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Correct answer */}
          <div>
            <div style={{ fontWeight: 700, color: '#22C55E', fontSize: '0.82rem', marginBottom: 8 }}>
              Đáp án đúng
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {slots.map((slot, si) => {
                const correctItem = getCorrectItem(slot, result.correctAnswer);
                const correctText = correctItem !== null ? getItemText(correctItem) : null;

                return (
                  <div key={slot} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    background: '#22C55E11',
                    border: '2px solid #22C55E33',
                  }}>
                    <span style={{ fontSize: '0.82rem', color: '#22C55E', width: 40, flexShrink: 0 }}>
                      {slot.replace('slot_', 'Vị trí ')}{slot.replace('slot_', '')}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#166534' }}>
                      {correctText || '(trống)'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {result.explanation && (
          <div style={{ padding: 12, borderRadius: 10, background: '#8b5cf611', border: '1px solid #8b5cf633' }}>
            <span style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.82rem' }}>💡 Gợi ý: </span>
            <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>{result.explanation}</span>
          </div>
        )}
      </div>
    );
  }

  // Interactive drag-drop UI
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '0.82rem', color: '#718096', fontWeight: 600 }}>
          Kéo và thả các mục vào vị trí đúng, hoặc click để đặt
        </span>
        <button
          onClick={handleReset}
          className="clay-btn"
          style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <RefreshCw size={11} /> Xóa tất cả
        </button>
      </div>

      {/* Available items */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.82rem', marginBottom: 8 }}>
          📋 Danh sách (kéo vào vị trí bên dưới):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {items.map((item, i) => {
            const itemKey = 'item_' + i;
            const isPlaced = !!getSlotOfItem(itemKey);
            const itemText = getItemText(item);

            return (
              <div
                key={itemKey}
                draggable={!showResult && !isPlaced}
                onDragStart={(e) => handleDragStart(e, itemKey)}
                onDragEnd={handleDragEnd}
                onClick={() => handleItemClick(itemKey)}
                style={{
                  padding: '8px 16px', borderRadius: 10, cursor: showResult ? 'default' : (isPlaced ? 'default' : 'grab'),
                  background: isPlaced ? 'rgba(0,0,0,0.04)' : '#fff',
                  border: `2px solid ${isPlaced ? '#e2e8f0' : '#8b5cf633'}`,
                  opacity: isPlaced ? 0.4 : 1,
                  fontWeight: 700, fontSize: '0.88rem', color: '#1a202c',
                  userSelect: 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s',
                  boxShadow: isPlaced ? 'none' : '0 2px 8px rgba(139,92,246,0.1)',
                }}
              >
                {!isPlaced && <GripVertical size={12} color="#a0aec0" />}
                {itemText}
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop zones */}
      <div>
        <div style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.82rem', marginBottom: 8 }}>
          🎯 Vị trí:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {slots.map((slot, si) => {
            const itemKey = getItemInSlot(slot);
            const itemText = itemKey !== null ? getItemText(items[parseInt(itemKey.replace('item_', ''))]) : null;
            const isOver = dragOverSlot === slot;

            return (
              <div
                key={slot}
                onDragOver={(e) => handleDragOver(e, slot)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, slot)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: itemText ? '10px 14px' : '14px 14px',
                  borderRadius: 12, minHeight: 44,
                  background: isOver ? '#8b5cf622' : (itemText ? '#8b5cf611' : 'rgba(0,0,0,0.02)'),
                  border: `2px dashed ${isOver ? '#8b5cf6' : (itemText ? '#8b5cf633' : '#e2e8f0')}`,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  background: '#8b5cf622', color: '#8b5cf6',
                  padding: '3px 10px', borderRadius: 8,
                  fontSize: '0.78rem', fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {slot.replace('slot_', '#')}
                </span>

                {itemText ? (
                  <span style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.92rem' }}>
                    {itemText}
                  </span>
                ) : (
                  <span style={{ color: '#a0aec0', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Kéo mục vào đây...
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper to check if a placement is correct
function checkPlacement(itemKey, slotKey, correctAnswerStr) {
  try {
    const correct = typeof correctAnswerStr === 'string'
      ? JSON.parse(correctAnswerStr)
      : correctAnswerStr;
    return correct[itemKey] === slotKey;
  } catch {
    return false;
  }
}

// Get the correct item for a slot
function getCorrectItem(slotKey, correctAnswerStr) {
  try {
    const correct = typeof correctAnswerStr === 'string'
      ? JSON.parse(correctAnswerStr)
      : correctAnswerStr;
    for (const [itemKey, slot] of Object.entries(correct)) {
      if (slot === slotKey) return itemKey;
    }
  } catch {}
  return null;
}
