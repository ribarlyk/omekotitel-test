"use client";

import { Turnstile } from "@marsidev/react-turnstile";

interface Props {
  onSuccess: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
}

export default function TurnstileWidget({ onSuccess, onExpire, onError }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={onSuccess}
      onExpire={onExpire}
      onError={onError}
      className="w-full"
      options={{ theme: "light", size: "flexible" }}
    />
  );
}
