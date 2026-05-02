"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { NavCatalogCategory } from "@/src/app/constants";
import { useBreadcrumb } from "@/src/app/contexts/BreadcrumbContext";

const STATIC_LABELS: Record<string, string> = {
  products: "Продукти",
  catalog: "Каталог",
  search: "Търсене",
  profil: "Профил",
  onestepcheckout: "Поръчка",
  success: "Успешна поръчка",
  dostavka: "Доставка",
  "nachini-za-plaschane": "Начини за плащане",
  "obschi-uslovija": "Общи условия",
  "privacy-policy-cookie-restriction-mode": "Политика за поверителност",
  "vr-schane-na-por-chka": "Връщане на поръчка",
  "za-nas": "За нас",
  "forgot-password": "Забравена парола",
  sales: "Профил",
  order: "Поръчки",
  history: "История",
  view: "Преглед",
  order_id: "Поръчка",
  customer: "Профил",
  account: "Акаунт",
  edit: "Редактирай",
  address: "Адрес",
  new: "Нов",
  createPassword: "Нова парола",
};

function findCategoryByUrlKey(
  list: NavCatalogCategory[],
  urlKey: string,
): NavCatalogCategory | null {
  for (const cat of list) {
    if (cat.url_key === urlKey) return cat;
    if (cat.children?.length) {
      const found = findCategoryByUrlKey(cat.children, urlKey);
      if (found) return found;
    }
  }
  return null;
}

function resolveLabel(segment: string, categoryList: NavCatalogCategory[]): string {
  const cat = findCategoryByUrlKey(categoryList, segment);
  if (cat) return cat.name;
  if (STATIC_LABELS[segment]) return STATIC_LABELS[segment];
  return decodeURIComponent(segment).replace(/-/g, " ");
}

interface BreadcrumbProps {
  categoryList: NavCatalogCategory[];
}

export function Breadcrumb({ categoryList }: BreadcrumbProps) {
  const pathname = usePathname();
  const { lastCrumbLabel, lastCategoryPath, setLastCategoryPath } = useBreadcrumb();

  // Save the current path as the category context, but only when it's not a product URL.
  // A single-segment path that isn't a known static page or category is almost certainly
  // a product — skip saving it so we don't overwrite the real category path.
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const isLikelyProduct =
      segments.length === 1 &&
      !STATIC_LABELS[segments[0]] &&
      !findCategoryByUrlKey(categoryList, segments[0]);
    if (!isLikelyProduct) {
      setLastCategoryPath(pathname);
    }
  }, [pathname, setLastCategoryPath, categoryList]);

  if (pathname === "/") return null;
  if (
    pathname.startsWith("/customer/") ||
    pathname.startsWith("/sales/") ||
    pathname.startsWith("/profil")
  ) return null;

  const segments = pathname.split("/").filter(Boolean);

  // Detect product pages by the same heuristic used in the useEffect —
  // this fires immediately on render, before ProductDetail mounts, so we
  // can show "Зарежда се..." instead of the raw URL slug.
  const isLikelyProduct =
    segments.length === 1 &&
    !STATIC_LABELS[segments[0]] &&
    !findCategoryByUrlKey(categoryList, segments[0]);

  const basePath = isLikelyProduct && lastCategoryPath ? lastCategoryPath : pathname;
  const baseSegments = basePath.split("/").filter(Boolean);

  const crumbs = baseSegments.map((segment, index) => {
    const href = "/" + baseSegments.slice(0, index + 1).join("/");
    const label = resolveLabel(segment, categoryList);
    return { href, label, isLast: false };
  });

  // Last crumb: SKU once loaded, "Зарежда се..." while Suspense is still resolving
  const lastLabel = lastCrumbLabel ?? (isLikelyProduct ? "Зарежда се..." : resolveLabel(segments.at(-1) ?? "", categoryList));

  if (!isLikelyProduct) {
    const last = crumbs.pop();
    if (last) crumbs.push({ ...last, isLast: true });
  } else {
    crumbs.push({ href: pathname, label: lastLabel, isLast: true });
  }

  return (
    <div className="hidden lg:block">
    <nav
      aria-label="breadcrumb"
      className="bg-gray-50 border-b border-gray-200"
    >
      <ol className="container mx-auto px-4 py-2 flex flex-wrap items-center gap-1 text-base text-gray-500">
        <li>
          <Link href="/" className="hover:text-gray-800 transition-colors">
            Начало
          </Link>
        </li>
        {crumbs.map(({ href, label, isLast }) => (
          <li key={href} className="flex items-center gap-1">
            <span className="select-none">›</span>
            {isLast ? (
              <span className="text-gray-800 font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-gray-800 transition-colors">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
    </div>
  );
}
