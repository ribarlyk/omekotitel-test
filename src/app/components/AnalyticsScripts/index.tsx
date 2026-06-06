"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { useCookieConsent } from "@/src/app/contexts/CookieConsentContext";

export function AnalyticsScripts() {
  const { analyticsAllowed } = useCookieConsent();
  if (!analyticsAllowed) return null;
  return (
    <>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
      <Analytics />
    </>
  );
}
