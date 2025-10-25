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
      color: "text-yellow-500",
    },
    {
      id: 2,
      user: "Alex Kim",
      action: "reached a 30-day savings streak! 🔥",
      timestamp: "5 hours ago",
      icon: Flame,
      color: "text-orange-500",
    },
    {
      id: 3,
      user: "Mike Johnson",
      action: "unlocked the Budget Master badge",
      timestamp: "1 day ago",
      icon: Award,
      color: "text-purple-500",
    },
    {
      id: 4,
      user: "Emma Davis",
      action: "saved $50 this week",
      timestamp: "2 days ago",
      icon: TrendingUp,
      color: "text-green-500",
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Friends & Community</h1>
        <p className="text-gray-600">Connect with friends, share your journey, and climb the leaderboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Friends</h3>
            <Users size={24} />
          </div>
          <p className="text-4xl font-bold">{friends.length}</p>
          <p className="text-white/90 text-sm mt-2">{friends.filter(f => f.isOnline).length} online now</p>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Your Rank</h3>
            <Trophy size={24} />
          </div>
          <p className="text-4xl font-bold">#3</p>
          <p className="text-white/90 text-sm mt-2">in UC Berkeley group</p>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Group XP</h3>
            <Flame size={24} />
          </div>
          <p className="text-4xl font-bold">850</p>
          <p className="text-white/90 text-sm mt-2">Keep climbing!</p>
        </div>
      </div>

      {/* Group Activity Feed */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="text-blue-500" />
            Group Activity
          </h2>
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            UC Berkeley Group
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          {groupActivities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className={`p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                  index !== groupActivities.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className={`${activity.color}`}>
                  <Icon size={32} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">
                    <span className="font-bold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="text-yellow-500" />
          Leaderboard
        </h2>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.rank}
              className={`p-6 flex items-center justify-between transition-colors ${
                entry.isCurrentUser
                  ? 'bg-blue-50 border-2 border-blue-300'
                  : 'hover:bg-gray-50'
              } ${index !== leaderboard.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                    entry.rank === 1
                      ? 'bg-yellow-400 text-yellow-900'
                      : entry.rank === 2
                      ? 'bg-gray-300 text-gray-700'
                      : entry.rank === 3
                      ? 'bg-orange-400 text-orange-900'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {entry.rank}
                </div>

                <div>
                  <p className={`font-bold text-lg ${entry.isCurrentUser ? 'text-blue-600' : 'text-gray-900'}`}>
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{entry.score}</p>
                <p className="text-sm text-gray-500">XP</p>
              </div>
            </div>
          ))}
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
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="text-orange-500" size={16} />
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
      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-8 text-white shadow-lg">
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
