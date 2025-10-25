import Link from "next/link";
import { Wallet, Egg, TrendingUp, MapPin, Gift, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Viego Wallet
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your gamified student financial companion. Save money, grow your monsters, and master your budget!
        </p>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Current Balance</h3>
            <Wallet className="text-blue-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">$1,234.56</p>
          <p className="text-sm text-gray-500 mt-2">+5.2% this month</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Savings Streak</h3>
            <TrendingUp className="text-purple-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">14 Days</p>
          <p className="text-sm text-gray-500 mt-2">Keep it up!</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Monsters</h3>
            <Egg className="text-green-500" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-900">3 Active</p>
          <p className="text-sm text-gray-500 mt-2">1 egg hatching...</p>
        </div>
      </div>

      {/* Feature Cards */}
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Explore Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/island">
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
            <Egg className="text-white mb-4" size={48} />
            <h3 className="text-2xl font-bold text-white mb-2">My Island</h3>
            <p className="text-white/90">
              Visit your island and watch your monsters roam. Hatch new creatures by meeting savings goals!
            </p>
          </div>
        </Link>

        <Link href="/budget">
          <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
            <TrendingUp className="text-white mb-4" size={48} />
            <h3 className="text-2xl font-bold text-white mb-2">Budget</h3>
            <p className="text-white/90">
              Track spending, set limits, and automate payments. Get positive nudges to reach your goals!
            </p>
          </div>
        </Link>

        <Link href="/map">
          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
            <MapPin className="text-white mb-4" size={48} />
            <h3 className="text-2xl font-bold text-white mb-2">Merchant Map</h3>
            <p className="text-white/90">
              Find nearby student essentials and see where your Viego card is accepted.
            </p>
          </div>
        </Link>

        <Link href="/savings">
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
            <Gift className="text-white mb-4" size={48} />
            <h3 className="text-2xl font-bold text-white mb-2">Offers</h3>
            <p className="text-white/90">
              Discover and automatically apply merchant offers to stretch your budget further.
            </p>
          </div>
        </Link>

        <Link href="/friends">
          <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1">
            <Users className="text-white mb-4" size={48} />
            <h3 className="text-2xl font-bold text-white mb-2">Friends</h3>
            <p className="text-white/90">
              Connect with friends, visit their islands, and share your financial journey together.
            </p>
          </div>
        </Link>

        <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-8 shadow-lg">
          <Wallet className="text-white mb-4" size={48} />
          <h3 className="text-2xl font-bold text-white mb-2">Your Card</h3>
          <p className="text-white/90">
            Manage your Viego card, view transactions, and control spending limits.
          </p>
        </div>
      </div>
    </div>
  );
}
