"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function RouteScrollReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resetKey = (() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("book");
    params.delete("member");

    return `${pathname}?${params.toString()}`;
  })();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [resetKey]);

  return null;
}
