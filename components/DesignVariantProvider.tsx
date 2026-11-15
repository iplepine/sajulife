"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export type DesignVariant = "a" | "b";
const COOKIE = "sajulife_design";
const DesignContext = createContext<DesignVariant>("a");

/** A is the existing service. B is explicitly selected; no visitor allocation or tracking. */
export default function DesignVariantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [variant, setVariant] = useState<DesignVariant>("a");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("design");
    const saved = document.cookie.split("; ").find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    const selected: DesignVariant = query === "a" || query === "b" ? query : saved === "b" ? "b" : "a";
    setVariant(selected);
    if (query === "a" || query === "b") {
      document.cookie = `${COOKIE}=${selected}; Path=/; Max-Age=2592000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    }
    if (selected === "b") document.documentElement.dataset.design = "b";
    else delete document.documentElement.dataset.design;
  }, [pathname]);

  return <DesignContext.Provider value={variant}>{children}</DesignContext.Provider>;
}

export function useDesignVariant(): DesignVariant {
  return useContext(DesignContext);
}
