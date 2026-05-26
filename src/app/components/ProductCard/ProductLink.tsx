"use client";

import Link from "next/link";
import { prefetchProductLinks } from "@/src/app/components/ProductDetail/prefetchLinks";

export function ProductLink({
  urlKey,
  className,
  children,
}: {
  urlKey: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/${urlKey}`}
      onMouseDown={() => prefetchProductLinks(urlKey)}
      className={className}
    >
      {children}
    </Link>
  );
}
