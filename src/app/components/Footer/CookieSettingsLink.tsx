"use client";

import { useCookieConsent } from "@/src/app/contexts/CookieConsentContext";

export function CookieSettingsLink() {
  const { openSettings } = useCookieConsent();
  return (
    <button
      onClick={openSettings}
      className="text-xs text-gray-400 hover:text-brand-nav transition-colors underline cursor-pointer"
    >
      Настройки за бисквитки
    </button>
  );
}
