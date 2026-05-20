import type { Metadata } from "next";
import { Phone, Mail } from "lucide-react";
import { VR_SCHANE_NA_POR_CHKA } from "@/src/app/constants";

export const metadata: Metadata = {
  title: { absolute: "Право на отказ | omekotitel.bg" },
  description:
    "Право на отказ и връщане на поръчка - 14 дни на omekotitel.bg",
  alternates: { canonical: "/vr-schane-na-por-chka" },
  openGraph: {
    type: "website",
    url: "/vr-schane-na-por-chka",
    locale: "bg_BG",
    siteName: "Omekotitel.bg",
    title: { absolute: "Право на отказ | omekotitel.bg" },
    description: "Право на отказ и връщане на поръчка - 14 дни на omekotitel.bg",
  },
};

export default function VrSchaneNaPorchkaPage() {
  const { heading, paragraphs, odrUrl } = VR_SCHANE_NA_POR_CHKA;

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{heading}</h1>

      <article className="space-y-6 mb-12">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-gray-600 text-lg leading-relaxed">
            {para}
          </p>
        ))}

        {odrUrl && (
          <p className="text-gray-600 text-lg leading-relaxed">
            <a
              href={odrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-nav hover:underline font-semibold"
            >
              {odrUrl}
            </a>
          </p>
        )}
      </article>

      <section aria-label="Контакти" className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-6 sm:gap-16">
        <address className="not-italic flex items-center gap-4">
          <Phone size={40} className="text-brand-nav shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-nav">
              Телефон за връзка
            </p>
            <a
              href="tel:0884358676"
              className="text-2xl font-bold text-gray-800 hover:text-brand-nav transition-colors"
            >
              0884358676
            </a>
          </div>
        </address>

        <address className="not-italic flex items-center gap-4">
          <Mail size={40} className="text-brand-nav shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-nav">
              Пишете на email
            </p>
            <a
              href="mailto:info@omekotitel.bg"
              className="text-2xl font-bold text-gray-800 hover:text-brand-nav transition-colors"
            >
              info@omekotitel.bg
            </a>
          </div>
        </address>
      </section>
    </main>
  );
}
