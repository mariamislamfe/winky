"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/pixel";

/**
 * PageView on the first load and on every page change: the store navigates
 * without full reloads, so Meta's snippet alone would only count the first page.
 */
export function MetaPixel() {
  const pathname = usePathname();
  useEffect(() => {
    track("PageView");
  }, [pathname]);
  return null;
}
