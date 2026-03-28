"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NavCatalogCategory } from "../../../constants";

function categoryHref(cat: NavCatalogCategory): string {
  if (cat.url_path) return `/${cat.url_path}`;
  if (cat.url_key) return `/${cat.url_key}`;
  return `/catalog?category=${cat.id}`;
}

export const NavCatalogDropdown = ({
  categoryList,
  onClose,
}: {
  categoryList: NavCatalogCategory[];
  onClose: () => void;
}) => {
  const router = useRouter();

  // categoryList[0] is the Magento root ("Default Category"); its children are the real nav categories
  const NAV_CATEGORY_IDS = new Set([9, 221, 4, 3, 10, 7, 48]);
  const topCategories = (categoryList[0]?.children ?? []).filter((c) =>
    NAV_CATEGORY_IDS.has(c.id)
  );

  const [active, setActive] = useState<NavCatalogCategory | null>(
    topCategories[0] ?? null
  );
  const displayChildren = active?.children ?? [];

  return (
    <div className="absolute left-0 right-0 z-50 bg-white shadow-xl max-h-[75vh] overflow-y-auto lg:max-h-none lg:overflow-visible">
      <div className="flex flex-col lg:flex-row">
        {/* Left: category list */}
        <ul className="w-full lg:w-104 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 py-4">
          {topCategories.map((cat) => {
            const isActive = active?.id === cat.id;
            return (
              <li key={cat.id}>
                <button
                  onMouseEnter={() => setActive(cat)}
                  onClick={() => {
                    onClose();
                    router.push(categoryHref(cat));
                  }}
                  className={`w-full grid grid-cols-[1.25rem_1fr_1.25rem] items-center gap-3 px-6 py-2.5 text-[20px]! leading-normal transition-colors cursor-pointer ${
                    isActive
                      ? "text-brand-nav font-semibold"
                      : "text-gray-700 hover:text-brand-nav"
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full border-2 border-red-600 justify-self-center transition-opacity duration-200 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <span className="text-left">{cat.name}</span>
                  <ChevronRight
                    size={16}
                    className={`justify-self-end transition-opacity duration-200 text-brand-action ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Right: subcategories (desktop only) */}
        <div className="hidden lg:block flex-1 px-10 py-6">
          {active && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 pb-3 mb-5 border-b border-gray-200">
                {active.name}
              </h3>
              <div className="flex flex-col gap-3">
                {displayChildren.map((child) => (
                  <Link
                    key={child.id}
                    href={categoryHref(child)}
                    className="text-gray-700 hover:text-brand-action text-[18px]!"
                    onClick={onClose}
                  >
                    {child.name}
                  </Link>
                ))}
                {displayChildren.length === 0 && (
                  <Link
                    href={categoryHref(active)}
                    className="text-brand-action font-medium text-[18px]!"
                    onClick={onClose}
                  >
                    Виж всички продукти
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
