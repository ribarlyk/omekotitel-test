"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Loader2, ExternalLink, ChevronDown } from "lucide-react";
import MagentoImage from "@/src/app/components/MagentoImage";
import { magentoImageUrl } from "@/src/app/utils/image";
import { useCart } from "@/src/app/contexts/CartContext";
import { toast } from "sonner";
import type { ProductCardProduct } from "@/src/app/components/ProductCard";

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

interface ExtraData {
  media_gallery: { url: string; label: string; position: number }[];
  configurable_options: ConfigurableOption[];
  variants: Variant[];
  special_from_date?: string | null;
  special_to_date?: string | null;
}

interface Props {
  urlKey: string;
  initialProduct: ProductCardProduct;
  onClose: () => void;
}

type AddStatus = "idle" | "loading" | "success" | "error";

interface CustomSelectProps {
  attributeCode: string;
  label: string;
  values: ConfigurableOptionValue[];
  selected: number | undefined;
  isValueAvailable: (code: string, idx: number) => boolean;
  onSelect: (valueIndex: number) => void;
}

function CustomSelect({ attributeCode, label, values, selected, isValueAvailable, onSelect }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(values.length * 44, 280);
      const spaceBelow = window.innerHeight - rect.bottom;
      const goUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        ...(goUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }
    setOpen((o) => !o);
  };

  const selectedLabel = values.find((v) => v.value_index === selected)?.label;

  const menu = open && (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-y-auto max-h-70"
    >
      {values.map((val) => {
        const available = isValueAvailable(attributeCode, val.value_index);
        const isSelected = selected === val.value_index;
        return (
          <button
            key={val.value_index}
            type="button"
            disabled={!available}
            onClick={() => { onSelect(val.value_index); setOpen(false); }}
            className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition-colors
              ${isSelected ? "bg-brand-action/10 text-brand-action font-semibold" : available ? "text-gray-700 hover:bg-gray-50" : "text-gray-300 cursor-not-allowed"}`}
          >
            <span>{val.label}</span>
            {!available && <span className="text-xs ml-2">изчерпано</span>}
            {isSelected && (
              <svg className="w-4 h-4 shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div data-custom-select className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-action/40 focus:border-brand-action transition-colors"
      >
        <span className={selectedLabel ? "text-gray-700" : "text-gray-400"}>
          {selectedLabel ?? `Изберете ${label.toLowerCase()}...`}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {typeof document !== "undefined" && createPortal(menu, document.body)}
    </div>
  );
}

export default function ConfigurableProductModal({ urlKey, initialProduct, onClose }: Props) {
  const { addToCart } = useCart();
  const [extra, setExtra] = useState<ExtraData | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [addStatus, setAddStatus] = useState<AddStatus>("idle");

  useEffect(() => {
    fetch(`/api/product?urlKey=${encodeURIComponent(urlKey)}`)
      .then((r) => r.json())
      .then((data) => {
        const p = data.product as ExtraData & { media_gallery?: ExtraData["media_gallery"] };
        setExtra({
          media_gallery: p.media_gallery ?? [],
          configurable_options: (p as ExtraData).configurable_options ?? [],
          variants: (p as ExtraData).variants ?? [],
          special_from_date: (p as ExtraData).special_from_date,
          special_to_date: (p as ExtraData).special_to_date,
        });
      })
      .catch(() => toast.error("Грешка при зареждане на варианти"))
      .finally(() => setLoadingExtra(false));
  }, [urlKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, imageIndex, extra]);

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const selectedVariant = useCallback((): Variant | null => {
    if (!extra?.variants || !extra.configurable_options) return null;
    const codes = extra.configurable_options.map((o) => o.attribute_code);
    if (codes.some((code) => selectedOptions[code] === undefined)) return null;
    return extra.variants.find((v) =>
      codes.every((code) =>
        v.attributes.some((a) => a.code === code && a.value_index === selectedOptions[code])
      )
    ) ?? null;
  }, [extra, selectedOptions]);

  const variant = selectedVariant();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setImageIndex(0); }, [variant?.product.id]);

  const variantImage = variant?.product.small_image;
  const baseImages = extra?.media_gallery?.length
    ? [...extra.media_gallery].sort((a, b) => a.position - b.position)
    : initialProduct.small_image
    ? [{ url: initialProduct.small_image.url, label: initialProduct.small_image.label, position: 0 }]
    : [];
  const images = variantImage
    ? [{ url: variantImage.url, label: variantImage.label, position: 0 }, ...baseImages]
    : baseImages;

  const prevImage = () => setImageIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setImageIndex((i) => (i + 1) % images.length);

  const isOutOfStock = variant?.product.stock_status === "OUT_OF_STOCK";
  const allSelected = extra?.configurable_options?.every(
    (o) => selectedOptions[o.attribute_code] !== undefined
  ) ?? false;

  const displayPrice = variant?.product.price_range ?? initialProduct.price_range ?? null;
  const finalPrice = displayPrice?.minimum_price.final_price;
  const regularPrice = displayPrice?.minimum_price.regular_price;
  const variantDiscount = variant?.product.price_range?.minimum_price.discount;
  const variantOnSale = (() => {
    if (!variantDiscount || variantDiscount.percent_off <= 0) return false;
    const now = new Date();
    const vp = variant?.product;
    if (vp?.special_from_date && new Date(vp.special_from_date) > now) return false;
    if (vp?.special_to_date && new Date(vp.special_to_date) < now) return false;
    return true;
  })();
  const variantDiscountPct = variantOnSale ? Math.round(variantDiscount!.percent_off) : 0;

  const getVariantForValue = (attributeCode: string, valueIndex: number): Variant | undefined =>
    extra?.variants.find((v) =>
      v.attributes.some((a) => a.code === attributeCode && a.value_index === valueIndex)
    );

  const isValueAvailable = (attributeCode: string, valueIndex: number): boolean => {
    if (!extra?.variants) return true;
    const others = Object.entries(selectedOptions).filter(([code]) => code !== attributeCode);
    return extra.variants.some((v) => {
      const matchThis = v.attributes.some((a) => a.code === attributeCode && a.value_index === valueIndex);
      const matchOthers = others.every(([code, idx]) =>
        v.attributes.some((a) => a.code === code && a.value_index === idx)
      );
      return matchThis && matchOthers && v.product.stock_status !== "OUT_OF_STOCK";
    });
  };

  const handleAddToCart = async () => {
    if (!variant || isOutOfStock || addStatus === "loading") return;
    setAddStatus("loading");
    try {
      await addToCart(variant.product.sku, 1);
      setAddStatus("success");
      toast.success("Продуктът е добавен в количката", { description: initialProduct.name });
      setTimeout(() => { setAddStatus("idle"); onClose(); }, 1200);
    } catch {
      setAddStatus("error");
      toast.error("Неуспешно добавяне в количката");
      setTimeout(() => setAddStatus("idle"), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl max-h-[95dvh] flex flex-col sm:flex-row overflow-hidden rounded-t-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-gray-100 shadow transition-colors"
        >
          <X size={16} />
        </button>

        {/* ── Left: image ── */}
        <div className="sm:w-[52%] shrink-0 bg-gray-50">
          <div className="relative w-full h-64 sm:h-auto sm:aspect-square overflow-hidden">
            {images[0] && (
              <MagentoImage
                src={magentoImageUrl(images[0].url)}
                alt={images[0].label || initialProduct.name}
                fill
                style={{ objectFit: "contain" }}
                className="p-4 sm:p-6"
                priority
              />
            )}
          </div>
        </div>

        {/* ── Right: details ── */}
        <div className="flex flex-col p-4 sm:p-6 flex-1 min-w-0 overflow-y-auto">
          {/* Name */}
          <h2 className="text-base font-bold text-gray-900 mb-3 pr-8 leading-snug">
            {initialProduct.name}
          </h2>

          {/* Price — fixed height so modal doesn't jump when promo variant is selected */}
          <div className="mb-4 min-h-15 flex flex-col justify-center">
            {variantOnSale && regularPrice ? (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-rose-600">
                    {finalPrice!.value.toFixed(2)} {finalPrice!.currency}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                    -{variantDiscountPct}%
                  </span>
                </div>
                <span className="text-sm text-gray-400 line-through">
                  {regularPrice.value.toFixed(2)} {regularPrice.currency}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-brand-action">
                {finalPrice ? `${finalPrice.value.toFixed(2)} ${finalPrice.currency}` : "—"}
              </span>
            )}
          </div>

          {/* Options */}
          {loadingExtra ? (
            <div className="mb-5">
              <div className="h-4 w-20 bg-gray-100 rounded mb-3 animate-pulse" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 w-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            extra?.configurable_options?.map((option) => {
              const hasImages = option.values.every(
                (val) => !!getVariantForValue(option.attribute_code, val.value_index)?.product.small_image?.url
              );
              return (
                <div key={option.attribute_code} className="mb-5">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {option.label}
                    {hasImages && selectedOptions[option.attribute_code] !== undefined && (
                      <span className="font-normal text-gray-500 ml-1">
                        — {option.values.find((v) => v.value_index === selectedOptions[option.attribute_code])?.label}
                      </span>
                    )}
                  </p>
                  {hasImages ? (
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((val) => {
                        const available = isValueAvailable(option.attribute_code, val.value_index);
                        const selected = selectedOptions[option.attribute_code] === val.value_index;
                        const variantImg = getVariantForValue(option.attribute_code, val.value_index)?.product.small_image;
                        return (
                          <button
                            key={val.value_index}
                            disabled={!available}
                            title={val.label}
                            onClick={() =>
                              setSelectedOptions((prev) => ({ ...prev, [option.attribute_code]: val.value_index }))
                            }
                            className={`
                              relative w-16 h-16 rounded-lg border-2 overflow-hidden bg-white transition-all duration-150
                              ${selected
                                ? "border-brand-action shadow-md scale-105"
                                : available
                                ? "border-gray-200 hover:border-brand-action/60 hover:shadow"
                                : "border-gray-100 opacity-40 cursor-not-allowed"
                              }
                            `}
                          >
                            {variantImg && (
                              <MagentoImage
                                src={magentoImageUrl(variantImg.url)}
                                alt={variantImg.label || val.label}
                                width={64}
                                height={64}
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                className="p-1"
                              />
                            )}
                            {!available && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="w-full h-px bg-gray-400 rotate-45 absolute" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <CustomSelect
                      attributeCode={option.attribute_code}
                      label={option.label}
                      values={option.values}
                      selected={selectedOptions[option.attribute_code]}
                      isValueAvailable={isValueAvailable}
                      onSelect={(valueIndex) =>
                        setSelectedOptions((prev) => ({ ...prev, [option.attribute_code]: valueIndex }))
                      }
                    />
                  )}
                </div>
              );
            })
          )}

          {allSelected && isOutOfStock && (
            <p className="text-sm text-rose-500 font-medium mb-4">Изчерпано</p>
          )}

          {/* Detail page link */}
          <Link
            href={`/${urlKey}`}
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-brand-action transition-colors mb-3"
          >
            <ExternalLink size={14} />
            Виж пълните детайли на продукта
          </Link>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!allSelected || isOutOfStock || addStatus === "loading"}
            className={`
              mt-auto w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
              flex items-center justify-center gap-2
              ${!allSelected || isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : addStatus === "success"
                ? "bg-emerald-500 text-white"
                : addStatus === "error"
                ? "bg-rose-500 text-white"
                : "bg-brand-action text-white hover:bg-brand-action/90 active:scale-[0.98]"
              }
            `}
          >
            {addStatus === "loading" && <Loader2 size={16} className="animate-spin" />}
            {addStatus === "loading"
              ? "Добавяне..."
              : addStatus === "success"
              ? "Добавено!"
              : !allSelected
              ? "Избери вариант"
              : isOutOfStock
              ? "Изчерпано"
              : "Добави в количката"}
          </button>
        </div>
      </div>
    </div>
  );
}
