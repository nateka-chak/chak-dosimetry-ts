// app/signup/page.tsx
import dynamic from "next/dynamic";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </main>
  );
}
