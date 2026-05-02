import type { Metadata } from "next";
import { Phone, Mail } from "lucide-react";
import ContactForm from "@/src/app/components/ContactForm";
import { ZA_NAS_INFO } from "@/src/app/constants";

export const metadata: Metadata = {
  title: "Контакти | omekotitel.bg",
  description: "Свържете се с нас по телефон или имейл, или попълнете формата и ние ще отговорим при първа възможност.",
};

export default function ContactPage() {
  const { contacts } = ZA_NAS_INFO;

  return (
    <main className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">Свържете се с нас</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Пишете ни</h2>
        <p className="text-sm text-gray-500 italic mb-6">
          Вашето мнение е ценно за нас. Споделете ни го, а ние ще се свържем с Вас при първа възможност.
        </p>
        <ContactForm />
      </section>

      <section aria-label="Контактна информация" className="mt-12 pt-10 border-t border-gray-200 flex flex-col sm:flex-row gap-6 sm:gap-16">
        <address className="not-italic flex items-center gap-4">
          <Phone size={40} className="text-brand-nav shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-nav">
              {contacts.phone.label}
            </p>
            <a href={contacts.phone.href} className="text-2xl font-bold text-gray-800 hover:text-brand-nav transition-colors">
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
            <a href={contacts.email.href} className="text-2xl font-bold text-gray-800 hover:text-brand-nav transition-colors">
              {contacts.email.value}
            </a>
          </div>
        </address>
      </section>
    </main>
  );
}
