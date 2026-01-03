"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Loader2 } from "lucide-react";

type DemoUser = {
  userIdentifier: string;
  firstName: string;
  lastName: string;
  pan: string;
  email: string;
  description: string;
  avatar: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    userIdentifier: "bailey-student-001",
    firstName: "Bailey",
    lastName: "Chen",
    pan: "4514170000000001",
    email: "bailey@university.edu",
    description: "Budget-conscious freshman managing groceries and blocking temptations",
    avatar: "👩‍🎓",
  },
  {
    userIdentifier: "oliver-student-002",
    firstName: "Oliver",
    lastName: "Martinez",
    pan: "4514170000000002",
    email: "oliver@university.edu",
    description: "Junior controlling spending on electronics and apparel",
    avatar: "👨‍🎓",
  },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (user: DemoUser) => {
    setLoading(true);
    setSelectedUser(user.userIdentifier);

    try {
      // Store user in localStorage for demo
      const userData = {
        viegoUID: user.userIdentifier,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        xp: 0,
        pan: user.pan,
      };

      localStorage.setItem("viego_user", JSON.stringify(userData));
      localStorage.setItem("demo_user", user.userIdentifier);

      // Redirect to island
      setTimeout(() => {
        router.push("/island");
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Viego Wallet
        </h1>
        <p className="text-xl text-gray-600">
          Cal Hacks 12.0 Demo - Select a student persona
        </p>
      </div>

      {/* Demo Notice */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-3">
          <div className="text-3xl">ℹ️</div>
          <div>
            <h3 className="font-bold text-blue-900 text-lg mb-2">Demo Mode</h3>
            <p className="text-blue-800">
              This is a demonstration of Visa Transaction Controls (VCTC) integration.
              Both users have pre-configured spending limits and transaction history in
              the Visa sandbox environment.
            </p>
          </div>
        </div>
      </div>

      {/* User Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {DEMO_USERS.map((user) => (
          <button
            key={user.userIdentifier}
            onClick={() => handleLogin(user)}
            disabled={loading}
            className={`bg-white rounded-2xl p-8 shadow-lg border-2 transition-all hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-left ${
              selectedUser === user.userIdentifier
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">{user.avatar}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-6">{user.description}</p>

            {/* Stats */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Card:</span>
                <span className="font-mono text-gray-900">
                  •••• {user.pan.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-semibold">✓ Active Controls</span>
              </div>
            </div>

            {/* Loading State */}
            {loading && selectedUser === user.userIdentifier && (
              <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="animate-spin" size={20} />
                <span className="font-medium">Logging in...</span>
              </div>
            )}

            {/* Login Button */}
            {!loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-blue-600 font-bold">
                <User size={20} />
                <span>Login as {user.firstName}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Features */}
      <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          What You'll See
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🎮</div>
            <h4 className="font-bold text-gray-900 mb-2">Interactive Island</h4>
            <p className="text-sm text-gray-600">
              Gamified financial companion with virtual pets
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💳</div>
            <h4 className="font-bold text-gray-900 mb-2">Smart Spending Controls</h4>
            <p className="text-sm text-gray-600">
              Real-time transaction monitoring via VCTC API
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">📊</div>
            <h4 className="font-bold text-gray-900 mb-2">Budget Dashboard</h4>
            <p className="text-sm text-gray-600">
              Visualize spending patterns and stay on track
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
