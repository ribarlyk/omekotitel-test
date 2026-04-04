"use client";

import { useCart } from "@/src/app/contexts/CartContext";
import { useState } from "react";

const TEST_SKU = "Miss Scrubby No Scratch Жълта Адаптивна Гъба към Hot/ Cold Water";

export default function TestCartButton() {
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await addToCart(TEST_SKU, 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="px-4 py-2 bg-brand-action text-white rounded-lg text-sm disabled:opacity-50"
      >
        {loading ? "Добавя се…" : "🧪 Add test item"}
      </button>
    </div>
  );
}
