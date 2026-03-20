"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ProfileLink } from "@/components/layout/profile-link";
import { buttonStyles } from "@/components/ui/button";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = pathname
    ? `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    : "";
  const profileHref = currentPath
    ? `/profile?returnTo=${encodeURIComponent(currentPath)}`
    : "/profile";

  return (
    <header className="sticky top-0 z-30 border-b border-line-solid bg-bg-alternative/90 backdrop-blur">
      <div className="mx-auto max-w-[1440px] px-4 pt-4 sm:px-5">
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <ProfileLink
              className="max-w-[180px] sm:max-w-[220px]"
              href={profileHref}
              user={currentUser}
            />
            <p className="hidden min-w-0 truncate type-label text-label-assistive sm:block">
              {groupName}
            </p>
          </div>
          {isOwner ? (
            <div className="flex items-center gap-2">
              <Link
                className={buttonStyles({ variant: "secondary", size: "sm" })}
                href={`/group/${groupId}/settings`}
              >
                관리
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
