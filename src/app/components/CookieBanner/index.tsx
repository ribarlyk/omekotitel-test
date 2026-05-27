"use client";

import { useState, useEffect, useSyncExternalStore, startTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, X, Settings2 } from "lucide-react";
import { useCookieConsent } from "@/src/app/contexts/CookieConsentContext";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${checked ? "bg-brand-action" : "bg-gray-300"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function CookieBanner() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [showDetails, setShowDetails] = useState(false);
  const { analyticsAllowed, showBanner, acceptAll, rejectAll, saveCustom } = useCookieConsent();
  const [analyticsChecked, setAnalyticsChecked] = useState(analyticsAllowed);

  useEffect(() => {
    if (showBanner) {
      startTransition(() => {
        setAnalyticsChecked(analyticsAllowed);
        setShowDetails(false);
      });
    }
  }, [showBanner, analyticsAllowed]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-black/75 shadow-2xl transition-all duration-500 ease-in-out ${
        showBanner ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <div className="px-5 py-3 lg:container lg:mx-auto lg:px-8 lg:py-4">

        {/* Mobile: title + description stacked; Desktop: single-line text */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex-1">
            <p className="font-bold text-white text-xl mb-2">Използваме &bdquo;бисквитки&ldquo;</p>
            <p className="text-lg text-white/80">
              За да Ви осигурим най-пълноценното преживяване на нашия сайт, моля, приемете нашите бисквитки. За повече подробности и ползите при използване на бисквитки прочетете{" "}
              <Link
                href="/privacy-policy-cookie-restriction-mode"
                className="underline text-white hover:text-brand-action transition-colors"
              >
                тук
              </Link>
              .
            </p>
          </div>

          {/* Buttons — stacked full-width on mobile, inline on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:shrink-0">
            <button
              onClick={acceptAll}
              className="flex items-center justify-center gap-2 w-full lg:w-auto text-base font-semibold bg-brand-action text-white rounded-md px-6 py-3 hover:bg-brand-action/90 transition-colors cursor-pointer"
            >
              <Check size={18} strokeWidth={2.5} />
              Приемам всички
            </button>
            <button
              onClick={rejectAll}
              className="flex items-center justify-center gap-2 w-full lg:w-auto text-base font-semibold border border-white/40 text-white rounded-md px-6 py-3 hover:border-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={2.5} />
              Отказвам всички
            </button>
            <button
              onClick={() => setShowDetails((v) => !v)}
              className={`flex items-center justify-center gap-2 w-full lg:w-auto text-base font-medium rounded-md px-5 py-3 border transition-colors cursor-pointer ${
                showDetails
                  ? "bg-white/20 text-white border-white/40"
                  : "border-white/30 text-white/70 hover:border-white/60 hover:text-white"
              }`}
            >
              <Settings2 size={17} />
              Настройки на бисквитки
            </button>
          </div>
        </div>

        {/* Expandable settings */}
        {showDetails && (
          <div className="mt-5 border border-white/20 rounded-lg p-4 flex flex-col gap-4 bg-white/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Строго необходими (задължителни)</p>
                <p className="text-xs text-white/60 mt-0.5">Сесия, количка, вход в профил</p>
              </div>
              <Toggle checked={true} disabled />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Аналитични</p>
                <p className="text-xs text-white/60 mt-0.5">Google Analytics, Vercel Analytics</p>
              </div>
              <Toggle checked={analyticsChecked} onChange={setAnalyticsChecked} />
            </div>
            <button
              onClick={() => saveCustom(analyticsChecked)}
              className="self-end text-sm font-semibold bg-brand-action text-white rounded-md px-5 py-2.5 hover:bg-brand-action/90 transition-colors cursor-pointer"
            >
              Запази настройките
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
