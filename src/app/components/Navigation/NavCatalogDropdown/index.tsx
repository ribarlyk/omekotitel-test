"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NavCatalogCategory } from "../../../constants";

function categoryHref(cat: NavCatalogCategory): string {
  if (cat.url_path) return `/${cat.url_path}`;
  if (cat.url_key) return `/${cat.url_key}`;
  return "/";
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

  const firstSubWithChildren = (cat: NavCatalogCategory) =>
    cat.children?.find((c) => (c.children?.length ?? 0) > 0) ?? null;

  const [active, setActive] = useState<NavCatalogCategory | null>(
    topCategories[0] ?? null
  );
  const [activeSub, setActiveSub] = useState<NavCatalogCategory | null>(
    topCategories[0] ? firstSubWithChildren(topCategories[0]) : null
  );

  const handleSetActive = (cat: NavCatalogCategory) => {
    setActive(cat);
    setActiveSub(firstSubWithChildren(cat));
  };

  const displayChildren = active?.children ?? [];
  const displayGrandChildren = activeSub?.children ?? [];

  return (
    <div className="absolute left-0 right-0 z-50 bg-white shadow-xl max-h-[75vh] overflow-y-auto lg:max-h-none lg:overflow-visible">
      <div className="flex flex-col lg:flex-row">
        {/* Col 1: top categories */}
        <ul className="w-full lg:w-104 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 py-4">
          {topCategories.map((cat) => {
            const isActive = active?.id === cat.id;
            return (
              <li key={cat.id}>
                <button
                  onMouseEnter={() => handleSetActive(cat)}
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

        {/* Col 2: subcategories (desktop only) */}
        <div className="hidden lg:flex lg:flex-col w-96 shrink-0 border-r border-gray-100 px-8 py-6">
          {active && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 pb-3 mb-5 border-b border-gray-200">
                {active.name}
              </h3>
              <div className="flex flex-col gap-3">
                {displayChildren.length === 0 ? (
                  <Link
                    href={categoryHref(active)}
                    className="text-brand-nav font-medium text-[18px]!"
                    onClick={onClose}
                  >
                    Виж всички продукти
                  </Link>
                ) : (
                  displayChildren.map((child) => {
                    const hasChildren = (child.children?.length ?? 0) > 0;
                    const isActiveSub = activeSub?.id === child.id;
                    return (
                      <div
                        key={child.id}
                        className="grid grid-cols-[1.25rem_1fr_1.25rem] items-center gap-3 group"
                        onMouseEnter={() =>
                          setActiveSub(hasChildren ? child : null)
                        }
                      >
                        <span
                          className={`block w-3.5 h-3.5 rounded-full border-2 border-red-600 justify-self-center transition-opacity duration-200 ${
                            isActiveSub ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <Link
                          href={categoryHref(child)}
                          className={`text-[18px]! transition-colors ${
                            isActiveSub
                              ? "text-brand-nav font-semibold"
                              : "text-gray-700 hover:text-brand-nav"
                          }`}
                          onClick={onClose}
                        >
                          {child.name}
                        </Link>
                        {hasChildren ? (
                          <ChevronRight
                            size={14}
                            className="justify-self-end shrink-0 text-brand-nav opacity-40"
                          />
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Col 3: grandchildren (desktop only) */}
        <div className="hidden lg:flex lg:flex-col flex-1 px-8 py-6">
          {activeSub && displayGrandChildren.length > 0 && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 pb-3 mb-5 border-b border-gray-200">
                {activeSub.name}
              </h3>
              <div className="flex flex-col gap-3">
                {displayGrandChildren.map((gc) => (
                  <Link
                    key={gc.id}
                    href={categoryHref(gc)}
                    className="text-gray-700 hover:text-brand-nav text-[18px]!"
                    onClick={onClose}
                  >
                    {gc.name}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
