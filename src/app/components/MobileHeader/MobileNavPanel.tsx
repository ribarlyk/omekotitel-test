"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/src/app/components/Header/Logo";
import { NavCatalogCategory, NAVGATIOM_ITEMS } from "@/src/app/constants";

function categoryHref(cat: NavCatalogCategory): string {
  if (cat.url_path) return `/${cat.url_path}`;
  if (cat.url_key) return `/${cat.url_key}`;
  return "/";
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
  const [activeSubCategory, setActiveSubCategory] = useState<NavCatalogCategory | null>(null);
  const [view, setView] = useState<"root" | "sub" | "subsub">("root");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        setActiveSubCategory(null);
        setView("root");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const topCategories = (categoryList[0]?.children ?? [])
    .filter((c) => NAV_CATEGORY_IDS.has(c.id))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const openCategory = (cat: NavCatalogCategory) => {
    setActiveCategory(cat);
    setView("sub");
  };

  const openSubCategory = (cat: NavCatalogCategory) => {
    setActiveSubCategory(cat);
    setView("subsub");
  };

  const goBack = () => {
    if (view === "subsub") {
      setActiveSubCategory(null);
      setView("sub");
    } else {
      setActiveCategory(null);
      setView("root");
    }
  };

  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  const backLabel = view === "subsub" ? activeSubCategory?.name : activeCategory?.name;

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-60 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-60 h-full w-full bg-white flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
          {view !== "root" ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-brand-nav font-semibold text-base cursor-pointer"
            >
              <ChevronLeft size={32} className="shrink-0" />
              <span className="truncate">{backLabel}</span>
            </button>
          ) : (
            <Logo imgClassName="h-12 w-auto" />
          )}
          <button onClick={onClose} aria-label="Затвори менюто" className="text-brand-action cursor-pointer shrink-0">
            <X size={32} />
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

          {/* Sub view */}
          <div
            className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ${
              view === "sub"
                ? "translate-x-0"
                : view === "root"
                  ? "translate-x-full"
                  : "-translate-x-full"
            }`}
          >
            {activeCategory && (
              <ul>
                {[...(activeCategory.children ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((child) => {
                  const hasChildren = (child.children?.length ?? 0) > 0;
                  return (
                    <li key={child.id} className="border-b border-gray-100">
                      {hasChildren ? (
                        <button
                          onClick={() => openSubCategory(child)}
                          className="w-full flex items-center justify-between px-5 py-4 text-gray-800 text-lg cursor-pointer active:bg-gray-50"
                        >
                          <span>{child.name}</span>
                          <ChevronRight size={20} className="text-brand-action shrink-0" />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(categoryHref(child))}
                          className="w-full flex items-center px-5 py-4 text-gray-800 text-lg cursor-pointer active:bg-gray-50"
                        >
                          {child.name}
                        </button>
                      )}
                    </li>
                  );
                })}
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

          {/* Subsub view */}
          <div
            className={`absolute inset-0 overflow-y-auto transition-transform duration-300 ${
              view === "subsub" ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {activeSubCategory && (
              <ul>
                {[...(activeSubCategory.children ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((grandchild) => (
                  <li key={grandchild.id} className="border-b border-gray-100">
                    <button
                      onClick={() => navigate(categoryHref(grandchild))}
                      className="w-full flex items-center px-5 py-4 text-gray-800 text-lg cursor-pointer active:bg-gray-50"
                    >
                      {grandchild.name}
                    </button>
                  </li>
                ))}
                <li className="border-t-4 border-gray-100">
                  <button
                    onClick={() => navigate(categoryHref(activeSubCategory))}
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
