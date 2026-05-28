import { Suspense } from "react";
import CategoryBar from "@/src/app/components/CategoryBar";
import HomeCategorySection from "@/src/app/components/HomeCategorySection";
import HeroSlider from "@/src/app/components/HeroSlider";

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="w-full">
        <HeroSlider />
      </section>

      <CategoryBar />

      <Suspense fallback={null}>
        <HomeCategorySection urlKey="novi-produkti" title="Нови продукти" />
      </Suspense>

      <Suspense fallback={null}>
        <HomeCategorySection urlKey="oferti-produkti" title="Оферти" />
      </Suspense>

      <Suspense fallback={null}>
        <HomeCategorySection
          urlKey="omekotiteli"
          title="Омекотители"
          href="/prane-vsichko-neobhodimo/omekotiteli"
        />
      </Suspense>

      <Suspense fallback={null}>
        <HomeCategorySection
          urlKey="preparati-za-sadomiyalni"
          title="Продукти за съдомиялни"
          href="/grizha-za-doma/kuhnja/preparati-za-sadomiyalni"
        />
      </Suspense>

    </div>
  );
}
