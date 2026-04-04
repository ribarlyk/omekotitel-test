import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import CategoryBar from "@/src/app/components/CategoryBar";
import HomeCategorySection from "@/src/app/components/HomeCategorySection";
import TestCartButton from "@/src/app/components/TestCartButton";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-160 flex items-center overflow-hidden">
        <Image
          src="/assets/Gemini_Generated_Image_86ouw886ouw886ou (1).png"
          alt="Hero background"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        {/* left-side gradient so text stays readable */}
        <div className="absolute inset-0 bg-linear-to-r from-white/80 via-white/50 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 py-20 flex justify-center md:justify-start">
          <div className="max-w-lg text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-5 leading-tight">
              Грижа за дома и семейството
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Открийте широк асортимент от козметика, почистващи препарати и
              продукти за лична хигиена — всичко на едно място, на достъпни цени.
            </p>
            <Link
              href="/grizha-za-doma"
              className="inline-block bg-brand-red text-white font-semibold px-8 py-4 rounded-lg text-lg hover:opacity-90 transition-opacity"
            >
              Разгледай продуктите
            </Link>
          </div>
        </div>
      </section>

      <CategoryBar />

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
