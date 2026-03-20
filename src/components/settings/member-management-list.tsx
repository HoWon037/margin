"use client";

import { removeMemberAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
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
            <form
              action={removeMemberAction}
              onSubmit={(event) => {
                if (!window.confirm(`정말 ${member.nickname}님을 내보내시겠습니까?`)) {
                  event.preventDefault();
                }
              }}
            >
              <input name="groupId" type="hidden" value={groupId} />
              <input
                name="memberUserId"
                type="hidden"
                value={member.userId}
              />
              <Button
                disabled={!isOwner}
                size="sm"
                type="submit"
                variant="danger"
              >
                내보내기
              </Button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
