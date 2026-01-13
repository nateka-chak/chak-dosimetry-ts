"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Bell, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  RefreshCw,
  Moon,
  Sun,
  Palette,
  Zap,
  Volume2,
  Eye,
  Globe,
  Server
} from "lucide-react";
import Button from "@/components/UI/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/UI/Card";
import Loader from "@/components/UI/Loader";

type UserPreferences = {
  theme: "light" | "dark" | "auto";
  compactMode: boolean;
  animations: boolean;
  soundEnabled: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  itemsPerPage: number;
  language: string;
  timezone: string;
  emailNotifications: boolean;
  desktopNotifications: boolean;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "light",
  compactMode: false,
  animations: true,
  soundEnabled: false,
  autoRefresh: true,
  refreshInterval: 30,
  itemsPerPage: 25,
  language: "en",
  timezone: typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Africa/Nairobi",
  emailNotifications: true,
  desktopNotifications: false,
};

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chakra-preferences");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error("Error loading preferences:", e);
        }
      }
      const maintenance = localStorage.getItem("chakra-maintenance");
      if (maintenance === "true") {
        setMaintenanceMode(true);
      }
      applyTheme(preferences.theme);
    }
    setLoading(false);
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      applyTheme(preferences.theme);
      localStorage.setItem("chakra-preferences", JSON.stringify(preferences));
    }
  }, [preferences.theme]);

  // Save maintenance mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chakra-maintenance", maintenanceMode ? "true" : "false");
    }
  }, [maintenanceMode]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (preferences.theme === "auto" && typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("auto");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [preferences.theme]);

  const applyTheme = (themeMode: "light" | "dark" | "auto") => {
    if (typeof document === "undefined") return;
    
    const root = document.documentElement;
    
    if (themeMode === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
      }
    } else if (themeMode === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setSuccess(null);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(null);
    setError(null);
    
    try {
      // Save to localStorage (client-side preferences)
      if (typeof window !== "undefined") {
        localStorage.setItem("chakra-preferences", JSON.stringify(preferences));
        localStorage.setItem("chakra-maintenance", maintenanceMode ? "true" : "false");
      }

      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <Loader size="lg" label="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-3 mb-4 lg:mb-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-heading">System Settings</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Customize your application experience and preferences.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") {
                const saved = localStorage.getItem("chakra-preferences");
                if (saved) {
                  try {
                    const parsed = JSON.parse(saved);
                    setPreferences(prev => ({ ...prev, ...parsed }));
                    setSuccess("Settings refreshed!");
                    setTimeout(() => setSuccess(null), 2000);
                  } catch (e) {
                    setError("Failed to refresh settings");
                  }
                }
              }
            }}
            leftIcon={<RefreshCw className="h-4 w-4" />}
            className="border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            Refresh
          </Button>
        </div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-3"
            >
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-3"
            >
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance Settings */}
          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <span className="dark:text-white">Appearance</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Customize the look and feel of your application
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["light", "dark", "auto"] as const).map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => updatePreference("theme", themeOption)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        preferences.theme === themeOption
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        {themeOption === "light" ? (
                          <Sun className="h-5 w-5 text-yellow-500" />
                        ) : themeOption === "dark" ? (
                          <Moon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                        ) : (
                          <Globe className="h-5 w-5 text-blue-500" />
                        )}
                        <span className="text-xs font-medium capitalize dark:text-gray-300">{themeOption}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {preferences.theme === "auto" && "Follows your system preference"}
                </p>
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Compact Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reduce spacing for more content</p>
                </div>
                <button
                  onClick={() => updatePreference("compactMode", !preferences.compactMode)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    preferences.compactMode ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      preferences.compactMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Animations */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Animations</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Enable smooth transitions</p>
                </div>
                <button
                  onClick={() => updatePreference("animations", !preferences.animations)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    preferences.animations ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      preferences.animations ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Performance & Behavior */}
          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="dark:text-white">Performance & Behavior</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Optimize your app experience
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Auto Refresh */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Auto Refresh</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Automatically update data</p>
                </div>
                <button
                  onClick={() => updatePreference("autoRefresh", !preferences.autoRefresh)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    preferences.autoRefresh ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      preferences.autoRefresh ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Refresh Interval */}
              {preferences.autoRefresh && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Refresh Interval: {preferences.refreshInterval} seconds
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={preferences.refreshInterval}
                    onChange={(e) => updatePreference("refreshInterval", parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>10s</span>
                    <span>300s</span>
                  </div>
                </div>
              )}

              {/* Items Per Page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Items Per Page: {preferences.itemsPerPage}
                </label>
                <select
                  value={preferences.itemsPerPage}
                  onChange={(e) => updatePreference("itemsPerPage", parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Sound Effects</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Play sounds for notifications</p>
                </div>
                <button
                  onClick={() => updatePreference("soundEnabled", !preferences.soundEnabled)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    preferences.soundEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      preferences.soundEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <span className="dark:text-white">Notifications</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Manage how you receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Email Notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive updates via email</p>
                </div>
                <button
                  onClick={() => updatePreference("emailNotifications", !preferences.emailNotifications)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    preferences.emailNotifications ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      preferences.emailNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Desktop Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Desktop Notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Browser push notifications</p>
                </div>
                <button
                  onClick={() => {
                    if (!preferences.desktopNotifications && typeof Notification !== "undefined") {
                      Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                          updatePreference("desktopNotifications", true);
                        }
                      });
                    } else {
                      updatePreference("desktopNotifications", !preferences.desktopNotifications);
                    }
                  }}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    preferences.desktopNotifications ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      preferences.desktopNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <a 
                  href="/notifications" 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Notification Center</span>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Localization */}
          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="dark:text-white">Localization</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Language and regional settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => updatePreference("language", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="en">English</option>
                  <option value="sw">Swahili</option>
                  <option value="fr">French</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => updatePreference("timezone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Admin Controls */}
          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="dark:text-white">Admin Controls</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Administrative settings (local only)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Maintenance Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Show maintenance banner (client-side)</p>
                </div>
                <button
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    maintenanceMode ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      maintenanceMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <span className="dark:text-white">System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Version:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">2.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Database:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">MySQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Framework:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Next.js 15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Environment:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {typeof window !== "undefined" ? (process.env.NODE_ENV || "development") : "development"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleSave}
            disabled={saving}
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            className="px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
