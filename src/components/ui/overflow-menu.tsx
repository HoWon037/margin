"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { usePresence } from "@/lib/use-presence";

interface OverflowMenuProps {
  children: ReactNode | ((close: () => void) => ReactNode);
  className?: string;
  panelClassName?: string;
  buttonClassName?: string;
}

export function OverflowMenu({
  children,
  className,
  panelClassName,
  buttonClassName,
}: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const present = usePresence(open, 180);
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "chrome-surface inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-solid text-label-alternative transition md:hover:bg-fill-alternative md:hover:text-label-strong",
          buttonClassName,
        )}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="sr-only">더보기</span>
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle cx="5" cy="12" fill="currentColor" r="1.8" />
          <circle cx="12" cy="12" fill="currentColor" r="1.8" />
          <circle cx="19" cy="12" fill="currentColor" r="1.8" />
        </svg>
      </button>

      {present ? (
        <div
          className={cn(
            "card-surface absolute top-11 right-0 z-40 min-w-[176px] origin-top-right rounded-[18px] border border-line-solid/90 p-2 shadow-sm transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            open
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0",
            panelClassName,
          )}
          role="menu"
        >
          {typeof children === "function" ? children(closeMenu) : children}
        </div>
      ) : null}
    </div>
  );
}
