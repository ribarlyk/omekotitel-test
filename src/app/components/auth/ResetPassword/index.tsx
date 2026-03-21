"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/src/app/contexts/AuthContext";
import { useCart } from "@/src/app/contexts/CartContext";
import { useWishlist } from "@/src/app/contexts/WishlistContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordStrength(pw: string): number {
  return [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
}

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
  token: string;
}

export default function ResetPassword({ token }: Props) {
  const router = useRouter();
  const { setUser } = useAuth();
  const { refreshCart } = useCart();
  const { refreshWishlist } = useWishlist();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repass, setRepass] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const rules = {
    email:    { valid: EMAIL_RE.test(email.trim()) },
    password: {
      minLen:    password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit:     /[0-9]/.test(password),
      special:   /[^a-zA-Z0-9]/.test(password),
    },
    repass: { match: repass === password && repass.length > 0 },
  };

  const passwordClassesOk = passwordStrength(password) >= 3;

  const isValid = {
    email:    rules.email.valid,
    password: rules.password.minLen && passwordClassesOk,
    repass:   rules.repass.match,
  };

  const canSubmit = Object.values(isValid).every(Boolean);
  const touch = (name: string) => setTouched((t) => ({ ...t, [name]: true }));

  const inputClass = (name: keyof typeof isValid) =>
    `w-full border rounded px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors ${
      touched[name]
        ? isValid[name]
          ? "border-green-400 focus:border-green-500"
          : "border-red-400 focus:border-red-400"
        : "border-gray-300 focus:border-brand-nav"
    }`;

  const onSubmit: React.ComponentProps<"form">["onSubmit"] = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().replace(/[<>"'&]/g, ""),
          resetToken: token,
          newPassword: password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Заявката не успя. Опитайте отново.");
      } else {
        // Auto-login with the new password
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: email.trim(), password }),
        });
        if (loginRes.ok) {
          const meRes = await fetch("/api/me", { credentials: "include" });
          if (meRes.ok) setUser(await meRes.json());
          refreshCart();
          refreshWishlist();
        }
        toast.success("Паролата е променена успешно!");
        router.push("/");
      }
    } catch {
      toast.error("Заявката не успя. Опитайте отново.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="text-sm text-red-500">
        Невалиден линк за нулиране на парола. Моля, заявете нов.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Въведете имейл адреса си и новата парола.
      </p>

      <div>
        <div className="relative">
          <input
            type="email"
            placeholder="Имейл"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => touch("email")}
            required
            className={inputClass("email")}
          />
          <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
        </div>
        <ul className="mt-1.5 space-y-0.5 pl-0.5">
          <Rule ok={rules.email.valid} text="Валиден имейл адрес" />
        </ul>
      </div>

      <div>
        <div className="relative">
          <input
            type="password"
            placeholder="Нова парола"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => touch("password")}
            required
            className={inputClass("password")}
          />
          <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
        </div>
        <ul className="mt-1.5 space-y-0.5 pl-0.5">
          <Rule ok={rules.password.minLen}    text="Минимум 8 символа" />
          <Rule ok={rules.password.uppercase} text="Поне една главна буква (A-Z)" />
          <Rule ok={rules.password.lowercase} text="Поне една малка буква (a-z)" />
          <Rule ok={rules.password.digit}     text="Поне една цифра (0-9)" />
          <Rule ok={rules.password.special}   text="Поне един специален символ (!@#...)" />
        </ul>
      </div>

      <div>
        <div className="relative">
          <input
            type="password"
            placeholder="Потвърдете новата парола"
            value={repass}
            onChange={(e) => setRepass(e.target.value)}
            onBlur={() => touch("repass")}
            required
            className={inputClass("repass")}
          />
          <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
        </div>
        <ul className="mt-1.5 space-y-0.5 pl-0.5">
          <Rule ok={rules.repass.match} text="Паролите съвпадат" />
        </ul>
      </div>

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
          "Запази новата парола"
        )}
      </button>
    </form>
  );
}
