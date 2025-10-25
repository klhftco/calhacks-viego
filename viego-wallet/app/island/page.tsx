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
    { id: 1, name: "Sparkle", type: "Starter", level: 5, emoji: "🦖", color: "bg-green-500" },
    { id: 2, name: "Goldie", type: "Savings Master", level: 3, emoji: "🐉", color: "bg-yellow-500" },
    { id: 3, name: "Bluey", type: "Budget Beast", level: 2, emoji: "🦕", color: "bg-blue-500" },
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
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
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

      {/* Island Area with Monsters */}
      <div className="bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 rounded-3xl p-8 mb-8 min-h-[400px] shadow-lg border-4 border-white relative overflow-hidden">
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
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-4 right-4 text-4xl animate-bounce">🌴</div>
        <div className="absolute bottom-8 left-8 text-3xl">🌺</div>
        <div className="absolute top-1/3 right-1/4 text-2xl">☁️</div>
      </div>

      {/* Egg Hatching Progress */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Egg className="text-purple-500" />
          Eggs Hatching
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eggProgress.map((egg) => (
            <div key={egg.id} className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
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
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${egg.progress}%` }}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Goal: ${egg.goalAmount}</span>
                <span className="text-purple-600 font-semibold">${egg.currentAmount} saved</span>
              </div>

              {egg.progress >= 50 && (
                <div className="mt-3 flex items-center gap-2 text-purple-600">
                  <Sparkles size={16} />
                  <span className="text-sm font-semibold">Almost there! Keep saving!</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          Recent Achievements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-4 text-white shadow-lg">
            <div className="text-3xl mb-2">🏆</div>
            <h4 className="font-bold mb-1">Budget Master</h4>
            <p className="text-sm text-white/90">Stayed under budget for 2 weeks</p>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-4 text-white shadow-lg">
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
