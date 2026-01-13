"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

export default function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        alert("Failed to send reset link");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-lg backdrop-blur"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>

      {success ? (
        <p className="text-green-600">
          If the email exists, a reset link has been sent.
        </p>
      ) : (
        <>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="w-full rounded-lg border px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
          </button>
        </>
      )}
    </motion.form>
  );
}
