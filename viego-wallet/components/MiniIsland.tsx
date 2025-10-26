"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useIsland } from '@/context/IslandContext';

export default function MiniIsland() {
  const { monsters: allMonsters, level: islandLevel, currentXP: islandCurrent, goalXP: islandGoal } = useIsland();
  const monsters = allMonsters.slice(0, 2).map(m => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color, level: m.level }));

  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>(() => {
    const initial: Record<number, { x: number; y: number }> = {};
    for (const m of monsters) {
      initial[m.id] = { x: 30 + Math.random() * 40, y: 40 + Math.random() * 30 };
    }
    return initial;
  });

  const meta = useMemo(() => {
    const map: Record<number, { speed: number; scale: number; wobbleDur: number; wobbleDelay: number }> = {};
    for (const m of monsters) {
      map[m.id] = {
        speed: 1.2 - Math.random() * 0.6,
        scale: 0.9 + Math.random() * 0.3,
        wobbleDur: 1.2 + Math.random() * 0.8,
        wobbleDelay: Math.random() * 0.8,
      };
    }
    return map;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setPositions((prev) => {
        const next: Record<number, { x: number; y: number }> = {};
        for (const m of monsters) {
          const p = prev[m.id] || { x: 50, y: 50 };
          const dx = (Math.random() - 0.5) * 10; // +/-5%
          const dy = (Math.random() - 0.5) * 8; // +/-4%
          const x = Math.max(15, Math.min(85, p.x + dx));
          const y = Math.max(25, Math.min(80, p.y + dy));
          next[m.id] = { x, y };
        }
        return next;
      });
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const islandPercent = Math.min(100, Math.round((islandCurrent / islandGoal) * 100));

  return (
    <div className="rounded-3xl p-6 mb-6 min-h-[200px] shadow-lg border-4 border-white relative overflow-hidden bg-gradient-to-br from-green-200 to-blue-200">
      <div
        className="absolute top-3 left-4 bg-white/90 rounded-full px-3 py-1 shadow text-xs font-semibold text-gray-700"
      >
        Viego Meadow
      </div>

      {/* Center tree with sway + XP */}
      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 select-none z-30 text-center">
        <div className="inline-block" style={{ animation: 'homeTree 3.6s ease-in-out 0.3s infinite alternate', transformOrigin: '50% 90%' }}>
          <span className="block text-6xl">🌳</span>
        </div>
        <div className="mt-1 bg-white/90 rounded-full px-3 py-1 text-[10px] font-semibold text-green-700 shadow">
          Island Lv. {islandLevel}
        </div>
        <div className="mt-1 h-2 rounded-full bg-gray-200 overflow-hidden w-32 mx-auto">
          <div className="h-full bg-gradient-to-r from-green-500 to-blue-500" style={{ width: `${islandPercent}%` }} />
        </div>
      </div>

      {/* Roaming monsters */}
      {monsters.map((m) => {
        const p = positions[m.id] || { x: 50, y: 50 };
        const mmeta = meta[m.id];
        return (
          <div
            key={m.id}
            className="absolute select-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: 'translate(-50%, -50%)',
              transition: `left ${1.6 * mmeta.speed}s ease, top ${1.6 * mmeta.speed}s ease`,
              zIndex: 50 + Math.round(p.y),
            }}
          >
            <div
              className="drop-shadow-sm leading-none text-center"
              style={{
                fontSize: '40px',
                transform: `scale(${mmeta.scale})`,
                animation: `wobble ${mmeta.wobbleDur}s ease-in-out ${mmeta.wobbleDelay}s infinite alternate`,
                display: 'inline-block',
              }}
            >
              {m.emoji}
            </div>
            <div className="mt-0.5 mx-auto w-max">
              <span className={`${m.color} text-white px-2 py-0.5 rounded-full text-[10px] font-semibold`}>Lv. {m.level}</span>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes wobble { 0% { transform: translateY(0) scale(1); } 100% { transform: translateY(-3px) scale(1.02); } }
      `}</style>
    </div>
  );
}
