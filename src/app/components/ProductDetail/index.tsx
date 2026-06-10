"use client";

import Link from "next/link";
import { useLayoutEffect, useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Loader2,
  Check,
  Truck,
  Package,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { magentoImageUrl } from "@/src/app/utils/image";
import { calcUnitPrice } from "@/src/app/utils/unitPrice";
import { fixBrandLinks } from "@/src/app/utils/fixBrandLinks";
import MagentoImage from "@/src/app/components/MagentoImage";
import { useBreadcrumb } from "@/src/app/contexts/BreadcrumbContext";
import { useCart } from "@/src/app/contexts/CartContext";
import ProductSlider from "@/src/app/components/ProductSlider";
import type { ResolvedAttribute } from "@/src/app/utils/productAttributes";
import {
  prefetchProductLinks,
  _linksCache,
  type ProductLinksState,
} from "./prefetchLinks";
import { trackViewItem, trackAddToCart } from "@/src/app/utils/analytics";

// Re-export so existing ProductCard imports keep working
export { prefetchProductLinks };

interface ConfigurableOptionValue {
  label: string;
  value_index: number;
}

interface ConfigurableOption {
  attribute_code: string;
  label: string;
  values: ConfigurableOptionValue[];
}

interface VariantProduct {
  id: string;
  sku: string;
  stock_status: string;
  special_from_date?: string | null;
  special_to_date?: string | null;
  small_image?: { url: string; label: string } | null;
  price_range: {
    minimum_price: {
      final_price: { value: number; currency: string };
      regular_price?: { value: number; currency: string };
      discount?: { percent_off: number; amount_off: number } | null;
    };
  };
}

interface Variant {
  attributes: { code: string; value_index: number }[];
  product: VariantProduct;
}

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    sku: string;
    description: { html: string };
    short_description: { html: string };
    price_range: {
      minimum_price: {
        final_price: { value: number; currency: string };
        regular_price: { value: number; currency: string };
      };
    };
    image: { url: string; label: string };
    media_gallery: Array<{ url: string; label: string; position: number }>;
    categories: Array<{ id: number; name: string; url_path: string }>;
    url_key: string;
    type_id: string;
    stock_status: string;
    special_price?: number | null;
    special_from_date?: string | null;
    special_to_date?: string | null;
    configurable_options?: ConfigurableOption[];
    variants?: Variant[];
  };
  resolvedAttributes?: ResolvedAttribute[];
  brandName?: string;
  brandUrl?: string;
  brandUrlMap?: Record<string, string>;
}

type AddStatus = "idle" | "loading" | "success" | "error";

