"use client";

import Image, { type ImageProps } from "next/image";
import { useState, useCallback } from "react";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

export default function MagentoImage(props: ImageProps) {
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
      {...props}
      onError={handleError}
    />
  );
}
