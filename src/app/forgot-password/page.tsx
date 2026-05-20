import type { Metadata } from "next";
import ForgotPassword from "@/src/app/components/auth/ForgotPassword";

export const metadata: Metadata = {
  title: { absolute: "Забравена парола | omekotitel.bg" },
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-brand-nav mb-6">Забравена парола</h1>
        <ForgotPassword />
      </div>
    </main>
  );
}
