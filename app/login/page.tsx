// app/login/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "login" | "signup" | "forgot-password" | "reset-password" | null;
  const token = searchParams.get("token");

  return (
    <AuthForm 
      initialMode={
        token ? "reset-password" : 
        (mode === "signup" || mode === "forgot-password" ? mode : "login")
      }
    />
  );
}
