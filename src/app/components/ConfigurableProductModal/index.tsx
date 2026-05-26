"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Loader2, ExternalLink, Minus, Plus } from "lucide-react";
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


export default function ConfigurableProductModal({ urlKey, initialProduct, onClose }: Props) {
  const { addToCart } = useCart();
  const [extra, setExtra] = useState<ExtraData | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [addStatus, setAddStatus] = useState<AddStatus>("idle");
  const [quantity, setQuantity] = useState(1);

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
      await addToCart(variant.product.sku, quantity);
      setAddStatus("success");
      toast.success("Продуктът е добавен в количката", { description: initialProduct.name });
      setTimeout(() => { setAddStatus("idle"); onClose(); }, 1200);
    } catch {
      setAddStatus("error");
      toast.error("Неуспешно добавяне в количката");
      setTimeout(() => setAddStatus("idle"), 2000);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 bg-white w-full sm:max-w-3xl shadow-2xl h-dvh sm:h-auto sm:max-h-[90dvh] flex flex-col sm:flex-row overflow-hidden sm:rounded-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-gray-100 shadow transition-colors"
        >
          <X size={16} />
        </button>

        {/* ── Left: image ── */}
        <div className="sm:w-[52%] shrink-0 bg-white">
          <div className="relative w-full h-72 sm:h-auto sm:aspect-square overflow-hidden">
            {images[0] && (
              <MagentoImage
                src={magentoImageUrl(images[0].url)}
                alt={images[0].label || initialProduct.name}
                fill
                style={{ objectFit: "contain" }}
                className="p-4 sm:p-6"
                fetchPriority="high"
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

          {/* Price + quantity on same row on mobile */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 min-h-15 flex flex-col justify-center">
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
            {/* Quantity stepper — mobile only */}
            <div className="sm:hidden shrink-0 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-action hover:text-brand-action disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-gray-800">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-action hover:text-brand-action transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
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
            extra?.configurable_options?.map((option) => (
              <div key={option.attribute_code} className="mb-5">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {option.label}
                  {selectedOptions[option.attribute_code] !== undefined && (
                    <span className="font-normal text-gray-500 ml-1">
                      — {option.values.find((v) => v.value_index === selectedOptions[option.attribute_code])?.label}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {option.values.filter((val) => isValueAvailable(option.attribute_code, val.value_index)).map((val) => {
                    const isSelected = selectedOptions[option.attribute_code] === val.value_index;
                    const variantImg = getVariantForValue(option.attribute_code, val.value_index)?.product.small_image;
                    return variantImg ? (
                      <button
                        key={val.value_index}
                        title={val.label}
                        onClick={() =>
                          setSelectedOptions((prev) => ({ ...prev, [option.attribute_code]: val.value_index }))
                        }
                        className={`
                          relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all duration-150
                          ${isSelected
                            ? "border-brand-action shadow-md scale-105"
                            : "border-gray-200 hover:border-brand-action/60 hover:shadow"
                          }
                        `}
                      >
                        <MagentoImage
                          src={magentoImageUrl(variantImg.url)}
                          alt={variantImg.label || val.label}
                          width={64}
                          height={64}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          className="p-1"
                        />
                      </button>
                    ) : (
                      <button
                        key={val.value_index}
                        title={val.label}
                        onClick={() =>
                          setSelectedOptions((prev) => ({ ...prev, [option.attribute_code]: val.value_index }))
                        }
                        className={`
                          px-3 py-2 rounded-lg border-2 text-sm transition-all duration-150
                          ${isSelected
                            ? "border-brand-action bg-brand-action/5 text-brand-action font-semibold shadow-md"
                            : "border-gray-200 text-gray-700 hover:border-brand-action/60 hover:shadow"
                          }
                        `}
                      >
                        {val.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
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

          {/* Quantity + Add to cart */}
          <div className="flex gap-3 items-end">
            {/* Quantity — desktop only (mobile version is next to price above) */}
            <div className="hidden sm:flex flex-col gap-1 shrink-0">
              <span className="text-xs font-semibold text-gray-500">Количество</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-action hover:text-brand-action disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-gray-800">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-action hover:text-brand-action transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!allSelected || isOutOfStock || addStatus === "loading"}
              className={`
                flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200
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
    </div>,
    document.body
  );
}