function parseDescriptionSections(html: string): { title: string; html: string }[] {
  const normalized = html
    .replace(/<h[12](\b[^>]*)>/gi, "<h3$1>")
    .replace(/<\/h[12]>/gi, "</h3>");
  const parts = normalized.split(/(?=<h3[\s>])/i);
  const sections: { title: string; html: string }[] = [];
  for (const part of parts) {
    const match = part.match(/^<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (match) {
      const title = match[1].replace(/<[^>]+>/g, "").trim();
      sections.push({ title, html: part.slice(match[0].length).trim() });
    } else if (part.trim()) {
      sections.push({ title: "__intro__", html: part.trim() });
    }
  }
  return sections;
}

export default function ProductDetail({ product, resolvedAttributes = [], brandName, brandUrl, brandUrlMap = {} }: ProductDetailProps) {
  const { setLastCrumbLabel } = useBreadcrumb();
  const { addToCart } = useCart();

  const [productLinks, setProductLinks] = useState<ProductLinksState>(() => _linksCache[product.url_key] ?? { upsell: [], crosssell: [], related: [] });
  const [linksLoading, setLinksLoading] = useState(!_linksCache[product.url_key]);

  useEffect(() => {
    if (_linksCache[product.url_key]) {
      setProductLinks(_linksCache[product.url_key]);
      setLinksLoading(false);
      return;
    }
    setLinksLoading(true);
    prefetchProductLinks(product.url_key)
      .then((data) => setProductLinks(data))
      .finally(() => setLinksLoading(false));
  }, [product.url_key]);


  const visibleSliders = useMemo(() => {
    if (linksLoading) return [];
    const all = [
      { title: "Честo купувани заедно", products: productLinks.crosssell },
      { title: "Може да ви хареса също", products: productLinks.upsell },
      { title: "Подобни продукти", products: productLinks.related },
    ];
    const nonEmpty = all.filter((s) => s.products.length > 0);
    if (nonEmpty.length <= 2) return nonEmpty;
    const i = Math.floor(Math.random() * nonEmpty.length);
    const j = (i + 1 + Math.floor(Math.random() * (nonEmpty.length - 1))) % nonEmpty.length;
    return [nonEmpty[i], nonEmpty[j]];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linksLoading, productLinks]);

  const [imageIndex, setImageIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOpen, imageIndex]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [addStatus, setAddStatus] = useState<AddStatus>("idle");
  const [activeTab, setActiveTab] = useState<"description" | "short">("description");
  
  // Fix brand links in descriptions
  const fixedDescription = useMemo(
    () => product.description?.html ? fixBrandLinks(product.description.html, brandUrlMap) : '',
    [product.description?.html, brandUrlMap]
  );
  
  const fixedShortDescription = useMemo(
    () => product.short_description?.html ? fixBrandLinks(product.short_description.html, brandUrlMap) : '',
    [product.short_description?.html, brandUrlMap]
  );
  
  const descSections = useMemo(
    () => (fixedDescription ? parseDescriptionSections(fixedDescription) : []),
    [fixedDescription]
  );
  
  const [descSection, setDescSection] = useState(0);
  const [cartBtnVisible, setCartBtnVisible] = useState(true);
  const cartBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = cartBtnRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCartBtnVisible(true);
        } else {
          // Only show bar when button has scrolled ABOVE viewport, not when it's below (not yet reached)
          setCartBtnVisible(entry.boundingClientRect.top > 0);
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    trackViewItem({ sku: product.sku, name: product.name, price: product.price_range.minimum_price.final_price.value, currency: product.price_range.minimum_price.final_price.currency });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.sku]);

  useLayoutEffect(() => {
    setLastCrumbLabel(product.sku);
    return () => setLastCrumbLabel(null);
  }, [product.sku, setLastCrumbLabel]);

  const isConfigurable = product.type_id === "configurable";


  const sortedGallery = [...(product.media_gallery ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const baseImages =
    sortedGallery.length > 0
      ? sortedGallery
      : [{ url: product.image.url, label: product.image.label, position: 0 }];

  const selectedVariant = useCallback((): Variant | null => {
    if (!isConfigurable || !product.variants || !product.configurable_options)
      return null;
    const codes = product.configurable_options.map((o) => o.attribute_code);
    if (codes.some((code) => selectedOptions[code] === undefined)) return null;
    return (
      product.variants.find((v) =>
        codes.every((code) =>
          v.attributes.some(
            (a) => a.code === code && a.value_index === selectedOptions[code],
          ),
        ),
      ) ?? null
    );
  }, [isConfigurable, product.variants, product.configurable_options, selectedOptions]);

  const variant = selectedVariant();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setImageIndex(0); }, [variant?.product.id]);

  const variantImage = variant?.product.small_image;
  const images = variantImage
    ? [{ url: variantImage.url, label: variantImage.label, position: -1 }, ...baseImages]
    : baseImages;

  const displayPriceRange = variant?.product.price_range ?? product.price_range;
  const finalPrice = displayPriceRange.minimum_price.final_price;
  const regularPrice = displayPriceRange.minimum_price.regular_price;
  const hasDiscount = regularPrice && finalPrice.value < regularPrice.value;
  const discountPct =
    hasDiscount && regularPrice
      ? Math.round(100 - (finalPrice.value / regularPrice.value) * 100)
      : 0;

  const stockStatus = variant?.product.stock_status ?? product.stock_status;
  const isInStock = stockStatus === "IN_STOCK";

  const isValueAvailable = (attributeCode: string, valueIndex: number): boolean => {
    if (!product.variants) return true;
    const others = Object.entries(selectedOptions).filter(
      ([code]) => code !== attributeCode,
    );
    return product.variants.some((v) => {
      const matchThis = v.attributes.some(
        (a) => a.code === attributeCode && a.value_index === valueIndex,
      );
      const matchOthers = others.every(([code, idx]) =>
        v.attributes.some((a) => a.code === code && a.value_index === Number(idx)),
      );
      return matchThis && matchOthers && v.product.stock_status !== "OUT_OF_STOCK";
    });
  };

  const getVariantImage = (attributeCode: string, valueIndex: number) =>
    product.variants?.find((v) =>
      v.attributes.some(
        (a) => a.code === attributeCode && a.value_index === valueIndex,
      ),
    )?.product.small_image;

  const allSelected =
    !isConfigurable ||
    (product.configurable_options?.every(
      (o) => selectedOptions[o.attribute_code] !== undefined,
    ) ??
      true);

  const handleAddToCart = async () => {
    if (addStatus === "loading") return;
    if (isConfigurable && !variant) {
      toast.error("Моля, изберете вариант");
      return;
    }
    const sku = isConfigurable ? variant!.product.sku : product.sku;
    setAddStatus("loading");
    try {
      await addToCart(sku, quantity);
      setAddStatus("success");
      toast.success("Продуктът е добавен в количката", {
        description: product.name,
      });
      trackAddToCart({ sku, name: product.name, price: finalPrice.value, currency: finalPrice.currency, quantity });
      setTimeout(() => setAddStatus("idle"), 2000);
    } catch {
      setAddStatus("error");
      toast.error("Неуспешно добавяне в количката");
      setTimeout(() => setAddStatus("idle"), 2000);
    }
  };

  const prevImage = () =>
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setImageIndex((i) => (i + 1) % images.length);

  const perks = [
    { icon: <Truck size={15} />, title: "Бърза доставка", desc: "48 часа · Еконт / Speedy", href: "/dostavka" },
    { icon: <Package size={15} />, title: "Сигурно плащане", desc: "Карта или наложен платеж", href: "/nachini-za-plaschane" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 lg:py-8">
      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ── Gallery ── */}
        <div className="lg:sticky lg:top-24 lg:bottom-25 lg:h-fit flex gap-3 max-w-md mx-auto w-full lg:max-w-none">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="hidden sm:flex flex-col gap-2 w-17 shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImageIndex(i)}
                  className={`w-17 h-17 rounded-xl border-2 overflow-hidden bg-white transition-all duration-150 ${
                    i === imageIndex
                      ? "border-brand-action shadow-sm"
                      : "border-gray-200 hover:border-brand-action/60"
                  }`}
                >
                  <MagentoImage
                    src={magentoImageUrl(img.url)}
                    alt={img.label || product.name}
                    width={68}
                    height={68}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    className="p-1.5"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main stage */}
          <div className="flex-1 relative bg-white rounded-2xl border border-gray-200 overflow-hidden h-72 sm:h-96 lg:h-115">
            <button
              onClick={() => setZoomOpen(true)}
              className="absolute inset-0 w-full h-full cursor-zoom-in z-10 group flex items-center justify-center"
              aria-label="Увеличи снимката"
            >
              <div className="opacity-0 group-hover:opacity-60 transition-opacity duration-200 bg-white/80 rounded-full p-4">
                <ZoomIn size={32} className="text-gray-600" />
              </div>
            </button>
            <MagentoImage
              src={magentoImageUrl(images[imageIndex]?.url ?? product.image.url)}
              alt={images[imageIndex]?.label || product.name}
              fill
              style={{ objectFit: "contain" }}
              className="p-6 sm:p-10"
              priority
              fetchPriority="high"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  aria-label="Предишна снимка"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 border border-brand-action text-brand-action flex items-center justify-center shadow-sm hover:bg-brand-action/10 hover:shadow transition-all"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={nextImage}
                  aria-label="Следваща снимка"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 border border-brand-action text-brand-action flex items-center justify-center shadow-sm hover:bg-brand-action/10 hover:shadow transition-all"
                >
                  <ChevronRight size={15} />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIndex(i)}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === imageIndex ? 24 : 8,
                        height: 8,
                        background: i === imageIndex ? "#98ab3f" : "#d1d5db",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Info panel ── */}
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-bold leading-snug tracking-tight text-gray-900 mb-2">
            {product.name}
          </h1>

          {brandName && brandUrl && (
            <div className="mb-3">
              <Link 
                href={`/${brandUrl}`}
                className="inline-flex items-center gap-1.5 text-sm text-brand-action hover:text-brand-nav font-medium transition-colors"
              >
                <span>Марка:</span>
                <span className="underline">{brandName}</span>
              </Link>
            </div>
          )}

          {fixedShortDescription && (
            <div
              className="text-gray-500 text-xs leading-relaxed mb-6 [&>p]:mb-0.5"
              dangerouslySetInnerHTML={{ __html: fixedShortDescription }}
            />
          )}

          {/* Price + Quantity row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            {/* Left: stock + price */}
            <div>
              <span
                className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                  isInStock ? "text-emerald-600" : "text-red-500"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isInStock ? "bg-emerald-500" : "bg-red-400"}`} />
                {isInStock ? "В наличност" : "Изчерпано"}
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xl font-bold text-gray-900">
                  {finalPrice.value.toFixed(2)}&nbsp;{finalPrice.currency}
                </span>
                {isConfigurable && variant && product.configurable_options && (() => {
                  const up = calcUnitPrice(selectedOptions, product.configurable_options, finalPrice.value, finalPrice.currency);
                  return up ? (
                    <span className="text-sm text-gray-400">
                      ({up.formatted} {finalPrice.currency} / {up.unit})
                    </span>
                  ) : null;
                })()}
                {hasDiscount && regularPrice && (
                  <>
                    <span className="text-xs text-gray-400 line-through">
                      {regularPrice.value.toFixed(2)}&nbsp;{regularPrice.currency}
                    </span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-brand-action text-white">
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: quantity */}
            <div className="shrink-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Количество
              </p>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border-2 border-brand-action rounded-full bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Намали количество"
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-brand-action/10 ${
                      quantity <= 1 ? "text-brand-action opacity-30 cursor-not-allowed" : "text-brand-action cursor-pointer"
                    }`}
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900 select-none">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    disabled={quantity >= 10}
                    aria-label="Увеличи количество"
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-brand-action/10 ${
                      quantity >= 10 ? "text-brand-action opacity-30 cursor-not-allowed" : "text-brand-action cursor-pointer"
                    }`}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Configurable options ── */}
          {isConfigurable &&
            product.configurable_options?.map((option) => (
              <div key={option.attribute_code} className="mb-3 pb-3 border-b border-gray-100">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  {option.label}
                  {selectedOptions[option.attribute_code] !== undefined && (
                    <span className="normal-case font-normal text-gray-700 ml-1.5">
                      — {option.values.find((v) => v.value_index === selectedOptions[option.attribute_code])?.label}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {option.values
                    .filter((val) => isValueAvailable(option.attribute_code, val.value_index))
                    .map((val) => {
                      const isSelected = selectedOptions[option.attribute_code] === val.value_index;
                      const vImg = getVariantImage(option.attribute_code, val.value_index);
                      return vImg ? (
                        <button
                          key={val.value_index}
                          title={val.label}
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.attribute_code]: val.value_index }))}
                          className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all duration-150 ${
                            isSelected
                              ? "border-brand-action shadow-md scale-105"
                              : "border-gray-200 hover:border-brand-action/60 hover:shadow-sm"
                          }`}
                        >
                          <MagentoImage
                            src={magentoImageUrl(vImg.url)}
                            alt={vImg.label || val.label}
                            width={64} height={64}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            className="p-1"
                          />
                        </button>
                      ) : (
                        <button
                          key={val.value_index}
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.attribute_code]: val.value_index }))}
                          className={`px-3 py-2 rounded-lg border-2 text-sm transition-all duration-150 ${
                            isSelected
                              ? "border-brand-action bg-brand-action/5 text-brand-nav font-semibold shadow-md"
                              : "border-gray-200 text-gray-700 hover:border-brand-action/60 hover:shadow-sm"
                          }`}
                        >
                          {val.label}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}

          {allSelected && !isInStock && (
            <p className="text-sm text-red-500 font-medium mb-3">Избраният вариант е изчерпан</p>
          )}

          {/* ── Add to cart ── */}
          {(() => {
            return (
              <div className="flex gap-2">
                <button
                  ref={cartBtnRef}
                  onClick={handleAddToCart}
                  disabled={!isInStock || addStatus === "loading" || (isConfigurable && !allSelected)}
                  className={`flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                    !isInStock || (isConfigurable && !allSelected)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : addStatus === "success"
                        ? "bg-emerald-500 text-white"
                        : addStatus === "error"
                          ? "bg-red-500 text-white"
                          : "bg-brand-action text-white hover:bg-brand-nav active:scale-[0.98] shadow-md shadow-brand-action/25"
                  }`}
                >
                  {addStatus === "loading" && <Loader2 size={16} className="animate-spin" />}
                  {addStatus === "success" && <Check size={16} />}
                  {addStatus === "loading"
                    ? "Добавяне..."
                    : addStatus === "success"
                      ? "Добавено!"
                      : addStatus === "error"
                        ? "Грешка, опитай пак"
                        : isConfigurable && !allSelected
                          ? "Избери вариант"
                          : !isInStock
                            ? "Изчерпано"
                            : <>Добави в количката <span className="font-light opacity-70 text-sm">–</span> {(finalPrice.value * quantity).toFixed(2)} {finalPrice.currency}</>}
                </button>
              </div>
            );
          })()}

          {/* ── Perks ── */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {perks.map((p) => (
              <Link key={p.title} href={p.href} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 hover:border-brand-action/40 hover:bg-brand-action/5 transition-colors">
                <span className="text-brand-action shrink-0 mt-0.5">{p.icon}</span>
                <div>
                  <p className="text-[11px] font-semibold text-gray-700 leading-snug">{p.title}</p>
                  <p className="text-[10px] text-gray-400 leading-snug">{p.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      {(product.description?.html || resolvedAttributes.length > 0) && (
        <div className="mt-16">
          {/* Tab bar */}
          <div className="flex gap-6 border-b border-gray-200 justify-center">
            {product.description?.html && (
              <button
                onClick={() => setActiveTab("description")}
                className={`pb-3 text-base font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                  activeTab === "description"
                    ? "border-brand-action text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Детайли
              </button>
            )}
            {resolvedAttributes.length > 0 && (
              <button
                onClick={() => setActiveTab("short")}
                className={`pb-3 text-base font-semibold border-b-2 -mb-px transition-colors cursor-pointer ${
                  activeTab === "short"
                    ? "border-brand-action text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Повече информация
              </button>
            )}
          </div>

          {/* Tab content */}
          <div className="pt-8">
            {activeTab === "description" && descSections.length > 0 && (
              <div>
                {/* Section sub-tabs (skip __intro__ entries) */}
                {descSections.filter((s) => s.title !== "__intro__").length > 1 && (
                  <div className="flex overflow-x-auto scrollbar-none border-b border-gray-200 mb-6 gap-0 -ml-3">
                    {descSections.map((s, i) =>
                      s.title === "__intro__" ? null : (
                        <button
                          key={i}
                          onClick={() => setDescSection(i)}
                          className={`shrink-0 px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap ${
                            descSection === i
                              ? "border-brand-action text-gray-900"
                              : "border-transparent text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {s.title}
                        </button>
                      )
                    )}
                  </div>
                )}
                {/* Show intro (content before first h3) always */}
                {descSections[0]?.title === "__intro__" && (
                  <div
                    className="prose-desc mb-6"
                    dangerouslySetInnerHTML={{ __html: descSections[0].html }}
                  />
                )}
                {/* Active section content */}
                {descSections[descSection] && descSections[descSection].title !== "__intro__" && (
                  <div
                    className="prose-desc"
                    dangerouslySetInnerHTML={{ __html: descSections[descSection].html }}
                  />
                )}
                {/* Fallback: single section with no h3 */}
                {descSections.length === 1 && descSections[0].title === "__intro__" && null}
              </div>
            )}
            {activeTab === "short" && resolvedAttributes.length > 0 && (
              <div className="divide-y divide-gray-100">
                {resolvedAttributes.map((attr) => (
                  <div key={attr.code} className="flex gap-4 py-3">
                    <span className="w-2/5 shrink-0 text-sm font-semibold text-gray-700">{attr.label}</span>
                    <span className="text-sm text-gray-500">{attr.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Related sliders — 2 of 3 chosen randomly ── */}
      {linksLoading ? (
        <>
          <ProductSlider title="Честo купувани заедно" products={[]} loading={true} />
          <ProductSlider title="Може да ви хареса също" products={[]} loading={true} />
        </>
      ) : (
        visibleSliders.map((s) => (
          <ProductSlider key={s.title} title={s.title} products={s.products} loading={false} />
        ))
      )}

      {/* ── Sticky bottom bar ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-60 lg:z-50 transition-transform duration-300 ${
          cartBtnVisible ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
            {/* Thumbnail — desktop only */}
            {product.image?.url && (
              <div className="w-14 h-14 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-white hidden lg:block">
                <MagentoImage
                  src={magentoImageUrl(product.image.url)}
                  alt={product.name}
                  width={56}
                  height={56}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  className="p-1.5"
                />
              </div>
            )}
            {/* Name + price — desktop only */}
            <div className="flex-1 min-w-0 hidden lg:block">
              <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
              <p className="text-base text-brand-action font-bold">
                {(finalPrice.value * quantity).toFixed(2)}&nbsp;{finalPrice.currency}
              </p>
            </div>
            {/* Quantity stepper — desktop only */}
            <div className="hidden lg:inline-flex items-center border-2 border-brand-action rounded-full bg-white shrink-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-brand-action/10 ${quantity <= 1 ? "text-brand-action opacity-30 cursor-not-allowed" : "text-brand-action cursor-pointer"}`}
              >
                <Minus size={13} />
              </button>
              <span className="w-7 text-center text-sm font-bold text-gray-900 select-none">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                disabled={quantity >= 10}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-brand-action/10 ${quantity >= 10 ? "text-brand-action opacity-30 cursor-not-allowed" : "text-brand-action cursor-pointer"}`}
              >
                <Plus size={13} />
              </button>
            </div>
            {/* Add to cart — full width on mobile, shrink-0 on desktop */}
            <button
              onClick={handleAddToCart}
              disabled={!isInStock || addStatus === "loading" || (isConfigurable && !allSelected)}
              className={`h-12 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer w-full lg:w-52 lg:shrink-0 ${
                !isInStock || (isConfigurable && !allSelected)
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : addStatus === "success"
                    ? "bg-emerald-500 text-white"
                    : addStatus === "error"
                      ? "bg-red-500 text-white"
                      : "bg-brand-action text-white hover:bg-brand-nav shadow-md shadow-brand-action/25"
              }`}
            >
              {addStatus === "loading" && <Loader2 size={15} className="animate-spin" />}
              {addStatus === "success" && <Check size={15} />}
              {addStatus === "loading"
                ? "Добавяне..."
                : addStatus === "success"
                  ? "Добавено!"
                  : addStatus === "error"
                    ? "Грешка"
                    : isConfigurable && !allSelected
                      ? "Избери вариант"
                      : !isInStock
                        ? "Изчерпано"
                        : "Добави в количката"}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setZoomOpen(false)}
        >
          <button
            onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 z-20 w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center text-white transition-colors"
            aria-label="Затвори"
          >
            <X size={24} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center text-white transition-colors shadow-lg"
                aria-label="Предишна снимка"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center text-white transition-colors shadow-lg"
                aria-label="Следваща снимка"
              >
                <ChevronRight size={26} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                {imageIndex + 1} / {images.length}
              </div>
            </>
          )}

          <div
            className="relative w-full h-full max-w-4xl max-h-[90vh] mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <MagentoImage
              src={magentoImageUrl(images[imageIndex]?.url ?? product.image.url)}
              alt={images[imageIndex]?.label || product.name}
              fill
              style={{ objectFit: "contain" }}
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </div>
  );
}
