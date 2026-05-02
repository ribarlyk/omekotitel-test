import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import CategoryBar from "@/src/app/components/CategoryBar";
import HomeCategorySection from "@/src/app/components/HomeCategorySection";
import TestCartButton from "@/src/app/components/TestCartButton";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero + CategoryBar — fills one viewport on desktop */}
      <div className="md:h-[calc(100dvh-11rem)] md:flex md:flex-col">
        <section className="relative min-h-36 md:flex-1 flex items-center overflow-hidden">
          <Image
            src="/assets/hero-omekotitel.png"
            alt="Hero background"
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
            fetchPriority="high"
          />
          {/* left-side gradient so text stays readable */}
          <div className="absolute inset-0 bg-linear-to-r from-white/80 via-white/50 to-transparent" />
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 md:py-8 flex justify-center md:justify-start">
            <div className="max-w-lg text-center md:text-left">
              <h1 className="text-2xl md:text-5xl font-bold text-gray-800 mb-2 md:mb-5 leading-tight">
                Грижа за дома и семейството
              </h1>
              <p className="hidden md:block text-xl text-gray-600 mb-8">
                Открийте широк асортимент от козметика, почистващи препарати и
                продукти за лична хигиена — всичко на едно място, на достъпни цени.
              </p>
              <Link
                href="/grizha-za-doma"
                className="inline-block bg-brand-red text-black font-semibold px-5 py-2.5 md:px-8 md:py-4 rounded-lg text-sm md:text-lg hover:opacity-90 transition-opacity"
              >
                Разгледай продуктите
              </Link>
            </div>
          </div>
        </section>

        <CategoryBar />
      </div>

      <Suspense fallback={null}>
        <HomeCategorySection urlKey="novi-produkti" title="Нови продукти" />
      </Suspense>

      <Suspense fallback={null}>
        <HomeCategorySection urlKey="oferti-produkti" title="Оферти" />
      </Suspense>

      {/* Dev test button */}
      <TestCartButton />
    </div>
  );
}
