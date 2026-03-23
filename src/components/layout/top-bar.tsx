"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileLink } from "@/components/layout/profile-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { UserSummary } from "@/lib/types";

interface TopBarProps {
  groupId: string;
  groupName: string;
  isOwner: boolean;
  currentUser: UserSummary;
}

export function TopBar({
  groupId,
  groupName,
  isOwner,
  currentUser,
}: TopBarProps) {
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isFloatingMobile, setIsFloatingMobile] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = pathname
    ? `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    : "";
  const profileHref = currentPath
    ? `/profile?returnTo=${encodeURIComponent(currentPath)}`
    : "/profile";

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");

    const updateFloatingState = () => {
      const isMobile = mobileQuery.matches;
      const nextValue = isMobile && window.scrollY > 18;
      setIsMobileViewport((current) =>
        current === isMobile ? current : isMobile,
      );
      setIsFloatingMobile((current) =>
        current === nextValue ? current : nextValue,
      );
    };

    updateFloatingState();
    window.addEventListener("scroll", updateFloatingState, { passive: true });
    window.addEventListener("resize", updateFloatingState);
    mobileQuery.addEventListener("change", updateFloatingState);

    return () => {
      window.removeEventListener("scroll", updateFloatingState);
      window.removeEventListener("resize", updateFloatingState);
      mobileQuery.removeEventListener("change", updateFloatingState);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transform-gpu transition-[background-color,border-color,backdrop-filter,box-shadow,padding] duration-600 ease-[cubic-bezier(0.18,0.9,0.32,1)]",
        isFloatingMobile
          ? "border-transparent bg-bg-alternative/12"
          : isMobileViewport
            ? "border-transparent bg-transparent"
          : "chrome-surface border-b border-line-solid bg-bg-alternative/90 backdrop-blur",
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-[1440px] px-4 pt-4 transition-[padding,transform] duration-600 ease-[cubic-bezier(0.18,0.9,0.32,1)] sm:px-5",
          isFloatingMobile && "pt-3",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-4 pb-4 transition-[padding,transform,opacity] duration-600 ease-[cubic-bezier(0.18,0.9,0.32,1)]",
            isFloatingMobile && "translate-y-0.5 pb-1",
          )}
        >
          <div className="flex min-w-0 items-center gap-3 rounded-full border border-transparent px-0 py-0 transform-gpu transition-[padding,border-color,background-color,box-shadow,transform,opacity] duration-600 ease-[cubic-bezier(0.18,0.9,0.32,1)]">
            <ProfileLink
              className={cn(
                "max-w-[180px] sm:max-w-[220px]",
                isFloatingMobile &&
                  "shadow-sm md:hover:bg-fill-alternative",
              )}
              href={profileHref}
              user={currentUser}
            />
            <p className="hidden min-w-0 truncate type-label text-label-assistive sm:block">
              {groupName}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border border-transparent px-1.5 py-1.5 transform-gpu transition-[background-color,border-color,box-shadow,transform,opacity,padding] duration-600 ease-[cubic-bezier(0.18,0.9,0.32,1)]",
              isFloatingMobile &&
                "chrome-surface border-line-solid shadow-sm",
            )}
          >
            <ThemeToggle
              className={cn(
                "rounded-full",
                isFloatingMobile &&
                  "border-line-solid/90 bg-bg-normal/92 shadow-xs md:hover:bg-fill-alternative",
              )}
            />
            {isOwner ? (
              <Link
                className={buttonStyles({
                  variant: "secondary",
                  size: "sm",
                  className: cn(
                    "rounded-full px-3",
                    isFloatingMobile &&
                      "h-9 border-line-solid/90 bg-bg-normal/92 px-3 shadow-xs md:hover:bg-fill-alternative",
                  ),
                })}
                href={`/group/${groupId}/settings`}
              >
                관리
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
