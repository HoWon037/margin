import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getGroupWorkspace } from "@/lib/data/queries";

interface GroupLayoutProps {
  children: ReactNode;
  params: Promise<{ groupId: string }>;
}

export default async function GroupLayout({
  children,
  params,
}: GroupLayoutProps) {
  const { groupId } = await params;
  const workspace = await getGroupWorkspace(groupId);

  if (!workspace) {
    notFound();
  }

  return (
    <AppShell
      currentUser={workspace.me}
      group={workspace.group}
      members={workspace.members}
      isOwner={workspace.group.ownerId === workspace.me.id}
    >
      {children}
    </AppShell>
  );
}
