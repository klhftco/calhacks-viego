"use client";

import { useState } from "react";
import { Users, UserPlus, Trophy, TrendingUp, Flame, Award, Eye, MessageCircle } from "lucide-react";

interface Friend {
  id: number;
  name: string;
  university: string;
  avatar: string;
  streak: number;
  monsters: number;
  savingsGoalProgress: number;
  isOnline: boolean;
}

interface GroupActivity {
  id: number;
  user: string;
  action: string;
  timestamp: string;
  icon: any;
  color: string;
}

interface Leaderboard {
  rank: number;
  name: string;
  score: number;
  isCurrentUser: boolean;
}

export default function FriendsPage() {
  const [friends] = useState<Friend[]>([
    {
      id: 1,
      name: "Sarah Chen",
      university: "UC Berkeley",
      avatar: "👩",
      streak: 21,
      monsters: 4,
      savingsGoalProgress: 85,
      isOnline: true,
    },
    {
      id: 2,
      name: "Mike Johnson",
      university: "UC Berkeley",
      avatar: "👨",
      streak: 14,
      monsters: 3,
      savingsGoalProgress: 62,
      isOnline: true,
    },
    {
      id: 3,
      name: "Emma Davis",
      university: "Stanford",
      avatar: "👩",
      streak: 7,
      monsters: 2,
      savingsGoalProgress: 45,
      isOnline: false,
    },
    {
      id: 4,
      name: "Alex Kim",
      university: "UC Berkeley",
      avatar: "👨",
      streak: 30,
      monsters: 5,
      savingsGoalProgress: 95,
      isOnline: true,
    },
  ]);

  const [groupActivities] = useState<GroupActivity[]>([
    {
      id: 1,
      user: "Sarah Chen",
      action: "hatched a new monster! 🦕",
      timestamp: "2 hours ago",
      icon: Trophy,
      color: "text-green-600",
    },
    {
      id: 2,
      user: "Alex Kim",
      action: "reached a 30-day savings streak! 🔥",
      timestamp: "5 hours ago",
      icon: Flame,
      color: "text-teal-600",
    },
    {
      id: 3,
      user: "Mike Johnson",
      action: "unlocked the Budget Master badge",
      timestamp: "1 day ago",
      icon: Award,
      color: "text-blue-600",
    },
    {
      id: 4,
      user: "Emma Davis",
      action: "saved $50 this week",
      timestamp: "2 days ago",
      icon: TrendingUp,
      color: "text-emerald-600",
    },
  ]);

  const [leaderboard] = useState<Leaderboard[]>([
    { rank: 1, name: "Alex Kim", score: 1250, isCurrentUser: false },
    { rank: 2, name: "Sarah Chen", score: 1180, isCurrentUser: false },
    { rank: 3, name: "You", score: 850, isCurrentUser: true },
    { rank: 4, name: "Mike Johnson", score: 720, isCurrentUser: false },
    { rank: 5, name: "Emma Davis", score: 580, isCurrentUser: false },
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
        <p className="text-gray-600 text-sm">Your campus crew</p>
      </div>

      {/* Floating bubbles for friends (clustered without overlap using concentric rings) */}
      <div className="relative rounded-2xl p-8 shadow-lg border-2 border-blue-100 mb-8 min-h-[320px] overflow-hidden bg-gradient-to-br from-blue-50 to-green-50">
        {friends.map((f, idx) => {
          const ringCaps = [6, 12, 18];
          const ringRadii = [90, 140, 180];
          let ring = 0;
          let pos = idx;
          while (ring < ringCaps.length && pos >= ringCaps[ring]) {
            pos -= ringCaps[ring];
            ring++;
          }
          const cap = ringCaps[Math.min(ring, ringCaps.length - 1)];
          const radius = ringRadii[Math.min(ring, ringRadii.length - 1)];
          const step = (2 * Math.PI) / cap;
          const angle = -Math.PI / 2 + pos * step; // start at top
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const size = idx % 4 === 0 ? 64 : 56;
          return (
            <div
              key={f.id}
              className={`absolute rounded-full flex items-center justify-center text-2xl shadow-md ring-2 ${f.isOnline ? 'ring-green-300 bg-green-100' : 'ring-blue-200 bg-blue-100'}`}
              style={{
                width: size, height: size,
                left: '50%', top: '50%',
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                animation: `float ${6 + (idx % 4)}s ease-in-out ${(idx % 5) * 0.6}s infinite alternate`,
              }}
              title={`${f.name} • ${f.university}`}
            >
              {f.avatar}
            </div>
          );
        })}
        <style jsx>{`
          @keyframes float { from { transform: translate(-50%, -50%) translate(0px, 0px); } to { transform: translate(-50%, -50%) translate(0px, -14px); } }
        `}</style>
      </div>

      {/* Below bubbles: two columns — left activity, right rank/XP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Group Activity (md: span 2) */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="text-blue-500" />
              Group Activity
            </h2>
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">UC Berkeley Group</span>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
            {groupActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className={`p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors ${index !== groupActivities.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className={`${activity.color}`}>
                    <Icon size={28} />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900"><span className="font-bold">{activity.user}</span> {activity.action}</p>
                    <p className="text-sm text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Rank and Group XP (aligned) */}
        <div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 text-blue-700 font-semibold">
                <Trophy size={20} />
                <span>Your Rank</span>
              </div>
              <div className="text-4xl font-bold text-gray-900 mt-1">#3</div>
              <div className="text-sm text-gray-500">in UC Berkeley group</div>
            </div>
            <div className="border-t border-gray-100 pt-4 text-center">
              <div className="inline-flex items-center gap-2 text-green-700 font-semibold">
                <Flame size={20} />
                <span>Group XP</span>
              </div>
              <div className="text-4xl font-bold text-gray-900 mt-1">850</div>
              <div className="text-sm text-gray-500">Keep climbing!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Friends List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-green-500" />
            My Friends
          </h2>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2">
            <UserPlus size={20} />
            Add Friend
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="text-5xl">{friend.avatar}</div>
                    {friend.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{friend.name}</h3>
                    <p className="text-sm text-gray-600">{friend.university}</p>
                    {friend.isOnline ? (
                      <span className="text-xs text-green-600 font-semibold">● Online</span>
                    ) : (
                      <span className="text-xs text-gray-400">○ Offline</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Friend Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="text-blue-600" size={16} />
                    <span className="text-xl font-bold text-gray-900">{friend.streak}</span>
                  </div>
                  <p className="text-xs text-gray-600">Day Streak</p>
                </div>

                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1">🦖 {friend.monsters}</div>
                  <p className="text-xs text-gray-600">Monsters</p>
                </div>

                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-900 mb-1">{friend.savingsGoalProgress}%</div>
                  <p className="text-xs text-gray-600">Goal</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-500 text-white py-2 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                  <Eye size={18} />
                  Visit Island
                </button>
                <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group Info Card */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-4">About University Groups</h2>
        <p className="text-white/90 mb-4">
          Join your university group to see how other students are managing their finances,
          share achievements, and compete on the leaderboard. Your spending activity is private -
          only achievements and progress are shared!
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">
            👥 {friends.length} Friends
          </span>
          <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">
            🏆 Compete Together
          </span>
          <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">
            🔒 Privacy Protected
          </span>
        </div>
      </div>
    </div>
  );
}
