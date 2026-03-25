"use client";

import Link from "next/link";
import { deleteReadingLogAction } from "@/app/actions";
import { ConfirmActionDialog } from "@/components/ui/modal";
import { OverflowMenu } from "@/components/ui/overflow-menu";

interface ReadingLogActionsMenuProps {
  groupId: string;
  logId: string;
}

const dangerMenuItemClassName =
  "h-auto w-full justify-start rounded-[14px] border border-negative/20 bg-negative/8 px-3 py-2 type-label text-negative shadow-none";
const menuTriggerClassName =
  "h-[22px] w-[22px] border-0 bg-transparent p-0 shadow-none md:hover:bg-fill-alternative";

export function ReadingLogActionsMenu({
  groupId,
  logId,
}: ReadingLogActionsMenuProps) {
  return (
    <OverflowMenu
      buttonClassName={menuTriggerClassName}
      panelClassName="w-[176px]"
    >
      {() => (
        <div className="space-y-1">
          <Link
            className="inline-flex w-full items-center rounded-[14px] border border-line-solid px-3 py-2 type-label text-label-strong transition md:hover:bg-fill-alternative"
            href={`/group/${groupId}/log?edit=${logId}`}
          >
            수정
          </Link>
          <ConfirmActionDialog
            action={deleteReadingLogAction}
            confirmLabel="삭제"
            description="삭제한 기록은 되돌릴 수 없습니다."
            fields={{ groupId, logId }}
            title="이 기록을 삭제할까요?"
            tone="danger"
            triggerBlock
            triggerClassName={dangerMenuItemClassName}
            triggerLabel="삭제"
            triggerSize="md"
            triggerVariant="danger"
          />
        </div>
      )}
    </OverflowMenu>
  );
}
