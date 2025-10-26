"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/hooks/useAccount";
import { useAuth } from "@/contexts/AuthContext";
import {
  UserPlus,
  User,
  CheckCircle,
  AlertCircle,
  Loader,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  RefreshCw,
  Save,
} from "lucide-react";
import { AlertPreference, NotificationDetail } from "@/types/visaAlerts";
import ProtectedRoute from "@/components/ProtectedRoute";

const ALERT_TYPES = [
  "DECLINE_ALL",
  "DECLINE_BREACHED_AMT",
  "ALERT_BREACHED_AMT",
  "DECLINE_BY_SPEND_LIMIT",
  "ALERT_BREACHED_SPEND",
  "DECLINE_BY_ISSUER",
];

const CONTROL_TYPES = [
  "GLOBAL",
  "ALL",
  "TCT_ATM_WITHDRAW",
  "TCT_AUTO_PAY",
  "TCT_BRICK_AND_MORTAR",
  "TCT_CROSS_BORDER",
  "TCT_E_COMMERCE",
  "TCT_CONTACTLESS",
  "TCT_PURCHASE_RETURN",
  "TCT_OCT",
  "MCT_ADULT_ENTERTAINMENT",
  "MCT_AIRFARE",
  "MCT_ALCOHOL",
  "MCT_APPAREL_AND_ACCESSORIES",
  "MCT_AUTOMOTIVE",
  "MCT_CAR_RENTAL",
  "MCT_ELECTRONICS",
  "MCT_SPORT_AND_RECREATION",
  "MCT_GAMBLING",
  "MCT_GAS_AND_PETROLEUM",
  "MCT_GROCERY",
  "MCT_HOTEL_AND_LODGING",
  "MCT_HOUSEHOLD",
  "MCT_PERSONAL_CARE",
  "MCT_SMOKE_AND_TOBACCO",
  "MCT_DINING",
];

const CONTACT_TYPES = ["Email", "SMS", "Push"];
const EMAIL_FORMATS = ["Plain", "RichText", "Html"];
const STATUS_OPTIONS = ["Active", "InActive"];
const DEFAULT_PORTFOLIO_ID = "001";
const DEFAULT_CALLING_CODE = "1";

