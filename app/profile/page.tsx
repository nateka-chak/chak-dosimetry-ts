"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Key, Shield, Building2, Save, Loader2, CheckCircle2, AlertCircle, PlusCircle, Users, Activity, TrendingUp, Clock, Bell, Settings, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { API_BASE_URL, getApiUrl } from "@/lib/config";
import Button from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/UI/Card";
import { Badge } from "@/components/UI/Badge";
import Loader from "@/components/UI/Loader";

interface UserProfile {
  id: number;
  email: string;
  role: string;
  hospitalId: number | null;
  hospitalName: string | null;
  resetRequired: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "HOSPITAL">("HOSPITAL");
  const [creatingUser, setCreatingUser] = useState(false);
  const [stats, setStats] = useState({
    unreadNotifications: 0,
    totalItems: 0,
    pendingRequests: 0,
    activeShipments: 0,
  });

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use getApiUrl helper to construct URL with basePath
      // This ensures cookies are sent properly
      const res = await fetch(getApiUrl("/api/user/profile"), {
        credentials: "include",
      });

      // If not authenticated, redirect to login page
      // Use window.location to ensure full redirect with basePath
      if (res.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const basePath = currentPath.includes('/chak-dosimetry-ts') ? '/chak-dosimetry-ts' : '';
          window.location.href = `${window.location.origin}${basePath}/login`;
        } else {
          router.push('/login');
        }
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setEmail(data.data.email);
        setIsAuthenticated(true);
      } else {
        throw new Error(data.error || "Failed to load profile");
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a delay to ensure cookies are set after login redirect
    // Check if we're coming from a login redirect
    const timer = setTimeout(() => {
      fetchProfile();
      fetchStats();
    }, 500); // Increased delay to ensure cookie is available
    return () => clearTimeout(timer);
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch unread notifications - use getApiUrl helper for proper basePath handling
      const notifRes = await fetch(getApiUrl("/api/notifications"), { credentials: "include" });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setStats(prev => ({ ...prev, unreadNotifications: notifData.data?.unreadCount || 0 }));
      }

      // Fetch inventory stats
      const invRes = await fetch(getApiUrl("/api/inventory"), { credentials: "include" });
      if (invRes.ok) {
        const invData = await invRes.json();
        setStats(prev => ({ ...prev, totalItems: invData.stats?.total || 0 }));
      }

      // Fetch pending requests
      const reqRes = await fetch(getApiUrl("/api/requests?status=pending"), { credentials: "include" });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setStats(prev => ({ ...prev, pendingRequests: reqData.data?.length || 0 }));
      }

      // Fetch active shipments
      const shipRes = await fetch(getApiUrl("/api/shipments?status=in_transit"), { credentials: "include" });
      if (shipRes.ok) {
        const shipData = await shipRes.json();
        setStats(prev => ({ ...prev, activeShipments: shipData.data?.length || 0 }));
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      // Validate passwords if changing password
      if (newPassword) {
        if (!currentPassword) {
          setError("Please enter your current password");
          setSaving(false);
          return;
        }

        if (newPassword.length < 8) {
          setError("New password must be at least 8 characters");
          setSaving(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setError("New passwords do not match");
          setSaving(false);
          return;
        }
      }

      // Validate email
      if (!email || !email.includes("@")) {
        setError("Please enter a valid email address");
        setSaving(false);
        return;
      }

      const payload: any = { email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message || "Profile updated successfully");
        // Update profile state
        if (data.data) {
          setProfile(data.data);
          setEmail(data.data.email);
        }
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Refresh profile after a short delay
        setTimeout(() => {
          fetchProfile();
          setSuccess(null);
        }, 2000);
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === "ADMIN") return "danger";
    if (role === "HOSPITAL") return "primary";
    return "secondary";
  };

  const handleCreateUser = async () => {
    if (!profile || profile.role !== "ADMIN") {
      setError("Only administrators can create users.");
      return;
    }
    if (!newUserEmail || !newUserEmail.includes("@")) {
      setError("Enter a valid email to invite.");
      return;
    }
    setCreatingUser(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create user");
      }
      setSuccess(`User ${newUserEmail} created with role ${newUserRole}`);
      setNewUserEmail("");
      setNewUserRole("HOSPITAL");
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader size="lg" label="Loading profile..." />
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load profile</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error || "Unable to load your profile information"}</p>
          <div className="flex items-center justify-center space-x-3">
            <Button onClick={fetchProfile}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push('/login')}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // Will be handled by earlier checks
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-heading">Profile & Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage your account and view your activity overview.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/settings"}
              leftIcon={<Settings className="h-4 w-4" />}
              className="border-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Bell className="h-5 w-5 opacity-80" />
              <TrendingUp className="h-4 w-4 opacity-60" />
            </div>
            <p className="text-3xl font-bold">{stats.unreadNotifications}</p>
            <p className="text-sm opacity-90 mt-1">Unread Notifications</p>
            <a href="/notifications" className="text-xs opacity-75 hover:opacity-100 mt-2 inline-flex items-center">
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-5 w-5 opacity-80" />
              <TrendingUp className="h-4 w-4 opacity-60" />
            </div>
            <p className="text-3xl font-bold">{stats.totalItems}</p>
            <p className="text-sm opacity-90 mt-1">Total Items</p>
            <a href="/inventory" className="text-xs opacity-75 hover:opacity-100 mt-2 inline-flex items-center">
              View inventory <ArrowRight className="h-3 w-3 ml-1" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 opacity-80" />
              <Activity className="h-4 w-4 opacity-60" />
            </div>
            <p className="text-3xl font-bold">{stats.pendingRequests}</p>
            <p className="text-sm opacity-90 mt-1">Pending Requests</p>
            <a href="/approvals" className="text-xs opacity-75 hover:opacity-100 mt-2 inline-flex items-center">
              Review <ArrowRight className="h-3 w-3 ml-1" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 opacity-80" />
              <TrendingUp className="h-4 w-4 opacity-60" />
            </div>
            <p className="text-3xl font-bold">{stats.activeShipments}</p>
            <p className="text-sm opacity-90 mt-1">Active Shipments</p>
            <a href="/dashboard" className="text-xs opacity-75 hover:opacity-100 mt-2 inline-flex items-center">
              Track <ArrowRight className="h-3 w-3 ml-1" />
            </a>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="dark:text-white">Quick Actions</span>
            </CardTitle>
            <CardDescription className="dark:text-gray-300">
              Access frequently used features
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/dispatch"}
                className="flex flex-col items-center justify-center h-24 space-y-2 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700"
              >
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium">Dispatch</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/receive"}
                className="flex flex-col items-center justify-center h-24 space-y-2 border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-gray-700"
              >
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium">Receive</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/requests"}
                className="flex flex-col items-center justify-center h-24 space-y-2 border-gray-200 dark:border-gray-600 hover:bg-amber-50 dark:hover:bg-gray-700"
              >
                <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium">Request</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/contracts"}
                className="flex flex-col items-center justify-center h-24 space-y-2 border-gray-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-gray-700"
              >
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium">Contracts</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success/Error Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-3"
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Information */}
          <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="dark:text-white">Account Information</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Update your email address and account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Account Status</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your account information</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Role</span>
                    </div>
                    <Badge variant={getRoleBadgeVariant(profile.role)}>
                      {profile.role}
                    </Badge>
                  </div>

                  {profile.hospitalName && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Hospital</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile.hospitalName}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Member Since</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(profile.createdAt)}
                    </span>
                  </div>

                  {profile.resetRequired && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-yellow-800 dark:text-yellow-200">Password Reset Required</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <span className="dark:text-white">Change Password</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  leftIcon={<Key className="h-4 w-4 text-gray-400" />}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 chars)"
                  leftIcon={<Key className="h-4 w-4 text-gray-400" />}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  leftIcon={<Key className="h-4 w-4 text-gray-400" />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Future Updates Section */}
          <Card className="lg:col-span-3 hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="dark:text-white">Coming Soon</span>
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Exciting features and improvements planned for weekly updates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Activity Timeline</span>
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Track your recent actions, dispatches, and receives in a visual timeline.
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2 flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Advanced Analytics</span>
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Detailed reports and insights on inventory usage, trends, and patterns.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <span>Smart Notifications</span>
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    AI-powered alerts for expiring items, low stock, and important updates.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Team Collaboration</span>
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Enhanced team features, comments, and collaborative workflows.
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-gray-200">Note:</strong> These features are in active development and will be released in weekly updates. Stay tuned!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin: Create User */}
          {profile.role === "ADMIN" && (
            <Card className="lg:col-span-3 hover:shadow-lg transition-all duration-200 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="dark:text-white">Invite / Create User</span>
                </CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Quickly onboard team members. Default password is emailed by the backend (if configured).
                </CardDescription>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="User Email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    leftIcon={<Mail className="h-4 w-4 text-gray-400" />}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as "ADMIN" | "HOSPITAL")}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="HOSPITAL">Hospital User</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreateUser}
                    disabled={creatingUser}
                    leftIcon={creatingUser ? <Loader size="sm" /> : <PlusCircle className="h-4 w-4" />}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {creatingUser ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleSave}
            disabled={saving}
            leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            className="px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

