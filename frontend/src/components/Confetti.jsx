import React, { useEffect, useRef } from 'react';

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];
const CONFETTI_COUNT = 80;

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Inject keyframes once
const styleId = 'confetti-keyframes';
if (!document.getElementById(styleId)) {
  const styleSheet = document.createElement('style');
  styleSheet.id = styleId;
  styleSheet.textContent = `
    @keyframes confettiFall {
      0% { opacity: 1; transform: translateY(0) rotate(0deg); }
      100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default function Confetti() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pieces = [];
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const piece = document.createElement('div');
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = randomRange(6, 12);
      const left = randomRange(0, 100);
      const duration = randomRange(2, 4);
      const delay = randomRange(0, 2);
      const rotation = randomRange(0, 360);
      const shape = Math.random() > 0.5 ? '50%' : '0%';

      piece.style.cssText = `
        position: absolute;
        top: -20px;
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${shape};
        opacity: 0;
        pointer-events: none;
        animation: confettiFall ${duration}s ease-in ${delay}s forwards;
        transform: rotate(${rotation}deg);
      `;

      container.appendChild(piece);
      pieces.push(piece);
    }

    return () => {
      pieces.forEach((p) => p.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
}