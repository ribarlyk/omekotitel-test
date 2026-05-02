"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuthenticate } from "@/src/app/hooks/useAuthentication";
import TurnstileWidget from "@/src/app/components/Turnstile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  onSuccess?: () => void;
  onRegister?: () => void;
  onForgotPassword?: () => void;
}

export default function Login({ onSuccess, onRegister, onForgotPassword }: Props) {
  const router = useRouter();
  const { handleLogin, loginLoading } = useAuthenticate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cfToken, setCfToken] = useState<string | null>(null);

  const emailError = touched.email && !EMAIL_RE.test(email.trim()) ? "Невалиден имейл адрес" : null;
  const passwordError = touched.password && password.length === 0 ? "Полето е задължително" : null;
  const canSubmit = EMAIL_RE.test(email.trim()) && password.length > 0 && !!cfToken;

  const touch = (name: string) => setTouched((t) => ({ ...t, [name]: true }));

  const onSubmit: React.ComponentProps<"form">["onSubmit"] = async (e) => {
    const success = await handleLogin(e, cfToken ?? undefined);
    if (success) {
      toast.success("Влязохте успешно!");
      onSuccess?.();
      router.push("/");
    } else {
      toast.error("Грешен имейл или парола.");
    }
  };

  const inputClass = (error: string | null) =>
    `w-full border rounded px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none ${
      error ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-brand-nav"
    }`;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <input
          type="email"
          name="email"
          placeholder="Имейл"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => touch("email")}
          required
          className={inputClass(emailError)}
        />
        <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
        {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
      </div>

      <div className="relative">
        <input
          type="password"
          name="password"
          placeholder="Парола"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => touch("password")}
          required
          className={inputClass(passwordError)}
        />
        <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
        {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input type="checkbox" name="remember" className="w-4 h-4 accent-brand-action" />
        Запомни ме
      </label>

      <TurnstileWidget onSuccess={setCfToken} onExpire={() => setCfToken(null)} onError={() => setCfToken(null)} />

      <button
        type="submit"
        disabled={!canSubmit || loginLoading}
        className={`w-full py-3 rounded text-sm font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${
          canSubmit && !loginLoading
            ? "bg-brand-action text-white hover:opacity-90 cursor-pointer"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {loginLoading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Зареждане...
          </>
        ) : (
          "Влезте с профила си"
        )}
      </button>

      <div className="flex justify-between text-xs font-semibold mt-2">
        {onForgotPassword ? (
          <button type="button" onClick={onForgotPassword} className="text-brand-action hover:underline uppercase cursor-pointer">
            Забравена парола?
          </button>
        ) : (
          <Link href="/forgot-password" className="text-brand-action hover:underline uppercase">
            Забравена парола?
          </Link>
        )}
        {onRegister ? (
          <button type="button" onClick={onRegister} className="text-brand-action hover:underline uppercase cursor-pointer">
            Създай нов профил
          </button>
        ) : (
          <Link href="/register" className="text-brand-action hover:underline uppercase">
            Създай нов профил
          </Link>
        )}
      </div>
    </form>
  );
}
