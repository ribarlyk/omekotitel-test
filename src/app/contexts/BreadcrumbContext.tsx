"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const SESSION_KEY = "breadcrumb_last_category_path";

interface BreadcrumbContextValue {
  lastCrumbLabel: string | null;
  setLastCrumbLabel: (label: string | null) => void;
  lastCategoryPath: string | null;
  setLastCategoryPath: (path: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  lastCrumbLabel: null,
  setLastCrumbLabel: () => {},
  lastCategoryPath: null,
  setLastCategoryPath: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [lastCrumbLabel, setLastCrumbLabel] = useState<string | null>(null);
  const [lastCategoryPath, setLastCategoryPathState] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- must run client-side after hydration; initializing to null keeps server/client in sync
    if (stored) setLastCategoryPathState(stored);
  }, []);

  const setLastCategoryPath = useCallback((path: string | null) => {
    setLastCategoryPathState(path);
    if (typeof window === "undefined") return;
    if (path) sessionStorage.setItem(SESSION_KEY, path);
    else sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ lastCrumbLabel, setLastCrumbLabel, lastCategoryPath, setLastCategoryPath }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}
