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

type Courier = "econt" | "speedy";

function formatLabel(o: Office, courier: Courier): string {
  const street =
    courier === "econt"
      ? o.address.fullAddress.replace(o.address.city.name, "").trim()
      : o.address.fullAddress.trim();
  return `${o.name} ( ${street} )`;
}

const COURIER_API: Record<Courier, string> = {
  econt: "/api/econt/offices",
  speedy: "/api/speedy/offices",
};

const officeCache: Partial<Record<Courier, Office[]>> = {};
const officeInflight: Partial<Record<Courier, Promise<Office[]>>> = {};

function fetchOffices(courier: Courier): Promise<Office[]> {
  if (officeCache[courier]) return Promise.resolve(officeCache[courier]!);
  if (officeInflight[courier]) return officeInflight[courier]!;
  const p = fetch(COURIER_API[courier])
    .then((r) => r.json())
    .then((d) => {
      const list: Office[] = d.offices ?? [];
      officeCache[courier] = list;
      delete officeInflight[courier];
      return list;
    })
    .catch(() => {
      delete officeInflight[courier];
      return [] as Office[];
    });
  officeInflight[courier] = p;
  return p;
}

export function prefetchOffices(courier: Courier) {
  fetchOffices(courier);
}

const COURIER_LABEL: Record<Courier, { text: string; className: string }> = {
  econt: {
    text: "ЕКОНТ",
    className: "font-bold text-[#003087] text-xs tracking-wide",
  },
  speedy: {
    text: "SPEEDY",
    className: "font-bold text-[#e30613] text-xs tracking-wide",
  },
};

interface Props {
  value: Office | null;
  onChange: (office: Office) => void;
  courier: Courier;
  placeholder?: string;
}

export function CourierOfficeSelector({
  value,
  onChange,
  courier,
  placeholder = "Моля, изберете офис на куриер",
}: Props) {
  const [offices, setOffices] = useState<Office[]>(() => officeCache[courier] ?? []);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const fetchedCourierRef = useRef<Courier | null>(null);

  useEffect(() => {
    if (!open) return;

    setTimeout(() => searchRef.current?.focus(), 50);

    if (fetchedCourierRef.current === courier) return;
    fetchedCourierRef.current = courier;

    if (officeCache[courier]) return;

    queueMicrotask(() => {
      setLoading(true);
      fetchOffices(courier)
        .then((list) => setOffices(list))
        .finally(() => setLoading(false));
    });
  }, [open, courier]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    const onScroll = (e: Event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
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
        o.address.fullAddress.toLowerCase().includes(q),
    );
  }, [offices, query]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((p) => !p)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((p) => !p)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm cursor-pointer transition-colors hover:border-gray-300 select-none"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value
            ? formatLabel(value, courier)
            : loading
              ? "Зареждане…"
              : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

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

          <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <li className="px-4 py-3 text-sm text-gray-400">Зареждане…</li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400">
                Няма намерени офиси
              </li>
            ) : (
              filtered.map((office) => (
                <li
                  key={office.id}
                  onClick={() => {
                    onChange(office);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    value?.id === office.id ? "bg-brand-action/5" : ""
                  }`}
                >
                  <span className="text-sm text-gray-800">
                    {formatLabel(office, courier)}
                  </span>
                  <span
                    className={`ml-3 shrink-0 ${COURIER_LABEL[courier].className}`}
                  >
                    {COURIER_LABEL[courier].text}
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
