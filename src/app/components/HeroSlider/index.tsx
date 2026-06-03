"use client";

import {
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
  useRef,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const SLIDES = [
  {
    src: "/assets/OmekotitelHeroBanners/1.webp",
    mobileSrc: "/assets/OmekotitelHeroBanners/1m.webp",
    alt: "Омекотител — слайд 1",
    title: "Аромат, който остава",
    subtitle: "Парфюми, есенции и перли за свежо пране",
    button: { label: "Разгледай", href: "/prane-vsichko-neobhodimo/parfjumi-esencii-i-busteri-za-prane" },
  },
  {
    src: "/assets/OmekotitelHeroBanners/2.webp",
    mobileSrc: "/assets/OmekotitelHeroBanners/2m.webp",
    alt: "Омекотител — слайд 2",
    title: "Новото усещане след сушене",
    subtitle: "Парфюми, листчета и аксесоари за сушилня",
    button: { label: "Разгледай", href: "/cjalostna-grizha-za-drehi/produkti-za-sushilnja" },
  },
  {
    src: "/assets/OmekotitelHeroBanners/3.webp",
    mobileSrc: "/assets/OmekotitelHeroBanners/3m.webp",
    alt: "Омекотител — слайд 3",
    title: "Домът блести във всеки детайл",
    subtitle: "Стъкла, прах, метали, камък и ароматизирана грижа",
    button: { label: "Разгледай", href: "/grizha-za-doma/podove-povarhnosti" },
  },
  {
    src: "/assets/OmekotitelHeroBanners/4.webp",
    mobileSrc: "/assets/OmekotitelHeroBanners/4m.webp",
    alt: "Омекотител — слайд 4",
    title: "Правилната грижа за всеки под",
    subtitle: "Препарати за паркет, плочки, мрамор, гранит и др",
    button: { label: "Разгледай", href: "/grizha-za-doma/podove-povarhnosti/parket-podove-kilimi-tapicerii" },
  },
  {
    src: "/assets/OmekotitelHeroBanners/5.webp",
    mobileSrc: "/assets/OmekotitelHeroBanners/5m.webp",
    alt: "Омекотител — слайд 5",
    title: "Решение за всяко петно",
    subtitle: "Препарати за дрехи, текстил, килими и тапицерии",
    button: { label: "Разгледай", href: "/prane-vsichko-neobhodimo/preparati-za-prane" },
  },
];

const INTERVAL = 5000;
const FADE_MS = 700;
const SWIPE_THRESHOLD = 50;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const touchStartX = useRef(0);

  const next = useCallback(
    () => setCurrent((i) => (i + 1) % SLIDES.length),
    [],
  );
  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [paused, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > SWIPE_THRESHOLD) prev();
    else if (delta < -SWIPE_THRESHOLD) next();
  };

  const slidesToRender = mounted ? SLIDES : SLIDES.slice(0, 1);

  return (
    <div
      className="relative w-full overflow-hidden h-96 md:h-[500px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slidesToRender.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0"
          style={{
            opacity: i === current ? 1 : 0,
            zIndex: i === current ? 10 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
          }}
          aria-hidden={i !== current}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-contain md:object-contain hidden md:block"
            sizes="100vw"
            priority={i === 0}
            loading={i === 0 ? "eager" : "lazy"}
          />
          <Image
            src={slide.mobileSrc}
            alt={slide.alt}
            fill
            className="object-cover md:hidden"
            sizes="100vw"
            fetchPriority="high"
            loading={i === 0 ? "eager" : "lazy"}
            priority={i === 0}
          />

          <div className="absolute inset-0 flex items-start md:items-center pointer-events-none justify-center md:justify-start md:pl-32 pt-2 md:pt-0">
            <div className="flex flex-col items-center md:items-start gap-1 md:gap-4">
              {/* Text box with transparent background */}
              <div className="w-[95%] md:max-w-sm px-3 md:px-8 py-3 md:py-6 bg-transparent backdrop-blur-[2px] rounded-xl md:rounded-3xl shadow-2xl flex flex-col items-center md:items-start text-center md:text-left">
                <h2 className="text-base md:text-3xl font-bold text-gray-900 leading-tight md:leading-snug">
                  {slide.title}
                </h2>
                <div className="hidden md:block w-12 h-1 bg-gradient-to-r from-brand-nav to-brand-action rounded-full my-4" />
                <p className="text-xs md:text-base text-gray-700 leading-tight md:leading-relaxed mt-0.5 md:mt-0 font-medium">
                  {(() => {
                    const words = slide.subtitle.split(" ");
                    return <><strong>{words.slice(0, 3).join(" ")}</strong>{" "}{words.slice(3).join(" ")}</>;
                  })()}
                </p>
              </div>
              {/* Button without background */}
              <Link
                href={slide.button.href}
                className="pointer-events-auto inline-flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-4 md:px-9 py-2 md:py-4 rounded-lg md:rounded-xl shadow-lg shadow-red-500/40 hover:shadow-xl hover:shadow-red-500/50 transition-all duration-300 text-xs md:text-base hover:-translate-y-0.5"
              >
                {slide.button.label}
                <ArrowRight size={14} className="md:w-5 md:h-5" />
              </Link>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={prev}
        aria-label="Предишен слайд"
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-brand-action bg-white shadow items-center justify-center text-brand-action hover:bg-brand-action/10 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        aria-label="Следващ слайд"
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-brand-action bg-white shadow items-center justify-center text-brand-action hover:bg-brand-action/10 transition-colors"
      >
        <ChevronRight size={18} />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrent(i);
              setPaused(true);
              setTimeout(() => setPaused(false), 8000);
            }}
            aria-label={`Слайд ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2 bg-brand-nav"
                : "w-2 h-2 bg-brand-nav/40 hover:bg-brand-nav/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
