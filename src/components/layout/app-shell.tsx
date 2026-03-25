import type { ReactNode } from "react";
import { AppShellChrome } from "@/components/layout/app-shell-chrome";
import type { GroupSummary, MemberSummary, UserSummary } from "@/lib/types";

interface AppShellProps {
  group: GroupSummary;
  currentUser: UserSummary;
  members: MemberSummary[];
  isOwner: boolean;
  children: ReactNode;
}

export function AppShell({
  group,
  currentUser,
  members,
  isOwner,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg-alternative">
      <div className="min-h-[76px] md:min-h-[84px]" id="app-shell-top-chrome" />
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 pb-36 pt-3 sm:px-5 sm:pt-4 md:pb-14 lg:gap-8 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <div id="app-shell-sidebar-chrome" />
        </aside>
        <main className="min-w-0 space-y-6">{children}</main>
      </div>
      <div id="app-shell-bottom-chrome" />
      <AppShellChrome
        currentUser={currentUser}
        group={group}
        members={members}
        isOwner={isOwner}
      />
    </div>
  );
}
