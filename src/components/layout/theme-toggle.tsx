"use client";

import { cn } from "@/lib/cn";

type Theme = "light" | "dark";

interface ThemeToggleProps {
  className?: string;
}

function getCurrentTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  window.localStorage.setItem("margin-theme", theme);
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const toggleTheme = () => {
    if (document.documentElement.classList.contains("theme-transitioning")) {
      return;
    }

    const nextTheme: Theme = getCurrentTheme() === "dark" ? "light" : "dark";
    const root = document.documentElement;

    if (prefersReducedMotion()) {
      applyTheme(nextTheme);
      return;
    }

    const run = () => {
      root.classList.add("theme-transitioning");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          applyTheme(nextTheme);
          window.setTimeout(() => {
            root.classList.remove("theme-transitioning");
          }, 760);
        });
      });
    };

    const documentWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => unknown;
    };

    if (typeof documentWithTransition.startViewTransition === "function") {
      documentWithTransition.startViewTransition(run);
      return;
    }

    run();
  };

  return (
    <button
      aria-label="다크모드와 라이트모드 전환"
      className={cn(
        "chrome-surface inline-flex h-9 items-center gap-2 rounded-full border border-line-solid bg-bg-normal/90 px-3 text-label-strong shadow-xs transition-[background-color,border-color,box-shadow,transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "md:hover:-translate-y-px md:hover:bg-fill-alternative",
        className,
      )}
      onClick={toggleTheme}
      type="button"
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 2.5v2M12 19.5v2M4.7 4.7l1.4 1.4M17.9 17.9l1.4 1.4M2.5 12h2M19.5 12h2M4.7 19.3l1.4-1.4M17.9 6.1l1.4-1.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
          <circle cx="10.5" cy="10.5" fill="currentColor" r="3.6" />
          <path
            d="M19.8 14.7a4.8 4.8 0 1 1-4.5-6.5 5.7 5.7 0 0 0 4.5 6.5Z"
            fill="currentColor"
            opacity="0.52"
          />
        </svg>
      </span>
      <span className="type-caption">테마</span>
    </button>
  );
}
