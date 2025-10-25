"use client";

import { useState } from "react";
import { Egg, Sparkles, Trophy, TrendingUp, Star } from "lucide-react";

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

export default function IslandPage() {
  const [monsters] = useState<Monster[]>([
    { id: 1, name: "Sparkle", type: "Starter", level: 5, emoji: "🦖", color: "bg-green-500", traits: ["Frugal", "Cheerful"] },
    { id: 2, name: "Goldie", type: "Savings Master", level: 3, emoji: "🐉", color: "bg-teal-500", traits: ["Persistent", "Lucky"] },
    { id: 3, name: "Bluey", type: "Budget Beast", level: 2, emoji: "🦕", color: "bg-blue-500", traits: ["Planner", "Calm"] },
  ]);

  const [eggProgress] = useState<EggProgress[]>([
    { id: 1, progress: 65, goalAmount: 500, currentAmount: 325, emoji: "🥚" },
    { id: 2, progress: 30, goalAmount: 1000, currentAmount: 300, emoji: "🥚" },
  ]);

  return (
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

      {/* Isometric Grassy Plains with Monsters */}
      <div className="rounded-3xl p-8 mb-8 min-h-[420px] shadow-lg border-4 border-white relative overflow-hidden bg-gradient-to-br from-green-200 to-blue-200">
        {/* faux isometric grid */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.2) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,0.2) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%), linear-gradient(315deg, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0) 25%)", backgroundSize: '40px 40px', backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0' }} />
        <div className="absolute top-4 left-4 bg-white/90 rounded-full px-4 py-2 shadow-md">
          <span className="font-semibold text-gray-700">🏝️ Viego Island</span>
        </div>

        {/* Monsters roaming */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-16">
          {monsters.map((monster, index) => (
            <div
              key={monster.id}
              className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-2 ${
                index % 2 === 0 ? 'mt-8' : ''
              }`}
            >
              <div className="text-6xl mb-3 text-center">{monster.emoji}</div>
              <h3 className="text-xl font-bold text-gray-900 text-center">{monster.name}</h3>
              <p className="text-sm text-gray-600 text-center mb-2">{monster.type}</p>
              <div className="flex items-center justify-center gap-2">
                <div className={`${monster.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                  Lv. {monster.level}
                </div>
              </div>
              <p className="text-xs text-gray-600 text-center mt-2">Traits: {monster.traits.join(', ')}</p>
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-4 right-4 text-4xl animate-bounce">🌳</div>
        <div className="absolute bottom-8 left-8 text-3xl">🌺</div>
        <div className="absolute top-1/3 right-1/4 text-2xl">☁️</div>
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

      {/* Achievements Section (badges along bottom) */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="text-green-600" />
          Recent Achievements
        </h2>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-3">
          <div className="bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl p-4 text-white shadow-lg">
            <div className="text-3xl mb-2">🏆</div>
            <h4 className="font-bold mb-1">Budget Master</h4>
            <p className="text-sm text-white/90">Stayed under budget for 2 weeks</p>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-teal-500 rounded-xl p-4 text-white shadow-lg">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="font-bold mb-1">Savings Streak</h4>
            <p className="text-sm text-white/90">14 consecutive days of saving</p>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-4 text-white shadow-lg">
            <div className="text-3xl mb-2">🌱</div>
            <h4 className="font-bold mb-1">First Monster</h4>
            <p className="text-sm text-white/90">Hatched your starter monster!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
