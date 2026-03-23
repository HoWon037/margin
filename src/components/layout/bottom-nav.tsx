"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getGroupNavigation } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function BottomNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();
  const items = getGroupNavigation(groupId);
  const hidden = pathname.endsWith("/log") || pathname.endsWith("/settings");

  if (hidden) {
    return null;
  }

  return (
    <nav className="mobile-safe-bottom fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 md:hidden">
      <div className="chrome-surface pointer-events-auto inline-flex items-center gap-1 rounded-full border border-line-solid/90 bg-bg-normal/92 p-1.5 shadow-sm backdrop-blur-xl">
        {items.map((item) => {
          const active = item.href === pathname;
          return (
            <Link
              key={item.href}
              className={cn(
                "flex min-w-[64px] items-center justify-center rounded-full px-3 py-2 text-center type-caption transition",
                active
                  ? "bg-fill-strong text-label-strong shadow-xs"
                  : "text-label-assistive",
              )}
              href={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
