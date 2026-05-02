import type { Metadata } from "next";
import { Phone, Mail } from "lucide-react";
import { PRIVACY_POLICY } from "@/src/app/constants";

export const metadata: Metadata = {
  title: "Политика за поверителност | omekotitel.bg",
  description:
    `Политика за защита на личните данни, поверителност и "бисквитки" на omekotitel.bg`,
};

export default function PrivacyPolicyPage() {
  const { heading, intro, gdpr, cookiesCollected, cookiesUsage, howWeUseCookies, choice, externalLinks, cookieTable, thirdPartyCookies, security } =
    PRIVACY_POLICY;

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{heading}</h1>

      <p className="text-gray-600 text-lg leading-relaxed mb-8">{intro}</p>

      <article>
        {/* GDPR Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{gdpr.heading}</h2>
          {gdpr.paragraphs?.map((para, i) => (
            <p key={i} className="text-gray-600 text-lg mb-4 leading-relaxed">
              {para}
            </p>
          ))}

          {gdpr.conditions && (
            <ul className="list-disc list-inside mb-6 space-y-2 text-gray-600 ml-4">
              {gdpr.conditions.map((condition, i) => (
                <li key={i}>{condition}</li>
              ))}
            </ul>
          )}

          {gdpr.closingParagraphs?.map((para, i) => (
            <p key={i} className="text-gray-600 text-lg mb-4 leading-relaxed">
              {para}
            </p>
          ))}

          {gdpr.declaration && (
            <div className="bg-gray-50 p-6 rounded-lg my-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{gdpr.declaration.heading}</h3>
              {gdpr.declaration.paragraphs?.map((para, i) => (
                <p key={i} className="text-gray-600 text-lg mb-4 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          )}

          {gdpr.finalParagraphs?.map((para, i) => (
            <p key={i} className="text-gray-600 text-lg mb-4 leading-relaxed">
              {para}
            </p>
          ))}

          {gdpr.cpdpUrl && (
            <p className="text-gray-600 mb-4">
              <a href={gdpr.cpdpUrl} target="_blank" rel="noopener noreferrer" className="text-brand-nav hover:underline">
                {gdpr.cpdpUrl}
              </a>
            </p>
          )}
        </section>

        {/* Cookies Collected */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{cookiesCollected.heading}</h2>
          <p className="text-gray-600 text-lg mb-4 leading-relaxed">{cookiesCollected.intro}</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-4">
            {cookiesCollected.items?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="text-gray-600 leading-relaxed">{cookiesCollected.note}</p>
        </section>

        {/* Cookies Usage */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{cookiesUsage.heading}</h2>
          <p className="text-gray-600 text-lg mb-4 leading-relaxed">{cookiesUsage.intro}</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
            {cookiesUsage.items?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        {/* How We Use Cookies */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{howWeUseCookies.heading}</h2>
          {howWeUseCookies.paragraphs?.map((para, i) => (
            <p key={i} className="text-gray-600 text-lg mb-4 leading-relaxed">
              {para}
            </p>
          ))}
        </section>

        {/* Choice */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{choice.heading}</h2>
          <p className="text-gray-600 leading-relaxed">{choice.content}</p>
        </section>

        {/* External Links */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{externalLinks.heading}</h2>
          <p className="text-gray-600 leading-relaxed">{externalLinks.content}</p>
        </section>

        {/* Cookie Table */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{cookieTable.heading}</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Име на &quot;бисквитката&quot;</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Описание</th>
                </tr>
              </thead>
              <tbody>
                {cookieTable.rows?.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{row.name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Third Party Cookies */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{thirdPartyCookies.heading}</h2>

          {thirdPartyCookies.providers?.map((provider, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">{provider.name}</h3>
              <dl className="space-y-1 text-sm text-gray-600">
                <div>
                  <dt className="font-semibold">Кой:</dt>
                  <dd>{provider.who}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Цел:</dt>
                  <dd>{provider.purpose}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Бисквитки:</dt>
                  <dd>{provider.cookies}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Период на съхранение:</dt>
                  <dd>{provider.retention}</dd>
                </div>
              </dl>
            </div>
          ))}

          <div className="overflow-x-auto mt-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Име</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Описание</th>
                </tr>
              </thead>
              <tbody>
                {thirdPartyCookies.table?.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-4 py-2 font-mono text-sm">{row.name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Security */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{security.heading}</h2>
          {security.paragraphs?.map((para, i) => (
            <p key={i} className="text-gray-600 text-lg mb-4 leading-relaxed">
              {para}
            </p>
          ))}
        </section>
      </article>

      <section aria-label="Контакти" className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-6 sm:gap-16">
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
