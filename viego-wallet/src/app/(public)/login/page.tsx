"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User, Loader2, LogIn, ArrowRight } from "lucide-react";

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
  const [viegoUID, setViegoUID] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showTextLogin, setShowTextLogin] = useState(false);
  const router = useRouter();
  const { login, setUserData } = useAuth();

  const handleLogin = async (user: DemoUser) => {
    setLoading(true);
    setSelectedUser(user.userIdentifier);

    try {
      // Store user data using AuthContext
      const userData = {
        viegoUID: user.userIdentifier,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        xp: 0,
        pan: user.pan,
      };

      // Update AuthContext state (this also updates localStorage)
      setUserData(userData);

      // Also store demo_user for backward compatibility
      localStorage.setItem("demo_user", user.userIdentifier);

      // Redirect to budget (first page in app)
      router.replace("/budget");
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      setSelectedUser(null);
    }
  };

  const handleTextLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      await login(viegoUID);
      router.push("/budget");
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error instanceof Error ? error.message : "Failed to login");
      setLoading(false);
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

      {/* Login Mode Toggle */}
      <div className="flex gap-4 mb-8 justify-center">
        <button
          onClick={() => setShowTextLogin(false)}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            !showTextLogin
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Demo Users
        </button>
        <button
          onClick={() => setShowTextLogin(true)}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            showTextLogin
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Login with Viego UID
        </button>
      </div>

      {/* Text-Based Login */}
      {showTextLogin && (
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login to Viego</h2>
              <p className="text-gray-600">Enter your Viego UID to access your account</p>
            </div>

            <form onSubmit={handleTextLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Viego UID
                </label>
                <input
                  type="text"
                  required
                  value={viegoUID}
                  onChange={(e) => setViegoUID(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none font-mono text-gray-900"
                  placeholder="your-viego-id"
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">⚠️</span>
                    <span className="font-semibold text-red-700">{loginError}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    Login
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Cards */}
      {!showTextLogin && (
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
      )}

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
