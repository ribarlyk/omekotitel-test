import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FOOTER_COLUMNS, FOOTER_SOCIAL } from "@/src/app/constants";

const FacebookIcon = () => (
  <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const SOCIAL_ICONS: Record<string, () => React.JSX.Element> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
};

export const Footer = () => (
  <footer className="border-t border-gray-200 mt-16">
    {/* Columns */}
    <div className="container mx-auto px-8 py-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
      {FOOTER_COLUMNS.map((col) => (
        <div key={col.heading}>
          <h3 className="font-bold text-gray-900 mb-4">{col.heading}</h3>
          <ul className="flex flex-col gap-2">
            {col.links.map((link) => (
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
        </div>
      ))}

      {/* Contact column */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4">Контакти:</h3>
        <div className="flex flex-col gap-2 mb-5">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">Телефон:</span>{" "}
            <a href="tel:+359884358676" className="hover:text-brand-nav transition-colors">
              0884 358 676
            </a>
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">E-mail:</span>{" "}
            <a href="mailto:info@omekotitel.bg" className="hover:text-brand-nav transition-colors">
              info@omekotitel.bg
            </a>
          </p>
        </div>
        <div className="flex items-center gap-4 mb-4">
          {FOOTER_SOCIAL.map((s) => {
            const Icon = SOCIAL_ICONS[s.icon];
            return (
              <Link
                key={s.icon}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-gray-400 hover:text-brand-nav transition-colors"
              >
                {Icon && <Icon />}
              </Link>
            );
          })}
        </div>
        <Image
          src="https://omekotitel.bg/pub/media/wysiwyg/payment_1.png"
          alt="Начини на плащане"
          width={300}
          height={56}
          unoptimized
        />
      </div>
    </div>

    {/* Bottom bar */}
    <div className="border-t border-gray-200">
      <div className="container mx-auto px-8 py-5 flex flex-col items-center gap-2 lg:flex-row lg:justify-between lg:gap-4">
        {/* Made by */}
        <p className="text-xs text-gray-400">
          Уеб дизайн{" "}
          <a
            href="#"
            className="font-semibold text-gray-500 hover:text-brand-nav transition-colors"
          >
            ПХ Дизайн
          </a>
        </p>

        {/* Copyright */}
        <p className="text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} omekotitel.bg. Всички права запазени.
        </p>

        {/* Spacer to balance left side */}
        <div className="hidden lg:block w-12" aria-hidden="true" />
      </div>
    </div>
  </footer>
);
