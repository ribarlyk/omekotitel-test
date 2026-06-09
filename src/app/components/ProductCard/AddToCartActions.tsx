"use client";

import { useState } from "react";
import { useCart } from "@/src/app/contexts/CartContext";
import { toast } from "sonner";
import ConfigurableProductModal from "@/src/app/components/ConfigurableProductModal";
import type { ProductCardProduct } from "./index";
import { trackAddToCart } from "@/src/app/utils/analytics";

type ButtonStatus = "idle" | "loading" | "success" | "error";

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

export function AddToCartActions({ product }: { product: ProductCardProduct }) {
  const { addToCart } = useCart();
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const isConfigurable = product.type_id === "configurable";
  const isOutOfStock = product.stock_status === "OUT_OF_STOCK";

  // Out-of-stock products stay listed (discoverable), but can't be added to the cart.
  if (isOutOfStock) {
    return (
      <button
        type="button"
        disabled
        aria-label="Изчерпано"
        className="w-full py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
      >
        <span>Изчерпано</span>
      </button>
    );
  }

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
      const finalPrice = product.price_range?.minimum_price.final_price;
      if (finalPrice) {
        trackAddToCart({ sku: product.sku, name: product.name, price: finalPrice.value, currency: finalPrice.currency, quantity: 1 });
      }
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      toast.error("Неуспешно добавяне в количката");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const isLoading = status === "loading";

  const configs = {
    idle: { icon: null, label: isConfigurable ? "Избери вариант" : "Добави", className: "bg-white border-2 border-brand-action text-brand-action hover:bg-brand-action hover:text-white hover:border-brand-action active:scale-[0.98]" },
    loading: { icon: <SpinnerIcon />, label: "Добавяне...", className: "bg-white border-2 border-brand-action text-brand-action opacity-70 cursor-not-allowed" },
    success: { icon: <CheckIcon />, label: "Добавено!", className: "bg-emerald-500 border-2 border-emerald-500 text-white" },
    error: { icon: <ErrorIcon />, label: "Грешка!", className: "bg-rose-500 border-2 border-rose-500 text-white" },
  };

  const { icon, label, className } = configs[status];

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        aria-label={`Добави ${product.sku} в количката`}
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
