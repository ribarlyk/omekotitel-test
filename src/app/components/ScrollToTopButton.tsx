"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 shrink-0">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 shrink-0">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const ViberIcon = () => (
  <span className="w-6 h-6 shrink-0 rounded-full bg-[#7360F2] flex items-center justify-center">
    <Image src="/assets/viber.svg" alt="Viber" width={14} height={14} style={{ filter: "brightness(0) invert(1)" }} />
  </span>
);

const ContactIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const CONTACTS = [
  {
    icon: <PhoneIcon />,
    label: "0884 358 676",
    sublabel: "За поръчки и запитвания",
    href: "tel:+359884358676",
    color: "text-brand-nav",
  },
  {
    icon: <ViberIcon />,
    label: "Viber",
    sublabel: "Пишете ни във Viber",
    href: "viber://chat?number=359884358676",
    color: "",
  },
  {
    icon: <EmailIcon />,
    label: "info@omekotitel.bg",
    sublabel: "Пишете на имейл",
    href: "mailto:info@omekotitel.bg",
    color: "text-brand-nav",
  },
];

export const ScrollToTopButton = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Panel */}
      <div
        className={`bg-white rounded-2xl shadow-2xl border-2 border-brand-nav overflow-hidden w-72 transition-all duration-500 ease-in-out origin-bottom-right ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-90 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-brand-nav px-5 py-4">
          <p className="text-white font-bold text-base">Свържете се с нас</p>
          <p className="text-white/70 text-xs mt-0.5">Отговаряме бързо</p>
        </div>
        {/* Contact rows */}
        <div className="divide-y divide-gray-100">
          {CONTACTS.map((c) => (
            <a
              key={c.href}
              href={c.href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              <span className={`${c.color} group-hover:scale-110 transition-transform`}>{c.icon}</span>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{c.sublabel}</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{c.label}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Trigger button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-500 ease-in-out cursor-pointer ${
          open ? "bg-brand-nav rotate-90 scale-110" : "bg-brand-nav hover:scale-110"
        } text-white`}
        aria-label="Контакти"
      >
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`w-6 h-6 absolute transition-all duration-500 ease-in-out ${open ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`}
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        <span className={`absolute transition-all duration-500 ease-in-out ${open ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`}>
          <ContactIcon />
        </span>
      </button>
    </div>
  );
};
