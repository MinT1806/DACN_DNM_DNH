import { useState, useRef } from 'react';

const S = {
  container: { padding: '24px', maxWidth: 800, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', margin: 0 },
  instructions: { background: '#f8fafc', borderRadius: 10, padding: 12, fontSize: '0.9rem', color: '#64748b', marginBottom: 20, border: '1px solid #e2e8f0' },
  dragArea: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 },
  slotsColumn: { display: 'flex', flexDirection: 'column', gap: 10 },
  itemsColumn: { display: 'flex', flexDirection: 'column', gap: 10 },
  columnTitle: { fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  slot: { padding: '12px 16px', borderRadius: 10, border: '2px dashed #cbd5e1', background: 'white', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' },
  slotFilled: { borderStyle: 'solid', borderColor: '#3b82f6', background: '#eff6ff' },
  slotCorrect: { borderStyle: 'solid', borderColor: '#10b981', background: '#f0fdf4' },
  slotWrong: { borderStyle: 'solid', borderColor: '#ef4444', background: '#fef2f2' },
  item: { padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0', background: 'white', cursor: 'grab', fontSize: '0.9rem', color: '#475569', fontWeight: 500, transition: 'all 0.2s', userSelect: 'none' },
  itemDragging: { opacity: 0.5, cursor: 'grabbing' },
  itemUsed: { opacity: 0.4, pointerEvents: 'none' },
  feedbackBox: { padding: '12px 16px', borderRadius: 10, marginTop: 16, fontSize: '0.9rem' },
  feedbackCorrect: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
  feedbackWrong: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' },
  scoreText: { fontSize: '1.2rem', fontWeight: 700 },
};

export default function DragDrop({ question, answer, onAnswer, showResult, result }) {
  const options = Array.isArray(question.options) ? question.options
    : typeof question.options === 'object' ? question.options : {};

  const leftItems = Object.keys(options);
  const rightItems = Object.values(options);

  const [slots, setSlots] = useState({});
  const [draggingItem, setDraggingItem] = useState(null);
  const dragState = useRef({});

  const getSlotValue = (slotKey) => slots[slotKey] || null;
  const isItemUsed = (item) => Object.values(slots).includes(item);
  const isCorrectPlacement = (slotKey) => {
    const placed = slots[slotKey];
    if (!placed) return false;
    return placed === options[slotKey];
  };

  const handleDragStart = (item) => {
    setDraggingItem(item);
    dragState.current = { item };
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
  };

  const handleDrop = (slotKey) => {
    if (!draggingItem) return;
    const newSlots = { ...slots };
    Object.keys(newSlots).forEach(k => {
      if (newSlots[k] === draggingItem) delete newSlots[k];
    });
    if (newSlots[slotKey]) delete newSlots[slotKey];
    newSlots[slotKey] = draggingItem;
    setSlots(newSlots);
    const answerStr = JSON.stringify(newSlots);
    onAnswer(answerStr);
  };

  const handleSlotClick = (slotKey) => {
    if (showResult) return;
    const current = slots[slotKey];
    if (current) {
      const newSlots = { ...slots };
      delete newSlots[slotKey];
      setSlots(newSlots);
      onAnswer(JSON.stringify(newSlots));
    }
  };

  const getSlotStyle = (slotKey) => {
    const placed = slots[slotKey];
    if (!placed) return S.slot;
    if (showResult) {
      if (isCorrectPlacement(slotKey)) return { ...S.slot, ...S.slotFilled, ...S.slotCorrect };
      return { ...S.slot, ...S.slotFilled, ...S.slotWrong };
    }
    return { ...S.slot, ...S.slotFilled };
  };

  const ratio = result?.correctRatio;
  const correctCount = result?.correctPlacements;
  const totalCount = result?.totalPlacements;

  return (
    <div style={S.container}>
      <div style={S.header}>
        <span style={{ fontSize: '1.5rem' }}>🧩</span>
        <h2 style={S.title}>Kéo thả ghép đôi</h2>
      </div>

      {question.question && (
        <div style={S.instructions}>{question.question}</div>
      )}

      <div style={S.dragArea}>
        <div style={S.slotsColumn}>
          <div style={S.columnTitle}>Mục tiêu</div>
          {leftItems.map((key, i) => (
            <div key={i} style={S.columnTitle}>
              <div style={getSlotStyle(key)} onClick={() => handleSlotClick(key)}>
                <span>{key}</span>
                {getSlotValue(key) && (
                  <span style={{ color: '#3b82f6', fontWeight: 700 }}>
                    → {getSlotValue(key)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={S.itemsColumn}>
          <div style={S.columnTitle}>Kéo vào đây</div>
          {rightItems.map((val, i) => {
            const used = isItemUsed(val);
            const isDragging = draggingItem === val;
            return (
              <div
                key={i}
                draggable={!used && !showResult}
                onDragStart={() => handleDragStart(val)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {}}
                style={{
                  ...S.item,
                  ...(isDragging ? S.itemDragging : {}),
                  ...(used || showResult ? S.itemUsed : {}),
                }}
              >
                {val}
              </div>
            );
          })}
        </div>
      </div>

      {showResult && (
        <div style={{
          ...S.feedbackBox,
          ...(ratio === 1 ? S.feedbackCorrect : S.feedbackWrong)
        }}>
          <div style={S.scoreText}>
            {correctCount}/{totalCount} ghép đúng ({Math.round((ratio || 0) * 100)}%)
          </div>
          {result?.correctPlacements !== undefined && (
            <div style={{ marginTop: 4 }}>
              {correctCount === totalCount ? '🎉 Tuyệt vời!' : '💪 Cố gắng hơn nhé!'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
