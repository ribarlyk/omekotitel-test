import type { Metadata } from "next";
import { Phone, Mail } from "lucide-react";
import { ZA_NAS_INFO } from "@/src/app/constants";

export const metadata: Metadata = {
  title: "За нас | omekotitel.bg",
  description:
    "Приветстваме ви на сайта, на който може да откриете голямо разнообразие от професионални препарати за дома, бизнеса, консумативи и аксесоари.",
};

export default function ZaNasPage() {
  const { heading, paragraphs, contacts } = ZA_NAS_INFO;

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{heading}</h1>

      <section aria-label="Информация за нас">
        {paragraphs.map((text, i) => (
          <p key={i} className="text-gray-600 text-lg leading-relaxed mb-4">
            {text}
          </p>
        ))}
      </section>

      <section aria-label="Контакти" className="mt-10 pt-10 border-t border-gray-200 flex flex-col sm:flex-row gap-6 sm:gap-16">
        <address className="not-italic flex items-center gap-4">
          <Phone size={40} className="text-brand-nav shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-nav">
              {contacts.phone.label}
            </p>
            <a
              href={contacts.phone.href}
              className="text-2xl font-bold text-gray-800 hover:text-brand-nav transition-colors"
            >
              {contacts.phone.value}
            </a>
          </div>
        </address>

        <address className="not-italic flex items-center gap-4">
          <Mail size={40} className="text-brand-nav shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-nav">
              {contacts.email.label}
            </p>
            <a
              href={contacts.email.href}
              className="text-2xl font-bold text-gray-800 hover:text-brand-nav transition-colors"
            >
              {contacts.email.value}
            </a>
          </div>
        </address>
      </section>
    </main>
  );
}
