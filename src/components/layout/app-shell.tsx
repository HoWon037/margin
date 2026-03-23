import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RouteScrollReset } from "@/components/layout/route-scroll-reset";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import type { GroupSummary, UserSummary } from "@/lib/types";

interface AppShellProps {
  group: GroupSummary;
  currentUser: UserSummary;
  isOwner: boolean;
  children: ReactNode;
}

export function AppShell({
  group,
  currentUser,
  isOwner,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg-alternative">
      <RouteScrollReset />
      <TopBar
        currentUser={currentUser}
        groupId={group.id}
        groupName={group.name}
        isOwner={isOwner}
      />
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 pb-36 pt-3 sm:px-5 sm:pt-4 md:pb-14 lg:gap-8 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <Sidebar group={group} />
        </aside>
        <main className="min-w-0 space-y-6">{children}</main>
      </div>
      <BottomNav groupId={group.id} />
    </div>
  );
}
