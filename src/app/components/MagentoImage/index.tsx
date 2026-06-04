"use client";

import Image, { type ImageProps } from "next/image";
import { useState, useCallback } from "react";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAD0lEQVR42mNk+M9Qz0AHAARWAQBmOwh0AAAAAElFTkSuQmCC";

export default function MagentoImage({
  placeholder = "blur",
  blurDataURL = BLUR_DATA_URL,
  ...props
}: ImageProps) {
  const [retries, setRetries] = useState(0);
  const [key, setKey] = useState(0);

  const handleError = useCallback(() => {
    if (retries < MAX_RETRIES) {
      setTimeout(() => {
        setRetries((r) => r + 1);
        setKey((k) => k + 1);
      }, RETRY_DELAY_MS);
    }
  }, [retries]);

  return (
    <Image
      key={key}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      {...props}
      onError={handleError}
    />
  );
}
