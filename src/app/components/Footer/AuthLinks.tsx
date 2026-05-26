"use client";

import Link from "next/link";
import { useAuth } from "@/src/app/contexts/AuthContext";

interface FooterLink {
  href: string;
  label: string;
  requiresAuth?: boolean;
}

export function AuthLinks({ links }: { links: readonly FooterLink[] }) {
  const { user } = useAuth();
  return (
    <ul className="flex flex-col gap-2">
      {links.filter((link) => !link.requiresAuth || !!user).map((link) => (
        <li key={link.href + link.label}>
          <Link
            href={link.href}
            className="text-sm text-gray-500 hover:text-brand-nav transition-colors"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
