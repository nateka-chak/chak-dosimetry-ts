"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/config";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        alert("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - brand / gradient */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-400 p-10 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <Image
            src="/cbsl.svg"
            alt="CBSL Logo"
            width={160}
            height={160}
            className="mx-auto drop-shadow-lg"
          />
          <h1 className="text-4xl font-bold tracking-tight">CBSL Portal</h1>
          <p className="text-white/90 text-lg">Building Value with Technology</p>
        </motion.div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <motion.form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-2xl border border-gray-200"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 text-center">Welcome Back</h2>
          <p className="text-center text-gray-500 text-sm">Sign in to continue</p>

          <input
            type="email"
            name="email"
            placeholder="Email address"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-[#F36A00] px-4 py-2 text-white font-semibold hover:bg-[#d85f00] transition duration-200 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
          </button>

          <p className="text-sm text-center text-gray-500">
            Forgot password?{" "}
            <a href="/reset-password" className="text-[#4277FF] hover:underline font-medium">
              Reset here
            </a>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
