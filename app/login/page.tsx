// app/login/page.tsx
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

// Optional: SEO metadata
export const metadata: Metadata = {
  title: "Login | Dosimetry Tracker",
};


export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
