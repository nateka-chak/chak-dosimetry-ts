"use client";

import { useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <AuthForm 
      initialMode={token ? "reset-password" : "forgot-password"}
    />
  );
}
