import { regenerateInviteCodeAction } from "@/app/actions";
import { GroupSettingsForm } from "@/components/forms/group-settings-form";
import { DeleteGroupForm } from "@/components/settings/delete-group-form";
import { MemberManagementList } from "@/components/settings/member-management-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGroupWorkspace } from "@/lib/data/queries";
import { formatDateLong } from "@/lib/date";
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
    <div className="space-y-5">
      {!isOwner ? (
        <Card className="space-y-2">
          <p className="type-headline text-label-strong">접근 제한</p>
          <p className="type-body text-label-alternative">
            이 화면은 모임장만 볼 수 있습니다.
          </p>
        </Card>
      ) : (
        <>
          <GroupSettingsForm group={workspace.group} isOwner={isOwner} />

          <Card className="space-y-2">
            <p className="type-headline text-label-strong">기록 시작일</p>
            <p className="type-body text-label-strong">
              {formatDateLong(workspace.group.recordStartDate)}
            </p>
            <p className="type-caption text-label-assistive">
              주차는 이 월요일부터 1주차로 계산됩니다.
            </p>
          </Card>

          <Card className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="type-headline text-label-strong">초대 코드</p>
                <div className="inline-flex rounded-2xl bg-fill-alternative px-4 py-3">
                  <p className="font-mono text-[1.125rem] font-semibold tracking-[0.22em] text-label-strong">
                    {workspace.group.inviteCode}
                  </p>
                </div>
              </div>
              <form action={regenerateInviteCodeAction}>
                <input name="groupId" type="hidden" value={groupId} />
                <Button type="submit" variant="secondary">
                  초대 코드 다시 만들기
                </Button>
              </form>
            </div>
          </Card>

          <Card className="space-y-4">
            <p className="type-headline text-label-strong">멤버</p>
            <MemberManagementList
              groupId={groupId}
              isOwner={isOwner}
              members={workspace.members}
            />
          </Card>

          <Card className="space-y-4 border-negative/15">
            <p className="type-headline text-label-strong">모임 관리</p>
            <DeleteGroupForm groupId={groupId} />
          </Card>
        </>
      )}
    </div>
  );
}
