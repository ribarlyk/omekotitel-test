"use client";

import { useState } from "react";
import Link from "next/link";
import { magentoImageUrl } from "@/src/app/utils/image";
import MagentoImage from "@/src/app/components/MagentoImage";
import { useCart } from "@/src/app/contexts/CartContext";
import { toast } from "sonner";
import { isProductNew, isProductOnSale, discountPercent } from "@/src/app/utils/productBadges";
import ConfigurableProductModal from "@/src/app/components/ConfigurableProductModal";
import type { ViewMode } from "@/src/app/components/SortToolbar";
import { prefetchProductLinks } from "@/src/app/components/ProductDetail";

export interface ProductCardProduct {
  id: string;
  name: string;
  sku: string;
  price_range: {
    minimum_price: {
      final_price: { value: number; currency: string };
      regular_price?: { value: number; currency: string };
      discount?: { percent_off: number; amount_off: number } | null;
    };
  } | null;
  small_image: { url: string; label: string } | null;
  url_key: string;
  new_from_date?: string | null;
  new_to_date?: string | null;
  special_price?: number | null;
  special_from_date?: string | null;
  special_to_date?: string | null;
  type_id?: string | null;
}

type ButtonStatus = "idle" | "loading" | "success" | "error";

interface ProductCardProps {
  product: ProductCardProduct;
  index?: number;
  view?: ViewMode;
}

function CartIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
}

function AddToCartButton({ sku, status, onClick, isConfigurable }: { sku: string; status: ButtonStatus; onClick: (e: React.MouseEvent) => void; isConfigurable?: boolean }) {
  const isLoading = status === "loading";

  const configs = {
    idle: { icon: null, label: isConfigurable ? "Избери вариант" : "Добави", className: "bg-white border-2 border-brand-action text-brand-action hover:bg-brand-action hover:text-white hover:border-brand-action active:scale-[0.98]" },
    loading: { icon: <SpinnerIcon />, label: "Добавяне...", className: "bg-white border-2 border-brand-action text-brand-action opacity-70 cursor-not-allowed" },
    success: { icon: <CheckIcon />, label: "Добавено!", className: "bg-emerald-500 border-2 border-emerald-500 text-white" },
    error: { icon: <ErrorIcon />, label: "Грешка!", className: "bg-rose-500 border-2 border-rose-500 text-white" },
  };

  const { icon, label, className } = configs[status];

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      aria-label={`Добави ${sku} в количката`}
      className={`
        w-full py-2 px-3 rounded-lg text-sm font-semibold
        flex items-center justify-center gap-2
        transition-all duration-200 whitespace-nowrap
        disabled:opacity-80 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function ProductCard({ product, index = 0, view = "grid" }: ProductCardProps) {
  const { addToCart } = useCart();
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const isConfigurable = product.type_id === "configurable";

  const finalPrice = product.price_range?.minimum_price.final_price;
  const regularPrice = product.price_range?.minimum_price.regular_price;

  const isOnSale = isProductOnSale(product);
  const discountPct = discountPercent(product);
  const isNew = isProductNew(product);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isConfigurable) {
      setModalOpen(true);
      return;
    }
    if (status === "loading") return;
    setStatus("loading");
    try {
      await addToCart(product.sku, 1);
      setStatus("success");
      toast.success("Продуктът е добавен в количката", {
        description: product.name,
      });
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      toast.error("Неуспешно добавяне в количката");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const imageLoadingProps = {
    loading: (index === 0 ? "eager" : "lazy") as "eager" | "lazy",
    fetchPriority: (index === 0 ? "high" : "auto") as "high" | "auto",
  };

  const badges = (
    <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
      {isNew && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow tracking-wide uppercase">
          Ново
        </span>
      )}
      {isOnSale && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow tracking-wide">
          -{discountPct}%
        </span>
      )}
    </div>
  );

  const priceBlock = (
    <div>
      {isOnSale ? (
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 line-through leading-none mb-0.5">
            {regularPrice!.value.toFixed(2)} {regularPrice!.currency}
          </span>
          <span className="text-lg font-bold text-rose-600 leading-tight">
            {finalPrice!.value.toFixed(2)} {finalPrice!.currency}
          </span>
        </div>
      ) : (
        <span className="text-lg font-bold text-brand-action leading-tight">
          {finalPrice ? `${finalPrice.value.toFixed(2)} ${finalPrice.currency}` : "—"}
        </span>
      )}
    </div>
  );

  if (view === "list") {
    return (
      <>
      <Link
        href={`/${product.url_key}`}
        onMouseDown={() => prefetchProductLinks(product.url_key)}
        className="flex gap-4 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-brand-action/40 transition-all duration-200 group overflow-hidden"
      >
        <div className="relative shrink-0 overflow-hidden w-30">
          {product.small_image && (
          <MagentoImage
            src={magentoImageUrl(product.small_image.url)}
            alt={product.small_image.label || product.name}
            width={120}
            height={120}
            style={{ width: "120px", height: "120px", objectFit: "contain" }}
            className="transition-transform duration-300 group-hover:scale-105"
            sizes="120px"
            {...imageLoadingProps}
          />
          )}
          {badges}
        </div>
        <div className="flex flex-col justify-between py-4 pr-4 flex-1 min-w-0">
          <h3 className="font-medium text-sm mb-2 text-gray-800 group-hover:text-brand-nav transition-colors leading-snug">
            {product.name}
          </h3>
          <div className="flex items-end justify-between gap-3 flex-wrap">
            {priceBlock}
            <div className="shrink-0 w-36">
              <AddToCartButton sku={product.sku} status={status} onClick={handleAddToCart} isConfigurable={isConfigurable} />
            </div>
          </div>
        </div>
      </Link>
      {modalOpen && (
        <ConfigurableProductModal
          urlKey={product.url_key}
          initialProduct={product}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
    );
  }

  return (
    <>
    <Link
      href={`/${product.url_key}`}
      onMouseDown={() => prefetchProductLinks(product.url_key)}
      className="flex flex-col h-full border border-gray-200 rounded-xl bg-white hover:shadow-xl hover:border-brand-action/40 transition-all duration-200 group overflow-hidden"
    >
      <div className="relative overflow-hidden">
        {product.small_image && (
        <MagentoImage
          src={magentoImageUrl(product.small_image.url)}
          alt={product.small_image.label || product.name}
          width={200}
          height={200}
          style={{ width: "100%", height: "200px", objectFit: "contain" }}
          className="transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(50vw - 1.5rem), (max-width: 1280px) calc(33vw - 1.5rem), calc(25vw - 1.5rem)"
          {...imageLoadingProps}
        />
        )}
        {badges}
      </div>

      <div className="flex flex-col p-4 flex-1">
        <h3 className="font-medium text-sm mb-3 flex-1 text-gray-800 group-hover:text-brand-nav transition-colors leading-snug">
          {product.name}
        </h3>
        <div className="mt-auto flex flex-col gap-3">
          {priceBlock}
          <AddToCartButton sku={product.sku} status={status} onClick={handleAddToCart} isConfigurable={isConfigurable} />
        </div>
      </div>
    </Link>

    {modalOpen && (
      <ConfigurableProductModal
        urlKey={product.url_key}
        initialProduct={product}
        onClose={() => setModalOpen(false)}
      />
    )}
    </>
  );
}
