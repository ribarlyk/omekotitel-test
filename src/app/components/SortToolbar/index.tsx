"use client";

import { useState, useRef, useEffect } from "react";
import { LayoutGrid, LayoutList, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";

export type SortDir = "ASC" | "DESC";
export type ViewMode = "grid" | "list";

export const SORT_OPTIONS = [
  { value: "position", label: "Позиция" },
  { value: "name", label: "Наименование" },
  { value: "price", label: "Цена" },
];

export const SEARCH_SORT_OPTIONS = [
  { value: "relevance", label: "Релевантност" },
  { value: "name", label: "Наименование" },
  { value: "price", label: "Цена" },
];

interface SortToolbarProps {
  totalCount: number;
  currentCount: number;
  currentPage: number;
  pageSize: number;
  sortField: string;
  sortDir: SortDir;
  view: ViewMode;
  onSortChange: (field: string, dir: SortDir) => void;
  onViewChange: (view: ViewMode) => void;
  sortOptions?: { value: string; label: string }[];
}

export default function SortToolbar({
  totalCount,
  currentCount,
  currentPage,
  pageSize,
  sortField,
  sortDir,
  view,
  onSortChange,
  onViewChange,
  sortOptions = SORT_OPTIONS,
}: SortToolbarProps) {
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, from + currentCount - 1);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = sortOptions.find((o) => o.value === sortField)?.label ?? sortField;
  const toggleDir = () => onSortChange(sortField, sortDir === "ASC" ? "DESC" : "ASC");

  return (
    <div className="flex items-center gap-2 py-2 px-3 border border-gray-200 bg-white mb-4 text-sm text-gray-600">
      {/* View toggle */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => onViewChange("grid")}
          className={`p-1.5 rounded transition-colors ${view === "grid" ? "text-brand-action" : "text-gray-400 hover:text-gray-600"}`}
          aria-label="Мрежа"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewChange("list")}
          className={`p-1.5 rounded transition-colors ${view === "list" ? "text-brand-action" : "text-gray-400 hover:text-gray-600"}`}
          aria-label="Списък"
        >
          <LayoutList className="w-4 h-4" />
        </button>
      </div>

      <div className="h-4 w-px bg-gray-200 shrink-0" />

      {/* Item count */}
      <span className="hidden sm:block shrink-0 text-xs">
        Артикули {from}–{to} от {totalCount}
      </span>
      <span className="sm:hidden shrink-0 text-xs">
        {from}–{to} от {totalCount}
      </span>

      <div className="flex-1" />

      <span className="hidden sm:block shrink-0 text-xs font-medium text-gray-700">Сортирай по</span>

      {/* Custom dropdown */}
      <div ref={ref} className="relative shrink-0">
        <button
          onClick={() => setOpen((p) => !p)}
          className={`h-7 flex items-center gap-1.5 px-2 border rounded text-xs text-gray-700 bg-white transition-colors ${open ? "border-brand-action" : "border-gray-300 hover:border-gray-400"}`}
        >
          <span>{selectedLabel}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded shadow-lg min-w-full overflow-hidden">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onSortChange(opt.value, sortDir); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs whitespace-nowrap transition-colors ${
                  opt.value === sortField
                    ? "bg-brand-action/10 text-brand-action font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Direction toggle */}
      <button
        onClick={toggleDir}
        className="h-7 w-7 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:border-brand-action hover:text-brand-action transition-colors"
        aria-label={sortDir === "ASC" ? "Низходящо" : "Възходящо"}
      >
        {sortDir === "ASC" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
