import { GroupSettingsPanel } from "@/components/settings/group-settings-panel";
import { getGroupWorkspace } from "@/lib/data/queries";
import { notFound } from "next/navigation";

interface SettingsPageProps {
  params: Promise<{ groupId: string }>;
}

export default async function SettingsPage({
  params,
}: SettingsPageProps) {
  const { groupId } = await params;
  const workspace = await getGroupWorkspace(groupId);

  if (!workspace) {
    notFound();
  }

  const isOwner = workspace.group.ownerId === workspace.me.id;

  return (
    <GroupSettingsPanel
      group={workspace.group}
      groupId={groupId}
      isOwner={isOwner}
      members={workspace.members}
    />
  );
}
