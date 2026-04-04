"use client";

import { createContext, useContext, useState } from "react";

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
  const [lastCategoryPath, setLastCategoryPath] = useState<string | null>(null);
  return (
    <BreadcrumbContext.Provider value={{ lastCrumbLabel, setLastCrumbLabel, lastCategoryPath, setLastCategoryPath }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}
