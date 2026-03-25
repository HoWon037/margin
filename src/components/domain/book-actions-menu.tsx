"use client";

import Link from "next/link";
import { deleteBookAction, updateBookStatusAction } from "@/app/actions";
import { ConfirmActionDialog } from "@/components/ui/modal";
import { OverflowMenu } from "@/components/ui/overflow-menu";
import type { BookStatus } from "@/lib/types";

interface BookActionsMenuProps {
  groupId: string;
  bookId: string;
  status: BookStatus;
  redirectTo: string;
  editHref?: string;
  onEdit?: () => void;
  panelClassName?: string;
  buttonClassName?: string;
}

const menuItemClassName =
  "inline-flex h-auto w-full items-center justify-start rounded-[14px] border border-line-solid px-3 py-2 text-left type-label text-label-strong shadow-none transition md:hover:bg-fill-alternative";
const dangerMenuItemClassName =
  "h-auto w-full justify-start rounded-[14px] border border-negative/20 bg-negative/8 px-3 py-2 type-label text-negative shadow-none";

export function BookActionsMenu({
  groupId,
  bookId,
  status,
  redirectTo,
  editHref,
  onEdit,
  panelClassName,
  buttonClassName,
}: BookActionsMenuProps) {
  return (
    <OverflowMenu
      buttonClassName={buttonClassName}
      panelClassName={panelClassName ?? "w-[188px]"}
    >
      {(closeMenu) => (
        <div className="space-y-1">
          {editHref ? (
            <Link
              className={menuItemClassName}
              href={editHref}
            >
              정보 수정
            </Link>
          ) : onEdit ? (
            <button
              className={menuItemClassName}
              onClick={() => {
                onEdit();
                closeMenu();
              }}
              type="button"
            >
              정보 수정
            </button>
          ) : null}
          <form action={updateBookStatusAction}>
            <input name="groupId" type="hidden" value={groupId} />
            <input name="bookId" type="hidden" value={bookId} />
            <input name="redirectTo" type="hidden" value={redirectTo} />
            <input
              name="status"
              type="hidden"
              value={status === "reading" ? "finished" : "reading"}
            />
            <button
              className={menuItemClassName}
              type="submit"
            >
              {status === "reading" ? "완독으로 변경" : "읽는 중으로 변경"}
            </button>
          </form>
          <ConfirmActionDialog
            action={deleteBookAction}
            confirmLabel="삭제"
            description="삭제한 책은 되돌릴 수 없습니다."
            fields={{ groupId, bookId, redirectTo }}
            title="이 책을 삭제할까요?"
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
