import { useEffect, useState } from 'react';

interface FloatingElement {
  id: number;
  type: 'text' | 'symbol';
  content: string;
  left: string;
  top: string;
  animationDelay: string;
  duration: string;
  opacity: number;
  scale: number;
  rotation: number;
}

export default function FloatingBackground() {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    // Grid System to prevent overlap
    // 4x4 Grid = 16 slots. We have ~12-15 items.
    const cols = 4;
    const rows = 4;
    const cellWidth = 100 / cols;
    const cellHeight = 100 / rows;

    // Generate all possible grid slots
    const slots: { c: number, r: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        slots.push({ c, r });
      }
    }

    // Shuffle slots to randomize placement
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    const count = 15; // Number of floating items (must be <= slots.length)
    const newElements: FloatingElement[] = [];

    for (let i = 0; i < count; i++) {
      const slot = slots[i];
      const isText = Math.random() > 0.6; // Slightly more symbols than text for cleaner look

      // Calculate position within the cell with padding to avoid edge overlap
      // Padding 5% to keep away from cell borders
      const padding = 5;
      const safeWidth = cellWidth - (padding * 2);
      const safeHeight = cellHeight - (padding * 2);

      const randomX = padding + (Math.random() * safeWidth);
      const randomY = padding + (Math.random() * safeHeight);

      newElements.push({
        id: i,
        type: isText ? 'text' : 'symbol',
        content: isText ? 'İNDİRİM' : '%',
        left: `${(slot.c * cellWidth) + randomX}%`,
        top: `${(slot.r * cellHeight) + randomY}%`,
        animationDelay: `${Math.random() * 5}s`,
        duration: `${20 + Math.random() * 15}s`, // Slower movement (20-35s)
        opacity: 0.02 + Math.random() * 0.04, // Very subtle opacity (0.02 - 0.06)
        scale: 0.8 + Math.random() * 1.0, // Reduced max scale variance
        rotation: Math.random() * 360,
      });
    }

    setElements(newElements);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute font-black text-gray-900 whitespace-nowrap will-change-transform animate-float"
          style={{
            left: el.left,
            top: el.top,
            fontSize: el.type === 'symbol' ? '8rem' : '4rem',
            opacity: el.opacity,
            transform: `rotate(${el.rotation}deg) scale(${el.scale})`,
            animation: `float ${el.duration} linear infinite`,
            animationDelay: el.animationDelay,
            fontFamily: el.type === 'symbol' ? 'sans-serif' : 'inherit' // Ensure % looks geometric
          }}
        >
          {el.content}
        </div>
      ))}
      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          33% {
            transform: translateY(-30px) translateX(20px) rotate(5deg) scale(1.05);
          }
          66% {
            transform: translateY(20px) translateX(-20px) rotate(-5deg) scale(0.95);
          }
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
