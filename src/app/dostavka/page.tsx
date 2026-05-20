import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { DELIVERY_INFO } from "@/src/app/constants";

export const metadata: Metadata = {
  title: { absolute: "Условия за Доставка | omekotitel.bg" },
  description:
    "Информация за начините и цените на доставка чрез Еконт и Speedy, включително безплатна доставка при поръчка над 50 €.",
  alternates: { canonical: "/dostavka" },
  openGraph: {
    type: "website",
    url: "/dostavka",
    locale: "bg_BG",
    siteName: "Omekotitel.bg",
    title: "Условия за Доставка | omekotitel.bg",
    description: "Информация за начините и цените на доставка чрез Еконт и Speedy, включително безплатна доставка при поръчка над 50 €.",
  },
};

export default function DostavkaPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Truck size={32} className="text-brand-nav shrink-0" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-gray-800">Условия за Доставка</h1>
      </div>

      <p className="text-gray-600 text-lg leading-relaxed mb-4">{DELIVERY_INFO.intro}</p>
      <p className="text-gray-600 text-lg leading-relaxed mb-10">{DELIVERY_INFO.subIntro}</p>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Начини на доставка</h2>
      <ul className="mb-10 flex flex-col gap-2">
        {DELIVERY_INFO.methods.map((method, i) => (
          <li key={i} className="flex items-start gap-2 text-gray-600 text-base">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-nav shrink-0" aria-hidden="true" />
            {method}
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Цени и условия за доставка</h2>
      <dl className="flex flex-col gap-3">
        {DELIVERY_INFO.pricing.map((item, i) => (
          <div key={i} className="flex items-start gap-3 text-base">
            <dt className="font-semibold text-brand-nav whitespace-nowrap">{item.label}</dt>
            <dd className="text-gray-600">{item.description}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
