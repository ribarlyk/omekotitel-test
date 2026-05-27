"use client";

import { createContext, useContext, useState, useEffect, useCallback, startTransition } from "react";

const CONSENT_KEY = "omekotitel-cookie-consent";
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

interface ConsentRecord {
  analytics: boolean;
  timestamp: number;
}

interface CookieConsentContextValue {
  analyticsAllowed: boolean;
  showBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  saveCustom: (analytics: boolean) => void;
  openSettings: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function writeConsent(analytics: boolean) {
  const record: ConsentRecord = { analytics, timestamp: Date.now() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const show = () => setShowBanner(true);
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) { setTimeout(show, 300); return; }
      const record: ConsentRecord = JSON.parse(raw);
      if (Date.now() - record.timestamp > CONSENT_TTL_MS) {
        localStorage.removeItem(CONSENT_KEY);
        setTimeout(show, 300);
        return;
      }
      startTransition(() => setAnalyticsAllowed(record.analytics));
    } catch {
      setTimeout(show, 300);
    }
  }, []);

  const acceptAll = useCallback(() => {
    writeConsent(true);
    setAnalyticsAllowed(true);
    setShowBanner(false);
  }, []);

  const rejectAll = useCallback(() => {
    writeConsent(false);
    setAnalyticsAllowed(false);
    setShowBanner(false);
  }, []);

  const saveCustom = useCallback((analytics: boolean) => {
    writeConsent(analytics);
    setAnalyticsAllowed(analytics);
    setShowBanner(false);
  }, []);

  const openSettings = useCallback(() => {
    setShowBanner(true);
  }, []);

  return (
    <CookieConsentContext.Provider value={{ analyticsAllowed, showBanner, acceptAll, rejectAll, saveCustom, openSettings }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used inside CookieConsentProvider");
  return ctx;
}
