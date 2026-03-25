"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getGroupNavigation } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function BottomNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();

  const items = getGroupNavigation(groupId);
  const hidden = pathname.endsWith("/log") || pathname.endsWith("/settings");
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.href === pathname),
  );

  if (hidden) {
    return null;
  }

  return (
    <nav className="mobile-safe-bottom fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 md:hidden">
      <div className="chrome-surface pointer-events-auto relative grid w-full max-w-[20.5rem] grid-cols-4 rounded-full border border-line-solid/85 p-1.25 shadow-sm backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="absolute top-1.25 bottom-1.25 left-1.25 rounded-full bg-fill-strong shadow-xs transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
          style={{
            width: `calc((100% - 10px) / ${items.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {items.map((item) => {
          const active = item.href === pathname;
          return (
            <Link
              key={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative z-10 flex min-w-0 items-center justify-center rounded-full px-2.5 py-[0.72rem] text-center type-caption transition-[color,transform] duration-300",
                active
                  ? "translate-y-0 text-label-strong"
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
