"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Wishlist } from "../types/wishlist";
import { useAuth } from "./AuthContext";

interface WishlistContextType {
  wishlist: Wishlist | null;
  loading: boolean;
  itemCount: number;
  isInWishlist: (sku: string) => boolean;
  addToWishlist: (sku: string) => Promise<void>;
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
      if (resp.status === 401) {
        setWishlist(null);
        return;
      }
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
    if (!authLoading && isLoggedIn) {
      fetchWishlist();
    } else if (!authLoading && !isLoggedIn) {
      setWishlist(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isLoggedIn]);

  const isInWishlist = (sku: string): boolean => {
    if (!wishlist) return false;
    return wishlist.items.some((item) => item.product?.sku === sku);
  };

  const addToWishlist = async (sku: string) => {
    if (!isLoggedIn) return;
    
    try {
      setLoading(true);
      const resp = await fetch("/api/wishlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sku }),
      });

      if (resp.status === 401) return;

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to add to wishlist");
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
    
    try {
      setLoading(true);
      const resp = await fetch("/api/wishlist/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wishlistItemId }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to remove from wishlist");
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
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        itemCount,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
