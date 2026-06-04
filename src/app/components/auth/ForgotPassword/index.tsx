"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import TurnstileWidget from "@/src/app/components/Turnstile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs leading-none transition-colors ${ok ? "text-green-600" : "text-red-500"}`}>
      <span className="flex items-center justify-center w-3 h-3 shrink-0">
        {ok ? (
          <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
            <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
          </svg>
        ) : (
          <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
            <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M3 3l6 6M9 3l-6 6" />
          </svg>
        )}
      </span>
      <span>{text}</span>
    </li>
  );
}

interface Props {
  onBack?: () => void;
  onSuccess?: () => void;
  onRegister?: () => void;
}

export default function ForgotPassword({ onBack, onSuccess, onRegister }: Props) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cfToken, setCfToken] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const canSubmit = emailValid && !!cfToken;

  const inputClass = touched
    ? emailValid
      ? "w-full border border-green-400 focus:border-green-500 rounded px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors"
      : "w-full border border-red-400 focus:border-red-400 rounded px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors"
    : "w-full border border-gray-300 focus:border-brand-nav rounded px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors";

  const onSubmit: React.ComponentProps<"form">["onSubmit"] = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().replace(/[<>"'&]/g, ""), cfToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Заявката не успя. Опитайте отново.");
      } else {
        toast.success("Изпратен е имейл за нулиране на паролата. Проверете пощата си.");
        setEmail("");
        setTouched(false);
        onSuccess?.();
      }
    } catch {
      toast.error("Заявката не успя. Опитайте отново.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Въведете имейл адреса, с който сте се регистрирали. Ще получите линк за нулиране на паролата.
      </p>

      <div>
        <div className="relative">
          <input
            type="email"
            name="email"
            placeholder="Имейл"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            required
            className={inputClass}
          />
          <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
        </div>
        <ul className="mt-1.5 space-y-0.5 pl-0.5">
          <Rule ok={emailValid} text="Валиден имейл адрес" />
        </ul>
      </div>

      <TurnstileWidget onSuccess={setCfToken} onExpire={() => setCfToken(null)} onError={() => setCfToken(null)} />

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className={`w-full py-3 rounded text-sm font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${
          canSubmit && !loading
            ? "bg-brand-action text-white hover:opacity-90 cursor-pointer"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Зареждане...
          </>
        ) : (
          "Изпрати линк"
        )}
      </button>

      <div className="flex justify-between text-xs font-semibold mt-2">
        {onBack ? (
          <button type="button" onClick={onBack} className="text-brand-action hover:underline uppercase cursor-pointer">
            Обратно към вход
          </button>
        ) : (
          <Link href="/login" className="text-brand-action hover:underline uppercase">
            Обратно към вход
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
