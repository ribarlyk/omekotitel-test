"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { Cart } from "../types/cart";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cartId: string | null;
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (sku: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [cartId, setCartId] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/cart", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();
      setCartId(data.cartId);
      setCart(data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cart");
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cart for both guests and logged-in users
  useEffect(() => {
    if (!authLoading) {
      fetchCart();
    }
  }, [authLoading, isLoggedIn, fetchCart]);

  const addToCart = useCallback(async (sku: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ sku, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add item to cart");
      }

      const data = await response.json();
      setCartId(data.cartId);
      setCart(data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to cart");
      console.error("Error adding to cart:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromCart = useCallback(async (cartItemId: string) => {
    try {
      setError(null);

      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ cartItemId: parseInt(cartItemId) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove item from cart");
      }

      const { cart: updated } = await response.json();
      setCart((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total_quantity: updated.total_quantity,
          prices: updated.prices,
          items: prev.items.filter((item) => item.id !== cartItemId),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove from cart");
      console.error("Error removing from cart:", err);
      throw err;
    }
  }, []);

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    try {
      setError(null);

      const response = await fetch("/api/cart/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ cartItemId: parseInt(cartItemId), quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update cart item");
      }

      const { cart: updated } = await response.json();
      setCart((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total_quantity: updated.total_quantity,
          prices: updated.prices,
          items: prev.items.map((item) => {
            const updatedItem = updated.items.find((u: { id: string }) => u.id === item.id);
            return updatedItem ? { ...item, quantity: updatedItem.quantity } : item;
          }),
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity");
      console.error("Error updating quantity:", err);
      throw err;
    }
  }, []);

  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  const itemCount = cart?.total_quantity || 0;

  const value = useMemo<CartContextType>(() => ({
    cartId,
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    refreshCart,
    itemCount,
  }), [cartId, cart, loading, error, addToCart, removeFromCart, updateQuantity, refreshCart, itemCount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
