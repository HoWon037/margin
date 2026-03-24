"use client";

import { removeMemberAction } from "@/app/actions";
import { Chip } from "@/components/ui/chip";
import { ConfirmActionDialog } from "@/components/ui/modal";
import type { MemberSummary } from "@/lib/types";
import { formatMemberRole } from "@/lib/utils";

interface MemberManagementListProps {
  groupId: string;
  isOwner: boolean;
  members: MemberSummary[];
}

export function MemberManagementList({
  groupId,
  isOwner,
  members,
}: MemberManagementListProps) {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.userId}
          className="flex min-h-[76px] items-center justify-between gap-4 rounded-2xl bg-fill-alternative p-4"
        >
          <div className="min-w-0 space-y-1">
            <p className="type-label text-label-strong">{member.nickname}</p>
            <p className="type-caption text-label-assistive">
              {formatMemberRole(member.role)}
            </p>
          </div>

          {member.role === "owner" ? (
            <Chip tone="primary">{formatMemberRole(member.role)}</Chip>
          ) : (
            <ConfirmActionDialog
              action={removeMemberAction}
              confirmLabel="내보내기"
              description={`${member.nickname}님은 이 모임의 기록을 더 이상 볼 수 없게 됩니다.`}
              disabled={!isOwner}
              fields={{ groupId, memberUserId: member.userId }}
              title={`${member.nickname}님을 내보낼까요?`}
              triggerLabel="내보내기"
            />
          )}
        </div>
      ))}
    </div>
  );
}
