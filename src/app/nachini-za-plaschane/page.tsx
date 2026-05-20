import type { Metadata } from "next";
import { Phone, Mail } from "lucide-react";
import { NACHINI_ZA_PLASCHANE } from "@/src/app/constants";

export const metadata: Metadata = {
  title: { absolute: "Начини за плащане | omekotitel.bg" },
  description:
    "Начини за плащане - Revolut Pay, карта и плащане при доставка на omekotitel.bg",
  alternates: { canonical: "/nachini-za-plaschane" },
  openGraph: {
    type: "website",
    url: "/nachini-za-plaschane",
    locale: "bg_BG",
    siteName: "Omekotitel.bg",
    title: "Начини за плащане | omekotitel.bg",
    description: "Начини за плащане - Revolut Pay, карта и плащане при доставка на omekotitel.bg",
  },
};

export default function NachinaZaPlaschane() {
  const { heading, sections, footer } = NACHINI_ZA_PLASCHANE;

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{heading}</h1>

      {sections.map((section, idx) => (
        <section key={idx} className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{section.heading}</h2>

          {section.paragraphs?.map((para, i) => (
            <p key={i} className="text-gray-600 text-lg leading-relaxed mb-4">
              {para}
            </p>
          ))}

          {section.paymentMethods && (
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6 ml-4">
              {section.paymentMethods.map((method, i) => (
                <li key={i}>{method}</li>
              ))}
            </ul>
          )}

          {section.additionalInfo?.map((info, i) => (
            <p key={i} className="text-gray-600 text-lg leading-relaxed mb-4">
              {info}
            </p>
          ))}
        </section>
      ))}

      {footer && (
        <section className="mb-12 bg-gray-50 p-6 rounded-lg">
          {footer.map((text, i) => (
            <p key={i} className="text-gray-600 text-lg leading-relaxed">
              {text}
            </p>
          ))}
        </section>
      )}

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
