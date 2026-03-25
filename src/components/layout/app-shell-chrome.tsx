"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BottomNav } from "@/components/layout/bottom-nav";
import { GroupRoutePrefetch } from "@/components/layout/group-route-prefetch";
import { RouteScrollReset } from "@/components/layout/route-scroll-reset";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import type { GroupSummary, UserSummary } from "@/lib/types";

interface AppShellChromeProps {
  currentUser: UserSummary;
  group: GroupSummary;
  isOwner: boolean;
}

export function AppShellChrome({
  currentUser,
  group,
  isOwner,
}: AppShellChromeProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const topTarget =
    ready ? document.getElementById("app-shell-top-chrome") : null;
  const sidebarTarget =
    ready ? document.getElementById("app-shell-sidebar-chrome") : null;
  const bottomTarget =
    ready ? document.getElementById("app-shell-bottom-chrome") : null;

  return (
    <>
      <GroupRoutePrefetch groupId={group.id} />
      <RouteScrollReset />
      {topTarget
        ? createPortal(
            <TopBar
              currentUser={currentUser}
              groupId={group.id}
              groupName={group.name}
              isOwner={isOwner}
            />,
            topTarget,
          )
        : null}
      {sidebarTarget
        ? createPortal(
            <Sidebar group={group} />,
            sidebarTarget,
          )
        : null}
      {bottomTarget
        ? createPortal(
            <BottomNav groupId={group.id} />,
            bottomTarget,
          )
        : null}
    </>
  );
}
