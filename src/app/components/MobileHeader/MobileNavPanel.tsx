"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavCatalogCategory, NAVGATIOM_ITEMS } from "@/src/app/constants";

function categoryHref(cat: NavCatalogCategory): string {
  if (cat.url_key) return `/${cat.url_key}`;
  return `/catalog?category=${cat.id}`;
}

const NAV_CATEGORY_IDS = new Set([9, 221, 4, 3, 10, 7, 48]);

export const MobileNavPanel = ({
  categoryList,
  isOpen,
  onClose,
}: {
  categoryList: NavCatalogCategory[];
  isOpen: boolean;
  onClose: () => void;
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NavCatalogCategory | null>(null);
  const [view, setView] = useState<"root" | "sub">("root");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset to root when panel closes
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setActiveCategory(null);
        setView("root");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const topCategories = (categoryList[0]?.children ?? []).filter((c) =>
    NAV_CATEGORY_IDS.has(c.id)
  );

  const openCategory = (cat: NavCatalogCategory) => {
    setActiveCategory(cat);
    setView("sub");
  };

  const goBack = () => {
    setView("root");
    setActiveCategory(null);
  };

  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — slides in from the right, full screen */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full bg-white flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header — fixed height to prevent wobble */}
        <div className="flex items-center h-14 px-4 border-b border-gray-200 shrink-0">
          <div className="flex-1 min-w-0">
            {view === "sub" ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-brand-nav font-semibold text-base cursor-pointer"
              >
                <ChevronLeft size={22} className="shrink-0" />
                <span className="truncate">{activeCategory?.name}</span>
              </button>
            ) : (
              <span className="text-lg font-semibold text-brand-nav">Меню</span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0 ml-4">
            <X size={24} />
          </button>
        </div>

        {/* Sliding content area */}
        <div className="flex-1 overflow-hidden relative">
          {/* Root view */}
          <div
            className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ${
              view === "root" ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <ul>
              {topCategories.map((cat) => {
                const hasChildren = (cat.children?.length ?? 0) > 0;
                return (
                  <li key={cat.id} className="border-b border-gray-100">
                    {hasChildren ? (
                      <button
                        onClick={() => openCategory(cat)}
                        className="w-full flex items-center justify-between px-5 py-4 text-gray-800 text-lg font-medium cursor-pointer active:bg-gray-50"
                      >
                        <span>{cat.name}</span>
                        <ChevronRight size={20} className="text-brand-action shrink-0" />
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(categoryHref(cat))}
                        className="w-full flex items-center px-5 py-4 text-gray-800 text-lg font-medium cursor-pointer active:bg-gray-50"
                      >
                        {cat.name}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Static nav links */}
            <ul className="border-t-4 border-gray-100">
              {NAVGATIOM_ITEMS.filter((i) => !i.main).map((item) => (
                <li key={item.name} className="border-b border-gray-100">
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="block px-5 py-4 text-gray-600 text-base"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subcategory view */}
          <div
            className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ${
              view === "sub" ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {activeCategory && (
              <ul>
                {(activeCategory.children ?? []).map((child) => (
                  <li key={child.id} className="border-b border-gray-100">
                    <button
                      onClick={() => navigate(categoryHref(child))}
                      className="w-full flex items-center px-5 py-4 text-gray-800 text-lg cursor-pointer active:bg-gray-50"
                    >
                      {child.name}
                    </button>
                  </li>
                ))}
                {/* "All products" link for the parent category */}
                <li className="border-t-4 border-gray-100">
                  <button
                    onClick={() => navigate(categoryHref(activeCategory))}
                    className="w-full flex items-center px-5 py-4 text-brand-action font-semibold text-base cursor-pointer active:bg-gray-50"
                  >
                    Всички продукти
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
