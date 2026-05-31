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
    src: "/assets/hero/1.webp",
    mobileSrc: "/assets/hero/1m.webp",
    alt: "Омекотител — слайд 1",
    title: "Парфюми, Есенции и Перли за Пране",
    subtitle: "Ароматизирайте пранeто си с широката гама буустери за пране",
    button: { label: "Разгледай", href: "/prane-vsichko-neobhodimo" },
  },
  {
    src: "/assets/hero/2.webp",
    mobileSrc: "/assets/hero/2m.webp",
    alt: "Омекотител — слайд 2",
    title: "Хипоалергенни продукти за мама и бебе",
    subtitle: "Нежна грижа и чистота за най-чувствителната кожа.",
    button: { label: "Разгледай", href: "/" },
  },
  {
    src: "/assets/hero/3.webp",
    mobileSrc: "/assets/hero/3m.webp",
    alt: "Омекотител — слайд 3",
    title: "Есенции за прахоулавяне с антистатик",
    subtitle:
      "които забавят натрупването на прах и поддържат повърхностите чисти по-дълго.",
    button: { label: "Разгледай", href: "/" },
  },
  {
    src: "/assets/hero/4.webp",
    mobileSrc: "/assets/hero/4m.webp",
    alt: "Омекотител — слайд 4",
    title: "Заглавие слайд 4",
    subtitle: "Описание на продукта или промоцията за слайд 4.",
    button: { label: "Разгледай", href: "/" },
  },
  {
    src: "/assets/hero/5.webp",
    mobileSrc: "/assets/hero/5m.webp",
    alt: "Омекотител — слайд 5",
    title: "Заглавие слайд 5",
    subtitle: "Описание на продукта или промоцията за слайд 5.",
    button: { label: "Разгледай", href: "/" },
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
            className="object-fill md:object-fill hidden md:block"
            sizes="100vw"
            fetchPriority="high"
            loading={i === 0 ? "eager" : "lazy"}
            priority={i === 0}
          />
          <Image
            src={slide.mobileSrc}
            alt={slide.alt}
            fill
            className="object-cover md:hidden"
            sizes="100vw"
            loading={i === 0 ? "eager" : "lazy"}
          />

          <div className="absolute inset-0 flex items-start md:items-center pointer-events-none justify-center md:justify-start md:pl-16 pt-5 md:pt-0">
            <div className="w-[72%] md:max-w-sm px-4 md:px-8 py-3 md:py-7 bg-white/85 backdrop-blur-sm rounded-lg md:rounded-2xl shadow-md flex flex-col items-center md:items-start text-center md:text-left">
              <h2 className="text-base md:text-3xl font-bold text-brand-nav leading-snug">
                {slide.title}
              </h2>
              <div className="hidden md:block w-10 h-0.5 bg-brand-nav my-3" />
              <p className="hidden md:block text-base text-gray-700 leading-snug">
                {slide.subtitle}
              </p>
              <Link
                href={slide.button.href}
                className="pointer-events-auto inline-flex mt-3 md:mt-4 items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold px-5 md:px-8 py-2.5 md:py-3.5 rounded-xl shadow-md shadow-red-500/30 transition-colors duration-200 text-sm md:text-base"
              >
                {slide.button.label}
                <ArrowRight size={15} />
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
