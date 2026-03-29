"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface Office {
  id: number;
  name: string;
  address: {
    city: { name: string; postCode: string };
    fullAddress: string;
  };
}

interface Props {
  value: Office | null;
  onChange: (office: Office) => void;
  placeholder?: string;
}

export function CourierOfficeSelector({
  value,
  onChange,
  placeholder = "Моля, изберете офис на куриер",
}: Props) {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (offices.length > 0 || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    
    // Use promise chain to manage loading state
    Promise.resolve()
      .then(() => setLoading(true))
      .then(() => fetch("/api/econt/offices"))
      .then((r) => r.json())
      .then((d) => setOffices(d.offices ?? []))
      .finally(() => setLoading(false));
  }, [offices.length]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onScroll = (e: Event) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const isDesktop = window.innerWidth >= 1024;
    document.addEventListener("mousedown", onClickOutside);
    if (isDesktop) document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      if (isDesktop) document.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return offices;
    const q = query.toLowerCase();
    return offices.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.address.city.name.toLowerCase().includes(q) ||
        o.address.fullAddress.toLowerCase().includes(q)
    );
  }, [offices, query]);

  const formatLabel = (o: Office) => {
    const street = o.address.fullAddress.replace(o.address.city.name, "").trim();
    return `${o.name} ( ${street} )`;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm transition-colors hover:border-gray-300 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/20"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? formatLabel(value) : loading ? "Зареждане…" : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Търсене по град или адрес…"
              className="flex-1 text-sm outline-none placeholder-gray-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X size={14} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* List */}
          <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <li className="px-4 py-3 text-sm text-gray-400">Зареждане…</li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400">Няма намерени офиси</li>
            ) : (
              filtered.map((office) => (
                <li
                  key={office.id}
                  onClick={() => { onChange(office); setOpen(false); setQuery(""); }}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    value?.id === office.id ? "bg-brand-action/5" : ""
                  }`}
                >
                  <span className="text-sm text-gray-800">{formatLabel(office)}</span>
                  <span className="ml-3 shrink-0 font-bold text-[#003087] text-xs tracking-wide">
                    <span className="text-orange-500">*</span>ЕКОНТ
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
