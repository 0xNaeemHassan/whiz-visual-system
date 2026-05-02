import { useRef, useState } from 'react';

// C29: Touch-friendly drag-and-drop that works on both mouse and touch devices
// Replaces react-dnd which doesn't support touch
export default function DragItem({ children, index, id, onMove }) {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startIndex = useRef(0);

  // Mouse drag
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
    setIsDragging(true);
    startIndex.current = index;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(from) && from !== index) {
      onMove(from, index);
    }
  };

  const handleDragEnd = () => setIsDragging(false);

  // Touch drag — move items by swiping up/down
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    startIndex.current = index;
    setIsDragging(true);
  };

  const handleTouchEnd = (e) => {
    const endY = e.changedTouches[0].clientY;
    const diff = endY - startY.current;
    const threshold = 30; // pixels to trigger a reorder
    if (Math.abs(diff) > threshold) {
      const direction = diff > 0 ? 1 : -1;
      const newIndex = Math.max(0, index + direction);
      if (newIndex !== index) onMove(index, newIndex);
    }
    setIsDragging(false);
  };

  return (
    <div
      ref={ref}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        touchAction: 'none', // Enable touch handling
        transition: 'opacity 0.15s',
      }}
      role="listitem"
      aria-roledescription="Draggable item"
      aria-label={`Item ${index + 1}, drag to reorder`}
    >
      {children}
    </div>
  );
}
