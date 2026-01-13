"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Building2
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import Image from "next/image";

type AuthMode = "login" | "signup" | "forgot-password" | "reset-password";

interface AuthFormProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function AuthForm({ 
  initialMode = "login", 
  onSuccess,
  redirectTo = "/profile" 
}: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    resetToken: "",
  });

  // Get reset token from URL if in reset-password mode
  useEffect(() => {
    if (typeof window !== "undefined" && mode === "reset-password") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        setFormData(prev => ({ ...prev, resetToken: token }));
      }
    }
  }, [mode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Login successful! Redirecting...");
        // Give time for cookie to be set and ensure it's available
        setTimeout(() => {
          onSuccess?.();
          // Use window.location.href for full page reload to ensure cookies are sent
          // Construct URL with basePath detection
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const basePath = currentPath.includes('/chak-dosimetry-ts') ? '/chak-dosimetry-ts' : '';
            window.location.href = `${window.location.origin}${basePath}${redirectTo}`;
          } else {
            router.push(redirectTo);
          }
        }, 1000);
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Account created successfully! Redirecting...");
        setTimeout(() => {
          onSuccess?.();
          // Next.js router.push automatically handles basePath from next.config.ts
          // So /profile becomes /chak-dosimetry-ts/profile automatically
          router.push(redirectTo);
        }, 1500);
      } else {
        setError(data.error || "Signup failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(data.message || "Password reset link sent to your email");
        // Show reset token in development (remove in production)
        if (data.resetUrl) {
          console.log("Reset URL:", data.resetUrl);
          setSuccess(`${data.message}\n\nReset URL: ${data.resetUrl}`);
        }
      } else {
        setError(data.error || "Failed to send reset link");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!formData.resetToken) {
      setError("Reset token is missing");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formData.resetToken,
          newPassword: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setSuccess("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          setMode("login");
          setFormData({ name: "", email: "", password: "", confirmPassword: "", resetToken: "" });
        }, 2000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (mode === "login") return handleLogin(e);
    if (mode === "signup") return handleSignup(e);
    if (mode === "forgot-password") return handleForgotPassword(e);
    if (mode === "reset-password") return handleResetPassword(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 pt-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-8 py-6 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              {mode === "login" && "Welcome Back"}
              {mode === "signup" && "Create Account"}
              {mode === "forgot-password" && "Reset Password"}
              {mode === "reset-password" && "Set New Password"}
            </h2>
            <p className="text-blue-100 text-sm text-center">
              {mode === "login" && "Sign in to your account"}
              {mode === "signup" && "Get started with your free account"}
              {mode === "forgot-password" && "Enter your email to receive reset instructions"}
              {mode === "reset-password" && "Enter your new password"}
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-800 text-sm whitespace-pre-line">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Enter organization name"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                {(mode === "login" || mode === "signup" || mode === "forgot-password") && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your.email@example.com"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                {(mode === "login" || mode === "signup" || mode === "reset-password") && (
                  <>
                    <motion.div
                      key="password"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          placeholder={mode === "reset-password" ? "New password" : "Enter your password"}
                          required
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {mode === "signup" && (
                        <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                      )}
                    </motion.div>

                    {(mode === "signup" || mode === "reset-password") && (
                      <motion.div
                        key="confirm-password"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                            placeholder="Confirm your password"
                            required
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </AnimatePresence>

              {mode === "login" && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-sm text-gray-600">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot-password")}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === "login" && "Sign In"}
                      {mode === "signup" && "Create Account"}
                      {mode === "forgot-password" && "Send Reset Link"}
                      {mode === "reset-password" && "Reset Password"}
                    </span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Mode Switcher */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              {mode === "login" && (
                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              )}

              {mode === "signup" && (
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}

              {mode === "forgot-password" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to login</span>
                </button>
              )}

              {mode === "reset-password" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

