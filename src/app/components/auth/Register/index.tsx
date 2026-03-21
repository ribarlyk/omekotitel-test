"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticate } from "@/src/app/hooks/useAuthentication";
import TurnstileWidget from "@/src/app/components/Turnstile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li
      className={`flex items-center gap-1.5 text-xs leading-none transition-colors ${ok ? "text-green-600" : "text-red-500"}`}
    >
      <span className="flex items-center justify-center w-3 h-3 shrink-0">
        {ok ? (
          <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
            <path
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2 6l3 3 5-5"
            />
          </svg>
        ) : (
          <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
            <path
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              d="M3 3l6 6M9 3l-6 6"
            />
          </svg>
        )}
      </span>
      <span>{text}</span>
    </li>
  );
}

interface Props {
  onLogin?: () => void;
  onSuccess?: () => void;
}

export default function Register({ onLogin, onSuccess }: Props) {
  const router = useRouter();
  const { handleRegister, loginLoading } = useAuthenticate();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repass, setRepass] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [cfToken, setCfToken] = useState<string | null>(null);

  // Per-rule checks
  const rules = {
    firstname: { minLen: firstname.trim().length >= 2 },
    lastname: { minLen: lastname.trim().length >= 2 },
    email: { valid: EMAIL_RE.test(email.trim()) },
    password: {
      minLen: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /[0-9]/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    },
    repass: { match: repass === password && repass.length > 0 },
  };

  const passwordClassesOk =
    [
      rules.password.uppercase,
      rules.password.lowercase,
      rules.password.digit,
      rules.password.special,
    ].filter(Boolean).length >= 3;

  const isValid = {
    firstname: rules.firstname.minLen,
    lastname: rules.lastname.minLen,
    email: rules.email.valid,
    password: rules.password.minLen && passwordClassesOk,
    repass: rules.repass.match,
  };

  const canSubmit = Object.values(isValid).every(Boolean) && !!cfToken;
  const touch = (name: string) => setTouched((t) => ({ ...t, [name]: true }));

  const onSubmit: React.ComponentProps<"form">["onSubmit"] = async (e) => {
    const success = await handleRegister(e, cfToken ?? undefined);
    if (success) {
      onSuccess?.();
      router.push("/");
    }
  };

  const inputClass = (name: keyof typeof isValid) =>
    `w-full border rounded px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors ${
      touched[name]
        ? isValid[name]
          ? "border-green-400 focus:border-green-500"
          : "border-red-400 focus:border-red-400"
        : "border-gray-300 focus:border-brand-nav"
    }`;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <div className="relative">
          <input
            type="text"
            name="name"
            placeholder="Име"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            onBlur={() => touch("firstname")}
            required
            className={inputClass("firstname")}
          />
          <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
        </div>
        <ul className="mt-1.5 space-y-0.5 pl-0.5">
          <Rule ok={rules.firstname.minLen} text="Минимум 2 символа" />
        </ul>
      </div>

      <div>
        <div className="relative">
          <input
            type="text"
            name="lastname"
            placeholder="Фамилия"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            onBlur={() => touch("lastname")}
            required
            className={inputClass("lastname")}
          />
          <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
        </div>
        <ul className="mt-1.5 space-y-0.5 pl-0.5">
          <Rule ok={rules.lastname.minLen} text="Минимум 2 символа" />
        </ul>
      </div>

      <div>
        <div className="relative">
          <input
            type="email"
            name="email"
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
            name="password"
            placeholder="Парола"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => touch("password")}
            required
            className={inputClass("password")}
          />
          <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
        </div>
        <ul className="mt-1.5 space-y-0.5 pl-0.5">
          <Rule ok={rules.password.minLen} text="Минимум 8 символа" />
          <Rule
            ok={rules.password.uppercase}
            text="Поне една главна буква (A-Z)"
          />
          <Rule
            ok={rules.password.lowercase}
            text="Поне една малка буква (a-z)"
          />
          <Rule ok={rules.password.digit} text="Поне една цифра (0-9)" />
          <Rule
            ok={rules.password.special}
            text="Поне един специален символ (!@#...)"
          />
        </ul>
      </div>

      <div>
        <div className="relative">
          <input
            type="password"
            name="repass"
            placeholder="Потвърдете паролата"
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

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          name="is_subscribed"
          className="w-4 h-4 accent-brand-action"
        />
        Искам да получавам новини и оферти
      </label>

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
          "Регистрирай ме"
        )}
      </button>

      <TurnstileWidget onSuccess={setCfToken} onExpire={() => setCfToken(null)} onError={() => setCfToken(null)} />

      {onLogin && (
        <div className="flex justify-end text-xs font-semibold">
          <button
            type="button"
            onClick={onLogin}
            className="text-brand-action hover:underline uppercase cursor-pointer"
          >
            Вече имам профил
          </button>
        </div>
      )}
    </form>
  );
}
