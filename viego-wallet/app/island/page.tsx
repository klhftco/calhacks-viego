"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useIsland } from "@/context/IslandContext";
import { Egg, Sparkles, Trophy, TrendingUp, Star, Plus } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Monster {
  id: number;
  name: string;
  type: string;
  level: number;
  emoji: string;
  color: string;
  traits: string[];
}

interface EggProgress {
  id: number;
  progress: number;
  goalAmount: number;
  currentAmount: number;
  emoji: string;
}

// Map monster emojis to dinosaur images
const getDinoImage = (emoji: string): string => {
  const dinoMap: Record<string, string> = {
    "🦖": "/assets/trex.png",
    "🐉": "/assets/pterodactyl.png",
    "🦕": "/assets/plesiosaur.png",
    "🦴": "/assets/stegosaurus.png",
    "🐊": "/assets/ankylosaurus.png",
    "🦎": "/assets/triceratops.png",
  };
  return dinoMap[emoji] || "/assets/trex.png";
};

export default function IslandPage() {
  const { monsters, level: islandLevel, currentXP, goalXP, setXP } = useIsland();

  const [eggProgress] = useState<EggProgress[]>([
    { id: 1, progress: 65, goalAmount: 500, currentAmount: 325, emoji: "🥚" },
    { id: 2, progress: 30, goalAmount: 1000, currentAmount: 300, emoji: "🥚" },
  ]);

  const islandPercent = Math.min(100, Math.round((currentXP / goalXP) * 100));

  // roaming positions for monsters (in percentages inside the landscape)
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>(() => {
    const initial: Record<number, { x: number; y: number }> = {};
    for (const m of monsters) {
      initial[m.id] = { x: 20 + Math.random() * 60, y: 25 + Math.random() * 50 };
    }
    return initial;
  });

  // per-monster meta for speed, scale, and wobble timings
  const meta = useMemo(() => {
    const map: Record<number, { speed: number; scale: number; wobbleDur: number; wobbleDelay: number }> = {};
    for (const m of monsters) {
      map[m.id] = {
        speed: 1.4 - Math.random() * 0.8, // 0.6..1.4s base multiplier
        scale: 0.9 + Math.random() * 0.5, // 0.9..1.4 scale
        wobbleDur: 1.2 + Math.random() * 1.2, // 1.2..2.4s
        wobbleDelay: Math.random() * 1.0, // 0..1s
      };
    }
    return map;
  }, [monsters]);

  // (removed grass particles per request)

  useEffect(() => {
    const id = setInterval(() => {
      setPositions((prev) => {
        const next: Record<number, { x: number; y: number }> = {};
        for (const m of monsters) {
          const p = prev[m.id] || { x: 50, y: 50 };
          // wander a little each tick
          const dx = (Math.random() - 0.5) * 14; // +/- 7%
          const dy = (Math.random() - 0.5) * 10; // +/- 5%
          const x = Math.max(8, Math.min(92, p.x + dx));
          const y = Math.max(18, Math.min(82, p.y + dy));
          next[m.id] = { x, y };
        }
        return next;
      });
    }, 2500);
    return () => clearInterval(id);
  }, [monsters]);

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Island</h1>
        <p className="text-gray-600">Watch your monsters roam and grow as you achieve your financial goals!</p>
      </div>

      {/* Streak & Achievement Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <TrendingUp size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">14 Day Streak!</h3>
              <p className="text-white/90">Keep saving to maintain your streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="text-yellow-300" fill="currentColor" size={24} />
            <span className="text-2xl font-bold">850 XP</span>
          </div>
        </div>
      </div>

      {/* Isometric Grassy Plains with roaming monsters */}
      <div className="rounded-3xl mb-8 shadow-lg border-4 border-white relative overflow-hidden" style={{ minHeight: '600px' }}>
        {/* Landscape Background */}
        <div className="absolute inset-0">
          <Image
            src="/assets/landscape.png"
            alt="Viego Island"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <div className="absolute top-4 left-4 bg-white/90 rounded-full px-4 py-2 shadow-md z-10">
          <span className="font-semibold text-gray-700">🏝️ Viego Island</span>
        </div>

        {/* Central big tree with XP bar */}
        <div className="absolute select-none" style={{ left: '50%', top: '46%', transform: 'translate(-50%, -50%)', zIndex: 300 }}>
          <div
            className="leading-none text-center drop-shadow"
            style={{
              display: 'inline-block',
              animation: 'treeSway 3.6s ease-in-out 0.4s infinite alternate',
              transformOrigin: '50% 90%'
            }}
          >
            <span className="block text-[7rem] md:text-[9rem]">🌳</span>
          </div>
          <div className="mt-2 bg-white/90 backdrop-blur-sm rounded-xl shadow border border-green-100 px-3 py-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="font-semibold text-green-700">Island Lv. {islandLevel}</span>
              <span className="font-medium text-gray-700">{currentXP}/{goalXP}</span>
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full" style={{ width: `${islandPercent}%` }} />
            </div>
            <div className="mt-2 text-center">
              <button
                onClick={() => setXP(currentXP + 50)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus size={14} /> Gain 50 XP
              </button>
            </div>
          </div>
        </div>

        {/* roaming monsters */}
        {monsters.map((m) => {
          const p = positions[m.id] || { x: 50, y: 50 };
          const mmeta = meta[m.id] || { speed: 1, scale: 1, wobbleDur: 1.5, wobbleDelay: 0 };
          return (
            <div
              key={m.id}
              className="absolute select-none"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: 'translate(-50%, -50%)',
                transition: `left ${1.8 * mmeta.speed}s ease, top ${1.8 * mmeta.speed}s ease`,
                zIndex: 100 + Math.round(p.y),
              }}
              title={`Traits: ${m.traits.join(', ')}`}
            >
              <div
                className="drop-shadow-lg leading-none text-center"
                style={{
                  transform: `scale(${mmeta.scale})`,
                  animation: `wobble ${mmeta.wobbleDur}s ease-in-out ${mmeta.wobbleDelay}s infinite alternate`,
                  display: 'inline-block',
                }}
              >
                <Image
                  src={getDinoImage(m.emoji)}
                  alt={m.name}
                  width={80}
                  height={80}
                  className="pointer-events-none"
                  style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
                />
              </div>
              <div className="mt-1 mx-auto w-max">
                <span className={`${m.color} text-white px-2 py-0.5 rounded-full text-xs font-semibold`}>Lv. {m.level}</span>
              </div>
              <div className="text-[10px] text-gray-700 bg-white/80 px-2 py-0.5 rounded-full text-center mt-1 font-medium">{m.name}</div>
            </div>
          );
        })}

        <style jsx>{`
          @keyframes wobble {
            0% { transform: translateY(0) scale(1); }
            100% { transform: translateY(-4px) scale(1.02); }
          }
          @keyframes treeSway {
            0% { transform: rotate(-2deg); }
            100% { transform: rotate(2deg); }
          }
        `}</style>

        {/* Decorative elements removed per request */}
      </div>

      {/* Egg Hatching Progress */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Egg className="text-blue-600" />
          Eggs Hatching
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eggProgress.map((egg) => (
            <div key={egg.id} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="text-5xl">{egg.emoji}</div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{egg.progress}%</p>
                  <p className="text-sm text-gray-500">Complete</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${egg.progress}%` }}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Goal: ${egg.goalAmount}</span>
                <span className="text-blue-700 font-semibold">${egg.currentAmount} saved</span>
              </div>

              {egg.progress >= 50 && (
                <div className="mt-3 flex items-center gap-2 text-blue-700">
                  <Sparkles size={16} />
                  <span className="text-sm font-semibold">Almost there! Keep saving!</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Section (round medals style) */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="text-green-600" />
          Recent Achievements
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {/* Medal 1 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-green-500 shadow-lg ring-4 ring-white flex items-center justify-center text-3xl">🏆</div>
            <div className="mt-2 text-sm font-semibold text-gray-900">Budget Master</div>
            <div className="text-xs text-gray-600">2 weeks under budget</div>
          </div>
          {/* Medal 2 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg ring-4 ring-white flex items-center justify-center text-3xl">💰</div>
            <div className="mt-2 text-sm font-semibold text-gray-900">Savings Streak</div>
            <div className="text-xs text-gray-600">14 day streak</div>
          </div>
          {/* Medal 3 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-green-400 shadow-lg ring-4 ring-white flex items-center justify-center text-3xl">🌱</div>
            <div className="mt-2 text-sm font-semibold text-gray-900">First Monster</div>
            <div className="text-xs text-gray-600">Starter hatched</div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