export default function AccountPage() {
  const router = useRouter();
  const { profile, loading, error, createAccount, getAccount, clearError } = useAccount();
  const { user, login, logout, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    customViegoUID: "",
  });

  const [viegoUID, setViegoUID] = useState("");
  const [loginUID, setLoginUID] = useState("");
  const [loginError, setLoginError] = useState("");
  const [mode, setMode] = useState<"create" | "retrieve" | "settings">("settings");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState(true);
  const [basicSettingsSaving, setBasicSettingsSaving] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [alertPreferencesState, setAlertPreferencesState] = useState<AlertPreference[]>([]);
  const [visaDocumentId, setVisaDocumentId] = useState("");
  const [visaIdentifierInput, setVisaIdentifierInput] = useState("");
  const [newPreferenceForm, setNewPreferenceForm] = useState({
    alertType: ALERT_TYPES[0],
    controlType: CONTROL_TYPES[0],
    contactType: CONTACT_TYPES[0],
    contactValue: "",
    status: STATUS_OPTIONS[0],
    preferredEmailFormat: EMAIL_FORMATS[0],
    callingCode: DEFAULT_CALLING_CODE,
    isVerified: true,
    portfolioID: DEFAULT_PORTFOLIO_ID,
  });
  const [notificationHistory, setNotificationHistory] = useState<NotificationDetail[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (profile?.preferences) {
      setNotificationsEnabled(profile.preferences.notifications ?? true);
      setBudgetAlertsEnabled(profile.preferences.budgetAlerts ?? true);
    }
    if (profile?.visaUserIdentifier) {
      setVisaIdentifierInput((prev) => prev || profile.visaUserIdentifier || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user?.email) {
      setNewPreferenceForm((prev) => ({
        ...prev,
        contactValue: prev.contactValue || user.email,
      }));
    }
    if (user?.viegoUID) {
      setVisaIdentifierInput((prev) => prev || user.viegoUID);
    }
  }, [user]);

  const loadNotificationPreferences = useCallback(
    async (targetUID: string) => {
      setPreferencesLoading(true);
      setPreferencesMessage(null);
      try {
        const response = await fetch(`/api/alerts/preferences?viegoUID=${encodeURIComponent(targetUID)}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load notification preferences");
        }

        const data = result.data || {};
        setAlertPreferencesState(data.alertPreferences || []);
        setVisaDocumentId(data.visaAlertDocumentId || "");

        if (data.visaUserIdentifier) {
          setVisaIdentifierInput((prev) => prev || data.visaUserIdentifier);
        }
      } catch (err) {
        setPreferencesMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to load notification preferences",
        });
      } finally {
        setPreferencesLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (user?.viegoUID) {
      loadNotificationPreferences(user.viegoUID);
    }
  }, [user, loadNotificationPreferences]);

  const updatePreferenceAtIndex = useCallback(
    (index: number, updater: (pref: AlertPreference) => AlertPreference) => {
      setAlertPreferencesState((prev) =>
        prev.map((pref, i) => (i === index ? updater(pref) : pref))
      );
    },
    []
  );

  const handlePreferenceFieldChange = (index: number, field: keyof AlertPreference, value: string) => {
    updatePreferenceAtIndex(index, (pref) => ({
      ...pref,
      [field]: value,
    }));
  };

  const handleContactFieldChange = (index: number, field: string, value: string | boolean) => {
    updatePreferenceAtIndex(index, (pref) => {
      const contacts = pref.contacts?.length
        ? [...pref.contacts]
        : [
            {
              contactType: CONTACT_TYPES[0],
              contactValue: "",
              status: STATUS_OPTIONS[0],
              isVerified: true,
            },
          ];

      contacts[0] = {
        ...contacts[0],
        [field]: value,
      };

      return {
        ...pref,
        contacts,
      };
    });
  };

  const handleBasicSettingsSave = async () => {
    if (!user) {
      setPreferencesMessage({ type: "error", text: "Login is required to save settings." });
      return;
    }

    setBasicSettingsSaving(true);
    setPreferencesMessage(null);

    try {
      const response = await fetch("/api/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          viegoUID: user.viegoUID,
          updates: {
            preferences: {
              notifications: notificationsEnabled,
              budgetAlerts: budgetAlertsEnabled,
            },
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save settings");
      }

      setPreferencesMessage({ type: "success", text: "Account notification toggles saved." });
    } catch (err) {
      setPreferencesMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save settings",
      });
    } finally {
      setBasicSettingsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) {
      setPreferencesMessage({ type: "error", text: "Login is required to save alert preferences." });
      return;
    }

    setPreferencesSaving(true);
    setPreferencesMessage(null);

    try {
      const response = await fetch("/api/alerts/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "replace",
          viegoUID: user.viegoUID,
          documentId: visaDocumentId || undefined,
          userIdentifier: visaIdentifierInput || undefined,
          alertPreferences: alertPreferencesState,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save alert preferences");
      }

      setAlertPreferencesState(result.data?.alertPreferences || []);
      setPreferencesMessage({
        type: "success",
        text: "Visa notification preferences updated.",
      });
    } catch (err) {
      setPreferencesMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save alert preferences",
      });
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleAddPreference = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setPreferencesMessage({ type: "error", text: "Login is required to manage alert preferences." });
      return;
    }

    if (!newPreferenceForm.contactValue) {
      setPreferencesMessage({ type: "error", text: "Contact value is required." });
      return;
    }

    const newPreference: AlertPreference = {
      alertType: newPreferenceForm.alertType,
      controlType: newPreferenceForm.controlType,
      status: newPreferenceForm.status,
      portfolioID: newPreferenceForm.portfolioID || undefined,
      contacts: [
        {
          contactType: newPreferenceForm.contactType,
          contactValue: newPreferenceForm.contactValue,
          callingCode:
            newPreferenceForm.contactType === "SMS"
              ? newPreferenceForm.callingCode || DEFAULT_CALLING_CODE
              : undefined,
          isVerified: newPreferenceForm.isVerified,
          preferredEmailFormat:
            newPreferenceForm.contactType === "Email"
              ? newPreferenceForm.preferredEmailFormat
              : undefined,
          status: newPreferenceForm.status,
        },
      ],
    };

    setPreferencesSaving(true);
    setPreferencesMessage(null);

    try {
      const response = await fetch("/api/alerts/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add",
          viegoUID: user.viegoUID,
          documentId: visaDocumentId || undefined,
          userIdentifier: visaIdentifierInput || undefined,
          alertPreferences: [newPreference],
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add alert preference");
      }

      setAlertPreferencesState(result.data?.alertPreferences || []);
      setPreferencesMessage({ type: "success", text: "Alert preference added." });
    } catch (err) {
      setPreferencesMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to add alert preference",
      });
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleRemovePreference = async (index: number) => {
    if (!user) {
      setPreferencesMessage({ type: "error", text: "Login is required to manage alert preferences." });
      return;
    }

    const targetPreference = alertPreferencesState[index];

    if (!targetPreference) {
      return;
    }

    setPreferencesSaving(true);
    setPreferencesMessage(null);

    try {
      const response = await fetch("/api/alerts/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "remove",
          viegoUID: user.viegoUID,
          documentId: visaDocumentId || undefined,
          userIdentifier: visaIdentifierInput || undefined,
          alertPreferences: [targetPreference],
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to remove alert preference");
      }

      setAlertPreferencesState(result.data?.alertPreferences || []);
      setPreferencesMessage({ type: "success", text: "Alert preference removed." });
    } catch (err) {
      setPreferencesMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to remove alert preference",
      });
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleFetchHistory = async () => {
    if (!visaDocumentId) {
      setPreferencesMessage({
        type: "error",
        text: "Visa document ID is required to fetch alert history.",
      });
      return;
    }

    setHistoryLoading(true);
    setPreferencesMessage(null);

    try {
      const response = await fetch("/api/alerts/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagination: {
            pageLimit: "10",
            startIndex: "1",
          },
          documentIds: [visaDocumentId],
          includeAlertDetails: true,
          includeContactDetails: true,
          includeMerchantDetails: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch alert history");
      }

      setNotificationHistory(result.resource?.notificationDetails || []);
    } catch (err) {
      setPreferencesMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to fetch alert history",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  /**
   * Handle login
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      await login(loginUID);
      setLoginUID("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Failed to login");
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    localStorage.removeItem("viego_user");
    localStorage.removeItem("demo_user");
    router.push("/login");
  };

  /**
   * Handle account creation
   * Logic: Check if account exists, then create if nothing exists
   */
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const newProfile = await createAccount({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || undefined,
        customViegoUID: formData.customViegoUID || undefined,
      });

      console.log("Account created successfully:", newProfile);
      alert(`Account created!\n\nViego UID: ${newProfile.viegoUID}\nEmail: ${newProfile.email}\n\nYour account is now saved in MongoDB!`);

      // Clear form
      setFormData({ email: "", firstName: "", lastName: "", phoneNumber: "", customViegoUID: "" });
    } catch (err) {
      console.error("Failed to create account:", err);
    }
  };

  /**
   * Handle account retrieval
   * Logic: Retrieve existing profile by viegoUID to check notifications
   */
  const handleRetrieveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const existingProfile = await getAccount(viegoUID);
      console.log("Account retrieved:", existingProfile);
      alert(`Account found!\n\nViego UID: ${existingProfile.viegoUID}\nEmail: ${existingProfile.email}`);
    } catch (err) {
      console.error("Failed to retrieve account:", err);
    }
  };

  // If not logged in, show login form
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Login to Viego</h1>
            <p className="text-gray-600">Enter your Viego UID to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Viego UID
              </label>
              <input
                type="text"
                required
                value={loginUID}
                onChange={(e) => setLoginUID(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none font-mono text-gray-900"
                placeholder="your-viego-id"
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-600" size={20} />
                  <span className="font-semibold text-red-700">{loginError}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
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

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-700 text-center">
              <strong>Don&apos;t have an account?</strong>
              <br />
              Scroll down to create a new account with your custom Viego UID
            </p>
          </div>
        </div>

        {/* Create Account Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Account</h2>
          <form onSubmit={handleCreateAccount} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Custom Viego UID (Optional)
              </label>
              <input
                type="text"
                value={formData.customViegoUID}
                onChange={(e) => setFormData({ ...formData, customViegoUID: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 font-mono"
                placeholder="my-custom-id (leave blank for auto-generated)"
              />
              <p className="text-xs text-gray-500 mt-1">Choose your own unique ID, or leave blank for auto-generation</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
                placeholder="student@berkeley.edu"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-600" size={20} />
                  <span className="font-semibold text-red-700">{error}</span>
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
                  <Loader className="animate-spin" size={20} />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Account Management</h1>
          <p className="text-gray-600">Welcome back, {user.firstName}!</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setMode("create")}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
            mode === "create"
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <UserPlus className="inline mr-2" size={20} />
          Create Account
        </button>
        <button
          onClick={() => setMode("retrieve")}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
            mode === "retrieve"
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <User className="inline mr-2" size={20} />
          Retrieve Account
        </button>
        <button
          onClick={() => setMode("settings")}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
            mode === "settings"
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <User className="inline mr-2" size={20} />
          Settings
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <span className="font-semibold text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Success Display */}
      {profile && !error && (
        <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-green-600" size={24} />
            <h3 className="font-bold text-green-700 text-lg">Account Profile</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Viego UID</p>
              <p className="font-mono text-sm font-semibold text-gray-900">{profile.viegoUID}</p>
              <p className="text-xs text-orange-600 mt-1">⚠️ Temporary ID - Will persist in MongoDB</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-semibold text-gray-900">{profile.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold text-gray-900">
                {profile.firstName} {profile.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                profile.accountStatus === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {profile.accountStatus}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm text-gray-900">{new Date(profile.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Form */}
      {mode === "create" && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Account</h2>
          <form onSubmit={handleCreateAccount} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Custom Viego UID (Optional)
              </label>
              <input
                type="text"
                value={formData.customViegoUID}
                onChange={(e) => setFormData({ ...formData, customViegoUID: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 font-mono"
                placeholder="my-custom-id (leave blank for auto-generated)"
              />
              <p className="text-xs text-gray-500 mt-1">Choose your own unique ID, or leave blank for auto-generation</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
                placeholder="student@berkeley.edu"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-green-50 rounded-xl border-2 border-green-200">
            <p className="text-sm text-gray-700">
              <strong>✅ MongoDB Integration Active:</strong>
              <br />
              1. Account is saved to MongoDB database
              <br />
              2. Data persists permanently across server restarts
              <br />
              3. All user data, XP, badges, and monsters are stored securely
              <br />
              4. Financial data remains in Visa API (not stored in database)
              <br />
              <br />
              <strong className="text-green-700">Save your Viego UID to retrieve your account later!</strong>
            </p>
          </div>
        </div>
      )}

      {/* Retrieve Account Form */}
      {mode === "retrieve" && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Retrieve Existing Account</h2>
          <form onSubmit={handleRetrieveAccount} className="space-y-6">
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
                placeholder="Enter Viego UID (e.g., viego_1234567890_abc123)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Retrieving Account...
                </>
              ) : (
                <>
                  <User size={20} />
                  Retrieve Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-700">
              <strong>How it works:</strong>
              <br />
              1. Use Viego UID to retrieve profile (from account creation)
              <br />
              2. System fetches account data from temporary storage
              <br />
              3. Displays profile information
              <br />
              4. ⚠️ Data is temporary until MongoDB is integrated
            </p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      {mode === "settings" && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>

          {preferencesMessage && (
            <div
              className={`mb-6 rounded-2xl border-2 p-4 ${
                preferencesMessage.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              <div className="flex items-center gap-2">
                {preferencesMessage.type === "error" ? (
                  <AlertCircle size={20} />
                ) : (
                  <CheckCircle size={20} />
                )}
                <span className="font-semibold">{preferencesMessage.text}</span>
              </div>
            </div>
          )}

          <div className="space-y-10">
            <section className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Toggles</h3>

              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Push Notifications
                  </label>
                  <p className="text-sm text-gray-600">
                    Receive notifications about your spending, offers, and account activity.
                  </p>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`ml-4 relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    notificationsEnabled ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Budget Alerts
                  </label>
                  <p className="text-sm text-gray-600">
                    Get notified when you&apos;re close to exceeding your budget limits.
                  </p>
                </div>
                <button
                  onClick={() => setBudgetAlertsEnabled(!budgetAlertsEnabled)}
                  className={`ml-4 relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    budgetAlertsEnabled ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      budgetAlertsEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleBasicSettingsSave}
                disabled={basicSettingsSaving}
                className="mt-4 w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {basicSettingsSaving ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Basic Settings
                  </>
                )}
              </button>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Visa Alert Delivery Identifiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Visa userIdentifier
                  </label>
                  <input
                    type="text"
                    value={visaIdentifierInput}
                    onChange={(e) => setVisaIdentifierInput(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    placeholder="b2d1b9cc-fc3f-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Document ID
                  </label>
                  <input
                    type="text"
                    value={visaDocumentId}
                    onChange={(e) => setVisaDocumentId(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    placeholder="ctc-vd-857a8766-160b..."
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Required when syncing alert preferences with the Visa Alert History and Customer Profiles APIs.
                We store these identifiers securely in MongoDB.
              </p>
            </section>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Alert Preferences</h3>
                  <p className="text-sm text-gray-600">
                    Tailored alert routing per alertType + controlType combination.
                  </p>
                </div>
                <button
                  onClick={() => user?.viegoUID && loadNotificationPreferences(user.viegoUID)}
                  disabled={preferencesLoading}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {preferencesLoading ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Refresh
                    </>
                  )}
                </button>
              </div>

              {preferencesLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader className="animate-spin" size={16} />
                  Loading preferences...
                </div>
              ) : alertPreferencesState.length ? (
                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Alert Type</th>
                        <th className="px-4 py-3">Control Type</th>
                        <th className="px-4 py-3">Channel</th>
                        <th className="px-4 py-3">Destination</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {alertPreferencesState.map((pref, index) => {
                        const contact = pref.contacts?.[0] || {};
                        return (
                          <tr key={`${pref.alertType}-${index}`}>
                            <td className="px-4 py-3">
                              <select
                                value={pref.alertType || ""}
                                onChange={(e) => handlePreferenceFieldChange(index, "alertType", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900"
                              >
                                {!ALERT_TYPES.includes(pref.alertType || "") && pref.alertType && (
                                  <option value={pref.alertType}>{pref.alertType}</option>
                                )}
                                {ALERT_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={pref.controlType || ""}
                                onChange={(e) => handlePreferenceFieldChange(index, "controlType", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900"
                              >
                                {!CONTROL_TYPES.includes(pref.controlType || "") && pref.controlType && (
                                  <option value={pref.controlType}>{pref.controlType}</option>
                                )}
                                {CONTROL_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={contact?.contactType || ""}
                                onChange={(e) => handleContactFieldChange(index, "contactType", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900"
                              >
                                {!CONTACT_TYPES.includes(contact?.contactType || "") && contact?.contactType && (
                                  <option value={contact.contactType}>{contact.contactType}</option>
                                )}
                                {CONTACT_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={contact?.contactValue || ""}
                                onChange={(e) => handleContactFieldChange(index, "contactValue", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900"
                                placeholder="alexmiller@example.com"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={pref.status || STATUS_OPTIONS[0]}
                                onChange={(e) => handlePreferenceFieldChange(index, "status", e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900"
                              >
                                {STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemovePreference(index)}
                                disabled={preferencesSaving}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  No alert preferences stored yet. Use the form below to add one.
                </p>
              )}

              <button
                onClick={handleSavePreferences}
                disabled={preferencesSaving || !alertPreferencesState.length}
                className="mt-4 w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {preferencesSaving ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Visa Preferences
                  </>
                )}
              </button>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Alert Preference</h3>
              <form onSubmit={handleAddPreference} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alert Type
                  </label>
                  <select
                    value={newPreferenceForm.alertType}
                    onChange={(e) => setNewPreferenceForm((prev) => ({ ...prev, alertType: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    {ALERT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Control Type
                  </label>
                  <select
                    value={newPreferenceForm.controlType}
                    onChange={(e) => setNewPreferenceForm((prev) => ({ ...prev, controlType: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    {CONTROL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Channel
                  </label>
                  <select
                    value={newPreferenceForm.contactType}
                    onChange={(e) => setNewPreferenceForm((prev) => ({ ...prev, contactType: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    {CONTACT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={newPreferenceForm.contactValue}
                    onChange={(e) => setNewPreferenceForm((prev) => ({ ...prev, contactValue: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    placeholder="alexmiller@example.com"
                    maxLength={254}
                  />
                </div>
                {newPreferenceForm.contactType === "SMS" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Calling Code
                    </label>
                    <input
                      type="text"
                      value={newPreferenceForm.callingCode}
                      onChange={(e) => setNewPreferenceForm((prev) => ({ ...prev, callingCode: e.target.value.slice(0, 3) }))}
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                      placeholder="1"
                    />
                  </div>
                )}
                {newPreferenceForm.contactType === "Email" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Format
                    </label>
                    <select
                      value={newPreferenceForm.preferredEmailFormat}
                      onChange={(e) => setNewPreferenceForm((prev) => ({ ...prev, preferredEmailFormat: e.target.value }))}
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    >
                      {EMAIL_FORMATS.map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={newPreferenceForm.status}
                    onChange={(e) => setNewPreferenceForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Portfolio ID
                  </label>
                  <input
                    type="text"
                    value={newPreferenceForm.portfolioID}
                    onChange={(e) =>
                      setNewPreferenceForm((prev) => ({ ...prev, portfolioID: e.target.value.slice(0, 3) }))
                    }
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    placeholder={DEFAULT_PORTFOLIO_ID}
                  />
                </div>
                <div className="md:col-span-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-2">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={newPreferenceForm.isVerified}
                      onChange={(e) => setNewPreferenceForm((prev) => ({ ...prev, isVerified: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    Contact is verified
                  </label>
                  <button
                    type="submit"
                    disabled={preferencesSaving}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {preferencesSaving ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Add Preference
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Alert History</h3>
                  <p className="text-sm text-gray-600">
                    Fetch recent Visa alert notifications tied to the document ID above.
                  </p>
                </div>
                <button
                  onClick={handleFetchHistory}
                  disabled={historyLoading || !visaDocumentId}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {historyLoading ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Fetch Latest
                    </>
                  )}
                </button>
              </div>

              {historyLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader className="animate-spin" size={16} />
                  Fetching alert history...
                </div>
              ) : notificationHistory.length ? (
                <div className="space-y-4">
                  {notificationHistory.slice(0, 5).map((detail) => {
                    const payload = detail.outBoundAlertsNotificationPayload || {};
                    const merchant = payload.merchantInfo || {};
                    const transaction = payload.transactionDetails || {};

                    return (
                      <div key={detail.notificationId} className="rounded-2xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-900">
                            {merchant.name || "Notification"}
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            {detail.notificationStatus}
                          </span>
                        </div>
                        {transaction.transactionAmount && (
                          <p className="mt-2 text-sm text-gray-700">
                            Amount: {transaction.transactionAmount} {transaction.billerCurrencyCode || ""}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Notification ID: {detail.notificationId}
                        </p>
                        {detail.transactionOutcome?.transactionApproved && (
                          <p className="text-xs text-gray-500">
                            Decision: {detail.transactionOutcome.transactionApproved}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  {visaDocumentId
                    ? "No alert history returned for this document ID yet."
                    : "Provide a Visa document ID to load alert history."}
                </p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
