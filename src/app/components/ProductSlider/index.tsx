"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/src/app/components/ProductCard";
import type { ProductCardProduct } from "@/src/app/components/ProductCard";

const VISIBLE = 4;

interface ProductSliderProps {
  title: string;
  products: ProductCardProduct[];
  loading?: boolean;
  viewAllHref?: string;
  titleSize?: string;
  outerClassName?: string;
}

function SliderSkeleton({ title }: { title: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">{title}</h2>
      </div>
      <div className="h-0.5 w-full mb-5" style={{ background: "linear-gradient(to right, #98ab3f 60px, #e5e7eb 60px)" }} />
      <div className="hidden lg:flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[calc(25%-12px)] shrink-0 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" style={{ height: 320 }} />
        ))}
      </div>
      <div className="lg:hidden flex gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="w-44 sm:w-52 md:w-56 shrink-0 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" style={{ height: 280 }} />
        ))}
      </div>
    </div>
  );
}

export default function ProductSlider({
  title,
  products,
  loading,
  viewAllHref,
  titleSize = "text-base",
  outerClassName = "mt-16",
}: ProductSliderProps) {
  const [index, setIndex] = useState(0);
  const [activeDot, setActiveDot] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const max = Math.max(0, products.length - VISIBLE);
  const canPrev = index > 0;
  const canNext = index < max;

  const slideTo = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(next, max)));
  }, [max]);

  useEffect(() => {
    if (!trackRef.current) return;
    const card = trackRef.current.children[0] as HTMLElement | undefined;
    if (!card) return;
    const cardWidth = card.offsetWidth;
    const gap = 16;
    trackRef.current.style.transform = `translateX(-${index * (cardWidth + gap)}px)`;
  }, [index]);

  // Scroll-based dot tracking — more reliable than IntersectionObserver
  useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const cards = el.querySelectorAll<HTMLElement>("[data-card]");
      if (!cards.length) return;
      const elRect = el.getBoundingClientRect();
      const elCenter = elRect.left + elRect.width / 2;
      let closest = 0;
      let minDist = Infinity;
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const dist = Math.abs(rect.left + rect.width / 2 - elCenter);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActiveDot(closest);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [products.length]);

  if (loading) return <SliderSkeleton title={title} />;
  if (!products.length) return null;

  return (
    <div className={outerClassName}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className={`${titleSize} font-bold text-gray-900 tracking-tight min-w-0 truncate`}>{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-medium text-brand-nav hover:text-brand-action transition-colors whitespace-nowrap shrink-0">
            Виж всички →
          </Link>
        )}
      </div>
      <div className="h-0.5 w-full mb-5" style={{ background: "linear-gradient(to right, #98ab3f 60px, #e5e7eb 60px)" }} />

      {/* Desktop: windowed slider */}
      <div className="hidden lg:block relative">
        {products.length > VISIBLE && (
          <>
            <button onClick={() => slideTo(index - 1)} disabled={!canPrev} aria-label="Предишни"
              className={`absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border bg-white shadow flex items-center justify-center transition-colors ${canPrev ? "border-brand-action text-brand-action hover:bg-brand-action/10" : "border-gray-200 text-gray-300 cursor-not-allowed"}`}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => slideTo(index + 1)} disabled={!canNext} aria-label="Следващи"
              className={`absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border bg-white shadow flex items-center justify-center transition-colors ${canNext ? "border-brand-action text-brand-action hover:bg-brand-action/10" : "border-gray-200 text-gray-300 cursor-not-allowed"}`}>
              <ChevronRight size={18} />
            </button>
          </>
        )}
        <div className="overflow-hidden">
          <div ref={trackRef} className="flex gap-4 transition-transform duration-300 ease-in-out" style={{ willChange: "transform" }}>
            {products.map((product, i) => (
              <div key={product.id} className="w-[calc(25%-12px)] shrink-0 self-stretch">
                <ProductCard product={product} index={i} view="grid" imageSizes="320px" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile + tablet: native scroll — -mx-4 px-4 breaks out of parent padding to reach viewport edges */}
      <div className="lg:hidden">
        <div
          ref={mobileScrollRef}
          className="flex flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4"
          style={{
            touchAction: "pan-x pan-y",
            WebkitOverflowScrolling: "touch",
            width: "calc(100% + 2rem)",
            maxWidth: "100vw",
            minWidth: 0,
          }}
        >
          {products.map((product, i) => (
            <div
              key={product.id}
              data-card
              className="shrink-0"
              style={{ width: 200, flex: "0 0 200px" }}
            >
              <ProductCard product={product} index={i} view="grid" imageSizes="200px" />
            </div>
          ))}
          <div className="w-4 shrink-0" />
        </div>
        {products.length > 1 && (
          <div
            style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16, paddingBottom: 4 }}
          >
            {products.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Към продукт ${i + 1}`}
                onClick={() => {
                  const el = mobileScrollRef.current;
                  const card = el?.querySelectorAll<HTMLElement>("[data-card]")[i];
                  if (card && el) {
                    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
                  }
                }}
                style={{
                  width: i === activeDot ? 24 : 8,
                  height: 8,
                  borderRadius: 9999,
                  background: i === activeDot ? "#98ab3f" : "#d1d5db",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
