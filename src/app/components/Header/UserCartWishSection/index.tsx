"use client";

import { User, Heart, ShoppingCart, Phone } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { SidePanel } from "@/src/app/components/SidePanel";
import { CartPanel } from "./CartPanel";
import { LoginPanel } from "./LoginPanel";
import { WishlistPanel } from "./WishlistPanel";
import { ProfileDropdown } from "./ProfileDropdown";
import { useCart } from "@/src/app/contexts/CartContext";
import { useWishlist } from "@/src/app/contexts/WishlistContext";
import { useAuth } from "@/src/app/contexts/AuthContext";

enum Panel {
  Cart = "cart",
  Profile = "profile",
  Wishlist = "wishlist",
}

const PANEL_TITLES: Record<Panel, string> = {
  [Panel.Profile]: "Влез в профил",
  [Panel.Cart]: "Количка",
  [Panel.Wishlist]: "Любими",
};

export const UserCartWishSection = ({
  showWishlist = true,
  showPhone = true,
  showLabels = true,
  iconSize = 24,
}: {
  showWishlist?: boolean;
  showPhone?: boolean;
  showLabels?: boolean;
  iconSize?: number;
} = {}) => {
  const [openPanel, setOpenPanel] = useState<Panel | null>(null);
  const [authTitle, setAuthTitle] = useState<string>(PANEL_TITLES[Panel.Profile]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { itemCount, loading: cartLoading, refreshCart } = useCart();
  const { itemCount: wishlistCount, loading: wishlistLoading, refreshWishlist } = useWishlist();
  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (panel: Panel) =>
    setOpenPanel((prev) => (prev === panel ? null : panel));

  const handleProfileClick = () => {
    if (isLoggedIn) {
      setProfileMenuOpen((prev) => !prev);
    } else {
      toggle(Panel.Profile);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 lg:gap-6">
        {showPhone && (
          <div className="hidden xl:flex items-center gap-3">
            <div className="border border-gray-300 rounded-xl p-3">
              <Phone className="text-brand-action" strokeWidth={2} size={30} />
            </div>
            <address className="flex flex-col not-italic gap-1">
              <p className="text-[12px]! text-brand-nav">За поръчки и запитвания</p>
              <a href="tel:0884358676" className="text-[25px]! font-bold text-brand-nav">
                0884358676
              </a>
            </address>
          </div>
        )}

        <div ref={profileRef} className="relative">
          <button
            onClick={handleProfileClick}
            className="flex flex-col items-center cursor-pointer"
          >
            <User className="text-brand-action" strokeWidth={2} size={iconSize} />
            {showLabels && (
              <span className="text-xs text-gray-900">
                {isLoggedIn && user?.firstname ? user.firstname : "Профил"}
              </span>
            )}
          </button>
          {isLoggedIn && profileMenuOpen && (
            <ProfileDropdown
              onClose={() => setProfileMenuOpen(false)}
            />
          )}
        </div>

        {showWishlist && (
          <button
            onClick={() => toggle(Panel.Wishlist)}
            className="flex flex-col items-center cursor-pointer"
          >
            <div className="relative">
              <Heart className="text-brand-action" strokeWidth={2} size={iconSize} />
              {isLoggedIn && wishlistLoading ? (
                <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-brand-action/30 border-t-brand-action animate-spin" />
                </span>
              ) : wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-action text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </div>
            {showLabels && <span className="text-xs text-gray-900">Любими</span>}
          </button>
        )}

        <button
          onClick={() => toggle(Panel.Cart)}
          className="flex flex-col items-center cursor-pointer"
        >
          <div className="relative">
            <ShoppingCart className="text-brand-action" strokeWidth={2} size={iconSize} />
            {isLoggedIn && cartLoading ? (
              <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-brand-action/30 border-t-brand-action animate-spin" />
              </span>
            ) : itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-action text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </div>
          {showLabels && <span className="text-xs text-gray-900">Количка</span>}
        </button>
      </div>

      <SidePanel
        isOpen={openPanel !== null}
        onClose={() => { setOpenPanel(null); setAuthTitle(PANEL_TITLES[Panel.Profile]); }}
        title={openPanel ? (openPanel === Panel.Profile ? authTitle : PANEL_TITLES[openPanel]) : ""}
        width={openPanel === Panel.Cart ? "w-full lg:w-[480px]" : "w-full lg:w-96"}
        customLayout={openPanel === Panel.Cart}
      >
        {openPanel === Panel.Cart && <CartPanel onClose={() => setOpenPanel(null)} />}
        {openPanel === Panel.Profile && (
          <LoginPanel
            onSuccess={() => { setOpenPanel(null); refreshCart(); refreshWishlist(); }}
            onViewChange={(view) => {
              const titles = { login: "Влез в профил", register: "Регистрация на профил", "forgot-password": "Забравена парола" };
              setAuthTitle(titles[view]);
            }}
          />
        )}
        {openPanel === Panel.Wishlist && <WishlistPanel />}
      </SidePanel>
    </>
  );
};
