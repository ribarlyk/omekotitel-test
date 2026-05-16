"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/src/app/components/ProductCard";
import type { ProductCardProduct } from "@/src/app/components/ProductCard";

const VISIBLE = 4;

interface ProductSliderProps {
  title: string;
  products: ProductCardProduct[];
  loading?: boolean;
}

function SliderSkeleton({ title }: { title: string }) {
  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">{title}</h2>
      </div>
      <div className="h-0.5 w-full mb-5" style={{ background: "linear-gradient(to right, #98ab3f 60px, #e5e7eb 60px)" }} />
      <div className="hidden sm:flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[calc(25%-12px)] shrink-0 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" style={{ height: 320 }} />
        ))}
      </div>
      <div className="sm:hidden flex gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="w-[calc(50%-6px)] shrink-0 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" style={{ height: 280 }} />
        ))}
      </div>
    </div>
  );
}

export default function ProductSlider({ title, products, loading }: ProductSliderProps) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

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
    const gap = 16; // gap-4
    trackRef.current.style.transform = `translateX(-${index * (cardWidth + gap)}px)`;
  }, [index]);

  if (loading) return <SliderSkeleton title={title} />;
  if (!products.length) return null;

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-900 tracking-tight">{title}</h2>
        {products.length > VISIBLE && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => slideTo(index - 1)}
              disabled={!canPrev}
              aria-label="Предишни"
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                canPrev
                  ? "border-brand-action text-brand-action hover:bg-brand-action/10"
                  : "border-gray-200 text-gray-300 cursor-not-allowed"
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => slideTo(index + 1)}
              disabled={!canNext}
              aria-label="Следващи"
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                canNext
                  ? "border-brand-action text-brand-action hover:bg-brand-action/10"
                  : "border-gray-200 text-gray-300 cursor-not-allowed"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="h-0.5 w-full mb-5" style={{ background: "linear-gradient(to right, #98ab3f 60px, #e5e7eb 60px)" }} />

      {/* Desktop: windowed slider */}
      <div className="hidden sm:block overflow-hidden">
        <div
          ref={trackRef}
          className="flex gap-4 transition-transform duration-300 ease-in-out"
          style={{ willChange: "transform" }}
        >
          {products.map((product, i) => (
            <div key={product.id} className="w-[calc(25%-12px)] shrink-0 self-stretch">
              <ProductCard product={product} index={i} view="grid" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: native scroll */}
      <div className="sm:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none">
        {products.map((product, i) => (
          <div key={product.id} className="w-[calc(50%-6px)] shrink-0 snap-start">
            <ProductCard product={product} index={i} view="grid" />
          </div>
        ))}
      </div>
    </div>
  );
}
