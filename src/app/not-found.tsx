import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Страницата не е намерена",
  robots: { index: false, follow: false },
};

const QUICK_LINKS = [
  { label: "Всички продукти", href: "/products" },
  { label: "Нови продукти", href: "/novi-produkti" },
  { label: "Оферти", href: "/oferti-produkti" },
  { label: "Марки", href: "/marki-brands" },
  { label: "Контакти", href: "/contact" },
];

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">

        {/* Big 404 */}
        <div className="relative mb-8 select-none">
          <span className="text-[160px] font-black leading-none text-gray-100">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[160px] font-black leading-none text-brand-action/10">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-brand-nav mb-3">
          Страницата не е намерена
        </h1>
        <p className="text-gray-500 mb-10 leading-relaxed">
          Продуктът или страницата, която търсите, не съществува или е преместена.
          <br />
          Опитайте да потърсите директно или разгледайте категориите.
        </p>

        {/* Primary CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand-action text-white font-bold px-8 py-3 rounded-xl shadow-md shadow-brand-action/25 hover:bg-brand-nav transition-colors duration-200 mb-10"
        >
          Към началната страница
        </Link>

        {/* Quick links */}
        <div className="border-t border-gray-100 pt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Бързи връзки
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-brand-action hover:text-brand-action transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
