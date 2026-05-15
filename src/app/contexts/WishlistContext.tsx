"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Wishlist } from "../types/wishlist";
import { useAuth } from "./AuthContext";

const MAGENTO_URL = (process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "").replace("/graphql", "");

function getMagentoFormKey(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith("form_key="))?.split("=")[1];
}

interface WishlistContextType {
  wishlist: Wishlist | null;
  loading: boolean;
  itemCount: number;
  isInWishlist: (sku: string) => boolean;
  addToWishlist: (sku: string, productId: string | number) => Promise<void>;
  removeFromWishlist: (wishlistItemId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      setLoading(true);
      const resp = await fetch("/api/wishlist", { credentials: "include" });
      if (resp.status === 401) { setWishlist(null); return; }
      if (!resp.ok) throw new Error("Failed to fetch wishlist");
      const data = await resp.json();
      setWishlist(data.wishlist);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!authLoading && isLoggedIn) fetchWishlist();
    else if (!authLoading && !isLoggedIn) setWishlist(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isLoggedIn]);

  const isInWishlist = (sku: string): boolean =>
    wishlist?.items.some((item) => item.product?.sku === sku) ?? false;

  const addToWishlist = async (sku: string, productId: string | number) => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const formKey = getMagentoFormKey();
      if (!formKey) throw new Error("no_session");

      const uenc = btoa(`${MAGENTO_URL}/wishlist`);
      const resp = await fetch(`${MAGENTO_URL}/wishlist/index/add/`, {
        method: "POST",
        credentials: "include",
        redirect: "manual",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ product: String(productId), uenc, form_key: formKey }).toString(),
      });

      // Magento 302 redirect = success. Browser with redirect:"manual" returns type="opaqueredirect" / status=0.
      if (resp.status !== 0 && resp.status !== 302 && resp.type !== "opaqueredirect" && !resp.ok) {
        throw new Error("Failed to add to wishlist");
      }

      await fetchWishlist();
    } catch (err) {
      console.error("Error adding to wishlist:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistItemId: string) => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const formKey = getMagentoFormKey();
      if (!formKey) throw new Error("no_session");

      const uenc = btoa(`${MAGENTO_URL}/wishlist`);
      const resp = await fetch(`${MAGENTO_URL}/wishlist/index/remove/`, {
        method: "POST",
        credentials: "include",
        redirect: "manual",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ item: String(wishlistItemId), uenc, form_key: formKey }).toString(),
      });

      if (resp.status !== 0 && resp.status !== 302 && resp.type !== "opaqueredirect" && !resp.ok) {
        throw new Error("Failed to remove from wishlist");
      }

      await fetchWishlist();
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const itemCount = wishlist?.items_count ?? 0;

  return (
    <WishlistContext.Provider value={{ wishlist, loading, itemCount, isInWishlist, addToWishlist, removeFromWishlist, refreshWishlist: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
