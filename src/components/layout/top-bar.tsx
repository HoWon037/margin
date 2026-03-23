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
    let frameId = 0;

    const updateFloatingState = () => {
      const nextValue = mobileQuery.matches && window.scrollY > 18;
      setIsFloatingMobile((current) =>
        current === nextValue ? current : nextValue,
      );
    };

    const scheduleUpdate = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateFloatingState();
      });
    };

    updateFloatingState();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    mobileQuery.addEventListener("change", scheduleUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      mobileQuery.removeEventListener("change", scheduleUpdate);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transform-gpu border-transparent bg-transparent transition-[background-color,border-color,box-shadow,padding] duration-[600ms] ease-[cubic-bezier(0.18,0.9,0.32,1)] md:chrome-surface md:border-b md:border-line-solid md:bg-bg-alternative/90",
        isFloatingMobile
          ? "pointer-events-none border-transparent bg-transparent shadow-none"
          : "",
      )}
    >
      <div
        className={cn(
          "relative z-10 mx-auto max-w-[1440px] px-4 pt-4 transition-[padding,transform] duration-[600ms] ease-[cubic-bezier(0.18,0.9,0.32,1)] sm:px-5",
          isFloatingMobile && "pt-3",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-4 pb-3 transition-[padding,transform,opacity] duration-[600ms] ease-[cubic-bezier(0.18,0.9,0.32,1)]",
            isFloatingMobile && "translate-y-0.5 pb-1",
          )}
        >
          <div className="flex min-w-0 items-center gap-3 rounded-full border border-transparent px-0 py-0 transform-gpu transition-[padding,border-color,background-color,box-shadow,transform,opacity] duration-[600ms] ease-[cubic-bezier(0.18,0.9,0.32,1)]">
            <ProfileLink
              className={cn(
                "max-w-[180px] sm:max-w-[220px]",
                isFloatingMobile &&
                  "pointer-events-auto shadow-sm md:hover:bg-fill-alternative",
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
              "flex items-center gap-2 rounded-full border border-transparent px-1.5 py-1.5 transform-gpu transition-[background-color,border-color,box-shadow,transform,opacity,padding] duration-[600ms] ease-[cubic-bezier(0.18,0.9,0.32,1)]",
              isFloatingMobile &&
                "pointer-events-auto chrome-surface border-line-solid shadow-sm",
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
