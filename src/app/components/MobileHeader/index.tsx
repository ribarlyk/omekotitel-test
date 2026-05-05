"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Logo } from "@/src/app/components/Header/Logo";
import { SearchBar } from "@/src/app/components/Header/SearchBar";
import { DeliveryBanner } from "@/src/app/components/DeliveryBanner";
import { UserCartWishSection } from "@/src/app/components/Header/UserCartWishSection";
import { MobileNavPanel } from "./MobileNavPanel";
import { NavCatalogCategory } from "@/src/app/constants";

const BurgerIcon = ({ isOpen }: { isOpen: boolean }) => (
  <div className="w-8 flex flex-col gap-1.75">
    <span
      className={`block h-[3.5px] bg-brand-nav rounded transition-all duration-300 origin-center ${
        isOpen ? "rotate-45 translate-y-[10.5px]" : ""
      }`}
    />
    <span
      className={`block h-[3.5px] bg-brand-nav rounded transition-all duration-300 ${
        isOpen ? "opacity-0 scale-x-0" : ""
      }`}
    />
    <span
      className={`block h-[3.5px] bg-brand-nav rounded transition-all duration-300 origin-center ${
        isOpen ? "-rotate-45 -translate-y-[10.5px]" : ""
      }`}
    />
  </div>
);

export const MobileHeader = ({ categoryList }: { categoryList: NavCatalogCategory[] }) => {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchLocked, setSearchLocked] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchLocked(false);
    setScrolled(false);
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isCheckout = pathname === "/onestepcheckout";
  const showSearch = !isCheckout && (scrolled || searchLocked);

  const openSearch = () => {
    setSearchLocked(true);
    setTimeout(() => searchRef.current?.focus(), 320);
  };

  return (
    <div className="lg:hidden bg-white border-b-2 border-brand-action">
      {/* Top bar: burger + logo + icons */}
      <div className="flex items-center h-16 px-3 gap-2">
        <button
          onClick={() => setNavOpen((p) => !p)}
          className="flex items-center justify-center w-10 h-10 shrink-0"
          aria-label="Меню"
        >
          <BurgerIcon isOpen={navOpen} />
        </button>
        <div className="shrink-0">
          <Logo imgClassName="h-12 w-auto" />
        </div>
        <div className="ml-auto shrink-0 flex items-center gap-3">
          <button
            onClick={openSearch}
            aria-label="Търсене"
            className={`flex flex-col items-center cursor-pointer transition-opacity duration-300 ${showSearch ? "opacity-0 pointer-events-none" : "opacity-100"}`}
          >
            <Search size={32} className="text-brand-action" strokeWidth={2} />
          </button>
          <UserCartWishSection showWishlist={false} showPhone={false} showLabels={false} iconSize={32} />
        </div>
      </div>

      {/* Scroll-aware second row: delivery banner → search bar */}
      <div className="h-13 overflow-hidden">
        <div
          className={`transition-transform duration-300 ${showSearch ? "-translate-y-13" : "translate-y-0"}`}
        >
          <div className="h-13">
            <DeliveryBanner className="h-full py-0" />
          </div>
          <div className="h-13 px-3 py-2">
            <SearchBar inputRef={searchRef} />
          </div>
        </div>
      </div>

      <MobileNavPanel
        categoryList={categoryList}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
      />
    </div>
  );
};
