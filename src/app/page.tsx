import { Suspense } from "react";
import CategoryBar from "@/src/app/components/CategoryBar";
import HomeCategorySection from "@/src/app/components/HomeCategorySection";
import HeroSlider from "@/src/app/components/HeroSlider";
import { SliderSkeleton } from "@/src/app/components/ProductSlider";

export default function Home() {
  return (
    <div className="flex flex-col">
<section className="w-full lg:-mt-16.25">
        <HeroSlider />
      </section>

      <CategoryBar />

      <Suspense fallback={<SliderSkeleton title="Нови продукти" />}>
        <HomeCategorySection urlKey="novi-produkti" title="Нови продукти" priorityFirst />
      </Suspense>

      <Suspense fallback={<SliderSkeleton title="Оферти" />}>
        <HomeCategorySection urlKey="oferti-produkti" title="Оферти" />
      </Suspense>

      <Suspense fallback={<SliderSkeleton title="Омекотители" />}>
        <HomeCategorySection
          urlKey="omekotiteli"
          title="Омекотители"
          href="/prane-vsichko-neobhodimo/omekotiteli"
        />
      </Suspense>

      <Suspense fallback={<SliderSkeleton title="Продукти за съдомиялни" />}>
        <HomeCategorySection
          urlKey="preparati-za-sadomiyalni"
          title="Продукти за съдомиялни"
          href="/grizha-za-doma/kuhnja/preparati-za-sadomiyalni"
        />
      </Suspense>

    </div>
  );
}
