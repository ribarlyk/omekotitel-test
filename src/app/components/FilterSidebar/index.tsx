"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface AggregationOption {
  label: string;
  value: string;
  count: number;
}

export interface Aggregation {
  attribute_code: string;
  label: string;
  count: number;
  options: AggregationOption[];
}

export type ActiveFilters = Record<string, string[]>;

interface FilterSidebarProps {
  aggregations: Aggregation[];
  activeFilters: ActiveFilters;
  onToggle: (code: string, value: string) => void;
  onClearAll: () => void;
  showHeader?: boolean;
  fullWidth?: boolean;
}

const EXCLUDED = new Set(["category_id", "category_uid"]);

function formatPriceLabel(value: string): string {
  const [from, to] = value.split("_");
  const fmt = (n: string) => {
    const num = parseFloat(n);
    return isNaN(num) ? null : num.toFixed(2).replace(".", ",") + " €";
  };
  const fromFmt = from === "*" ? null : fmt(from);
  const toFmt   = to   === "*" ? null : fmt(to);
  if (fromFmt && toFmt)  return `${fromFmt} - ${toFmt}`;
  if (fromFmt && !toFmt) return `${fromFmt} и нагоре`;
  if (!fromFmt && toFmt) return `до ${toFmt}`;
  return value;
}

const LABEL_BG: Record<string, string> = {
  Price: "Цена",
  Brand: "Марка",
  Color: "Цвят",
  Size: "Размер",
  Material: "Материал",
  Category: "Категория",
};

export default function FilterSidebar({ aggregations, activeFilters, onToggle, onClearAll, showHeader = true, fullWidth = false }: FilterSidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const visible = aggregations.filter(
    (a) => !EXCLUDED.has(a.attribute_code) && a.options.length > 0
  );

  const hasActive = Object.keys(activeFilters).length > 0;

  const toggleSection = (code: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });

  return (
    <aside className={fullWidth ? "w-full" : "w-52 shrink-0"}>
      {showHeader && (
        <div className="bg-brand-nav text-white px-3 py-1.5">
          <h2 className="font-bold text-xs uppercase tracking-wide">Пазаруване По</h2>
        </div>
      )}

      <div className={fullWidth ? "" : `border border-gray-200 ${showHeader ? "border-t-0" : ""}`}>
        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Опции за пазаруване
          </span>
          {hasActive && (
            <button
              onClick={onClearAll}
              className="text-xs text-brand-action hover:underline font-medium"
            >
              Изчисти
            </button>
          )}
        </div>

        {visible.map((agg) => {
          const isOpen = expanded.has(agg.attribute_code);
          const activeCount = activeFilters[agg.attribute_code]?.length ?? 0;

          return (
            <div key={agg.attribute_code} className="border-b border-gray-200 last:border-0">
              <button
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${isOpen ? "bg-gray-50 text-gray-900" : "text-gray-700 hover:bg-gray-50"}`}
                onClick={() => toggleSection(agg.attribute_code)}
              >
                <span className="flex items-center gap-2 text-left">
                  {LABEL_BG[agg.label] ?? agg.label}
                  {activeCount > 0 && (
                    <span className="bg-brand-action text-white text-xs rounded-full w-3.5 h-3.5 flex items-center justify-center shrink-0">
                      {activeCount}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="px-3 pb-2 space-y-0.5">
                  {agg.options.map((opt) => {
                    const isActive = activeFilters[agg.attribute_code]?.includes(opt.value) ?? false;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onToggle(agg.attribute_code, opt.value)}
                        className="w-full flex items-center justify-between text-xs py-1 px-1 rounded hover:bg-gray-50 transition-colors group"
                      >
                        <span className="flex items-center gap-1.5 text-left min-w-0">
                          <span
                            className={`w-3 h-3 border rounded shrink-0 transition-colors ${
                              isActive
                                ? "bg-brand-action border-brand-action"
                                : "border-gray-300 group-hover:border-gray-500"
                            }`}
                          />
                          <span className={`truncate ${isActive ? "text-brand-action font-medium" : "text-gray-600"}`}>
                            {agg.attribute_code === "price" ? formatPriceLabel(opt.value) : opt.label}
                          </span>
                        </span>
                        <span className="text-gray-400 text-xs ml-1.5 shrink-0">{opt.count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
