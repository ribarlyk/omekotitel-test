import type { Metadata } from "next";
import { Phone, Mail } from "lucide-react";
import { OBSCHI_USLOVIJA } from "@/src/app/constants";

export const metadata: Metadata = {
  title: "Общи условия | omekotitel.bg",
  description:
    "Общи условия на онлайн магазин OMEKOTITEL.BG, содържащи информация за правата и задълженията на потребителите и доставчика.",
};

export default function ObshchiUsloviyaPage() {
  const { heading, sections } = OBSCHI_USLOVIJA;

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-12">{heading}</h1>

      <article>
        {sections.map((section, idx) => (
          <section key={idx} className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{section.heading}</h2>

            {section.paragraphs?.map((para, i) => (
              <p key={i} className="text-gray-600 text-lg mb-4 leading-relaxed">
                {para}
              </p>
            ))}

            {section.details && (
              <dl className="mb-6 space-y-2">
                {section.details.map((detail, i) => (
                  <div key={i} className="flex gap-4">
                    <dt className="font-semibold text-gray-800 w-48 flex-shrink-0">{detail.label}</dt>
                    <dd className="text-gray-600">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {section.agencies && (
              <div className="mb-6 space-y-6">
                {section.agencies.map((agency, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">{agency.name}</h3>
                    <dl className="space-y-1 text-sm text-gray-600">
                      {agency.address && (
                        <>
                          <dt className="font-semibold">Адрес:</dt>
                          <dd className="mb-2">{agency.address}</dd>
                        </>
                      )}
                      {agency.phone && (
                        <>
                          <dt className="font-semibold">Телефон:</dt>
                          <dd>{agency.phone}</dd>
                        </>
                      )}
                      {agency.fax && (
                        <>
                          <dt className="font-semibold">Факс:</dt>
                          <dd>{agency.fax}</dd>
                        </>
                      )}
                      {agency.hotline && (
                        <>
                          <dt className="font-semibold">Гоема линия:</dt>
                          <dd>{agency.hotline}</dd>
                        </>
                      )}
                      {agency.email && (
                        <>
                          <dt className="font-semibold">Email:</dt>
                          <dd>{agency.email}</dd>
                        </>
                      )}
                      {agency.website && (
                        <>
                          <dt className="font-semibold">Уеб сайт:</dt>
                          <dd>{agency.website}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            )}

            {section.odr && (
              <p className="text-gray-600 text-lg mb-4 leading-relaxed">{section.odr}</p>
            )}

            {section.steps && (
              <ol className="list-decimal list-inside mb-6 space-y-2 text-gray-600">
                {section.steps.map((step, i) => (
                  <li key={i} className="ml-4">
                    {step}
                  </li>
                ))}
              </ol>
            )}

            {section.closing && (
              <>
                {section.closing.map((para, i) => (
                  <p key={i} className="text-gray-600 text-lg mb-4 leading-relaxed">
                    {para}
                  </p>
                ))}
              </>
            )}

            {section.conditions && (
              <ul className="list-disc list-inside mb-6 space-y-2 text-gray-600">
                {section.conditions.map((condition, i) => (
                  <li key={i} className="ml-4">
                    {condition}
                  </li>
                ))}
              </ul>
            )}

            {section.closingParagraphs && (
              <>
                {section.closingParagraphs.map((para, i) => (
                  <p key={i} className="text-gray-600 text-lg mb-4 leading-relaxed">
                    {para}
                  </p>
                ))}
              </>
            )}

            {section.noResponsibilityFor && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Доставчикът не носи отговорност:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {section.noResponsibilityFor.map((item, i) => (
                    <li key={i} className="ml-4">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.supplierRights && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Права на OMEKOTITEL.BG:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {section.supplierRights.map((item, i) => (
                    <li key={i} className="ml-4">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.userRights && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Права на Ползвателя:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {section.userRights.map((item, i) => (
                    <li key={i} className="ml-4">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.userObligations && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Задължения на Ползвателя:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {section.userObligations.map((item, i) => (
                    <li key={i} className="ml-4">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
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
